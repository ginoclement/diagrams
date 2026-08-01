# Departmental groups (one per entry in var.departments).
resource "okta_group" "department" {
  for_each = toset(var.departments)

  name        = "${var.group_name_prefix}-${var.environment}-${each.value}"
  description = "${each.value} department (${var.environment})."
}

# App-access groups — membership in these grants assignment to the apps below.
resource "okta_group" "web_app_access" {
  name        = "${var.group_name_prefix}-${var.environment}-App-WebApp"
  description = "Grants access to the ${var.web_app_label} OIDC application (${var.environment})."
}

resource "okta_group" "saml_app_access" {
  name        = "${var.group_name_prefix}-${var.environment}-App-SamlApp"
  description = "Grants access to the ${var.saml_app_label} SAML application (${var.environment})."
}

# A privileged/admin group used by the app sign-on (MFA) policy.
resource "okta_group" "admins" {
  name        = "${var.group_name_prefix}-${var.environment}-Admins"
  description = "Privileged users subject to stricter sign-on rules (${var.environment})."
}
