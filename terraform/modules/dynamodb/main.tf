resource "aws_dynamodb_table" "monitors" {
  name         = "sentinel_monitors"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = { Project = "sentinel" }
}

resource "aws_dynamodb_table" "checks" {
  name         = "sentinel_checks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "timestamp"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "monitorId"
    type = "S"
  }

  global_secondary_index {
    name            = "monitorId-timestamp-index"
    hash_key        = "monitorId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  tags = { Project = "sentinel" }
}

resource "aws_dynamodb_table" "incidents" {
  name         = "sentinel_incidents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "monitorId"
    type = "S"
  }

  global_secondary_index {
    name            = "monitorId-index"
    hash_key        = "monitorId"
    projection_type = "ALL"
  }

  tags = { Project = "sentinel" }
}
