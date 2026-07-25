---
title: "Choosing an Authentication Protocol"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing an Authentication Protocol

**Status:** ✅ Current

A decision guide for picking the primary authentication protocol for an application or
service: **OIDC**, **SAML**, **Kerberos**, or a **tokenless** mechanism (mutual TLS, API
key, or a plain server session). The short version: greenfield browser and mobile apps
should default to OIDC; keep SAML where an existing enterprise IdP already speaks it;
use Kerberos for domain-joined intranet apps; use tokenless mechanisms for
machine-to-machine or network-boundary cases.

## How to use this guide

1. Walk [flowchart.md](flowchart.md) from the top. The first split is human vs
   machine caller, then browser vs native, then whether an enterprise IdP already
   dictates the protocol.
2. Land on a leaf naming the recommended protocol and follow its **Leaf link** to the
   concrete flow.
3. Use [comparison-table.md](comparison-table.md) to confirm tradeoffs and status before
   committing.

## Options at a glance

- 🟢 ✅ **OIDC** (OpenID Connect on OAuth 2.0) — default for new web, SPA, mobile, and
  API-fronted apps. Modern, JSON/JWT, broad library support.
- 🟡 **SAML 2.0** — still first-class for enterprise workforce SSO where the IdP and
  partners already use it. Marked 🟡 **Legacy for new consumer/greenfield apps** — prefer
  OIDC there.
- ✅ **Kerberos** — best for domain-joined, intranet Windows apps needing seamless
  single sign-on inside a trusted realm.
- ✅ **Tokenless — mutual TLS** — service-to-service auth with certificates, no user.
- ✅ **Tokenless — session cookie / API key** — simplest option for a single first-party
  web app or a machine API key, when federation is not needed.

## Related diagrams

- [OIDC — Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md)
- [SAML — SP-initiated SSO](../../saml/sp-initiated-sso/README.md)
- [Kerberos — SPNEGO over HTTP](../../kerberos/spnego-http/README.md)
- [Tokenless — Mutual TLS](../../tokenless/mutual-tls/README.md)
- [Tokenless — Session cookie](../../tokenless/session-cookie/README.md)
- [Choosing an OAuth grant](../choosing-an-oauth-grant/README.md) — once you have picked OIDC.
- [SAML to OIDC migration](../saml-to-oidc-migration/README.md)

## Files

- [flowchart.md](flowchart.md) — the decision tree.
- [comparison-table.md](comparison-table.md) — option-by-option tradeoffs and status.
