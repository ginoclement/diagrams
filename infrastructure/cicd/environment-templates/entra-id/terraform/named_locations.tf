# Named location — a trusted corporate IP range referenced by Conditional Access.

variable "trusted_ip_ranges" {
  description = "CIDR IP ranges considered trusted (corporate egress, VPN, etc.)."
  type        = list(string)
  default     = ["203.0.113.0/24", "198.51.100.0/24"]
}

resource "azuread_named_location" "corp_ips" {
  display_name = "${var.name_prefix}-${var.environment}-Corporate-IPs"

  ip {
    ip_ranges = var.trusted_ip_ranges
    trusted   = true
  }
}
