---
title: "Adversary-in-the-Middle (AiTM) MFA Phishing"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Adversary-in-the-Middle (AiTM) MFA Phishing

**Status:** ✅ Current (active threat; defenses current)

## What it is

**Adversary-in-the-Middle (AiTM)** MFA phishing defeats most **multi-factor authentication** by
proxying the real login rather than harvesting a static password. The attacker stands up a
**reverse-proxy phishing site** that relays every request and response between the victim and the
legitimate IdP in real time. The victim sees the genuine login and MFA challenge (because it *is*
genuine, relayed through the proxy), completes MFA, and the IdP issues a **session cookie / token**.
Because that cookie flows back **through the proxy**, the attacker captures it and **replays the
authenticated session** — no password or second factor needed thereafter.

It abuses any password-plus-OTP/push login, and is best contrasted with
[WebAuthn / Passkey authentication](../../tokenless/webauthn-passkey-authentication/README.md),
whose **origin-bound** cryptographic assertion is the primary defense: a passkey signs the
*real* origin, so an assertion produced against the proxy's origin will not validate at the IdP.

## When it is used

- **Account takeover despite MFA** — the dominant modern phishing technique against OTP, push,
  and SMS second factors, which AiTM relays transparently.
- To steal a **live session cookie/token** for immediate replay, often followed by mailbox rules,
  consent grants, or lateral phishing from the compromised account.
- Delivered by email/chat links to a look-alike domain hosting the reverse proxy.

## Actors

| Actor | Role |
|---|---|
| Attacker | Operates the reverse-proxy phishing site; relays the login; captures and replays the session cookie/token |
| Victim | The user who enters credentials and completes MFA against the proxied (real, relayed) login |
| IdP | Legitimate authorization server performing authentication and MFA and issuing the session cookie/token |
| API | Resource server the replayed session accesses |
| Defender controls | Phishing-resistant FIDO2 / passkeys, token binding, continuous access evaluation, sign-in risk detection |

## Alternate scenarios covered

- **Phishing-resistant FIDO2 / passkey (attack prevented):** the authenticator signs over the
  **origin** (and the IdP checks it); the assertion is bound to the real site, so a challenge
  relayed via the proxy origin fails validation — AiTM cannot complete the login at all.
- **Token binding / sender-constrained session (replay defeated):** the issued token is bound to
  a client key (DPoP/mTLS-style); a cookie captured and replayed from the attacker's host lacks
  the proof-of-possession and is rejected.
- **Continuous access evaluation + risk signals (fast eviction):** anomalous IP/impossible travel
  on the replayed session triggers near-real-time re-evaluation and revocation.

## Security notes

AiTM works because a **bearer** session cookie/token is portable — whoever holds it is
authenticated. The two durable defenses either **stop the login from completing** (origin-bound
passkeys) or **make the stolen artifact non-replayable** (token binding), with CAE as fast
containment.

### Detection

- **Impossible travel / new-ASN session use:** the same session cookie appearing from the
  victim's location and, seconds later, the attacker's hosting provider.
- **Known AiTM infrastructure / reverse-proxy indicators:** newly registered look-alike domains,
  proxy-characteristic TLS and User-Agent patterns, high-reputation-mimicking phishing pages.
- **Post-compromise actions:** sudden inbox rules, new OAuth consent grants, or MFA-method
  registration right after a successful sign-in from an unusual client.
- **Sign-in risk scoring:** unfamiliar sign-in properties on a session that just passed MFA.

### Mitigation

- **Deploy phishing-resistant FIDO2 / passkeys** as the primary factor for privileged and,
  ideally, all users — origin binding is what actually breaks AiTM.
- **Sender-constrain sessions/tokens** (token binding, DPoP, mTLS) so a captured cookie cannot be
  replayed from another host.
- **Continuous access evaluation** and **short session lifetimes** to evict replayed sessions fast
  on risk signals or network change.
- **Conditional access** requiring compliant/managed devices, which the attacker's replay host is
  not.
- **User education and reporting** for look-alike-domain lures, plus rapid takedown.

## Related diagrams

- [WebAuthn / Passkey Authentication](../../tokenless/webauthn-passkey-authentication/README.md) — the origin-bound, phishing-resistant primary auth that prevents AiTM.
- [DPoP](../../oidc/dpop/README.md) — proof-of-possession that makes a stolen session token non-replayable.
- [Mutual TLS](../../tokenless/mutual-tls/README.md) — channel/token binding that similarly defeats replay from another host.
- [Token Theft & Replay](../token-theft-replay/README.md) — the general stolen-token replay problem AiTM feeds into.

## Files

- [sequence.md](sequence.md) — the AiTM relay/replay path, then FIDO2 / token-binding / CAE defenses in `alt`/`opt` blocks.
- [swimlane.md](swimlane.md) — Attacker / Victim / IdP / Defender-controls lanes.
- [flowchart.md](flowchart.md) — where origin binding and token binding force a deny/detect terminal.
