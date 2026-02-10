module "cognito" {
  source = "./modules/cognito"

  project_name           = var.project_name
  environment            = var.environment
  allowed_email_domains  = var.allowed_email_domains
  pre_signup_lambda_arn  = module.lambda.pre_signup_function_arn
  ses_email_identity_arn = module.ses.ses_identity_arn
  sender_email           = var.sender_email
  tags                   = var.tags

  depends_on = [module.ses]
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
  logout_lambda_invoke_arn            = module.lambda.logout_invoke_arn
  logout_lambda_function_name         = module.lambda.logout_function_name
  refresh_lambda_invoke_arn           = module.lambda.refresh_invoke_arn
  refresh_lambda_function_name        = module.lambda.refresh_function_name
  me_lambda_invoke_arn                = module.lambda.me_invoke_arn
  me_lambda_function_name             = module.lambda.me_function_name

  # Cognito configuration
  cognito_user_pool_arn = module.cognito.user_pool_arn
  cognito_user_pool_id  = module.cognito.user_pool_id

  depends_on = [module.lambda, module.cognito]
}

module "amplify" {
  source = "./modules/amplify"

  app_name            = "${var.project_name}-${var.environment}-frontend"
  repository          = var.github_repository
  branch_name         = var.github_branch
  github_access_token = var.github_access_token
  enable_auto_build   = var.enable_amplify_auto_build
  framework           = "React"

  environment_variables = {
    VITE_API_BASE_URL          = module.api_gateway.api_endpoint
    VITE_COGNITO_USER_POOL_ID  = module.cognito.user_pool_id
    VITE_COGNITO_CLIENT_ID     = module.cognito.client_id
    VITE_COGNITO_REGION        = var.aws_region
  }

  tags = var.tags

  depends_on = [module.api_gateway, module.cognito]
}
