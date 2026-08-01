# -----------------------------------------------------------------------------
# Password policy (applies to the departmental groups).
# -----------------------------------------------------------------------------
resource "okta_policy_password" "standard" {
  name        = "${var.group_name_prefix}-${var.environment}-password"
  description = "Baseline password requirements (${var.environment})."
  status      = "ACTIVE"

  # Groups this policy applies to.
  groups_included = [for g in okta_group.department : g.id]

  password_min_length                    = 12
  password_min_lowercase                 = 1
  password_min_uppercase                 = 1
  password_min_number                    = 1
  password_min_symbol                    = 1
  password_exclude_username              = true
  password_history_count                 = 8
  password_max_age_days                  = 90
  password_min_age_minutes               = 60
  password_max_lockout_attempts          = 5
  password_lockout_notification_channels = ["EMAIL"]
}

# -----------------------------------------------------------------------------
# App sign-on (authentication) policy — Okta Identity Engine.
# okta_app_signon_policy defines an authentication policy that apps can be bound
# to; okta_app_signon_policy_rule adds rules (here: require MFA / two factors).
# -----------------------------------------------------------------------------
resource "okta_app_signon_policy" "app_auth" {
  name        = "${var.group_name_prefix}-${var.environment}-app-signon"
  description = "Authentication policy for managed applications (${var.environment})."
}

# To bind an app to this authentication policy, set authentication_policy on the
# app resource, e.g. add to okta_app_oauth.web in apps.tf:
#   authentication_policy = okta_app_signon_policy.app_auth.id

resource "okta_app_signon_policy_rule" "require_mfa" {
  policy_id = okta_app_signon_policy.app_auth.id
  name      = "Require MFA"
  priority  = 1
  access    = "ALLOW"

  # Require two factors (password + a second factor) on every access.
  factor_mode                 = "2FA"
  re_authentication_frequency = "PT12H"
  type                        = "ASSURANCE"

  # Apply to privileged users first; broaden as needed.
  groups_included = [okta_group.admins.id]

  constraints = [
    jsonencode({
      knowledge = {
        types            = ["password"]
        reauthenticateIn = "PT12H"
        required         = true
      }
      possession = {
        required           = true
        hardwareProtection = "REQUIRED"
      }
    })
  ]
}

# -----------------------------------------------------------------------------
# Classic global session sign-on policy (alternative to the OIE policy above).
# Uncomment if your org uses Okta Classic session policies. Only one model
# should govern a given flow — do not duplicate MFA enforcement.
# -----------------------------------------------------------------------------
# resource "okta_policy_signon" "session" {
#   name            = "${var.group_name_prefix}-${var.environment}-session"
#   description     = "Global session policy (${var.environment})."
#   status          = "ACTIVE"
#   groups_included = [okta_group.admins.id]
# }
#
# resource "okta_policy_rule_signon" "session_mfa" {
#   policy_id        = okta_policy_signon.session.id
#   name             = "Require MFA for admins"
#   status           = "ACTIVE"
#   access           = "ALLOW"
#   mfa_required     = true
#   mfa_prompt       = "SESSION"
#   session_idle     = 60
#   session_lifetime = 720
# }
