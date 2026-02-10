#=============================================================================
# API Gateway REST API for Task Management
#=============================================================================

# Get AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

#=============================================================================
# REST API
#=============================================================================

resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "Task Management API - ${var.environment}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.tags
}

#=============================================================================
# Cognito Authorizer
#=============================================================================

resource "aws_api_gateway_authorizer" "cognito" {
  name            = "${var.project_name}-${var.environment}-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  identity_source = "method.request.header.Authorization"
  provider_arns   = [var.cognito_user_pool_arn]
}

#=============================================================================
# /tasks Resource
#=============================================================================

resource "aws_api_gateway_resource" "tasks" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "tasks"
}

# POST /tasks - Create Task
resource "aws_api_gateway_method" "create_task" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

resource "aws_api_gateway_integration" "create_task" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.tasks.id
  http_method             = aws_api_gateway_method.create_task.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# GET /tasks - List Tasks
resource "aws_api_gateway_method" "get_tasks" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
    "method.request.querystring.status"   = false
    "method.request.querystring.taskId"   = false
  }
}

resource "aws_api_gateway_integration" "get_tasks" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.tasks.id
  http_method             = aws_api_gateway_method.get_tasks.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# OPTIONS /tasks - CORS
resource "aws_api_gateway_method" "tasks_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tasks_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.tasks_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "tasks_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.tasks_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "tasks_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.tasks_options.http_method
  status_code = aws_api_gateway_method_response.tasks_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.tasks_options]
}

#=============================================================================
# /tasks/assigned Resource
#=============================================================================

resource "aws_api_gateway_resource" "tasks_assigned" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.tasks.id
  path_part   = "assigned"
}

# GET /tasks/assigned - Get Assigned Tasks (Members)
resource "aws_api_gateway_method" "get_assigned_tasks" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.tasks_assigned.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
    "method.request.querystring.status"   = false
  }
}

resource "aws_api_gateway_integration" "get_assigned_tasks" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.tasks_assigned.id
  http_method             = aws_api_gateway_method.get_assigned_tasks.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# OPTIONS /tasks/assigned - CORS
resource "aws_api_gateway_method" "tasks_assigned_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.tasks_assigned.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tasks_assigned_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tasks_assigned.id
  http_method = aws_api_gateway_method.tasks_assigned_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "tasks_assigned_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tasks_assigned.id
  http_method = aws_api_gateway_method.tasks_assigned_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "tasks_assigned_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tasks_assigned.id
  http_method = aws_api_gateway_method.tasks_assigned_options.http_method
  status_code = aws_api_gateway_method_response.tasks_assigned_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.tasks_assigned_options]
}

#=============================================================================
# /tasks/{taskId} Resource
#=============================================================================

resource "aws_api_gateway_resource" "task_by_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.tasks.id
  path_part   = "{taskId}"
}

# PUT /tasks/{taskId} - Update Task
resource "aws_api_gateway_method" "update_task" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.task_by_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
    "method.request.path.taskId"          = true
  }
}

resource "aws_api_gateway_integration" "update_task" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.task_by_id.id
  http_method             = aws_api_gateway_method.update_task.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# OPTIONS /tasks/{taskId} - CORS
resource "aws_api_gateway_method" "task_by_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.task_by_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "task_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_by_id.id
  http_method = aws_api_gateway_method.task_by_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "task_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_by_id.id
  http_method = aws_api_gateway_method.task_by_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "task_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_by_id.id
  http_method = aws_api_gateway_method.task_by_id_options.http_method
  status_code = aws_api_gateway_method_response.task_by_id_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.task_by_id_options]
}

#=============================================================================
# /tasks/{taskId}/assign Resource
#=============================================================================

resource "aws_api_gateway_resource" "task_assign" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.task_by_id.id
  path_part   = "assign"
}

# POST /tasks/{taskId}/assign - Assign Task
resource "aws_api_gateway_method" "assign_task" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.task_assign.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
    "method.request.path.taskId"          = true
  }
}

