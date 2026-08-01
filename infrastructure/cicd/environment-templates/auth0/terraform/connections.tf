# Connections (identity sources).
#
#   - a username/password database connection with a password policy
#   - a social connection (Google OAuth2) as an example of a non-database source
#
# auth0_connection_clients (plural, authoritative) enables each connection for
# the specific applications that may use it.

# ---------------------------------------------------------------------------
# Database connection (username / password) with password policy
# ---------------------------------------------------------------------------

resource "auth0_connection" "db" {
  name     = "${var.environment}-username-password"
  strategy = "auth0"

  options {
    # Password policy.
    password_policy = "good" # none | low | fair | good | excellent

    password_complexity_options {
      min_length = 12
    }

    password_history {
      enable = true
      size   = 5
    }

    password_no_personal_info {
      enable = true
    }

    password_dictionary {
      enable = true
    }

    # Attack protection / signup behavior.
    brute_force_protection = true
    disable_signup         = false
    requires_username      = false

    # Password hashing / import.
    password_hashing_algorithm = "bcrypt"
  }
}

# Enable the database connection for both applications.
resource "auth0_connection_clients" "db" {
  connection_id = auth0_connection.db.id

  enabled_clients = [
    auth0_client.spa.id,
    auth0_client.webapp.id,
  ]
}

# ---------------------------------------------------------------------------
# Social connection example (Google OAuth2)
#
# Provide client_id / client_secret for the upstream IdP via variables/secrets
# in a real deployment; left blank here so the template contains no credentials.
# A blank social connection will not function until configured — this is an
# example of the resource shape only.
# ---------------------------------------------------------------------------

resource "auth0_connection" "google" {
  name     = "google-oauth2"
  strategy = "google-oauth2"

  options {
    # client_id     = var.google_client_id      # supply via secret
    # client_secret = var.google_client_secret  # supply via secret

    scopes = ["email", "profile"]
  }
}

resource "auth0_connection_clients" "google" {
  connection_id = auth0_connection.google.id

  enabled_clients = [
    auth0_client.spa.id,
    auth0_client.webapp.id,
  ]
}
