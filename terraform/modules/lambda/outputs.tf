output "monitor_lambda_arn"  { value = aws_lambda_function.monitor.arn }
output "monitor_lambda_name" { value = aws_lambda_function.monitor.function_name }
output "api_lambda_arn"      { value = aws_lambda_function.api.arn }
output "api_lambda_name"     { value = aws_lambda_function.api.function_name }
