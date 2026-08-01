# Remote state backend (STUB — uncomment and configure one).
#
# Never commit local state. Use a separate backend key/workspace PER TENANT so
# dev/test/prod state never mix. Encrypt state at rest — Auth0 client secrets and
# connection options are stored in state.
#
# ---- Example: AWS S3 + DynamoDB lock ----
# terraform {
#   backend "s3" {
#     bucket         = "example-tfstate"
#     key            = "auth0/dev/terraform.tfstate"   # change per environment
#     region         = "us-east-1"
#     dynamodb_table = "example-tfstate-locks"
#     encrypt        = true
#   }
# }
#
# ---- Example: Azure Storage ----
# terraform {
#   backend "azurerm" {
#     resource_group_name  = "example-tfstate-rg"
#     storage_account_name = "exampletfstate"
#     container_name       = "tfstate"
#     key                  = "auth0/dev/terraform.tfstate"
#   }
# }
#
# ---- Example: Terraform Cloud ----
# terraform {
#   cloud {
#     organization = "example-org"
#     workspaces {
#       name = "auth0-dev"   # one workspace per environment
#     }
#   }
# }
