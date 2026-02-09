resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-user-pool"

  username_attributes      = var.username_attributes
  auto_verified_attributes = var.auto_verified_attributes

  password_policy {
    minimum_length                   = var.password_minimum_length
    require_lowercase                = var.password_require_lowercase
    require_numbers                  = var.password_require_numbers
    require_symbols                  = var.password_require_symbols
    require_uppercase                = var.password_require_uppercase
    temporary_password_validity_days = var.temporary_password_validity_days
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = false
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable             = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = var.explicit_auth_flows

  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true
  refresh_token_validity        = var.refresh_token_validity
  access_token_validity         = var.access_token_validity
  id_token_validity             = var.id_token_validity

  token_validity_units {
    refresh_token = "days"
    access_token  = "hours"
    id_token      = "hours"
  }
}

resource "aws_cognito_user_group" "admin" {
  name         = var.admin_group_name
  user_pool_id = aws_cognito_user_pool.main.id
  description  = var.admin_group_description
  precedence   = 1
}

resource "aws_cognito_user_group" "member" {
  name         = var.member_group_name
  user_pool_id = aws_cognito_user_pool.main.id
  description  = var.member_group_description
  precedence   = 2
}
