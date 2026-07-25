---
title: "HTTP Basic Authentication"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7617, RFC 7616"
---

# HTTP Basic Authentication

**Status:** 🟡 Legacy

The oldest HTTP-native authentication scheme (RFC 7617): the server challenges with
`401 Unauthorized` + `WWW-Authenticate: Basic realm="..."`, and the client replies with
`Authorization: Basic base64(username:password)` — **on every subsequent request**.
There is no session and no token; the credential itself is replayed each time.
HTTP **Digest** authentication (RFC 7616) is covered as an alternate: a
challenge-response variant that avoids sending the raw password but is largely
obsolete in practice.

## When it's used

Rarely for interactive browser login today, but still very common for:

- **Service-to-service** calls where the "password" is an API key or client secret.
- **git over HTTPS** (username + personal access token via Basic).
- **API gateways / reverse proxies** protecting internal tools or metrics endpoints
  (Prometheus, admin consoles) with minimal setup.
- OAuth2 itself: `client_secret_basic` client authentication at the token endpoint is
  HTTP Basic (see [oidc/client-credentials](../../oidc/client-credentials/README.md)).

## Actors

| Actor | Role |
|---|---|
| User | Human (or the operator who configured a service credential) |
| Browser | User agent (or CLI/service client) caching and replaying credentials |
| Server | Resource server issuing the 401 challenge and validating credentials |
| Directory | Credential store (htpasswd file, DB, LDAP) |

## Alternate scenarios covered

- **Invalid credentials** — server re-challenges with 401; browsers re-prompt.
- **Digest authentication** — nonce-based challenge-response instead of raw credentials.
- **Plain-HTTP rejection** — why Basic must be TLS-only.

## Security notes

- **TLS is mandatory.** Base64 is encoding, not encryption — over plain HTTP the
  password crosses the wire in the clear on *every request*, multiplying exposure
  compared to a one-time login. Servers should redirect or refuse Basic over HTTP
  and set HSTS.
- Credentials are cached by the user agent for the realm and replayed automatically;
  there is **no logout mechanism** short of closing the browser or clearing state.
- No CSRF protection is inherent: the browser attaches `Authorization` automatically
  just like a cookie, so state-changing endpoints still need CSRF defenses.
- Rate-limit and lock out brute-force attempts; Basic makes password guessing trivially
  scriptable.
- Digest avoids sending the raw password but forces the server to store passwords in a
  reversible/HA1 form, lacks modern hashing, and is effectively deprecated — prefer
  Basic-over-TLS or move to token-based schemes.

## Diagrams

- [sequence.md](sequence.md) — challenge, credential replay, and alt paths (invalid creds, Digest, no TLS).
- [swimlane.md](swimlane.md) — lanes for User, Browser, Server, Directory.
- [flowchart.md](flowchart.md) — decision logic: TLS check, header parsing, validation, lockout.

## Related diagrams

- [session-cookie](../session-cookie/README.md) — replaces per-request credentials with a server-side session.
- [mutual-tls](../mutual-tls/README.md) — stronger service-to-service alternative bound to the transport.
- [header-based-sso](../header-based-sso/README.md) — gateways often terminate Basic and forward identity headers.
- [OIDC client credentials](../../oidc/client-credentials/README.md) — token-based successor for service-to-service auth.
