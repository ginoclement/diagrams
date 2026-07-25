---
title: "Token Theft & Replay"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Token Theft & Replay

**Status:** ✅ Current (active threat; defenses current)

## What it is

**Token theft & replay** is the abuse of stolen **bearer** OAuth/OIDC tokens — access tokens
and refresh tokens — from a host other than the one they were issued to. Because a bearer token
grants access to *whoever presents it*, an attacker who lifts a token (from browser storage,
logs, a memory dump, an infostealer, or a compromised proxy) can **replay it against the API** or
**redeem a stolen refresh token** for fresh access tokens, impersonating the victim without any
password or MFA prompt.

It abuses the normal token model behind flows like the
[Refresh Token](../../authentication/oidc/refresh-token/README.md) grant: the API trusts a valid signature and
the refresh endpoint mints new access tokens on demand. The durable defenses **sender-constrain**
the token so it is useless off the victim's host — see [DPoP](../../authentication/oidc/dpop/README.md) and
[Mutual TLS](../../authentication/tokenless/mutual-tls/README.md) — plus **refresh-token rotation with reuse
detection** to catch a replayed refresh token.

## When it is used

- **Post-compromise account takeover / session hijacking** where MFA and passwords are irrelevant
  because a valid token already exists.
- To gain **persistence**: a stolen long-lived refresh token can be redeemed repeatedly, often
  outliving a password reset unless the token family is revoked.
- Frequently the **payoff stage** of [AiTM MFA phishing](../aitm-mfa-phishing/README.md) or
  [OAuth consent phishing](../oauth-consent-phishing/README.md), which produce the tokens replayed here.

## Actors

| Actor | Role |
|---|---|
| Attacker | Steals an access/refresh token and replays it from a different host to impersonate the victim |
| Victim | The legitimate token holder whose session is hijacked; often takes no action during the replay |
| IdP | Authorization server: issues tokens, rotates refresh tokens, runs reuse detection, revokes token families |
| API | Resource server validating the access token and (with DPoP/mTLS) the proof-of-possession |
| Defender controls | Sender-constrained tokens (DPoP / mTLS), refresh-token rotation + reuse detection, continuous access evaluation |

## Alternate scenarios covered

- **Sender-constrained token — DPoP or mTLS (replay prevented):** the token is bound to a client
  key/certificate; the API demands proof-of-possession, and a token replayed from the attacker's
  host lacks the matching key, so the call is rejected.
- **Refresh-token rotation + reuse detection (theft contained):** each refresh returns a new token
  and invalidates the old one; when the attacker (or the victim) presents an already-used refresh
  token, the IdP detects the reuse and **revokes the entire token family**.
- **Continuous access evaluation (fast eviction):** network change, revocation, or risk events
  are pushed to the API in near-real-time so a stolen access token is invalidated mid-lifetime,
  not only at expiry.

## Security notes

Replay is possible because a **bearer** token is portable. The strategy is to make tokens
**non-bearer** (bind them to a key/channel), to make refresh tokens **single-use and
self-tripwiring** (rotation + reuse detection), and to **shorten the window** with CAE and short
lifetimes.

### Detection

- **Refresh-token reuse:** a previously-rotated refresh token presented again is a high-fidelity
  signal that either the attacker or the victim is replaying a stolen copy — revoke the family.
- **Token used from a new host/ASN/impossible-travel** relative to issuance; access-token calls
  from an IP that never held the session.
- **DPoP/mTLS proof failures:** repeated proof-of-possession mismatches indicate a bearer copy
  being replayed against a sender-constrained endpoint.
- **Anomalous API usage** (volume, endpoints, geography) inconsistent with the victim's baseline.

### Mitigation

- **Sender-constrain tokens** with [DPoP](../../authentication/oidc/dpop/README.md) (proof-of-possession JWT) or
  [mutual TLS](../../authentication/tokenless/mutual-tls/README.md) certificate-bound tokens, so a stolen token
  cannot be used without the client's private key.
- **Rotate refresh tokens on every use with reuse detection**, revoking the whole family on a
  replay — the key control for public clients (see [Refresh Token](../../authentication/oidc/refresh-token/README.md)).
- **Continuous access evaluation** and **short access-token lifetimes** to shrink the replay
  window and evict compromised sessions quickly.
- **Bind sessions to device/network posture** via conditional access; restrict high-value scopes
  to compliant devices.
- **Protect tokens at rest**: avoid storing tokens in localStorage/logs; use secure, http-only,
  same-site cookies or platform secure storage.

## Related diagrams

- [Refresh Token](../../authentication/oidc/refresh-token/README.md) — the grant whose rotation + reuse detection contains a stolen refresh token.
- [DPoP](../../authentication/oidc/dpop/README.md) — proof-of-possession that sender-constrains access tokens against replay.
- [Mutual TLS](../../authentication/tokenless/mutual-tls/README.md) — certificate-bound tokens that similarly defeat replay from another host.
- [AiTM MFA Phishing](../aitm-mfa-phishing/README.md) — a common upstream source of the stolen session tokens.
- [OAuth Consent Phishing](../oauth-consent-phishing/README.md) — another source of durable tokens an attacker replays.

## Files

- [sequence.md](./sequence.md) — the replay path, then DPoP/mTLS binding, rotation + reuse detection, and CAE defenses in `alt`/`opt` blocks.
- [swimlane.md](./swimlane.md) — Attacker / Victim / IdP / Defender-controls lanes.
- [flowchart.md](./flowchart.md) — where token binding and reuse detection force a deny/detect terminal.
