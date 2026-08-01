# Roles (RBAC).
#
# Roles bundle API permissions (scopes on a resource server). Assign these roles
# to users via the dashboard, an Action, or your provisioning flow. RBAC must be
# enabled on the resource server (see enforce_policies in resource_servers.tf).

resource "auth0_role" "reader" {
  name        = "${var.environment}-reader"
  description = "Read-only access to the example API."
}

resource "auth0_role_permissions" "reader" {
  role_id = auth0_role.reader.id

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:items"
  }
}

resource "auth0_role" "editor" {
  name        = "${var.environment}-editor"
  description = "Read/write access to the example API."
}

resource "auth0_role_permissions" "editor" {
  role_id = auth0_role.editor.id

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:items"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:items"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:items"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:items"
  }

  # Ensure the scopes exist before they are referenced as permissions.
  depends_on = [auth0_resource_server_scopes.api]
}
