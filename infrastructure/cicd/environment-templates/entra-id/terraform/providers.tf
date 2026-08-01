# Microsoft Entra ID provider.
#
# Recommended: authenticate with GitHub OIDC -> Entra workload identity federation.
#   - Set use_oidc = true (below) and provide tenant_id + client_id.
#   - The provider exchanges the CI-issued OIDC token for an Entra access token;
#     no client secret is stored anywhere.
#   - These also map to the ARM_TENANT_ID / ARM_CLIENT_ID / ARM_USE_OIDC env vars,
#     which the GitHub Actions workflow sets for you.
#
# Fallback: a client secret (ARM_CLIENT_SECRET). Long-lived credential — prefer
# federation, especially for prod. Do not set both.

provider "azuread" {
  tenant_id = var.tenant_id
  client_id = var.client_id

  # OIDC / workload identity federation (keyless). Leave true for CI.
  use_oidc = var.use_oidc

  # Do NOT hard-code a client secret here. If you must use the client-secret
  # fallback, supply it via the ARM_CLIENT_SECRET environment variable instead.
}
