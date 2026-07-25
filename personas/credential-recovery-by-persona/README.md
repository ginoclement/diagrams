# Credential Recovery by Persona

**Status:** ✅ Current

## What it is

One goal — "I lost access, restore it" — but the safe path differs sharply by who the
principal is. This diagram set overlays the personas so the forks in recovery are visible
side by side rather than buried in separate flows:

- **Consumer** — fully **self-service reset (SSPR)**: prove control of a recovery factor
  (email/SMS/passkey), set a new password. No human in the loop.
- **Workforce** — SSPR when enough factors are registered; otherwise a **helpdesk-assisted**
  reset with identity proofing (the fallback path, and the one attackers target).
- **Privileged** — **no direct reset of the account by its holder**. The credential lives in
  a **vault**; recovery means checking out (or rotating) the vaulted secret under approval,
  not resetting a password the operator knows.
- **Workload** — no password at all: recovery is **rotating keys/certificates** — issue a new
  keypair or certificate and revoke the old, ideally via re-attestation, never a human reset.

It does not redraw each base mechanism — it references them and shows only what the persona
changes.

## Actors

| Actor | Role |
|---|---|
| `User` | Human principal (consumer, workforce, or privileged operator) |
| `Portal` | Self-service / recovery portal or admin console |
| `IdP` | Identity provider / directory that holds the credential and recovery factors |
| `Helpdesk` | Service-desk operator performing assisted, proofed reset |
| `Vault` | Privileged-access vault / secret manager holding the privileged credential |
| `Issuer` | CA / secret manager that rotates a workload's keys or certificates |

## Alternate scenarios covered

Each persona is an `alt` branch in the sequence, a lane group in the swimlane, and a
top-level decision branch in the flowchart:

- **Consumer SSPR** — verify recovery factor, set new password, done.
- **Workforce SSPR or helpdesk fallback** — SSPR if factors suffice; else proofed
  helpdesk reset with a one-time code and forced change.
- **Privileged vaulted recovery** — no self-reset; approval-gated checkout/rotation of the
  vaulted secret.
- **Workload key/cert rotation** — re-attest, issue new credential, revoke old; no reset
  concept at all.

## Security notes

- The **helpdesk path is the classic attack surface**: enforce strong identity proofing
  (knowledge + possession, manager callback, or video ID), never reset on a single weak
  signal, and log every assisted reset.
- **Never let a privileged holder self-reset** a standing credential — that turns recovery
  into a bypass of vault approval and session recording. Route all privileged recovery
  through the vault's checkout/rotation with approval and expiry.
- Recovery factors are credentials: a consumer's recovery email/phone must itself be
  protected and re-verified periodically; SMS/voice as the *only* recovery factor is weak.
- For workloads, prefer **rotation over reset**: issue a fresh key/cert bound to attestation
  and revoke the old one, so there is no human-resettable secret to phish.
- Rate-limit and monitor recovery endpoints; account recovery is an authentication bypass by
  design, so treat a spike as an attack.

## Related diagrams

- [password-management/self-service-reset](../../password-management/self-service-reset/README.md) — the consumer/workforce SSPR base flow.
- [password-management/admin-initiated-reset](../../password-management/admin-initiated-reset/README.md) — the helpdesk-driven reset detail.
- [password-management/account-unlock](../../password-management/account-unlock/README.md) — lockout vs credential loss.
- [privileged-access/credential-vault-checkout](../../privileged-access/credential-vault-checkout/README.md) — the vaulted privileged recovery path.
- [workload-identity/mutual-tls-bootstrap](../../workload-identity/mutual-tls-bootstrap/README.md) — key/cert rotation for workloads.
- [Personas reference](../README.md) — archetypes and full variance matrix.

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — per-persona `alt` message exchange
- [swimlane.md](swimlane.md) — lanes with a persona router
- [flowchart.md](flowchart.md) — persona-type decision tree
