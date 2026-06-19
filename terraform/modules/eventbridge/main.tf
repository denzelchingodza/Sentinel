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
