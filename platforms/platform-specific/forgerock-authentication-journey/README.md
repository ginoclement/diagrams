---
title: "ForgeRock / PingAM Authentication Journeys (Trees)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# ForgeRock / PingAM Authentication Journeys (Trees)

**Status:** ✅ Current

In **ForgeRock Access Management (PingAM)**, authentication is modeled as a **tree**
(a "Journey" in Ping Identity Platform terms): a directed graph of **nodes** wired
from a **Start** node to **Success** / **Failure** outcome nodes. The client drives
the tree through the **`/json/realms/<realm>/authenticate` JSON API**: AM returns an
**`authId`** (an opaque, signed continuation token) plus a set of **callbacks** the
client must fill in; the client posts them back with the same `authId`; AM advances
to the next node and returns the next callbacks — repeating until an outcome node is
reached and a **session token (SSO token / `tokenId`)** is issued.

Typical nodes: **Page Node** (groups callbacks), **Username Collector**, **Password
Collector**, **Data Store Decision** (validate credentials against the identity
store), **MFA / Push / WebAuthn**, **Inner Tree Evaluator** (call another tree as a
subroutine), **Retry Limit**, **Account Lockout**.

## What makes this ForgeRock-specific (vs the generic flow)

Once a session exists, AM can federate apps via standard
[OIDC](../../../authentication/oidc/authorization-code-pkce/README.md) or
[SAML](../../../authentication/saml/sp-initiated-sso/README.md) — not re-drawn here. What is
ForgeRock-specific is the **tree/journey execution model**: the stateless
**`authId` + callbacks** loop over the `/authenticate` endpoint, **node-by-node**
progression, **branching outcomes** per node (true/false/other), **Inner Tree**
composition, and node-driven lockout / retry.

## When it is used

- Any AM-protected login where authentication is designed visually as a tree.
- Adaptive / risk-based journeys that branch on device, geo, or behavior nodes.
- Progressive profiling and step-up composed from reusable inner trees.

## Actors

| Actor | Role |
|---|---|
| User | Supplies credentials / completes challenges |
| Client | App or login UI (ForgeRock SDK / XUI) driving the `/authenticate` API |
| PingAM | ForgeRock Access Management: executes the tree, returns callbacks, issues session |
| Directory | ForgeRock Directory Services (DS) or other identity store validating credentials |

## Alternate scenarios covered

- **Branch on failure node** — Data Store Decision returns `false`; the tree routes
  to a retry / failure branch instead of the success path.
- **MFA node** — the tree includes a Push / OTP / WebAuthn node that emits its own
  callbacks before continuing.
- **Account lockout node** — a Retry Limit / Account Lockout node trips after N
  failures and routes to Failure (and locks the account in DS).
- **Progressive profiling node** — an Inner Tree collects missing profile attributes
  before reaching Success.

## Related diagrams

- [OIDC Authorization Code + PKCE](../../../authentication/oidc/authorization-code-pkce/README.md) — token issuance AM performs once the session exists.
- [SAML SP-Initiated SSO](../../../authentication/saml/sp-initiated-sso/README.md) — alternative federation from an AM session.
- [ForgeRock IDM Sync & Reconciliation](../forgerock-idm-sync-reconciliation/README.md) — how identities in DS are provisioned.
- [WebAuthn / Passkey Authentication](../../../authentication/tokenless/webauthn-passkey-authentication/README.md) — the ceremony behind a WebAuthn node.

## Files

- [sequence.md](./sequence.md) — `authId` + callbacks loop across nodes to a session token; alts.
- [swimlane.md](./swimlane.md) — lanes for User, Client, PingAM, Directory.
- [flowchart.md](./flowchart.md) — node-by-node tree traversal with branch outcomes and lockout terminals.
