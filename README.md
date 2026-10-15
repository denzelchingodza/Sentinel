# Sentinel AI

Uptime monitoring with AI-powered incident analysis, built on serverless AWS infrastructure. Add a URL, and Sentinel checks it every 60 seconds, emails you when it goes down, and again when it recovers. The AI digest reads your last 7 days of monitoring data and returns a plain-English summary of what happened and what needs attention. Every Monday morning it lands in your inbox automatically.

![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonaws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=flat&logo=amazondynamodb&logoColor=white)

---

## What it does

Sentinel monitors URLs and tracks their uptime over time. Every 60 seconds, a Lambda function runs and checks each registered monitor. If a URL fails two checks in a row, an incident is opened and an alert goes out via SES. When the URL recovers, the incident is closed and a recovery email follows. Every check is stored with its response time and an anomaly flag, giving you a full history of availability and performance.

The alerting is designed to reduce noise. A single failed check (a blip) produces no email. Two consecutive failures trigger the down alert. If a monitor goes up and down four or more times in 15 minutes, one "unstable" email goes out instead of an up/down flood. Response times are analysed using Median Absolute Deviation — if a monitor is still technically up but responding much slower than its historical baseline, a slowdown warning goes out before it becomes an outage.

On top of that, the AI digest endpoint queries your monitors and all incidents from the last 7 days, computes per-monitor downtime summaries, builds a structured prompt, and sends it to GPT-4o-mini. What comes back is a concise plain-English report — incident counts, downtime durations, anything that needs attention — written in prose. A second EventBridge rule fires every Monday at 7am UTC and sends this digest to every user automatically, no button press required.

The entire backend is serverless. There are no servers to manage, no processes to keep alive, and no infrastructure to babysit. DynamoDB handles three tables: monitors, check history, and incidents. Everything is provisioned with Terraform.

If SES is unavailable when an alert needs to fire, the notification payload is pushed to an SQS queue instead of being dropped. A Dead Letter Queue is also attached to the monitor Lambda itself, so any invocation that crashes entirely lands somewhere inspectable rather than disappearing silently. Each monitor is processed inside its own error boundary, meaning one bad URL cannot take down the checks for everything else.

---

## Architecture

```
EventBridge (60s schedule)
        |
        v
Lambda (monitor)  -->  DynamoDB (checks, incidents, monitors)
                   -->  SES (down / recovery / unstable / slowdown alerts)
                   -->  SQS (fallback queue if SES is down)

EventBridge (Monday 7am UTC)
        |
        v
Lambda (digest-scheduler)  -->  DynamoDB (monitors, incidents)
                            -->  OpenAI gpt-4o-mini (weekly digest)
                            -->  SES (weekly digest email per user)

Client
  |
  v
API Gateway (Cognito JWT auth)
  |
  v
Lambda (API)  -->  DynamoDB (monitors, checks, incidents)
              -->  OpenAI gpt-4o-mini (on-demand digest)
```

---

## Stack

| Layer | Technology |
|---|---|
| Compute | AWS Lambda (Node.js 20) |
| Scheduling | Amazon EventBridge |
| Database | Amazon DynamoDB |
| Email | Amazon SES |
| Queue | Amazon SQS |
| Auth | Amazon Cognito |
| API | Amazon API Gateway |
| AI | OpenAI gpt-4o-mini |
| Infrastructure | Terraform |
| Frontend | Next.js (App Router) |

---

## Smarter alerting

The monitor Lambda implements three layers of noise reduction on top of basic up/down detection.

**Consecutive failures threshold** — a single failed check does not trigger an alert. The Lambda tracks `consecutiveFailures` on each monitor record in DynamoDB and only creates an incident and sends an email once the count reaches the configured threshold (default: 2). A passing check resets the counter to zero. The threshold is configurable via the `CONSECUTIVE_THRESHOLD` environment variable.

**Flapping detection** — when a monitor is unstable (oscillating between up and down), sending individual up and down emails creates more noise than signal. The Lambda queries the last 15 minutes of check results for the monitor and counts state transitions. If there are four or more transitions (configurable via `FLAP_THRESHOLD`), a single "unstable" alert goes out instead of the individual alerts. Recovery emails are also suppressed during a flapping window.

**MAD anomaly detection** — response time spikes often precede outages. Before storing each check result, the Lambda queries the last 50 healthy check results for the monitor as a baseline, computes the median response time and the Median Absolute Deviation (MAD), and flags the current check as anomalous if its response time exceeds `median + 3 × MAD` and is above 500ms. Flagged checks are stored with `anomalyFlag: true` and trigger a "responding slowly" warning email (60-minute cooldown, separate from the down-alert cooldown). On the dashboard, clicking a monitor row expands a response time chart showing all recent checks with anomalous points marked in orange.

---

## AI digest

The digest is available two ways: on demand via `GET /digest` from the dashboard, and automatically every Monday morning via the `digest-scheduler` Lambda.

Both paths share the same logic:

