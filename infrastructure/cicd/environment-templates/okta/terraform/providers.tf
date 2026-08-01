# Okta provider configuration.
#
# Two supported auth modes (supply ONE):
#   1. OAuth 2.0 service app, private-key JWT (recommended):
#        client_id + private_key + scopes
#   2. API token (simpler):
#        api_token
#
# All values come from variables, which in CI are populated from TF_VAR_* env
# (see workflows/deploy.yml). Never hard-code credentials here.

provider "okta" {
  org_name = var.org_name
  base_url = var.base_url

  # --- OAuth 2.0 private-key-JWT (used when client_id is set) ---
  client_id   = var.api_client_id != "" ? var.api_client_id : null
  private_key = var.api_private_key != "" ? var.api_private_key : null
  scopes      = var.api_client_id != "" ? var.api_scopes : null

  # --- API token (used when api_token is set instead) ---
  api_token = var.api_token != "" ? var.api_token : null
}