resource "aws_api_gateway_integration" "assign_task" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.task_assign.id
  http_method             = aws_api_gateway_method.assign_task.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# OPTIONS /tasks/{taskId}/assign - CORS
resource "aws_api_gateway_method" "task_assign_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.task_assign.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "task_assign_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_assign.id
  http_method = aws_api_gateway_method.task_assign_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "task_assign_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_assign.id
  http_method = aws_api_gateway_method.task_assign_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "task_assign_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_assign.id
  http_method = aws_api_gateway_method.task_assign_options.http_method
  status_code = aws_api_gateway_method_response.task_assign_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.task_assign_options]
}

#=============================================================================
# /tasks/{taskId}/close Resource
#=============================================================================

resource "aws_api_gateway_resource" "task_close" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.task_by_id.id
  path_part   = "close"
}

# POST /tasks/{taskId}/close - Close Task
resource "aws_api_gateway_method" "close_task" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.task_close.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
    "method.request.path.taskId"          = true
  }
}

resource "aws_api_gateway_integration" "close_task" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.task_close.id
  http_method             = aws_api_gateway_method.close_task.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# OPTIONS /tasks/{taskId}/close - CORS
resource "aws_api_gateway_method" "task_close_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.task_close.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "task_close_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_close.id
  http_method = aws_api_gateway_method.task_close_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "task_close_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_close.id
  http_method = aws_api_gateway_method.task_close_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "task_close_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.task_close.id
  http_method = aws_api_gateway_method.task_close_options.http_method
  status_code = aws_api_gateway_method_response.task_close_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.task_close_options]
}

#=============================================================================
# /auth Resource (Public - No Authorization)
#=============================================================================

resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "auth"
}

# /auth/signup Resource
resource "aws_api_gateway_resource" "auth_signup" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "signup"
}

# POST /auth/signup - User Registration
resource "aws_api_gateway_method" "signup" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_signup.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "signup" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.auth_signup.id
  http_method             = aws_api_gateway_method.signup.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.signup_lambda_invoke_arn
}

# OPTIONS /auth/signup - CORS
resource "aws_api_gateway_method" "auth_signup_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_signup.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_signup_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_signup.id
  http_method = aws_api_gateway_method.auth_signup_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_signup_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_signup.id
  http_method = aws_api_gateway_method.auth_signup_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "auth_signup_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_signup.id
  http_method = aws_api_gateway_method.auth_signup_options.http_method
  status_code = aws_api_gateway_method_response.auth_signup_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.auth_signup_options]
}

# /auth/login Resource
resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

# POST /auth/login - User Login
resource "aws_api_gateway_method" "login" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "login" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.auth_login.id
  http_method             = aws_api_gateway_method.login.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.login_lambda_invoke_arn
}

# OPTIONS /auth/login - CORS
resource "aws_api_gateway_method" "auth_login_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  status_code = aws_api_gateway_method_response.auth_login_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.auth_login_options]
}

# /auth/confirm Resource
resource "aws_api_gateway_resource" "auth_confirm" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "confirm"
}

# POST /auth/confirm - Confirm User Signup
resource "aws_api_gateway_method" "confirm_signup" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_confirm.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "confirm_signup" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.auth_confirm.id
  http_method             = aws_api_gateway_method.confirm_signup.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.confirm_signup_lambda_invoke_arn
}

# OPTIONS /auth/confirm - CORS
resource "aws_api_gateway_method" "auth_confirm_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_confirm.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_confirm_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_confirm.id
  http_method = aws_api_gateway_method.auth_confirm_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_confirm_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_confirm.id
  http_method = aws_api_gateway_method.auth_confirm_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "auth_confirm_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_confirm.id
  http_method = aws_api_gateway_method.auth_confirm_options.http_method
  status_code = aws_api_gateway_method_response.auth_confirm_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.auth_confirm_options]
}

# /auth/logout Resource
resource "aws_api_gateway_resource" "auth_logout" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "logout"
}

