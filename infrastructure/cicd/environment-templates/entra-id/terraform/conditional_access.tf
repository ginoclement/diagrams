# Conditional Access — require MFA for all users, excluding break-glass accounts.
#
# HIGH BLAST RADIUS: a misconfigured CA policy can lock every admin out of the
# tenant. The break-glass exclusion group (see groups.tf) is excluded so an
# emergency-access account can always sign in. Validate with state = "enabledForReportingButNotEnforced"
# (report-only) before switching to "enabled".

variable "ca_policy_state" {
  description = "Conditional Access policy state. Use report-only until validated."
  type        = string
  default     = "enabledForReportingButNotEnforced"

  validation {
    condition     = contains(["enabled", "disabled", "enabledForReportingButNotEnforced"], var.ca_policy_state)
    error_message = "ca_policy_state must be enabled, disabled, or enabledForReportingButNotEnforced."
  }
}

resource "azuread_conditional_access_policy" "require_mfa_all_users" {
  display_name = "${var.name_prefix}-${var.environment}-Require-MFA-All-Users"
  state        = var.ca_policy_state

  conditions {
    client_app_types = ["all"]

    applications {
      included_applications = ["All"]
    }

    users {
      included_users = ["All"]

      # Always exclude the break-glass / emergency access accounts.
      excluded_groups = [azuread_group.break_glass_exclusion.object_id]
    }

    locations {
      included_locations = ["All"]

      # Trusted corporate IPs are not exempt here; adjust if you want to skip
      # MFA on trusted networks by excluding azuread_named_location.corp_ips.id.
      excluded_locations = []
    }
  }

  grant_controls {
    operator          = "OR"
    built_in_controls = ["mfa"]
  }
}
