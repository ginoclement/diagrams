# API (resource server) and its scopes.
#
# A resource server represents an API that Auth0 issues access tokens for. The
# identifier (audience) is a logical URI and does not need to be reachable.

resource "auth0_resource_server" "api" {
  name       = "${var.environment}-example-api"
  identifier = var.api_identifier

  signing_alg = "RS256"

  # Access token lifetimes (seconds).
  token_lifetime         = 86400 # 24h for browser-obtained tokens
  token_lifetime_for_web = 7200  # 2h

  # Allow the API to skip the consent prompt for first-party clients.
  skip_consent_for_verifiable_first_party_clients = true

  # Enforce that a policy/RBAC is used for authorization.
  enforce_policies = true
  token_dialect    = "access_token_authz"
}

# Manage the full set of scopes for the API in one place. Using
# auth0_resource_server_scopes (plural, authoritative) means Terraform owns the
# complete scope list for this resource server.
resource "auth0_resource_server_scopes" "api" {
  resource_server_identifier = auth0_resource_server.api.identifier

  scopes {
    name        = "read:items"
    description = "Read items"
  }

  scopes {
    name        = "create:items"
    description = "Create items"
  }

  scopes {
    name        = "update:items"
    description = "Update items"
  }

  scopes {
    name        = "delete:items"
    description = "Delete items"
  }
}
