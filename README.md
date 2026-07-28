# Sentinel

Uptime monitoring on serverless AWS infrastructure. Add a URL, and Sentinel checks it every 60 seconds, emails you when it goes down, and emails you again when it recovers.

![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonaws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=flat&logo=amazondynamodb&logoColor=white)

---

## What it does

Sentinel monitors URLs and tracks their uptime over time. Every 60 seconds, a Lambda function runs and checks each registered monitor. If a URL fails, an incident is opened and an alert goes out via SES. When the URL recovers, the incident is closed and a recovery email follows. Every check is stored with its response time, giving you a full history of availability and performance.

The entire backend is serverless. There are no servers to manage, no processes to keep alive, and no infrastructure to babysit. EventBridge triggers the monitor Lambda on a schedule. API Gateway sits in front of the API Lambda with Cognito JWT authentication on every route. DynamoDB handles three tables: monitors, check history, and incidents. Everything is provisioned with Terraform.

---

## Architecture

```
EventBridge (60s schedule)
        |
        v
Lambda (monitor)  -->  DynamoDB (checks, incidents)
                   -->  SES (email alerts)

Client
  |
  v
API Gateway (Cognito JWT auth)
  |
  v
Lambda (API)  -->  DynamoDB (monitors, checks, incidents)
```

---

## Stack

| Layer | Technology |
|---|---|
| Compute | AWS Lambda (Node.js 20) |
| Scheduling | Amazon EventBridge |
| Database | Amazon DynamoDB |
| Email | Amazon SES |
| Auth | Amazon Cognito |
| API | Amazon API Gateway |
| Infrastructure | Terraform |
| Frontend | Next.js (App Router) |

---

## User accounts

Authentication is handled entirely by Amazon Cognito. Users sign up with their email and password, verify their address with a one-time code, and are issued a JWT that is attached to every API request.

The frontend supports the full auth lifecycle:

- **Sign up** — email + password, with a verification code sent to the inbox
- **Sign in** — JWT issued on success, stored in the browser session
- **Forgot password** — sends a reset code to the user's email
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

Create a `terraform.tfvars` file:

```hcl
aws_region  = "af-south-1"
alert_email = "your@email.com"
```

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

I had never used Terraform, DynamoDB, EventBridge, or SES before this project. I learned all of them because the project needed them. At the end I had a fully deployed, production grade monitoring system running on infrastructure I had provisioned from scratch with code.

That experience is the reason cloud infrastructure does not intimidate me anymore. Before Sentinel, AWS felt like a black box. After it, it feels like a tool.

---

## What broke and how I fixed it

**SES not sending any emails**

AWS SES starts in sandbox mode. In sandbox mode, both the sender and recipient addresses must be individually verified in the SES console before any email can be sent. The Lambda was executing without errors, but no emails arrived. Verified the sender address in SES, and alerts started working immediately. In production, SES sandbox limits require a support request to AWS to exit something to plan for before launch.

**Lambda had no permissions to write to DynamoDB or send via SES**

The Lambda functions deployed successfully but failed at runtime with `AccessDeniedException`. AWS IAM requires explicit permission grants — Lambda does not inherit any permissions by default. Added IAM policy documents in the Terraform Lambda module granting `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:Scan`, `dynamodb:UpdateItem` on each DynamoDB table ARN, and `ses:SendEmail` on the verified SES identity ARN.

**EventBridge trigger not firing**

The monitor Lambda deployed but never executed on schedule. The issue was a name mismatch — the EventBridge module referenced `module.lambda.monitor_lambda_name` but the Lambda module output was named `lambda_monitor_name`. Terraform silently used an empty string, creating a rule that pointed at nothing. Fixed by aligning output and variable names across modules and running `terraform plan` to verify the dependency graph before applying.

**Terraform state confusion causing duplicate resources**

Running `terraform apply` a second time after manually deleting a resource in the AWS console caused Terraform to try creating it again while its state entry still existed, producing `ResourceAlreadyExists` errors. Learned that `terraform.tfstate` is the source of truth — if a resource is deleted outside Terraform, the state must be updated with `terraform state rm` before re-applying.

**Cognito JWT authorizer not blocking unauthenticated requests**

The API Gateway authorizer was configured but initially had the wrong `authorization_scopes` setting, causing it to pass all requests through without validating the JWT. Fixed by setting the authorizer type to `JWT`, pointing it at the Cognito user pool ARN, and confirming that unauthenticated requests returned 401 before wiring up the frontend.

---

## Technical notes

- **Modular Terraform** — each AWS service (Cognito, DynamoDB, Lambda, EventBridge, API Gateway, SES) lives in its own `modules/` directory with its own `main.tf`, `variables.tf`, and `outputs.tf`. Module outputs are passed as inputs to dependent modules (e.g., DynamoDB table ARNs into the Lambda module for IAM policies).
- **Three DynamoDB tables** — `monitors` (user-defined URLs), `checks` (every result from every check, with response time), `incidents` (open/closed outage records). DynamoDB's on-demand billing means no capacity planning needed for this scale.
- **Daemon pattern** — the monitor Lambda queries all monitors, checks each URL with a timeout, writes the result to `checks`, and updates or creates an incident record if the status changed. The entire function is stateless — it reads current state from DynamoDB at the start of every invocation.
- **Cognito full auth lifecycle** — sign-up triggers a verification email via Cognito's built-in email provider. Password reset uses the `forgotPassword` / `confirmForgotPassword` flow. Account deletion calls `deleteUser` on the Cognito client and clears the local session, then redirects to sign-in.

---


