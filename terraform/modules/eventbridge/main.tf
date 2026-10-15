resource "aws_cloudwatch_event_rule" "every_minute" {
  name                = "sentinel_monitor_schedule"
  schedule_expression = "rate(1 minute)"
  description         = "Triggers Sentinel monitor Lambda every 60 seconds"
}

resource "aws_cloudwatch_event_target" "monitor_lambda" {
  rule      = aws_cloudwatch_event_rule.every_minute.name
  target_id = "sentinel_monitor"
  arn       = var.monitor_lambda_arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.monitor_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every_minute.arn
}

# ── Weekly digest — every Monday at 7am UTC ────────────────────────────────────
resource "aws_cloudwatch_event_rule" "weekly_digest" {
  name                = "sentinel_weekly_digest"
  schedule_expression = "cron(0 7 ? * MON *)"
  description         = "Triggers Sentinel weekly digest email every Monday at 7am UTC"
}

resource "aws_cloudwatch_event_target" "digest_scheduler_lambda" {
  rule      = aws_cloudwatch_event_rule.weekly_digest.name
  target_id = "sentinel_digest_scheduler"
  arn       = var.digest_scheduler_lambda_arn
}

resource "aws_lambda_permission" "allow_eventbridge_digest" {
  statement_id  = "AllowEventBridgeInvokeDigest"
  action        = "lambda:InvokeFunction"
  function_name = var.digest_scheduler_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_digest.arn
}
