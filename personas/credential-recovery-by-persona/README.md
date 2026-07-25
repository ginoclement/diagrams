# Credential Recovery by Persona

**Status:** ✅ Current

## What it is

"I lost my credential" is not one flow. What "recovery" even means depends on the persona:

- **Consumer** — **self-service reset (SSPR) only**. Verify proof of control of a recovery
  channel and let the user set a new credential. There is no helpdesk to fall back to.
- **Workforce** — **SSPR plus a helpdesk fallback**. Self-service first; if that fails
  (lost all factors, locked out), an identity-verified helpdesk path resets or re-enrols.
- **Privileged** — **vaulted, no direct reset**. Privileged credentials are not "recovered"
  by the user; they are **checked out from a vault and rotated**. The human never holds a
  standing secret to lose.
- **Workload** — **rotate keys/certs**, not reset. A machine has no memory to jog and no
  channel to verify; recovery means **issuing a new secret or certificate** and revoking the old.

It references the base password-management diagrams for reset mechanics and shows only the
per-persona divergence.

## Actors

| Actor | Role |
|---|---|
| `User` | Human recovering access (consumer, workforce, or privileged operator) |
| `IdP` | Identity provider handling verification and reset |
| `Helpdesk` | Assisted-recovery desk (workforce fallback) |
| `Vault` | Privileged credential vault / PAM |
| `Owner` | Workload owner rotating machine credentials |

## Alternate scenarios covered

- **Consumer SSPR** — verify recovery channel, set new credential; no assisted path.
- **Workforce SSPR + helpdesk** — self-service first, identity-proofed helpdesk fallback.
- **Privileged vaulted** — no user reset; check out from vault, rotate on check-in.
- **Workload rotate keys/certs** — owner issues new credential, revokes old, updates consumers.

## Security notes

- Recovery is the **most attacked** flow because it deliberately bypasses normal
  authentication — its verification must be **at least as strong** as the credential it restores.
- Consumer SSPR relies on the recovery channel (email/phone); protect that channel and prefer a
  registered passkey as the recovery factor over knowledge-based questions (deprecated).
- Helpdesk is a **social-engineering target**: require scripted identity proofing, out-of-band
  verification, and full audit; never let a caller's assertion of identity suffice.
- Privileged recovery must **never** hand the human a standing secret — that reintroduces the
  risk vaulting removed. Recovery is rotate-and-recheckout, and every check-out is logged.
- Workload rotation must be **overlap-safe**: issue the new credential and let consumers pick it
  up before revoking the old, or the "recovery" becomes an outage.
- [Account unlock](../../password-management/account-unlock/README.md) (lockout, not lost
  credential) is a related but distinct flow; recovery here is about a lost or compromised secret.

## Related diagrams

- [Self-Service Password Reset](../../password-management/self-service-reset/README.md) — consumer/workforce base flow
- [Admin-Initiated Reset](../../password-management/admin-initiated-reset/README.md) — helpdesk-assisted base flow
- [Account Unlock](../../password-management/account-unlock/README.md) — the related lockout flow
- [Secrets Management](../../architecture/secrets-management/README.md) — where workload keys/certs are stored and rotated
- [Authentication by Persona](../authentication-by-persona/README.md) — the flow recovery restores access to
- [Personas reference](../README.md) — archetypes and variance matrix

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — per-persona `alt` recovery exchange
- [swimlane.md](swimlane.md) — User / IdP / Helpdesk / Vault / Owner lanes
- [flowchart.md](flowchart.md) — recovery-model decision tree
