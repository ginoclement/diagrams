---
title: "PocketID — Passkey-Only OIDC Provider"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# PocketID — Passkey-Only OIDC Provider

**Status:** ✅ Current

**PocketID** is a lightweight, self-hosted **OIDC provider** with a deliberately
minimalist model: **passkeys (WebAuthn) are the only authentication method** — there
are no passwords at all. A user authenticates to PocketID with a passkey, and PocketID
then acts as a standard OIDC **authorization server**, issuing tokens to downstream
clients via the **Authorization Code flow**. Users are typically **admin-created**,
and each user enrolls one or more passkeys, often via a **one-time link** on first
use.

This diagram shows both halves together: the **passkey login** (WebAuthn ceremony to
PocketID) and the **OIDC issuance** (authorization code -> tokens) to a client app.

## What makes this PocketID-specific (vs the generic flows)

Both halves are standard on their own — the WebAuthn ceremony is described in
[WebAuthn / Passkey Authentication](../../../authentication/tokenless/webauthn-passkey-authentication/README.md)
and the token issuance in
[OIDC Authorization Code + PKCE](../../../authentication/oidc/authorization-code-pkce/README.md) — and
this diagram references rather than re-draws their internals. What is
PocketID-specific is the **composition and constraints**: a **passwordless-only**
provider where WebAuthn is the *sole* first factor at the authorization endpoint,
**admin-provisioned users**, **one-time-link passkey onboarding**, and **multiple
passkeys per user** — all wrapped in a small self-hosted OIDC server.

## When it is used

- Self-hosting SSO for homelab / small-team apps behind one passkey-only identity.
- Fronting apps (and reverse proxies) that speak OIDC with phishing-resistant login.
- Environments that want zero passwords and no external identity dependency.

## Actors

| Actor | Role |
|---|---|
| User | Human; authenticates with a passkey (biometric / PIN) |
| Browser | Runs the WebAuthn ceremony, mediates the OIDC redirect |
| Client App | Downstream OIDC relying party requesting tokens |
| PocketID | Self-hosted OIDC provider: WebAuthn RP + authorization server |
| Admin | Creates users and issues one-time enrollment links |

## Alternate scenarios covered

- **First-time passkey registration via one-time link** — a new user opens an
  admin-issued one-time link and enrolls their first passkey before any login.
- **Admin-created user** — accounts are provisioned by an admin (no self sign-up).
- **Multiple passkeys per user** — a user registers additional passkeys (second
  device / roaming key) and can authenticate with any of them.

## Related diagrams

- [WebAuthn / Passkey Authentication](../../../authentication/tokenless/webauthn-passkey-authentication/README.md) — the login ceremony PocketID uses as its only factor.
- [OIDC Authorization Code + PKCE](../../../authentication/oidc/authorization-code-pkce/README.md) — the token issuance PocketID performs as the authorization server.
- [FIDO2 / Passkey Registration](../../../identity-lifecycle/enrollment-and-update/fido2-passkey-registration/README.md) — the enrollment ceremony behind the one-time link.
- [Okta FastPass Passwordless](../okta-fastpass-passwordless/README.md) — a heavyweight commercial take on device-bound passwordless.

## Files

- [sequence.md](./sequence.md) — passkey login to PocketID, then authorization code -> tokens to the client; onboarding alts.
- [swimlane.md](./swimlane.md) — lanes for User, Browser, Client App, PocketID, Admin.
- [flowchart.md](./flowchart.md) — decision logic: user known, passkey present, assertion valid, code issuance.
