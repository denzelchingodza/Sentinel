# Sentinel

I built a few projects over the past while a document analysis tool, a personal portfolio, a couple of APIs. At some point I just wanted to open one page and see if everything was still running. Not dig through Netlify, not check Render, not wait for a user to tell me something was broken. Just one place, always watching.

That curiosity turned into Sentinel.

---

## What it is

Sentinel is a uptime monitoring system. You give it a URL, it checks that URL every 60 seconds, and if it ever goes down it sends you an email. When it comes back up, it sends you another one. In between, it tracks response times and calculates uptime percentage so you have a real picture of how your services are performing over time.

There's a dashboard where you can see everything at a glance — which services are up, how fast they're responding, whether anything is currently broken, and how long it's been that way.

It's nothing you couldn't piece together from paid tools. But building it myself meant I actually understood every part of it.

---

## Why I built it

Partly practical I have live projects and I want to know they're healthy without manually checking.

Mostly curiosity I wanted to know if I could build something like this from scratch, on real infrastructure, for free. No credit card, no subscription, no managed service doing the hard parts for me.

The answer was yes, and the process of figuring that out taught me more about cloud infrastructure than any tutorial did.

---

## How it works

Every 60 seconds, AWS EventBridge fires a trigger. That trigger wakes up a Lambda function, which loops through every URL registered in the system and sends an HTTP request to each one. The response — status code, response time, any errors — gets written to DynamoDB.

If a URL fails, a second Lambda creates an incident record and sends an alert email via SES. If it was previously down and is now back, it resolves the incident and sends a recovery email.

A REST API (also Lambda, sitting behind API Gateway) lets the frontend read monitors, add new ones, delete them, and pull analytics. The frontend is a Next.js app that polls the API every 30 seconds and updates in real time.

All the infrastructure is defined in Terraform — which means the entire backend can be deployed from scratch with two commands.

---

## Stack

| Layer | Technology |
|---|---|
| Scheduler | AWS EventBridge |
| Check + alert logic | AWS Lambda (Node.js) |
| Database | AWS DynamoDB |
| Email alerts | AWS SES |
| REST API | AWS API Gateway + Lambda |
| Frontend | Next.js, deployed on Netlify |
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
- Response time colour-coded by speed (green under 500ms, amber under 2s, red above)
- Add and remove monitors from the dashboard without touching code

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
# set NEXT_PUBLIC_API_URL in .env.local to the api_gateway_url from terraform output
npm run dev
```

After deploying, AWS will send a verification email to the address in your `terraform.tfvars`. Click the link — SES won't send alerts until the address is verified.

---

## What I learned

Before this project I had never written a line of Terraform, never set up an EventBridge rule, never touched SES. I knew Lambda existed but hadn't used it for anything real.

Working through this — figuring out IAM permissions, understanding why asyncpg doesn't accept `sslmode` as a connection arg, learning that `terraform plan` is basically your best friend — was the kind of learning that actually sticks.

The project is simple by industry standards. But it's real infrastructure, deployed to a real cloud, doing a real job. That matters to me.

---

Built by [Denzel Chingodza](https://github.com/denzelchingodza)
