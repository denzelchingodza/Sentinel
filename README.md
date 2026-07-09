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
| Frontend | HTML, CSS, JavaScript |

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

Set `API_URL` in the frontend config to your API Gateway endpoint. Deploy to any static hosting platform.

---

## What I learned

I had never used Terraform, DynamoDB, EventBridge, or SES before this project. I learned all of them because the project needed them. At the end I had a fully deployed, production-grade monitoring system running on infrastructure I had provisioned from scratch with code.

That experience is the reason cloud infrastructure does not intimidate me anymore. Before Sentinel, AWS felt like a black box. After it, it feels like a tool.

---


