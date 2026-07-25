---
title: "Okta Identity Engine (OIE) Policy-Driven Sign-In"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Okta Identity Engine (OIE) Policy-Driven Sign-In

**Status:** ✅ Current

Okta Identity Engine replaces the older "Okta Classic" fixed sign-in with a
**policy-driven, dynamically sequenced** authentication pipeline. A single login is
evaluated against two distinct policy layers:

- **Global Session Policy** — decides whether an *Okta org session* may be
  established at all (idle/lifetime limits, MFA-for-org, network zones, device
  state).
- **Authentication Policy** (the app **Sign-On Policy**) — attached to the specific
  application being accessed, decides which **factors / assurance** are required to
  release *that app*. The Identity Engine re-evaluates it on every app access, so a
  user with an org session can still be step-upped when opening a sensitive app.

The Identity Engine drives the interaction through the **Interaction Code / `/idx`
remediation model**: the server returns the *next allowed remediation* (identify,
select-authenticator, challenge, enroll) and the client (Okta-hosted Sign-In Widget
or an app using the Embedded SDK) renders it. Factors are **sequenced dynamically**
from policy rather than hard-coded, which is what makes this vendor-specific.

## What makes this Okta-specific (vs the generic flow)

Underneath, an app still gets its tokens through the standard
[OIDC Authorization Code + PKCE](../../../authentication/oidc/authorization-code-pkce/README.md) (or
[SAML SP-initiated SSO](../../../authentication/saml/sp-initiated-sso/README.md)) flow — this diagram
does **not** re-draw that. What is Okta-specific is everything that happens *at the
authorization endpoint* before the code is issued: the **two-layer policy
evaluation** (Global Session + Authentication Policy), the **`/idx` remediation
loop**, dynamic factor sequencing, device assurance, and network-zone rules.

## When it is used

- Any OIE-based Okta org where apps carry per-app Authentication Policies.
- Sensitive apps that require **step-up** even for users who already have an org
  session.
- Passwordless or "any 2 factors" policies where the required factors are chosen at
  runtime by rule, not fixed at design time.

## Actors

| Actor | Role |
|---|---|
| User | Human signing in |
| Browser | User agent; renders the Okta Sign-In Widget |
| App | The relying application (OIDC client / SAML SP) |
| Okta | Okta Identity Engine org: authorization endpoint, `/idx` remediation, policy engine, factor challenge |
| Directory | Okta Universal Directory or upstream store validating credentials |

## Alternate scenarios covered

- **Passwordless** — Authentication Policy allows Okta Verify / FastPass as a single
  phishing-resistant factor, skipping password remediation.
- **Factor enrollment during sign-in** — policy requires a factor the user has not
  enrolled; OIE injects an `enroll-authenticator` remediation inline.
- **Device assurance** — policy requires a managed / registered device; unmanaged
  devices are denied or forced to enroll.
- **Network zone rule** — a Global Session Policy rule matches an untrusted IP zone
  and forces MFA (or blocks).

## Related diagrams

- [OIDC Authorization Code + PKCE](../../../authentication/oidc/authorization-code-pkce/README.md) — the token-issuance mechanics OIE wraps.
- [SAML SP-Initiated SSO](../../../authentication/saml/sp-initiated-sso/README.md) — alternative app federation Okta can drive with the same policy layers.
- [Okta FastPass Passwordless](../okta-fastpass-passwordless/README.md) — the device-bound factor OIE can sequence.
- [Okta Inline Hooks](../okta-inline-hooks/README.md) — external callouts that extend this pipeline.
- [MFA Enrollment](../../../identity-lifecycle/enrollment-and-update/mfa-enrollment/README.md) — the enrollment ceremony OIE can trigger inline.

## Files

- [sequence.md](./sequence.md) — authorize, `/idx` remediation loop, two-policy evaluation, dynamic challenge; alts.
- [swimlane.md](./swimlane.md) — lanes for User, Browser, App, Okta, Directory.
- [flowchart.md](./flowchart.md) — Global Session then Authentication Policy decision logic with deny terminals.
