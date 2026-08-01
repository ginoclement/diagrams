# -----------------------------------------------------------------------------
# OIDC web application (authorization code flow).
# -----------------------------------------------------------------------------
resource "okta_app_oauth" "web" {
  label                      = "${var.web_app_label} (${var.environment})"
  type                       = "web"
  grant_types                = ["authorization_code", "refresh_token"]
  response_types             = ["code"]
  redirect_uris              = var.web_app_redirect_uris
  post_logout_redirect_uris  = var.web_app_post_logout_redirect_uris
  token_endpoint_auth_method = "client_secret_basic"

  # Do not auto-assign Everyone; assignment is managed explicitly below.
  auto_submit_toolbar = false
  hide_ios            = false
  hide_web            = false

  lifecycle {
    # Assignments are managed by okta_app_group_assignments below.
    ignore_changes = [users, groups]
  }
}

# -----------------------------------------------------------------------------
# SAML 2.0 application (example / illustrative).
# -----------------------------------------------------------------------------
resource "okta_app_saml" "saml" {
  label             = "${var.saml_app_label} (${var.environment})"
  preconfigured_app = null

  sso_url     = var.saml_sso_url
  recipient   = var.saml_sso_url
  destination = var.saml_sso_url
  audience    = var.saml_audience

  subject_name_id_template = "$${user.userName}"
  subject_name_id_format   = "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"

  response_signed         = true
  signature_algorithm     = "RSA_SHA256"
  digest_algorithm        = "SHA256"
  honor_force_authn       = true
  authn_context_class_ref = "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"

  # Example attribute statement mapping a user attribute into the assertion.
  attribute_statements {
    type      = "EXPRESSION"
    name      = "email"
    namespace = "urn:oasis:names:tc:SAML:2.0:attrname-format:basic"
    values    = ["user.email"]
  }

  lifecycle {
    ignore_changes = [users, groups]
  }
}

# -----------------------------------------------------------------------------
# Group assignments — assign app-access groups to each application.
# okta_app_group_assignments manages the full set of group assignments for an app.
# -----------------------------------------------------------------------------
resource "okta_app_group_assignments" "web" {
  app_id = okta_app_oauth.web.id

  group {
    id       = okta_group.web_app_access.id
    priority = 1
  }
}

resource "okta_app_group_assignments" "saml" {
  app_id = okta_app_saml.saml.id

  group {
    id       = okta_group.saml_app_access.id
    priority = 1
  }
}