# POST /auth/logout - User Logout (Requires Token)
resource "aws_api_gateway_method" "logout" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_logout.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

resource "aws_api_gateway_integration" "logout" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.auth_logout.id
  http_method             = aws_api_gateway_method.logout.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.logout_lambda_invoke_arn
}

# OPTIONS /auth/logout - CORS
resource "aws_api_gateway_method" "auth_logout_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_logout.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_logout_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_logout.id
  http_method = aws_api_gateway_method.auth_logout_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_logout_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_logout.id
  http_method = aws_api_gateway_method.auth_logout_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "auth_logout_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_logout.id
  http_method = aws_api_gateway_method.auth_logout_options.http_method
  status_code = aws_api_gateway_method_response.auth_logout_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.auth_logout_options]
}

# /auth/refresh Resource
resource "aws_api_gateway_resource" "auth_refresh" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "refresh"
}

# POST /auth/refresh - Refresh Tokens (No Auth Required)
resource "aws_api_gateway_method" "refresh" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_refresh.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "refresh" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.auth_refresh.id
  http_method             = aws_api_gateway_method.refresh.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.refresh_lambda_invoke_arn
}

# OPTIONS /auth/refresh - CORS
resource "aws_api_gateway_method" "auth_refresh_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_refresh.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_refresh_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_refresh.id
  http_method = aws_api_gateway_method.auth_refresh_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_refresh_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_refresh.id
  http_method = aws_api_gateway_method.auth_refresh_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "auth_refresh_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_refresh.id
  http_method = aws_api_gateway_method.auth_refresh_options.http_method
  status_code = aws_api_gateway_method_response.auth_refresh_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.auth_refresh_options]
}

#=============================================================================
# Lambda Permission for API Gateway
#=============================================================================

