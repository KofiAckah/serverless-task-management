# SNS Topic for Task Notifications
resource "aws_sns_topic" "task_notifications" {
  name         = "${var.project_name}-${var.environment}-task-notifications"
  display_name = "Task Management Notifications"

  tags = var.tags
}

# SNS Topic Policy - Allow publishing from Lambda
resource "aws_sns_topic_policy" "task_notifications" {
  arn = aws_sns_topic.task_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "SNS:Publish",
          "SNS:Subscribe"
        ]
        Resource = aws_sns_topic.task_notifications.arn
      }
    ]
  })
}

# IAM Policy for Lambda to publish to SNS
data "aws_iam_policy_document" "sns_publish" {
  statement {
    sid    = "AllowSNSPublish"
    effect = "Allow"

    actions = [
      "sns:Publish",
      "sns:Subscribe",
      "sns:Unsubscribe",
      "sns:ListSubscriptionsByTopic"
    ]

    resources = [
      aws_sns_topic.task_notifications.arn
    ]
  }
}

# Create IAM policy
resource "aws_iam_policy" "sns_publish" {
  name        = "${var.project_name}-${var.environment}-sns-publish"
  description = "Allow Lambda functions to publish to SNS topics"
  policy      = data.aws_iam_policy_document.sns_publish.json

  tags = var.tags
}
