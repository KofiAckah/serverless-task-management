resource "aws_dynamodb_table" "tasks" {
  name         = "${var.project_name}-${var.environment}-tasks"
  billing_mode = var.billing_mode
  hash_key     = "taskId"

  attribute {
    name = "taskId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = var.enable_encryption
  }

  # DynamoDB Streams for change data capture
  stream_enabled   = var.enable_streams
  stream_view_type = var.enable_streams ? var.stream_view_type : null

  tags = var.tags
}

resource "aws_dynamodb_table" "assignments" {
  name         = "${var.project_name}-${var.environment}-assignments"
  billing_mode = var.billing_mode
  hash_key     = "assignmentId"

  attribute {
    name = "assignmentId"
    type = "S"
  }

  attribute {
    name = "taskId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "TaskIndex"
    hash_key        = "taskId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    range_key       = "taskId"
    projection_type = "ALL"
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = var.enable_encryption
  }

  # DynamoDB Streams for change data capture
  stream_enabled   = var.enable_streams
  stream_view_type = var.enable_streams ? var.stream_view_type : null

  tags = var.tags
}
