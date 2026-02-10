module "cognito" {
  source = "./modules/cognito"

  project_name          = var.project_name
  environment           = var.environment
  allowed_email_domains = var.allowed_email_domains
  pre_signup_lambda_arn = module.lambda.pre_signup_function_arn
  tags                  = var.tags
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

module "lambda" {
  source = "./modules/lambda"

  project_name          = var.project_name
  environment           = var.environment
  runtime               = var.lambda_runtime
  timeout               = var.lambda_timeout
  memory_size           = var.lambda_memory
  allowed_email_domains = var.allowed_email_domains
  sender_email          = var.sender_email
  tags                  = var.tags

  # DynamoDB Table configuration
  tasks_table_name             = module.dynamodb.tasks_table_name
  tasks_table_arn              = module.dynamodb.tasks_table_arn
  assignments_table_name       = module.dynamodb.assignments_table_name
  assignments_table_arn        = module.dynamodb.assignments_table_arn
  tasks_table_stream_arn       = module.dynamodb.tasks_table_stream_arn
  assignments_table_stream_arn = module.dynamodb.assignments_table_stream_arn

  # SES configuration
  ses_policy_arn = module.ses.ses_send_email_policy_arn

  # Cognito configuration
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_user_pool_arn = module.cognito.user_pool_arn
  cognito_client_id     = module.cognito.client_id
}

module "api_gateway" {
  source = "./modules/api-gateway"

  project_name = var.project_name
  environment  = var.environment
  region       = var.aws_region
  tags         = var.tags

  # Lambda configuration
  lambda_invoke_arn    = module.lambda.tasks_invoke_arn
  lambda_function_name = module.lambda.tasks_function_name

  # Auth Lambda configuration
  signup_lambda_invoke_arn            = module.lambda.signup_invoke_arn
  signup_lambda_function_name         = module.lambda.signup_function_name
  login_lambda_invoke_arn             = module.lambda.login_invoke_arn
  login_lambda_function_name          = module.lambda.login_function_name
  confirm_signup_lambda_invoke_arn    = module.lambda.confirm_signup_invoke_arn
  confirm_signup_lambda_function_name = module.lambda.confirm_signup_function_name

  # Cognito configuration
  cognito_user_pool_arn = module.cognito.user_pool_arn
  cognito_user_pool_id  = module.cognito.user_pool_id

  depends_on = [module.lambda, module.cognito]
}
