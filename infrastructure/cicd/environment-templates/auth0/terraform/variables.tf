# Input variables.
#
# The three credential variables are provided at run time via TF_VAR_auth0_*
# environment variables (mapped from CI secrets). Everything else is generic and
# safe to keep in per-environment tfvars files.

# ---------------------------------------------------------------------------
# Credentials (provided via TF_VAR_* env vars — never commit real values)
# ---------------------------------------------------------------------------

variable "auth0_domain" {
  description = "Auth0 tenant canonical domain, e.g. your-tenant.us.auth0.com"
  type        = string
}

variable "auth0_client_id" {
  description = "Client ID of the M2M app authorized for the Auth0 Management API"
  type        = string
}

variable "auth0_client_secret" {
  description = "Client secret of the M2M app authorized for the Auth0 Management API"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------------------
# Environment / naming
# ---------------------------------------------------------------------------

variable "environment" {
  description = "Logical environment name (dev, test, prod). Used only for naming/labels."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "test", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, test, staging, prod."
  }
}

variable "tenant_friendly_name" {
  description = "Human-friendly tenant name shown in dashboards and emails."
  type        = string
  default     = "Example CIAM Tenant"
}

variable "support_email" {
  description = "Support email address surfaced to end users."
  type        = string
  default     = "support@example.com"
}

variable "support_url" {
  description = "Support URL surfaced to end users."
  type        = string
  default     = "https://example.com/support"
}

# ---------------------------------------------------------------------------
# Session lifetimes (minutes)
# ---------------------------------------------------------------------------

variable "session_lifetime_hours" {
  description = "Absolute session lifetime in hours."
  type        = number
  default     = 168 # 7 days
}

variable "idle_session_lifetime_hours" {
  description = "Idle session lifetime in hours."
  type        = number
  default     = 72 # 3 days
}

# ---------------------------------------------------------------------------
# Application URLs (generic placeholders — replace per environment)
# ---------------------------------------------------------------------------

variable "spa_callback_urls" {
  description = "Allowed callback URLs for the SPA."
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "spa_logout_urls" {
  description = "Allowed logout URLs for the SPA."
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "spa_web_origins" {
  description = "Allowed web origins (CORS) for the SPA."
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "webapp_callback_urls" {
  description = "Allowed callback URLs for the regular web app."
  type        = list(string)
  default     = ["http://localhost:8080/callback"]
}

variable "webapp_logout_urls" {
  description = "Allowed logout URLs for the regular web app."
  type        = list(string)
  default     = ["http://localhost:8080"]
}

# ---------------------------------------------------------------------------
# API (resource server)
# ---------------------------------------------------------------------------

variable "api_identifier" {
  description = "Unique identifier (audience) for the API resource server."
  type        = string
  default     = "https://api.example.com"
}
