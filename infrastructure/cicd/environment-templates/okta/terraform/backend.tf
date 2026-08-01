# Remote state backend (stub).
#
# Terraform state for an Okta org contains references to app IDs, policy IDs,
# and other sensitive metadata — store it remotely and encrypted, never in git.
# Uncomment ONE backend below and configure it. Use a distinct key/prefix per
# environment so dev/test/prod never share state.
#
# terraform {
#   # --- AWS S3 + DynamoDB lock ---
#   backend "s3" {
#     bucket         = "my-tfstate-bucket"
#     key            = "okta/dev/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "terraform-locks"
#     encrypt        = true
#   }
#
#   # --- Azure Blob Storage ---
#   # backend "azurerm" {
#   #   resource_group_name  = "tfstate-rg"
#   #   storage_account_name = "tfstatestorage"
#   #   container_name       = "tfstate"
#   #   key                  = "okta/dev/terraform.tfstate"
#   # }
#
#   # --- Google Cloud Storage ---
#   # backend "gcs" {
#   #   bucket = "my-tfstate-bucket"
#   #   prefix = "okta/dev"
#   # }
#
#   # --- HCP Terraform / Terraform Cloud ---
#   # cloud {
#   #   organization = "my-org"
#   #   workspaces {
#   #     name = "okta-dev"
#   #   }
#   # }
# }
