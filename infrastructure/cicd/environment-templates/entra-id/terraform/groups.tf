# Security groups.
#
# Two illustrative groups:
#   1. An "assigned" security group (explicit membership).
#   2. A "dynamic" security group whose membership is computed from a rule.
#   3. A break-glass exclusion group referenced by the Conditional Access policy.

# 1. Assigned security group.
resource "azuread_group" "engineering" {
  display_name     = "${var.name_prefix}-${var.environment}-${var.engineering_group_name}"
  description      = "Assigned-membership security group for engineering (${var.environment})."
  security_enabled = true
  mail_enabled     = false

  # "Assigned" is the default membership type; members are managed explicitly.
  # Add azuread_group_member resources or set members = [...] as needed.
}

# 2. Dynamic-membership security group.
#    types = ["DynamicMembership"] plus a dynamic_membership block with a rule.
resource "azuread_group" "engineering_dynamic" {
  display_name     = "${var.name_prefix}-${var.environment}-Engineering-Dynamic"
  description      = "Dynamic-membership security group populated by a membership rule (${var.environment})."
  security_enabled = true
  mail_enabled     = false

  types = ["DynamicMembership"]

  dynamic_membership {
    enabled = true
    rule    = var.dynamic_group_membership_rule
  }
}

# 3. Break-glass exclusion group. Emergency-access accounts are placed here and
#    excluded from Conditional Access so a policy or MFA outage cannot lock the
#    tenant. Manage the accounts themselves outside Terraform.
resource "azuread_group" "break_glass_exclusion" {
  display_name     = "${var.name_prefix}-${var.environment}-CA-BreakGlass-Exclude"
  description      = "Break-glass / emergency access accounts excluded from Conditional Access."
  security_enabled = true
  mail_enabled     = false

  members = var.break_glass_member_object_ids
}
