module "cognito" {
  source = "./modules/cognito"

  project_name          = var.project_name
  environment           = var.environment
  allowed_email_domains = var.allowed_email_domains
  tags                  = var.tags
  # TODO: Uncomment when Lambda module is ready
  # pre_signup_lambda_arn = module.lambda.pre_signup_function_arn
}

module "dynamodb" {
  source = "./modules/dynamodb"

  project_name     = var.project_name
  environment      = var.environment
  billing_mode     = var.dynamodb_billing_mode
  enable_streams   = var.enable_streams
  stream_view_type = var.stream_view_type
  tags             = var.tags
}

module "ses" {
  source = "./modules/ses"

  project_name          = var.project_name
  environment           = var.environment
  sender_email          = var.sender_email
  allowed_email_domains = var.allowed_email_domains
  tags                  = var.tags
}

