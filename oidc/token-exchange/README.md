# OAuth 2.0 Token Exchange (RFC 8693)

**Status:** 🔵 Emerging

## What it is

Token exchange is a `/token` grant (`grant_type=urn:ietf:params:oauth:grant-type:token-exchange`)
that lets a client trade one security token for another. The request carries a
`subject_token` (+ `subject_token_type`) representing the party on whose behalf the
new token is requested, and optionally an `actor_token` (+ `actor_token_type`)
representing the party doing the acting. `requested_token_type`, `resource`,
`audience`, and `scope` shape the token that comes back. The response returns
`issued_token_type` and `access_token`.

Two patterns:

- **Delegation** — the issued token records the acting party in an `act` (actor)
  claim, so downstream services see "A acting for B". `may_act` in the subject
  token pre-authorizes who is allowed to act.
- **Impersonation** — the issued token looks as if it belongs to the subject with
  no `act` claim; the acting party disappears. More powerful, less auditable.

## When it is used

- A microservice receives a user's token and needs a **downstream-scoped** token to
  call another service (audience/scope narrowing across a call chain).
- API gateways swapping an external token for an internal one.
- Trusted subsystems acting on behalf of users in a service mesh.
- Crossing trust or protocol boundaries (e.g. SAML assertion → OAuth access token).

## Actors

| Actor | Role |
|---|---|
| User | The subject the exchanged token ultimately represents |
| Client | The service performing the exchange (often the acting party) |
| IdP | Authorization server / security token service exposing `/token` exchange |
| API | Downstream resource server the new token targets |

## Alternate scenarios covered

- Delegation with `act` / `may_act` — issued token records the actor chain.
- Impersonation — issued token with no `act` claim.
- Audience / scope narrowing for the downstream call.
- Cross-protocol exchange (SAML assertion in, OAuth access token out).
- Policy denial — subject's `may_act` does not permit this actor → `invalid_request`.

## Security notes

- Prefer **delegation** (`act` chain) over impersonation so the actor stays auditable;
  reserve impersonation for narrow, tightly controlled cases.
- Enforce `may_act`: only actors the subject token authorizes may act for the subject.
- Always **narrow** audience and scope for the downstream token — never mint a broader
  token than the subject token grants.
- The exchanging client must authenticate; treat the STS as a high-value target.
- Chained exchanges accumulate `act` claims — cap chain depth and log every hop.

## Related diagrams

- [Client Credentials](../client-credentials/README.md) — the simpler M2M grant when no user subject is involved.
- [Refresh Token](../refresh-token/README.md) — the other way to obtain a fresh, possibly narrowed token.
- Rich Authorization Requests *(planned)* — fine-grained authorization_details the exchanged token can carry.
- [Token Introspection](../token-introspection/README.md) — how a downstream API validates the exchanged token.
- [Workload Identity](../../workload-identity/README.md) — service-to-service identity where token exchange is common.
- Policy Decision / Enforcement *(planned)* — enforcing the narrowed grant downstream.

## Files

- [sequence.md](sequence.md) — delegation happy path, then impersonation, cross-protocol, and denial alternates.
- [swimlane.md](swimlane.md) — lanes for User, Client, IdP, API.
- [flowchart.md](flowchart.md) — delegation-vs-impersonation and may_act decisions with error terminals.
