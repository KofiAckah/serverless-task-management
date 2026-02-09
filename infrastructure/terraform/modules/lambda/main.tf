# Get current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

#=============================================================================
# Pre-Signup Lambda (Cognito Trigger)
#=============================================================================

# IAM Role for Pre-Signup Lambda
resource "aws_iam_role" "pre_signup" {
  name = "${var.project_name}-${var.environment}-pre-signup-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "pre_signup_basic" {
  role       = aws_iam_role.pre_signup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# CloudWatch Log Group for Pre-Signup
resource "aws_cloudwatch_log_group" "pre_signup" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-pre-signup"
  retention_in_days = 7

  tags = var.tags
}

# Archive backend code for pre-signup Lambda
data "archive_file" "pre_signup" {
  type        = "zip"
  output_path = "${path.module}/../../.terraform/lambda/pre-signup.zip"
  source_dir  = "${path.module}/../../../../backend"
  excludes = [
    ".git",
    ".gitignore",
    "README.md",
    "test-events",
    "test-local.js",
    "quick-start.sh",
    "deploy.sh",
    "*.md"
  ]
}

# Pre-Signup Lambda Function
resource "aws_lambda_function" "pre_signup" {
  filename         = data.archive_file.pre_signup.output_path
  function_name    = "${var.project_name}-${var.environment}-pre-signup"
  role             = aws_iam_role.pre_signup.arn
  handler          = "src/handlers/preSignup.handler"
  source_code_hash = data.archive_file.pre_signup.output_base64sha256
  runtime          = var.runtime
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      ALLOWED_EMAIL_DOMAINS = join(",", var.allowed_email_domains)
      ENVIRONMENT           = var.environment
    }
  }

  tags = var.tags

  depends_on = [
    aws_cloudwatch_log_group.pre_signup,
    aws_iam_role_policy_attachment.pre_signup_basic
  ]
}

# Lambda Permission for Cognito
resource "aws_lambda_permission" "cognito_pre_signup" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "arn:aws:cognito-idp:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:userpool/${var.cognito_user_pool_id}"
}

#=============================================================================
# Tasks Lambda (API Gateway Backend)
#=============================================================================

# IAM Role for Tasks Lambda
resource "aws_iam_role" "tasks" {
  name = "${var.project_name}-${var.environment}-tasks-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

# Tasks Lambda DynamoDB Policy
resource "aws_iam_role_policy" "tasks_dynamodb" {
  name = "${var.project_name}-${var.environment}-tasks-dynamodb-policy"
  role = aws_iam_role.tasks.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.tasks_table_arn,
          "${var.tasks_table_arn}/index/*",
          var.assignments_table_arn,
          "${var.assignments_table_arn}/index/*"
        ]
      }
    ]
  })
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "tasks_basic" {
  role       = aws_iam_role.tasks.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# CloudWatch Log Group for Tasks
resource "aws_cloudwatch_log_group" "tasks" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-tasks"
  retention_in_days = 7

  tags = var.tags
}

# Archive backend code for tasks Lambda
data "archive_file" "tasks" {
  type        = "zip"
  output_path = "${path.module}/../../.terraform/lambda/tasks.zip"
  source_dir  = "${path.module}/../../../../backend"
  excludes = [
    ".git",
    ".gitignore",
    "README.md",
    "test-events",
    "test-local.js",
    "quick-start.sh",
    "deploy.sh",
    "*.md"
  ]
}

# Tasks Lambda Function
# Note: Uses router.js to dispatch API Gateway requests to appropriate handlers
resource "aws_lambda_function" "tasks" {
  filename         = data.archive_file.tasks.output_path
  function_name    = "${var.project_name}-${var.environment}-tasks"
  role             = aws_iam_role.tasks.arn
  handler          = "src/router.handler"
  source_code_hash = data.archive_file.tasks.output_base64sha256
  runtime          = var.runtime
  timeout          = var.timeout
  memory_size      = var.memory_size

  environment {
    variables = {
      TASKS_TABLE                         = var.tasks_table_name
      ASSIGNMENTS_TABLE                   = var.assignments_table_name
      ENVIRONMENT                         = var.environment
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }

  tags = var.tags

  depends_on = [
    aws_cloudwatch_log_group.tasks,
    aws_iam_role_policy_attachment.tasks_basic,
    aws_iam_role_policy.tasks_dynamodb
  ]
}

#=============================================================================
# Notifications Lambda (DynamoDB Streams Trigger)
#=============================================================================

# IAM Role for Notifications Lambda
resource "aws_iam_role" "notifications" {
  name = "${var.project_name}-${var.environment}-notifications-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "notifications_basic" {
  role       = aws_iam_role.notifications.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach SES send email policy
resource "aws_iam_role_policy_attachment" "notifications_ses" {
  role       = aws_iam_role.notifications.name
  policy_arn = var.ses_policy_arn
}

# DynamoDB Stream read policy for notifications
resource "aws_iam_role_policy" "notifications_streams" {
  name = "${var.project_name}-${var.environment}-notifications-streams-policy"
  role = aws_iam_role.notifications.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Resource = [
          var.tasks_table_stream_arn,
          var.assignments_table_stream_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          var.tasks_table_arn,
          "${var.tasks_table_arn}/index/*",
          var.assignments_table_arn,
          "${var.assignments_table_arn}/index/*"
        ]
      }
    ]
  })
}

# CloudWatch Log Group for Notifications
resource "aws_cloudwatch_log_group" "notifications" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-notifications"
  retention_in_days = 7

  tags = var.tags
}

# Archive backend code for notifications Lambda
data "archive_file" "notifications" {
  type        = "zip"
  output_path = "${path.module}/../../.terraform/lambda/notifications.zip"
  source_dir  = "${path.module}/../../../../backend"
  excludes = [
    ".git",
    ".gitignore",
    "README.md",
    "test-events",
    "test-local.js",
    "quick-start.sh",
    "deploy.sh",
    "*.md"
  ]
}

# Notifications Lambda Function
resource "aws_lambda_function" "notifications" {
  filename         = data.archive_file.notifications.output_path
  function_name    = "${var.project_name}-${var.environment}-notifications"
  role             = aws_iam_role.notifications.arn
  handler          = "src/handlers/notifications.handler"
  source_code_hash = data.archive_file.notifications.output_base64sha256
  runtime          = var.runtime
  timeout          = var.timeout
  memory_size      = var.memory_size

  environment {
    variables = {
      SENDER_EMAIL                        = var.sender_email
      TASKS_TABLE                         = var.tasks_table_name
      ASSIGNMENTS_TABLE                   = var.assignments_table_name
      ENVIRONMENT                         = var.environment
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }

  tags = var.tags

  depends_on = [
    aws_cloudwatch_log_group.notifications,
    aws_iam_role_policy_attachment.notifications_basic,
    aws_iam_role_policy_attachment.notifications_ses,
    aws_iam_role_policy.notifications_streams
  ]
}

# Event Source Mapping for Tasks Table Stream
resource "aws_lambda_event_source_mapping" "tasks_stream" {
  event_source_arn  = var.tasks_table_stream_arn
  function_name     = aws_lambda_function.notifications.arn
  starting_position = "LATEST"
  batch_size        = 10

  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT", "MODIFY"]
      })
    }
  }
}

# Event Source Mapping for Assignments Table Stream
resource "aws_lambda_event_source_mapping" "assignments_stream" {
  event_source_arn  = var.assignments_table_stream_arn
  function_name     = aws_lambda_function.notifications.arn
  starting_position = "LATEST"
  batch_size        = 10

  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT", "MODIFY"]
      })
    }
  }
}
