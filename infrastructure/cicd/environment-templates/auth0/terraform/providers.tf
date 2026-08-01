# Auth0 provider configuration.
#
# Credentials come from variables, which are fed by TF_VAR_* environment variables
# in CI (never hard-coded here). The provider also natively reads AUTH0_DOMAIN,
# AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET from the environment, but wiring them
# through variables keeps the plan explicit and makes multi-tenant use obvious.

provider "auth0" {
  domain        = var.auth0_domain
  client_id     = var.auth0_client_id
  client_secret = var.auth0_client_secret

  # debug = false
}
