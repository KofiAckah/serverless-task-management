output "topic_arn" {
  description = "ARN of the SNS topic for task notifications"
  value       = aws_sns_topic.task_notifications.arn
}

output "topic_name" {
  description = "Name of the SNS topic"
  value       = aws_sns_topic.task_notifications.name
}

output "sns_publish_policy_arn" {
  description = "ARN of the IAM policy for SNS publish permissions"
  value       = aws_iam_policy.sns_publish.arn
}
