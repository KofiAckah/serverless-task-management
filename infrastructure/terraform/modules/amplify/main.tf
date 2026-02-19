#=============================================================================
# AWS Amplify App for Frontend Hosting and CI/CD
#=============================================================================

# Amplify App
resource "aws_amplify_app" "frontend" {
  name        = "${var.project_name}-${var.environment}-frontend"
  repository  = var.repository_url
  description = "Task Management Frontend - ${var.environment}"

  # GitHub access token
  access_token = var.github_access_token

  # Build settings
  build_spec = file("${path.root}/../../amplify.yml")

  # Environment variables for build
  environment_variables = {
    VITE_API_BASE_URL         = var.api_gateway_url
    VITE_COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    VITE_COGNITO_CLIENT_ID    = var.cognito_client_id
    VITE_AWS_REGION           = var.aws_region
    VITE_APP_NAME             = "Task Management System"
    _LIVE_UPDATES             = jsonencode([{
      pkg     = "node"
      type    = "nvm"
      version = "20"
    }])
  }

  # Enable auto branch creation for feature branches
  enable_auto_branch_creation = false
  enable_branch_auto_build    = true
  enable_branch_auto_deletion = false

  # Custom rules for single page application routing
  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  # Auto branch creation config
  auto_branch_creation_config {
    enable_auto_build = false
  }

  # Platform - WEB for static sites (Vite/React)
  platform = "WEB"

  tags = var.tags
}

# Main branch deployment
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = var.branch_name

  enable_auto_build = true
  stage             = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"

  # Environment variables can be overridden at branch level if needed
  environment_variables = {
    VITE_API_BASE_URL         = var.api_gateway_url
    VITE_COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    VITE_COGNITO_CLIENT_ID    = var.cognito_client_id
    VITE_AWS_REGION           = var.aws_region
    VITE_APP_NAME             = "Task Management System"
  }

  tags = var.tags
}

# IAM role for Amplify
resource "aws_iam_role" "amplify" {
  name = "${var.project_name}-${var.environment}-amplify-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# Attach basic Amplify execution policy
resource "aws_iam_role_policy_attachment" "amplify_backend_deployment" {
  role       = aws_iam_role.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}
