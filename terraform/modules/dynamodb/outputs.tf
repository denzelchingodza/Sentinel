output "monitors_table_name" { value = aws_dynamodb_table.monitors.name }
output "checks_table_name"   { value = aws_dynamodb_table.checks.name }
output "incidents_table_name" { value = aws_dynamodb_table.incidents.name }
output "monitors_table_arn"  { value = aws_dynamodb_table.monitors.arn }
output "checks_table_arn"    { value = aws_dynamodb_table.checks.arn }
output "incidents_table_arn" { value = aws_dynamodb_table.incidents.arn }