# Permission for API Gateway to invoke Tasks Lambda
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/*"
}

# Permission for API Gateway to invoke Signup Lambda
resource "aws_lambda_permission" "api_gateway_signup" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.signup_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/*"
}

# Permission for API Gateway to invoke Login Lambda
resource "aws_lambda_permission" "api_gateway_login" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.login_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/*"
}

# Permission for API Gateway to invoke Confirm Signup Lambda
resource "aws_lambda_permission" "api_gateway_confirm_signup" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.confirm_signup_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/*"
}

# Permission for API Gateway to invoke Logout Lambda
resource "aws_lambda_permission" "api_gateway_logout" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.logout_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/*"
}

# Permission for API Gateway to invoke Refresh Lambda
resource "aws_lambda_permission" "api_gateway_refresh" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.refresh_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/*"
}

#=============================================================================
# API Gateway Deployment
#=============================================================================

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      # Resources
      aws_api_gateway_resource.tasks.id,
      aws_api_gateway_resource.tasks_assigned.id,
      aws_api_gateway_resource.task_by_id.id,
      aws_api_gateway_resource.task_assign.id,
      aws_api_gateway_resource.task_close.id,
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_resource.auth_signup.id,
      aws_api_gateway_resource.auth_login.id,
      aws_api_gateway_resource.auth_confirm.id,
      aws_api_gateway_resource.auth_logout.id,
      aws_api_gateway_resource.auth_refresh.id,
      # Authorizer
      aws_api_gateway_authorizer.cognito.id,
      # Main Methods
      aws_api_gateway_method.create_task.id,
      aws_api_gateway_method.get_tasks.id,
      aws_api_gateway_method.get_assigned_tasks.id,
      aws_api_gateway_method.update_task.id,
      aws_api_gateway_method.assign_task.id,
      aws_api_gateway_method.close_task.id,
      # Auth Methods
      aws_api_gateway_method.signup.id,
      aws_api_gateway_method.login.id,
      aws_api_gateway_method.confirm_signup.id,
      aws_api_gateway_method.logout.id,
      aws_api_gateway_method.refresh.id,
      # Main Integrations
      aws_api_gateway_integration.create_task.id,
      aws_api_gateway_integration.get_tasks.id,
      aws_api_gateway_integration.get_assigned_tasks.id,
      aws_api_gateway_integration.update_task.id,
      aws_api_gateway_integration.assign_task.id,
      aws_api_gateway_integration.close_task.id,
      # Auth Integrations
      aws_api_gateway_integration.signup.id,
      aws_api_gateway_integration.login.id,
      aws_api_gateway_integration.confirm_signup.id,
      aws_api_gateway_integration.logout.id,
      aws_api_gateway_integration.refresh.id,
      # OPTIONS Methods (CORS)
      aws_api_gateway_method.tasks_options.id,
      aws_api_gateway_method.tasks_assigned_options.id,
      aws_api_gateway_method.task_by_id_options.id,
      aws_api_gateway_method.task_assign_options.id,
      aws_api_gateway_method.task_close_options.id,
      aws_api_gateway_method.auth_signup_options.id,
      aws_api_gateway_method.auth_login_options.id,
      aws_api_gateway_method.auth_confirm_options.id,
      aws_api_gateway_method.auth_logout_options.id,
      aws_api_gateway_method.auth_refresh_options.id,
      # OPTIONS Integrations
      aws_api_gateway_integration.tasks_options.id,
      aws_api_gateway_integration.tasks_assigned_options.id,
      aws_api_gateway_integration.task_by_id_options.id,
      aws_api_gateway_integration.task_assign_options.id,
      aws_api_gateway_integration.task_close_options.id,
      aws_api_gateway_integration.auth_signup_options.id,
      aws_api_gateway_integration.auth_login_options.id,
      aws_api_gateway_integration.auth_confirm_options.id,
      aws_api_gateway_integration.auth_logout_options.id,
      aws_api_gateway_integration.auth_refresh_options.id,
      # OPTIONS Method Responses
      aws_api_gateway_method_response.tasks_options.id,
      aws_api_gateway_method_response.tasks_assigned_options.id,
      aws_api_gateway_method_response.task_by_id_options.id,
      aws_api_gateway_method_response.task_assign_options.id,
      aws_api_gateway_method_response.task_close_options.id,
      aws_api_gateway_method_response.auth_signup_options.id,
      aws_api_gateway_method_response.auth_login_options.id,
      aws_api_gateway_integration.signup,
      aws_api_gateway_integration.login,
      aws_api_gateway_integration.confirm_signup,
      aws_api_gateway_integration.logout,
      aws_api_gateway_integration.refresh,
      aws_api_gateway_method_response.auth_confirm_options.id,
      aws_api_gateway_method_response.auth_logout_options.id,
      aws_api_gateway_method_response.auth_refresh_options.id,
      # OPTIONS Integration Responses
      aws_api_gateway_integration_response.tasks_options.id,
      aws_api_gateway_integration_response.tasks_assigned_options.id,
      aws_api_gateway_integration_response.task_by_id_options.id,
      aws_api_gateway_integration_response.task_assign_options.id,
      aws_api_gateway_integration_response.task_close_options.id,
      aws_api_gateway_integration_response.auth_signup_options.id,
      aws_api_gateway_integration_response.auth_login_options.id,
      aws_api_gateway_integration_response.auth_confirm_options.id,
      aws_api_gateway_integration_response.auth_logout_options.id,
      aws_api_gateway_integration_response.auth_refresh_options.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.create_task,
    aws_api_gateway_integration.get_tasks,
    aws_api_gateway_integration.get_assigned_tasks,
    aws_api_gateway_integration.update_task,
    aws_api_gateway_integration.assign_task,
    aws_api_gateway_integration.close_task,
  ]
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = var.tags

  depends_on = [
    aws_api_gateway_account.main,
    aws_cloudwatch_log_group.api_gateway
  ]
}

#=============================================================================
# CloudWatch Logs
#=============================================================================

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/api-gateway/${var.project_name}-${var.environment}"
  retention_in_days = 7

  tags = var.tags
}

#=============================================================================
# API Gateway Account Settings (for CloudWatch Logs)
#=============================================================================

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.environment}-api-gateway-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
