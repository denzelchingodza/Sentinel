output "api_gateway_url" {
  description = "Base URL for the Sentinel REST API"
  value       = module.api_gateway.api_url
}

output "monitors_table_name" {
  value = module.dynamodb.monitors_table_name
}

output "checks_table_name" {
  value = module.dynamodb.checks_table_name
}

output "incidents_table_name" {
  value = module.dynamodb.incidents_table_name
}
