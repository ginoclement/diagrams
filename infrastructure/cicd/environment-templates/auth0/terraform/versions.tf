# Terraform and provider version constraints.
# Pin the provider to the v1 line; review the changelog before bumping the major.

terraform {
  required_version = ">= 1.6"

  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.0"
    }
  }
}
