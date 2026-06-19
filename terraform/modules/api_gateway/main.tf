resource "aws_api_gateway_rest_api" "sentinel" {
  name        = "sentinel-api"
  description = "Sentinel uptime monitoring REST API"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.sentinel.id
  parent_id   = aws_api_gateway_rest_api.sentinel.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.sentinel.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id             = aws_api_gateway_rest_api.sentinel.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.proxy.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.api_lambda_arn}/invocations"
}

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

resource "aws_api_gateway_deployment" "sentinel" {
  depends_on  = [aws_api_gateway_integration.lambda, aws_api_gateway_integration.lambda_root]
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
