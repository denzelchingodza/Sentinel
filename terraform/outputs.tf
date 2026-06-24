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

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID — set as NEXT_PUBLIC_COGNITO_USER_POOL_ID in frontend/.env.local"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID — set as NEXT_PUBLIC_COGNITO_CLIENT_ID in frontend/.env.local"
  value       = module.cognito.client_id
}
