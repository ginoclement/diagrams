# OpenID Connect Session Management 1.0

**Status:** 🟡 Legacy

## What it is

OIDC Session Management defines how a relying party (RP) detects that the end user's
login session **at the OpenID Provider (OP) has changed** — typically that the user
logged out or switched accounts at the OP — without polling a network endpoint. It
works entirely through hidden browser iframes and `postMessage`:

- At authentication the OP returns a `session_state` value alongside the response.
  `session_state` is a hash computed over the `client_id`, the request origin, the
  OP's browser-state (an opaque per-user-agent session identifier, usually a cookie),
  and a `salt`, formatted as `hash.salt`.
- The OP publishes a `check_session_iframe` URL in its discovery metadata. The RP
  embeds this OP iframe, plus its own RP iframe, hidden in the page.
- The **RP iframe** periodically `postMessage`s `"<client_id> <session_state>"` to the
  **OP iframe**. The OP iframe recomputes the session hash from the current OP
  browser-state cookie and replies `"changed"`, `"unchanged"`, or `"error"`.
- On `"changed"`, the RP re-authenticates silently with `prompt=none` against
  `/authorize`. If the user is still logged in at the OP, it gets a fresh session
  quietly; if not, it gets `error=login_required` and the RP treats the local session
  as ended and logs the user out.

This is polling-in-the-browser logout detection, distinct from the modern
server-driven mechanisms.

## When it is used

- Legacy single-sign-on portals that need an RP to notice OP-side logout so all apps
  drop their sessions together, implemented before front-/back-channel logout existed.
- Still present in many OP/RP libraries for backward compatibility.

Modern deployments should prefer the event-driven logout specs instead:

- [Front-Channel Logout](../front-channel-logout/README.md) — OP renders RP logout URIs in hidden iframes at logout time.
- [Back-Channel Logout](../back-channel-logout/README.md) — OP POSTs a signed `logout_token` directly to each RP, server-to-server.
- [RP-Initiated Logout](../rp-initiated-logout/README.md) — the RP starts logout at the OP `end_session_endpoint`.

Session Management is increasingly impaired by browsers blocking third-party cookies
and cross-site iframe access, which is the main reason it is now Legacy.

## Actors

| Actor | Role |
|---|---|
| User | Human whose OP login session may change or end |
| Browser | Hosts the RP page, the hidden RP iframe, and the OP `check_session_iframe`; relays `postMessage` |
| Client | The RP application; owns the RP iframe polling logic and the `prompt=none` re-auth |
| IdP | The OP: sets the browser-state cookie, serves `check_session_iframe`, answers `/authorize?prompt=none` |

## Alternate scenarios covered

- Happy path: RP iframe polls OP iframe, gets `"unchanged"`, session continues.
- OP session changed: OP iframe returns `"changed"` → RP silently re-auths with `prompt=none`.
- Silent re-auth succeeds (user still logged in) → new `session_state`, polling resumes.
- Silent re-auth fails (`error=login_required`) → RP ends local session, logs user out.
- Third-party cookies blocked → OP iframe cannot read browser-state → `"error"` → fall back to logout specs.

## Security notes

- `session_state` must not leak the OP session cookie: it is a salted hash, and the
  salt changes per computation so values are not linkable across RPs.
- The OP iframe MUST verify the `postMessage` origin against the requesting
  `client_id`'s registered origin before answering, to avoid cross-origin probing.
- Silent `prompt=none` re-auth still requires full ID-token validation (`iss`, `aud`,
  `nonce`, signature) — a `"changed"` signal is only a trigger, not a trust anchor.
- Relying on third-party cookies/iframes is fragile: browser privacy changes
  (blocked 3P cookies, storage partitioning) can silently break detection, so treat a
  persistent `"error"` as "session state unknown" and prefer server-driven logout.

## Related diagrams

- [Front-Channel Logout](../front-channel-logout/README.md) — modern iframe-based logout propagation.
- [Back-Channel Logout](../back-channel-logout/README.md) — modern server-to-server logout via signed `logout_token`.
- [RP-Initiated Logout](../rp-initiated-logout/README.md) — RP-triggered logout at the `end_session_endpoint`.
- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the flow whose `prompt=none` re-auth this reuses.

## Files

- [sequence.md](sequence.md) — happy poll plus changed/silent-reauth-success, silent-reauth-failure, and cookies-blocked alternates.
- [swimlane.md](swimlane.md) — lanes for User, Browser, Client, IdP.
- [flowchart.md](flowchart.md) — poll-result and silent-reauth decision logic with error terminals.
