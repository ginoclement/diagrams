---
title: "OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens (RFC 8705)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8705"
---

# OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens (RFC 8705)

**Status:** 🔵 Emerging

## What it is

RFC 8705 defines two related mechanisms built on mutual TLS (mTLS):

1. **mTLS client authentication** at the token endpoint — the client presents an
   X.509 client certificate during the TLS handshake instead of (or in addition to)
   a `client_secret` or `private_key_jwt`. Two variants exist:
   `tls_client_auth` (certificate issued by a trusted CA, matched against a
   pre-registered subject DN or SAN) and `self_signed_tls_client_auth`
   (certificate matched against a pre-registered `jwks`/`jwks_uri` thumbprint).
2. **Certificate-bound access tokens** — the authorization server binds the issued
   access token to the client's certificate by embedding a confirmation claim
   `cnf` with member `x5t#S256`, the base64url SHA-256 thumbprint of the
   certificate. The resource server later requires the same certificate on the
   TLS connection and rejects the token if the presented cert's thumbprint does not
   match `cnf.x5t#S256`. This turns a bearer token into a proof-of-possession (PoP)
   token, so a stolen token is useless without the corresponding private key.

The AS advertises support via metadata (`tls_client_certificate_bound_access_tokens: true`)
and typically exposes a separate mTLS alias endpoint set (`mtls_endpoint_aliases`) so the
TLS-client-auth handshake happens on a distinct host/port.

## When it is used

- High-assurance and regulated deployments (open banking / FAPI, healthcare, B2B
  workload-to-workload) where bearer tokens are considered too weak.
- Confidential clients that already manage PKI/certificates and want strong,
  key-based sender constraining without application-layer signing on every request.
- As an alternative to [DPoP](../dpop/README.md): mTLS constrains at the TLS layer
  (good when TLS terminates at or is passed through to the resource server), whereas
  DPoP is application-layer (better for public/browser clients that cannot present a
  client cert).

## Actors

| Actor | Role |
|---|---|
| Client | Confidential client holding an X.509 cert + private key, presents the cert on every TLS connection to the token endpoint and API |
| IdP | Authorization server: mTLS token endpoint, validates the client cert, mints tokens with `cnf.x5t#S256` |
| API | Resource server: terminates/inspects mTLS, compares presented cert thumbprint to the token's `cnf` |

## Alternate scenarios covered

- Happy path: mTLS auth at `/token`, token issued with `cnf.x5t#S256`, API confirms
  the presented cert thumbprint matches before serving.
- Token replayed on a connection without the bound client cert (or with a different
  cert) → API returns `401 invalid_token`.
- `self_signed_tls_client_auth` variant: cert matched against registered JWKS
  thumbprint rather than a CA chain.
- Introspection of a bound token: AS returns `cnf.x5t#S256`, resource server
  bind-checks it — see [Token Introspection](../token-introspection/README.md).

## Security notes

- Binding defeats bearer-token theft: exfiltrating the access token alone is not
  enough; the attacker also needs the client's TLS private key.
- The thumbprint is `x5t#S256` = base64url(SHA-256(DER(cert))). The API must compute
  it over the **leaf** client certificate actually presented on the connection.
- With a TLS-terminating proxy in front of the API, the proxy must forward the
  verified client certificate (e.g. via a trusted header) so the API can bind-check;
  that header path must be un-spoofable from outside.
- `tls_client_auth` trusts a CA to vouch for the DN/SAN; rotate and revoke via the CA
  and keep the registered expected subject exact. `self_signed_tls_client_auth`
  trusts only the registered key thumbprint.
- mTLS binding and [DPoP](../dpop/README.md) solve the same PoP problem at different
  layers; pick one per deployment and advertise it in metadata.

## Related diagrams

- [DPoP](../dpop/README.md) — application-layer proof of possession, the alternative to mTLS binding.
- [Token Introspection](../token-introspection/README.md) — returns the `cnf` so a resource server can bind-check opaque tokens.
- [Client Credentials](../client-credentials/README.md) — the grant most often paired with mTLS client auth for workloads.
- [Pushed Authorization Requests](../pushed-authorization-requests/README.md) — commonly mandated together with mTLS in FAPI profiles.

## Files

- [sequence.md](sequence.md) — happy path plus replay-without-cert, self-signed variant, and introspection alternates.
- [swimlane.md](swimlane.md) — lanes for Client, IdP, API.
- [flowchart.md](flowchart.md) — client-auth method and thumbprint-binding decision logic with error terminals.
