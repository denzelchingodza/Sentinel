terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "dynamodb" {
  source = "./modules/dynamodb"
}

module "ses" {
  source      = "./modules/ses"
  alert_email = var.alert_email
}

module "lambda" {
  source               = "./modules/lambda"
  monitors_table_name  = module.dynamodb.monitors_table_name
  checks_table_name    = module.dynamodb.checks_table_name
  incidents_table_name = module.dynamodb.incidents_table_name
  monitors_table_arn   = module.dynamodb.monitors_table_arn
  checks_table_arn     = module.dynamodb.checks_table_arn
  incidents_table_arn  = module.dynamodb.incidents_table_arn
  alert_email          = var.alert_email
  ses_arn              = module.ses.ses_identity_arn
}

module "eventbridge" {
  source              = "./modules/eventbridge"
  monitor_lambda_arn  = module.lambda.monitor_lambda_arn
  monitor_lambda_name = module.lambda.monitor_lambda_name
}

module "api_gateway" {
  source          = "./modules/api_gateway"
  api_lambda_arn  = module.lambda.api_lambda_arn
  api_lambda_name = module.lambda.api_lambda_name
  aws_region      = var.aws_region
  aws_account_id  = var.aws_account_id
}
