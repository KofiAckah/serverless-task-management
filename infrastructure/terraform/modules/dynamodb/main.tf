resource "aws_dynamodb_table" "tasks" {
  name         = "${var.project_name}-${var.environment}-tasks"
  billing_mode = var.billing_mode
  hash_key     = "taskId"

  # Full schema (non-key attributes added dynamically):
  # - taskId (S) - Primary key
  # - title (S) - Task title
  # - description (S) - Task description
  # - status (S) - Task status (OPEN, IN_PROGRESS, COMPLETED, CLOSED)
  # - priority (S) - Task priority (LOW, MEDIUM, HIGH)
  # - createdBy (S) - User ID of creator (admin)
  # - createdAt (N) - Unix timestamp
  # - updatedAt (N) - Unix timestamp
  # - dueDate (N) - Unix timestamp (optional)

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

    # Full schema (non-key attributes added dynamically):
  # - assignmentId (S) - Primary key (composite: taskId#userId)
  # - taskId (S) - Foreign key to tasks table
  # - userId (S) - Cognito user sub
  # - userEmail (S) - User email for notifications
  # - assignedBy (S) - User ID of admin who assigned
  # - assignedAt (N) - Unix timestamp
  # - status (S) - Assignment status (ASSIGNED, ACCEPTED, COMPLETED)

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