**1. Gather** — queries the monitors and incidents tables for the user.

**2. Shape** — filters incidents to the last 7 days in JavaScript. Computes per-monitor summaries: incident count, total resolved downtime in minutes, current status, active incident flag.

**3. Prompt** — builds a structured JSON context object and writes it into a prompt that instructs GPT-4o-mini to produce 3–5 sentences of prose using specific names and numbers, flagging anything that needs attention.

**4. Call** — sends the prompt to the OpenAI API. Uses `gpt-4o-mini` at `temperature: 0.4` and `max_tokens: 300`. No additional dependencies — uses Node.js native `fetch`.

**5. Return / Send** — the on-demand route returns `{ digest, generatedAt, stats }` to the frontend. The scheduled route emails the digest directly with a stats line and a link back to the dashboard.

---

## Digest test harness

The digest logic is extracted into pure functions in `lambda/functions/api/digest.js` (`buildDigestContext`, `buildPrompt`, `callDigestLLM`) so it can be tested without any AWS dependencies.

`lambda/functions/api/digest.test.js` runs six fixture cases, each representing a distinct real-world scenario:

| Case | Scenario | Pass condition |
|---|---|---|
| 1 | All healthy | Does not invent outage language |
| 2 | One monitor with two outages | Names the right monitor, does not blame healthy ones |
| 3 | Slow but never down | Does not claim the monitor went down |
| 4 | Flapping monitor | Describes instability or repeated short outages |
| 5 | Empty — no data | Acknowledges no data, invents nothing |
| 6 | 15 monitors, only one troubled | Identifies the right monitor in the noise |

Each fixture defines its own `check(digest)` function that evaluates the LLM output at sentence level, accounting for negation (so "no incidents" does not false-positive on the word "incidents"). The harness calls the LLM three times per case and reports pass/fail per run.

```bash
cd lambda/functions/api

# Fact-shaping only (no API key needed)
FACTS_ONLY=1 node digest.test.js

# Full run with real LLM calls
OPENAI_API_KEY=sk-... node digest.test.js
```

---

## User accounts

Authentication is handled entirely by Amazon Cognito. Users sign up with their email and password, verify their address with a one-time code, and are issued a JWT that is attached to every API request.

The frontend supports the full auth lifecycle:

- **Sign up** — email + password, with a verification code sent to the inbox
- **Sign in** — JWT issued on success, stored in the browser session
- **Forgot password** — sends a reset code to the user's email; the user enters the code and a new password to regain access
- **Delete account** — users can permanently delete their Cognito account from the dashboard settings; all session data is cleared and they are redirected to the sign-in page

---

## Deploying

You need an AWS account, Terraform installed, and AWS credentials configured locally.

**1. Clone**

```bash
git clone https://github.com/denz-os/sentinel.git
cd sentinel/terraform
```

**2. Set your variables**

Create a `terraform.tfvars` file (this file is gitignored — never commit it):

```hcl
aws_region     = "af-south-1"
aws_account_id = "your-account-id"
alert_email    = "your@email.com"
ai_api_key     = "your-openai-api-key"
```

The `ai_api_key` variable holds your OpenAI API key. Get one at `platform.openai.com`.

**3. Deploy**

```bash
terraform init
terraform plan
terraform apply
```

Terraform provisions all Lambda functions, DynamoDB tables, EventBridge rules, SES configuration, Cognito user pool, and API Gateway automatically.

**4. Deploy the frontend**

Copy `.env.local.example` to `.env.local` and fill in your Cognito User Pool ID, Client ID, and API Gateway URL. Deploy the `frontend/` directory to Vercel or any platform that supports Next.js.

---

## What I learned

I had never used Terraform, DynamoDB, EventBridge, or SES before this project. I learned all of them because the project needed them. At the end I had a fully deployed, production-grade monitoring system running on infrastructure I had provisioned from scratch with code.

Adding AI to the project meant learning how language models actually work — not at the model level, but at the integration level. The prompt is everything. The quality of what the LLM returns is determined entirely by the structure and clarity of what you send it. That meant thinking carefully about what data matters, how to compute it, and how to describe it to a model that has no other context.

Building the test harness for the digest made that concrete. The first version of the check functions failed on correct LLM outputs because they matched the word "incident" inside "no incidents." Fixing that meant writing sentence-level checks that account for negation — a small thing that taught a lot about the gap between "the model said the right thing" and "I correctly measured whether the model said the right thing."

That experience is the reason cloud infrastructure does not intimidate me anymore. Before Sentinel, AWS felt like a black box. After it, it feels like a tool.

---

## What broke and how I fixed it

**AI digest returning 502**

The original implementation used OpenRouter with `mistralai/mistral-7b-instruct:free`. The free tier was unreliable — requests timed out or returned empty responses frequently. Switched to OpenAI `gpt-4o-mini`, which is fast, cheap, and consistent. Also renamed the Terraform variable from `groq_api_key` to `ai_api_key` to reflect that this key is for AI features broadly, not a specific provider.

