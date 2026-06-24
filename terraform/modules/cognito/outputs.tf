output "user_pool_id" {
  value = aws_cognito_user_pool.sentinel.id
}

output "user_pool_arn" {
  value = aws_cognito_user_pool.sentinel.arn
}

output "client_id" {
  value = aws_cognito_user_pool_client.sentinel.id
}
