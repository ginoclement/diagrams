# Tenant-wide settings.
#
# There is exactly one auth0_tenant per Auth0 tenant. These settings apply
# globally to the tenant this provider is pointed at.

resource "auth0_tenant" "this" {
  friendly_name = var.tenant_friendly_name
  support_email = var.support_email
  support_url   = var.support_url

  # Default directory for username/password logins (must match a database
  # connection name enabled in this tenant). See connections.tf.
  default_directory = auth0_connection.db.name

  # Session lifetimes are configured in hours.
  session_lifetime      = var.session_lifetime_hours
  idle_session_lifetime = var.idle_session_lifetime_hours

  # Tenant-wide flags.
  flags {
    # Disable clickjacking protection headers only if you know why you need to.
    disable_clickjack_protection_headers = false
    # Enable the newer universal login experience.
    enable_public_signup_user_exists_error = true
    # Use scope descriptions on the consent prompt.
    use_scope_descriptions_for_consent = true
  }

  # Send a richer set of claims in the ID token where supported.
  sessions {
    oidc_logout_prompt_enabled = false
  }
}
