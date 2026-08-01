# -----------------------------------------------------------------------------
# Custom authorization server (issues access tokens for your APIs).
# -----------------------------------------------------------------------------
resource "okta_auth_server" "api" {
  name        = "${var.group_name_prefix}-${var.environment}-api"
  description = "Custom authorization server for ${var.environment} APIs."
  audiences   = ["api://${var.group_name_prefix}-${var.environment}"]
}

# A custom scope on the authorization server.
resource "okta_auth_server_scope" "read" {
  auth_server_id   = okta_auth_server.api.id
  name             = "api.read"
  description      = "Read access to the API."
  consent          = "IMPLICIT"
  metadata_publish = "ALL_CLIENTS"
}

resource "okta_auth_server_scope" "write" {
  auth_server_id   = okta_auth_server.api.id
  name             = "api.write"
  description      = "Write access to the API."
  consent          = "IMPLICIT"
  metadata_publish = "ALL_CLIENTS"
}

# A custom claim added to access tokens (maps the user's groups).
resource "okta_auth_server_claim" "groups" {
  auth_server_id          = okta_auth_server.api.id
  name                    = "groups"
  claim_type              = "RESOURCE"
  value_type              = "GROUPS"
  value                   = ".*"
  group_filter_type       = "REGEX"
  scopes                  = [okta_auth_server_scope.read.name]
  always_include_in_token = true
}

# Access policy for the authorization server, restricted to the OIDC web app.
resource "okta_auth_server_policy" "default" {
  auth_server_id   = okta_auth_server.api.id
  name             = "Default access policy (${var.environment})"
  description      = "Governs which clients may request tokens from this auth server."
  status           = "ACTIVE"
  priority         = 1
  client_whitelist = [okta_app_oauth.web.id]
}

# A rule within the policy defining token lifetimes and allowed grant types.
resource "okta_auth_server_policy_rule" "default" {
  auth_server_id       = okta_auth_server.api.id
  policy_id            = okta_auth_server_policy.default.id
  name                 = "Default rule (${var.environment})"
  status               = "ACTIVE"
  priority             = 1
  grant_type_whitelist = ["authorization_code", "refresh_token"]
  scope_whitelist      = ["*"]
  group_whitelist      = ["EVERYONE"]

  access_token_lifetime_minutes  = 60
  refresh_token_lifetime_minutes = 0
  refresh_token_window_minutes   = 10080
}
