# Sentinel

I built a few projects over the past while a document analysis tool, a personal portfolio, a demo ecommerce web app. At some point I just wanted to open one page and see if everything was still running. Not dig through Netlify, not check Render, not wait for a user to tell me something was broken. Just one place, always watching.

That curiosity turned into Sentinel.

---

## What it is

Sentinel is a uptime monitoring system. You give it a URL, it checks that URL every 60 seconds, and if it ever goes down it sends you an email. When it comes back up, it sends you another one. In between, it tracks response times and calculates uptime percentage so you have a real picture of how your services are performing over time.

There's a dashboard where you can see which services are up, how fast they're responding, whether anything is currently broken, and how long it's been that way.

It's nothing you couldn't piece together from paid tools. But building it myself meant I actually understood every part of it.

---

## Getting started

Visit [sentinel-kappa-wine.vercel.app](https://sentinel-kappa-wine.vercel.app) and create an account. Sign up with your email, verify it with the code sent to your inbox, and you're in. Each account is fully isolated you only ever see your own monitors, and alert emails go to the address you signed up with.

Once you're on the dashboard, paste in any URL and give it a name. Sentinel starts checking it immediately.

---

## Why I added authentication

The first version had no auth. Every monitor was visible to anyone who opened the app, and alert emails went to a single hardcoded address. That was fine for a prototype but completely wrong for something real.

Adding auth meant rethinking several layers at once. A Cognito User Pool handles sign up, email verification, password resets, and token management. API Gateway validates the JWT on every request before it reaches the Lambda, so unauthenticated calls are rejected before any business logic runs. DynamoDB got a `userId` GSI on both the monitors and incidents tables so queries can be scoped per user. The Lambda reads the `sub` claim from the verified token and uses it as the partition key meaning no user can read, write, or delete another user's data even if they know the IDs.

On the frontend, the Cognito SDK handles the auth flow. The JWT is attached as a Bearer token on every API call, and the session is refreshed automatically so users don't get logged out unexpectedly.

---

## Why I built it

Partly practical I have live projects and I want to know they're healthy without manually checking.

Mostly curiosity I wanted to know if I could build something like this from scratch, on real infrastructure, for free. No credit card, no subscription, no managed service doing the hard parts for me.

The answer was yes, and the process of figuring that out taught me more about cloud infrastructure than any tutorial did.

---

## How it works

Every 60 seconds, AWS EventBridge fires a trigger. That trigger wakes up a Lambda function, which loops through every URL registered in the system and sends an HTTP request to each one. The response status code, response time, any errors gets written to DynamoDB.

If a URL fails, a second Lambda creates an incident record and sends an alert email via SES. If it was previously down and is now back, it resolves the incident and sends a recovery email.

A REST API (also Lambda, sitting behind API Gateway) lets the frontend read monitors, add new ones, delete them, and pull analytics. The frontend is a Next.js app that polls the API every 30 seconds and updates in real time.

All the infrastructure is defined in Terraform which means the entire backend can be deployed from scratch with two commands.

---

## Stack

| Layer | Technology |
|---|---|
| Scheduler | AWS EventBridge |
| Check + alert logic | AWS Lambda (Node.js) |
| Database | AWS DynamoDB |
| Email alerts | AWS SES |
| REST API | AWS API Gateway + Lambda |
| Auth | AWS Cognito (User Pool + JWT authorizer) |
| Frontend | Next.js, deployed on Vercel |
| Infrastructure | Terraform |

Everything runs on the AWS free tier. Monthly cost: $0.

---

## Features

- Monitors any HTTP/HTTPS endpoint
- Checks every 60 seconds via EventBridge
- Email alert on down, email alert on recovery
- 30-minute alert cooldown so you don't get spammed during an extended outage
- Uptime percentage and average response time over the last 24 hours
- Incident log with start time, duration, and status code
- Response time colour coded by speed (green under 500ms, amber under 2s, red above)
- Add and remove monitors from the dashboard without touching code
- Auth check uses a single Cognito session call token and email extracted in one round trip

---

## Running it yourself

**Prerequisites:** AWS account, Terraform, Node.js

```bash
# Clone the repo
git clone https://github.com/denzelchingodza/sentinel.git
cd sentinel

# Install Lambda dependencies
cd lambda/functions/monitor && npm install
cd ../api && npm install

# Deploy infrastructure
cd ../../terraform
cp terraform.tfvars.example terraform.tfvars  # fill in your values
terraform init
terraform apply

# Run the frontend
cd ../frontend
npm install
cp .env.local.example .env.local  # fill in the values from terraform output
npm run dev
```

Terraform outputs the values you need for `.env.local`:

```
NEXT_PUBLIC_API_URL                 # api_gateway_url from terraform output
NEXT_PUBLIC_COGNITO_USER_POOL_ID    # cognito_user_pool_id from terraform output
NEXT_PUBLIC_COGNITO_CLIENT_ID       # cognito_client_id from terraform output
```

After deploying, AWS will send a verification email to the address in your `terraform.tfvars`. Click the link SES won't send alerts until the address is verified.

If deploying to Vercel, add those same three environment variables in your Vercel project settings and redeploy.

---

## What I learned

Before this project I had never written a line of Terraform, never set up an EventBridge rule, never touched SES. I knew Lambda existed but hadn't used it for anything real.

Working through this figuring out IAM permissions, wiring up a Cognito JWT authorizer in API Gateway, designing DynamoDB GSIs for per user queries, learning that `terraform plan` is basically your best friend was the kind of learning that actually sticks.

The project is simple by industry standards. But it's real infrastructure, deployed to a real cloud, doing a real job. That matters to me.

---

Built by [Denzel Chingodza](https://github.com/denzelchingodza)