**SES not sending any emails**

AWS SES starts in sandbox mode. In sandbox mode, both the sender and recipient addresses must be individually verified in the SES console before any email can be sent. The Lambda was executing without errors, but no emails arrived. Verified the sender address in SES, and alerts started working immediately. In production, SES sandbox limits require a support request to AWS to exit — something to plan for before launch.

**Lambda had no permissions to write to DynamoDB or send via SES**

The Lambda functions deployed successfully but failed at runtime with `AccessDeniedException`. AWS IAM requires explicit permission grants — Lambda does not inherit any permissions by default. Added IAM policy documents in the Terraform Lambda module granting `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:Scan`, `dynamodb:UpdateItem` on each DynamoDB table ARN, and `ses:SendEmail` on the verified SES identity ARN.

**EventBridge trigger not firing**

The monitor Lambda deployed but never executed on schedule. The issue was a name mismatch — the EventBridge module referenced `module.lambda.monitor_lambda_name` but the Lambda module output was named `lambda_monitor_name`. Terraform silently used an empty string, creating a rule that pointed at nothing. Fixed by aligning output and variable names across modules and running `terraform plan` to verify the dependency graph before applying.

**Terraform state confusion causing duplicate resources**

Running `terraform apply` a second time after manually deleting a resource in the AWS console caused Terraform to try creating it again while its state entry still existed, producing `ResourceAlreadyExists` errors. Learned that `terraform.tfstate` is the source of truth — if a resource is deleted outside Terraform, the state must be updated with `terraform state rm` before re-applying.

**Cognito JWT authorizer not blocking unauthenticated requests**

The API Gateway authorizer was configured but initially had the wrong `authorization_scopes` setting, causing it to pass all requests through without validating the JWT. Fixed by setting the authorizer type to `JWT`, pointing it at the Cognito user pool ARN, and confirming that unauthenticated requests returned 401 before wiring up the frontend.

**SES alert dropped silently when the service was temporarily unavailable**

SES can return throttling or service errors under certain conditions. The original code called `ses.send()` directly with no error handling — if it threw, the alert was lost and nothing in the logs indicated why. Fixed by wrapping the SES call in a try/catch and pushing the full notification payload to an SQS queue on failure. The queue retains messages for 24 hours, giving time to reprocess them once SES recovers.

**One failing monitor was silently killing checks for all other monitors**

The monitor Lambda processes all active monitors in a `Promise.all`. If one monitor's processing threw an unhandled error, the entire invocation failed — all other monitors in that batch got no check result written and no incident detection ran. Fixed by wrapping each monitor's processing block in its own try/catch so a bad monitor logs its error and is skipped, while every other monitor continues normally.

---

## Technical notes

- **Modular Terraform** — each AWS service (Cognito, DynamoDB, Lambda, EventBridge, API Gateway, SES) lives in its own `modules/` directory with its own `main.tf`, `variables.tf`, and `outputs.tf`. Module outputs are passed as inputs to dependent modules.
- **Three DynamoDB tables** — `monitors` (user-defined URLs), `checks` (every result from every check, with response time and anomaly flag), `incidents` (open/closed outage records). DynamoDB's on-demand billing means no capacity planning needed for this scale.
- **Daemon pattern** — the monitor Lambda queries all monitors, checks each URL with a timeout, writes the result to `checks`, and updates or creates an incident record if the status changed. The entire function is stateless — it reads current state from DynamoDB at the start of every invocation.
- **MAD over standard deviation** — MAD (Median Absolute Deviation) is used for anomaly detection rather than mean and standard deviation because it is robust to outliers. A single very long response time does not skew the baseline, which matters for monitoring where occasional spikes are common.
- **AI prompt engineering** — the digest prompt passes a structured JSON context object rather than raw DynamoDB items. This means the model sees computed values (total downtime in minutes, incident counts per monitor, current status) rather than raw timestamps and boolean flags. Lower temperature (`0.4`) keeps output factual.
- **LLM timeout** — the API Lambda timeout is set to 29 seconds (API Gateway's hard limit is 30). LLM API calls typically respond in 2–5 seconds, but this leaves headroom for slow responses without hitting the Gateway timeout.
- **Cognito full auth lifecycle** — sign up triggers a verification email via Cognito's built-in email provider. Password reset uses the `forgotPassword` / `confirmForgotPassword` flow. Account deletion calls `deleteUser` on the Cognito client and clears the local session, then redirects to sign in.
- **Cognito session caching** — `getIdToken()` is called on every API request from the frontend. The session is cached in a module-level variable and reused until it is within 5 minutes of its expiry, at which point it is refreshed. The cache is cleared immediately on sign-out.
- **SQS alert queue** — the queue uses a 60-second visibility timeout so that if something reads a message and fails to process it, it becomes available again for retry. Messages are retained for 24 hours. The same queue doubles as the Lambda's Dead Letter Queue, keeping the infrastructure footprint minimal.
