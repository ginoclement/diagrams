# App registration, its service principal, and (optionally) a client secret.

# Well-known Microsoft Graph IDs, resolved at plan time.
data "azuread_application_published_app_ids" "well_known" {}

data "azuread_service_principal" "msgraph" {
  client_id = data.azuread_application_published_app_ids.well_known.result["MicrosoftGraph"]
}

# App registration.
resource "azuread_application" "web_app" {
  display_name     = "${var.name_prefix}-${var.environment}-${var.app_display_name}"
  sign_in_audience = "AzureADMyOrg"

  owners = []

  web {
    redirect_uris = var.app_web_redirect_uris

    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled     = false
    }
  }

  # Requested API permissions (Microsoft Graph). Delegated scopes here as an
  # example; grant admin consent out-of-band or via your provisioning process.
  required_resource_access {
    resource_app_id = data.azuread_service_principal.msgraph.client_id

    # User.Read (delegated) — sign in and read the signed-in user's profile.
    resource_access {
      id   = data.azuread_service_principal.msgraph.oauth2_permission_scope_ids["User.Read"]
      type = "Scope"
    }

    # email (delegated).
    resource_access {
      id   = data.azuread_service_principal.msgraph.oauth2_permission_scope_ids["email"]
      type = "Scope"
    }
  }

  # App roles exposed by this application (assignable to users and/or apps).
  app_role {
    id                   = "d7f8a1b2-3c4d-5e6f-7a8b-9c0d1e2f3a4b"
    allowed_member_types = ["User"]
    display_name         = "Admin"
    description          = "Administrators of the sample web app."
    value                = "App.Admin"
    enabled              = true
  }

  app_role {
    id                   = "e8f9b2c3-4d5e-6f70-8b9c-0d1e2f3a4b5c"
    allowed_member_types = ["User"]
    display_name         = "Reader"
    description          = "Read-only users of the sample web app."
    value                = "App.Reader"
    enabled              = true
  }
}

# Service principal (enterprise application) for the registration in this tenant.
resource "azuread_service_principal" "web_app" {
  client_id                    = azuread_application.web_app.client_id
  app_role_assignment_required = false
  owners                       = []
}

# Optional client secret. Prefer federated credentials
# (azuread_application_federated_identity_credential) over a long-lived secret.
# Gated on var.create_client_secret; leave false in production.
resource "azuread_application_password" "web_app" {
  count = var.create_client_secret ? 1 : 0

  application_id = azuread_application.web_app.id
  display_name   = "${var.environment}-tf-managed"
  end_date       = "2027-01-01T00:00:00Z"
}
