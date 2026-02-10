/**
 * AWS Amplify Module
 * Deploys React frontend to AWS Amplify
 */

# Amplify App Resource
resource "aws_amplify_app" "frontend" {
  count = var.repository != "" ? 1 : 0

  name       = var.app_name
  repository = var.repository

  # GitHub access token for repository access
  access_token = var.github_access_token

  # Environment variables passed to build
  environment_variables = var.environment_variables

  # Build settings
  build_spec =  <<-EOT
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
EOT

  # SPA routing rules
  custom_rule {
    source = "/<*>"
    status = "200"
    target = "/index.html"
  }

  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>"
    status = "200"
    target = "/index.html"
  }

  # Enable auto branch creation
  enable_branch_auto_build = var.enable_auto_build
  enable_auto_branch_creation = false

  platform = "WEB_COMPUTE"

  tags = var.tags
}

# Branch configuration
resource "aws_amplify_branch" "main" {
  count = var.repository != "" ? 1 : 0

  app_id      = aws_amplify_app.frontend[0].id
  branch_name = var.branch_name

  framework = var.framework
  stage     = "PRODUCTION"

  enable_auto_build = var.enable_auto_build

  # Environment variables specific to this branch (if needed)
  environment_variables = var.branch_environment_variables

  tags = var.tags
}

# Optional: Custom domain association
# Uncomment and configure if you have a custom domain

# resource "aws_amplify_domain_association" "main" {
#   count = var.domain_name != "" ? 1 : 0
#
#   app_id      = aws_amplify_app.frontend[0].id
#   domain_name = var.domain_name
#
#   sub_domain {
#     branch_name = aws_amplify_branch.main[0].branch_name
#     prefix      = ""
#   }
#
#   sub_domain {
#     branch_name = aws_amplify_branch.main[0].branch_name
#     prefix      = "www"
#   }
# }
