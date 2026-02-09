module "cognito" {
  source = "./modules/cognito"

  project_name          = var.project_name
  environment           = var.environment
  allowed_email_domains = var.allowed_email_domains
  tags                  = var.tags
}
