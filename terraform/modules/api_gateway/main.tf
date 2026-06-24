resource "aws_api_gateway_rest_api" "sentinel" {
  name        = "sentinel-api"
  description = "Sentinel uptime monitoring REST API"
}

# ── Cognito authorizer ─────────────────────────────────────────────────────────
resource "aws_api_gateway_authorizer" "cognito" {
  name            = "sentinel-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.sentinel.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [var.cognito_user_pool_arn]
  identity_source = "method.request.header.Authorization"
}

# ── {proxy+} resource ──────────────────────────────────────────────────────────
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.sentinel.id
  parent_id   = aws_api_gateway_rest_api.sentinel.root_resource_id
  path_part   = "{proxy+}"
}

# ANY → protected by Cognito
resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.sentinel.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id             = aws_api_gateway_rest_api.sentinel.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.proxy.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.api_lambda_arn}/invocations"
}

# OPTIONS → no auth (CORS preflight)
resource "aws_api_gateway_method" "proxy_options" {
  rest_api_id   = aws_api_gateway_rest_api.sentinel.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.sentinel.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "proxy_options_200" {
  rest_api_id = aws_api_gateway_rest_api.sentinel.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.sentinel.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.proxy_options]
}

# ── Root resource ──────────────────────────────────────────────────────────────
resource "aws_api_gateway_method" "root" {
  rest_api_id   = aws_api_gateway_rest_api.sentinel.id
  resource_id   = aws_api_gateway_rest_api.sentinel.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_root" {
  rest_api_id             = aws_api_gateway_rest_api.sentinel.id
  resource_id             = aws_api_gateway_rest_api.sentinel.root_resource_id
  http_method             = aws_api_gateway_method.root.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.api_lambda_arn}/invocations"
}

# ── Deployment ─────────────────────────────────────────────────────────────────
resource "aws_api_gateway_deployment" "sentinel" {
  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.lambda_root,
    aws_api_gateway_integration.proxy_options,
    aws_api_gateway_integration_response.proxy_options,
  ]
  rest_api_id = aws_api_gateway_rest_api.sentinel.id
  stage_name  = "prod"
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.api_lambda_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sentinel.execution_arn}/*/*"
}
