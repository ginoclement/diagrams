# Remote state. Uncomment and point at your own backend. Never commit local state.
#
# Example: Azure Storage (azurerm backend). Use a distinct `key` per environment
# so state is never shared across dev/test/prod. Prefer OIDC for the backend too
# (use_azuread_auth + use_oidc), so no storage key or secret is stored.
#
# terraform {
#   backend "azurerm" {
#     resource_group_name  = "rg-tfstate"
#     storage_account_name = "sttfstateidentity"
#     container_name       = "tfstate"
#     key                  = "entra-id/dev.tfstate" # change per environment
#
#     use_azuread_auth = true
#     use_oidc         = true
#     # tenant_id / client_id come from ARM_TENANT_ID / ARM_CLIENT_ID
#   }
# }
