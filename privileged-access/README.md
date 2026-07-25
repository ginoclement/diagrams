---
title: "Privileged Access Management (PAM / PIM)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Privileged Access Management (PAM / PIM)

How organizations control, broker, and audit access to **privileged accounts** —
root, domain admin, database `sa`, cloud org-owner, shared service accounts, and the
infrastructure they administer. The unifying goal is to eliminate *standing* privilege:
credentials are vaulted, elevation is just-in-time and time-bound, sessions are proxied
and recorded, and the long-lived secret is replaced wherever possible by a short-lived,
automatically rotated one.

Where [oidc/](../authentication/oidc) and [saml/](../authentication/saml) authenticate *people into apps*, these
diagrams cover the far blast radius of *administrative* access: who may hold the keys to
production, for how long, under what approval, and with what recording. The recurring
theme is **least standing privilege**: nobody keeps admin rights they are not using
right now.

## Diagrams

- [credential-vault-checkout](./credential-vault-checkout/README.md) ✅ — vault check-out / check-in of a shared privileged credential, brokered login so the human never sees the secret, automatic rotation on check-in.
- [jit-privilege-elevation](./jit-privilege-elevation/README.md) ✅ — just-in-time elevation: eligible assignment, request, approval, time-bound activation, automatic revoke at expiry.
- [break-glass-emergency-access](./break-glass-emergency-access/README.md) ✅ — sealed emergency accounts, multi-person control, heavy real-time alerting, and mandatory post-use review.
- [session-recording-monitoring](./session-recording-monitoring/README.md) ✅ — proxied privileged session with full keystroke / command / video recording, real-time policy enforcement and session termination.
- [ssh-bastion-jump-host](./ssh-bastion-jump-host/README.md) ✅ — bastion / jump host with short-lived CA-signed SSH certificates and no standing keys on target hosts (long-lived static keys shown as the discouraged alternate).
- [secrets-broker-dynamic-credentials](./secrets-broker-dynamic-credentials/README.md) 🔵 — a secrets broker mints short-lived database / cloud credentials on demand with a lease and TTL, revoking them automatically when the lease ends.

## Related categories

- [cloud-iam/entra/pim-jit-elevation](../platforms/cloud-iam/entra/pim-jit-elevation/README.md) — the concrete Entra Privileged Identity Management implementation of [jit-privilege-elevation](./jit-privilege-elevation/README.md).
- [workload-identity/](../workload-identity) — the non-human counterpart: short-lived, auto-rotated credentials for *software*, using the same "no standing secret" principle as [secrets-broker-dynamic-credentials](./secrets-broker-dynamic-credentials/README.md).
- [network-security/](../infrastructure/network-security) — the transport and segmentation layer a bastion or session proxy sits inside.
- [user-lifecycle/](../identity-lifecycle/user-lifecycle) — how the underlying human identities that become *eligible* for privilege are joined, moved, and de-provisioned.

## More diagrams

- [Secrets Broker with Dynamic Credentials](./secrets-broker-dynamic-credentials/README.md)
- [Privileged Session Recording and Monitoring](./session-recording-monitoring/README.md)
- [SSH Bastion / Jump Host with Short-Lived Certificates](./ssh-bastion-jump-host/README.md)
