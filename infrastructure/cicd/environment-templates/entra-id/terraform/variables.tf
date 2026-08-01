# ---------------------------------------------------------------------------
# Authentication / tenant
# ---------------------------------------------------------------------------

variable "tenant_id" {
  description = "Entra ID tenant ID (GUID). Also settable via ARM_TENANT_ID."
  type        = string
}

variable "client_id" {
  description = "Client (application) ID of the Terraform service principal. Also settable via ARM_CLIENT_ID."
  type        = string
}

variable "use_oidc" {
  description = "Authenticate with GitHub OIDC -> Entra workload identity federation (no client secret). Recommended."
  type        = bool
  default     = true
}

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

variable "environment" {
  description = "Logical environment name (dev, test, prod). Used as a naming prefix."
  type        = string

  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "environment must be one of: dev, test, prod."
  }
}

variable "name_prefix" {
  description = "Prefix applied to created object display names, so environments do not collide."
  type        = string
  default     = "iac"
}

# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------

variable "engineering_group_name" {
  description = "Display name for the assigned engineering security group."
  type        = string
  default     = "Engineering"
}

variable "dynamic_group_membership_rule" {
  description = "Membership rule for the dynamic security group (Entra dynamic membership syntax)."
  type        = string
  default     = "(user.department -eq \"Engineering\")"
}

variable "break_glass_member_object_ids" {
  description = <<-EOT
    Object IDs of break-glass (emergency access) user accounts to place in the
    Conditional Access exclusion group. Manage the accounts themselves outside
    Terraform; only their membership in the exclusion group is referenced here.
  EOT
  type        = list(string)
  default     = []
}

# ---------------------------------------------------------------------------
# Application registration
# ---------------------------------------------------------------------------

variable "app_display_name" {
  description = "Display name for the app registration."
  type        = string
  default     = "Sample Web App"
}

variable "app_web_redirect_uris" {
  description = "OAuth 2.0 web redirect URIs for the app registration."
  type        = list(string)
  default     = ["https://app.example.com/auth/callback"]
}

variable "create_client_secret" {
  description = "Create an azuread_application_password (client secret). Prefer federated credentials; leave false in production."
  type        = bool
  default     = false
}
