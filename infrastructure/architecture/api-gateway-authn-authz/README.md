---
title: "API Gateway Authentication & Authorization (BFF Pattern)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# API Gateway Authentication & Authorization (BFF Pattern)

**Status:** ✅ Current

## What it shows

The API gateway / Backend-for-Frontend (BFF) pattern as a security architecture: a single
edge component that terminates TLS, **validates the caller's token** (JWT signature check
against JWKS, or opaque-token introspection), enforces **scope/claim-based authorization**,
applies **rate limiting**, and only then **routes** the request to the right upstream
microservice. Downstream calls use **token exchange** so each service receives a narrowly
scoped credential rather than the caller's original token.

The gateway is a concrete [Policy Enforcement Point](../zero-trust-architecture/README.md)
for APIs. The tokens it validates are minted by the flows in the
[OIDC category](../../../authentication/oidc/authorization-code-pkce/README.md).

## Actors / components

| Component | Role |
|---|---|
| Client / SPA / Mobile | Caller presenting a bearer token (or the BFF's session) |
| API Gateway / BFF | Edge: TLS termination, token validation, authZ, rate limit, routing |
| Authorization Server / IdP | Issues tokens; exposes JWKS and the introspection endpoint |
| JWKS endpoint | Publishes the signing public keys used to verify JWT signatures |
| Introspection endpoint | Validates opaque/reference tokens and returns their state |
| Token Exchange (STS) | Swaps the caller token for a downstream-scoped token (RFC 8693) |
| Rate limiter | Enforces per-client / per-route request quotas |
| Microservice A / B | Upstream services that trust only the gateway's forwarded identity |

## Trust boundaries & security notes

- **The gateway is the only public surface.** Microservices sit on an internal network and
  never accept direct external traffic; they trust identity forwarded by the gateway.
- **Validate signature before trusting any claim.** For JWTs, verify the signature against
  the correct key from JWKS (match `kid`, pin the issuer and allowed algorithms — reject
  `alg: none`), then check `iss`, `aud`, `exp`/`nbf`, and required scopes. For opaque
  tokens, call introspection and cache the result within the token's short lifetime.
- **AuthN is not authZ.** A valid token proves who is calling; the gateway still enforces
  that the token's scopes/claims permit *this* route and method. Deny by default.
- **Do not forward the caller's token downstream unchanged.** Use
  [token exchange](../../../authentication/oidc/client-credentials/README.md) to mint a service-scoped,
  audience-restricted token per hop, limiting blast radius if one service is compromised.
- **Rate limiting is a security control**, not just capacity management — it throttles
  credential-stuffing, token-guessing, and abusive clients at the edge.
- **Terminate TLS at the edge and re-establish it internally**; pair with an
  [mTLS service mesh](../../network-security/mtls-service-mesh/README.md) so gateway ->
  service and service -> service traffic is mutually authenticated.
- **JWKS caching + rotation:** cache keys and honor rotation via `kid`; never fetch keys
  from a URL named inside the token itself.

## Related diagrams

- [Zero trust architecture](../zero-trust-architecture/README.md) — the gateway as a PEP
- [IdP reference architecture](../identity-provider-reference-architecture/README.md) — where the tokens come from
- [Secrets management](../secrets-management/README.md) — how the gateway holds introspection creds
- [OIDC Authorization Code + PKCE](../../../authentication/oidc/authorization-code-pkce/README.md) — how a client obtains the token
- [OAuth 2.0 Client Credentials](../../../authentication/oidc/client-credentials/README.md) — machine tokens + token exchange downstream
- [mTLS service mesh](../../network-security/mtls-service-mesh/README.md) — mutual TLS behind the gateway

## Files

- [sequence.md](./sequence.md) — a request validated, authorized, rate-limited, exchanged, and routed
- [swimlane.md](./swimlane.md) — public / gateway / service tier topology
- [flowchart.md](./flowchart.md) — the gateway's token-validation and authorization decision
