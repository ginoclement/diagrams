# Actions (extensibility) and trigger bindings.
#
# A post-login Action that adds a custom claim to the issued tokens, plus the
# auth0_trigger_actions binding that attaches it to the post-login flow.

resource "auth0_action" "add_custom_claim" {
  name    = "${var.environment}-add-custom-claim"
  runtime = "node18"

  # The trigger this Action supports. version "v3" is current for post-login.
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  deploy = true

  code = <<-EOT
    /**
     * Post-login Action: add a namespaced custom claim to the tokens.
     *
     * @param {Event} event - details about the user and login request.
     * @param {PostLoginAPI} api - interface to affect the login behavior.
     */
    exports.onExecutePostLogin = async (event, api) => {
      const namespace = 'https://example.com';

      // Add a custom claim to both the ID token and the access token.
      api.idToken.setCustomClaim(`$${namespace}/environment`, event.tenant.id);
      api.accessToken.setCustomClaim(`$${namespace}/environment`, event.tenant.id);

      // Example: surface the user's roles (populated by RBAC / roles.tf).
      const roles = (event.authorization && event.authorization.roles) || [];
      api.idToken.setCustomClaim(`$${namespace}/roles`, roles);
    };
  EOT
}

# Bind the Action to the post-login trigger. auth0_trigger_actions is
# authoritative for the order of Actions on this trigger.
resource "auth0_trigger_actions" "post_login" {
  trigger = "post-login"

  actions {
    id           = auth0_action.add_custom_claim.id
    display_name = auth0_action.add_custom_claim.name
  }
}
