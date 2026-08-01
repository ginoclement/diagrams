# -----------------------------------------------------------------------------
# Connection / org
# -----------------------------------------------------------------------------

variable "org_name" {
  description = "Okta org subdomain (the part before base_url), e.g. dev-123456."
  type        = string
}

variable "base_url" {
  description = "Okta base domain, e.g. okta.com or oktapreview.com."
  type        = string
  default     = "okta.com"
}

# -----------------------------------------------------------------------------
# Authentication (supply the OAuth trio OR api_token, not both).
# In CI these are populated from TF_VAR_* secrets. Defaults are empty so the
# provider's ternaries can select the mode that is actually configured.
# -----------------------------------------------------------------------------

variable "api_client_id" {
  description = "Client ID of the OAuth 2.0 API Services app (private-key JWT auth)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_private_key" {
  description = "PEM-encoded private key for the OAuth app's JWK (RSA or EC)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_scopes" {
  description = "Okta management API scopes granted to the OAuth app."
  type        = list(string)
  default = [
    "okta.groups.manage",
    "okta.apps.manage",
    "okta.authorizationServers.manage",
    "okta.policies.manage",
  ]
}

variable "api_token" {
  description = "Okta API token (SSWS). Simpler alternative to the OAuth app."
  type        = string
  default     = ""
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Environment
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Logical environment name (dev, test, prod). Used to name/scope resources."
  type        = string

  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "environment must be one of: dev, test, prod."
  }
}

# -----------------------------------------------------------------------------
# Application inputs
# -----------------------------------------------------------------------------

variable "web_app_label" {
  description = "Display label for the OIDC web application."
  type        = string
  default     = "Example Web App"
}

variable "web_app_redirect_uris" {
  description = "Allowed OAuth 2.0 redirect (callback) URIs for the OIDC web app."
  type        = list(string)
  default = [
    "https://app.example.com/authorization-code/callback",
  ]
}

variable "web_app_post_logout_redirect_uris" {
  description = "Allowed post-logout redirect URIs for the OIDC web app."
  type        = list(string)
  default = [
    "https://app.example.com/",
  ]
}

variable "saml_app_label" {
  description = "Display label for the SAML application."
  type        = string
  default     = "Example SAML App"
}

variable "saml_sso_url" {
  description = "SAML assertion consumer service (ACS) / single sign-on URL."
  type        = string
  default     = "https://saml.example.com/sso/acs"
}

variable "saml_audience" {
  description = "SAML audience / SP entity ID (audience restriction)."
  type        = string
  default     = "https://saml.example.com/metadata"
}

# -----------------------------------------------------------------------------
# Group inputs
# -----------------------------------------------------------------------------

variable "group_name_prefix" {
  description = "Prefix applied to managed group names, e.g. 'ACME'."
  type        = string
  default     = "ACME"
}

variable "departments" {
  description = "Departmental groups to create (one okta_group per entry)."
  type        = list(string)
  default     = ["Engineering", "Sales", "Finance"]
}
