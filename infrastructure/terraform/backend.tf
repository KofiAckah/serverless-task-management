terraform {
  backend "s3" {
    bucket         = "terraform-state-management-serverless-task-management"
    key            = "terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
  }
}