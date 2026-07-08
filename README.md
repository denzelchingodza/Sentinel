# Sentinel

Uptime monitoring for your services. Add a URL, get an email when it goes down, another when it recovers.

---

## How it works

EventBridge fires every 60 seconds. A Lambda checks every registered URL and writes the result to DynamoDB. If something goes down, SES sends an alert email. When it recovers, another email goes out. The dashboard polls every 30 seconds and updates in real time.

## Stack

AWS EventBridge · Lambda · DynamoDB · SES · API Gateway · Cognito · Next.js · Terraform

Everything runs on the AWS free tier. Monthly cost: $0.

## Running it yourself

```bash
git clone https://github.com/denzelchingodza/sentinel.git
cd sentinel

cd lambda/functions/monitor && npm install
cd ../api && npm install

cd ../../terraform
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform apply

cd ../frontend
npm install
cp .env.local.example .env.local  # values come from terraform output
npm run dev
```

---

Built by [Denzel Chingodza](https://denz-platform.vercel.app)
