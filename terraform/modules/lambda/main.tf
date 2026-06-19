data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "sentinel_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "sentinel_lambda_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.monitors_table_arn,
          var.checks_table_arn,
          var.incidents_table_arn,
          "${var.monitors_table_arn}/index/*",
          "${var.checks_table_arn}/index/*",
          "${var.incidents_table_arn}/index/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# ── Monitor Lambda ─────────────────────────────────────────────────────────────
data "archive_file" "monitor" {
  type        = "zip"
  source_dir  = "${path.root}/../lambda/functions/monitor"
  output_path = "${path.root}/../lambda/zips/monitor.zip"
}

resource "aws_lambda_function" "monitor" {
  filename         = data.archive_file.monitor.output_path
  function_name    = "sentinel_monitor"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  source_code_hash = data.archive_file.monitor.output_base64sha256

  environment {
    variables = {
      MONITORS_TABLE   = var.monitors_table_name
      CHECKS_TABLE     = var.checks_table_name
      INCIDENTS_TABLE  = var.incidents_table_name
      ALERT_EMAIL      = var.alert_email
      AWS_SES_REGION   = "af-south-1"
    }
  }
}

# ── API Lambda ─────────────────────────────────────────────────────────────────
data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.root}/../lambda/functions/api"
  output_path = "${path.root}/../lambda/zips/api.zip"
}

resource "aws_lambda_function" "api" {
  filename         = data.archive_file.api.output_path
  function_name    = "sentinel_api"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 15
  source_code_hash = data.archive_file.api.output_base64sha256

  environment {
    variables = {
      MONITORS_TABLE  = var.monitors_table_name
      CHECKS_TABLE    = var.checks_table_name
      INCIDENTS_TABLE = var.incidents_table_name
    }
  }
}
