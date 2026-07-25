---
title: "SSH Bastion / Jump Host with Short-Lived Certificates"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SSH Bastion / Jump Host with Short-Lived Certificates

**Status:** ✅ Current

## What it is

Access to internal hosts is funnelled through a hardened **bastion** (jump host), and
authentication uses **short-lived, CA-signed SSH certificates** instead of standing keys.
The operator first proves identity to a **certificate authority** service (typically via
SSO / OIDC plus MFA). The CA signs an **ephemeral user certificate** — a public key
stamped with **principals** (which accounts the holder may become), a short **validity
window** (minutes to a few hours), and constraining **critical options** such as
`source-address` and `force-command`. The client presents that certificate to the bastion,
which **`ProxyJump`s** to the target; both bastion and target are configured with the CA's
public key as a **trusted user CA**, so they accept any valid, unexpired certificate for an
allowed principal — **no per-user `authorized_keys` entries and no standing private keys**.
When the certificate expires it is simply no longer valid; there is nothing to revoke or
clean up. Implementations include Teleport, Smallstep, HashiCorp Vault's SSH secrets
engine, and Netflix BLESS.

## When it is used

- Fleets where managing `authorized_keys` per host does not scale and standing keys become
  un-auditable, un-rotated liabilities.
- Zero-standing-access designs: the operator holds **no** durable credential to a target;
  the ability to connect exists only for the certificate's lifetime.
- Environments needing centralized, attributable, revocable-by-expiry SSH access with a
  single choke point that can be logged and recorded.

## Actors

| Actor | Role |
|---|---|
| User | Developer / operator needing shell access to an internal host |
| Client | SSH client and agent that requests signing and presents the certificate |
| CA | SSH certificate authority / signing service gated by SSO + MFA |
| Bastion | Hardened jump host that fronts the internal network |
| Target | Internal host the operator ultimately administers |

## Alternate scenarios covered

- **Certificate signed and used** — CA issues a short-lived cert; client jumps through the
  bastion to the target, which validates the cert against the trusted CA.
- **Expired certificate** — a stale cert is rejected; the user must re-authenticate to the
  CA for a fresh one.
- **Principal / policy mismatch** — the requested target account is not in the cert's
  principals, or a critical option (source address) fails; the target denies.
- **Host certificate verification** — the client verifies the target's **host** certificate
  (also CA-signed) to defeat man-in-the-middle, not just trust-on-first-use.
- **Standing long-lived key fallback** — 🟡 legacy `authorized_keys` with a durable private
  key; discouraged because it has no expiry and no central revocation.

## Security notes

- **No standing keys is the whole point.** A leaked ephemeral certificate is useless after
  its short TTL, and there are no per-host key files to sprawl, rotate, or forget.
- **Constrain the certificate.** Set least principals, a short validity, `source-address`,
  and where possible `force-command`; a broad, long cert is nearly as dangerous as a
  standing key.
- **Sign host certificates too.** Client-side `@cert-authority` verification of the target's
  host key stops MITM and eliminates blind trust-on-first-use prompts.
- **Protect the CA.** The signing service is now the crown jewel — gate it with
  phishing-resistant MFA, log every issuance, and keep the CA private key in an HSM / KMS.
- **Long-lived `authorized_keys` are discouraged (🟡).** They cannot expire and are revoked
  only by editing files on every host; prefer certificates and, if keys must exist, keep a
  `revoked-keys` / KRL and rotate aggressively.

## Related diagrams

- [session-recording-monitoring](../session-recording-monitoring/README.md) — recording the session the bastion transports.
- [secrets-broker-dynamic-credentials](../secrets-broker-dynamic-credentials/README.md) — the same short-lived-credential idea applied to databases and cloud APIs.
- [jit-privilege-elevation](../jit-privilege-elevation/README.md) — time-boxing the *role*, as this time-boxes the *credential*.
- [credential-vault-checkout](../credential-vault-checkout/README.md) — the standing-secret alternative this pattern is designed to replace.

## Files

- [sequence.md](./sequence.md) — authenticate to CA → sign short-lived cert → ProxyJump via bastion → target validates, plus expiry, principal-mismatch, and host-cert alternates.
- [swimlane.md](./swimlane.md) — lanes for User, Client, CA, Bastion, Target.
- [flowchart.md](./flowchart.md) — certificate validation gates with explicit deny terminals and the legacy standing-key branch.
