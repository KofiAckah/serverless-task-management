resource "aws_dynamodb_table" "tasks" {
  name           = "${var.project_name}-${var.environment}-tasks"
  billing_mode   = var.billing_mode
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "assignee_id"
    type = "S"
  }

  global_secondary_index {
    name               = "assignee-index"
    hash_key           = "assignee_id"
    projection_type    = "ALL"
  }

  tags = var.tags
}
