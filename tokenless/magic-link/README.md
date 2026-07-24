# Magic Link (Passwordless Email Login)

Passwordless authentication via email: the user enters only an email address, the
server emails a **single-use, time-limited, signed link**, and clicking it proves
control of the mailbox and establishes a normal server-side session. The link carries
a high-entropy random token (or signed payload) that is looked up/verified and then
immediately invalidated — it functions as a one-time credential in transit, not a
bearer token the client retains, and the resulting authentication state is an
ordinary [session cookie](../session-cookie/README.md).

## When it's used

- Consumer apps optimizing sign-in friction (no password to remember or reset).
- Low-frequency portals (billing, ticketing, document signing) where users would
  forget a password anyway.
- As a fallback/recovery channel next to passwords or
  [passkeys](../webauthn-passkey-authentication/README.md).
- Effectively the same mechanic as
  [self-service password reset](../../password-management/self-service-reset/README.md) —
  a reset link *is* a magic link; both deserve the same protections.

## Actors

| Actor | Role |
|---|---|
| User | Person who controls the email mailbox |
| Browser | Where the flow starts (and where the link may or may not be opened) |
| Server | Issues, stores (hashed), verifies, and invalidates link tokens |
| Email | Mail provider delivering the link |
| Directory | User store keyed by email address |

## Alternate scenarios covered

- **Link expired** — TTL exceeded (typically 5–15 minutes); user must request a new one.
- **Link reused** — token already consumed; reject and alert, since a second use may
  mean interception.
- **Email enumeration protection** — identical "check your email" response whether or
  not the address has an account.
- **Opened on a different device/browser** — the session appears where the link was
  clicked, not where it was requested; options: accept, confirm with a code displayed
  in the original browser, or bind the token to the requesting browser.

## Security notes

- **Token quality**: >= 128 bits from a CSPRNG (or a signed, expiring payload). Store
  only a **hash** of the token server-side so a DB leak does not leak live links.
- **Single use + short TTL**: consume atomically on first click; reuse must fail and
  should trigger an alert. Beware mail scanners and link-preview bots that "click"
  links — require a confirmation interaction (button/POST) on the landing page so a
  GET alone does not consume the token.
- **Uniform responses and timing** on the request endpoint to prevent account
  enumeration; rate-limit per address and per source.
- The whole scheme is only as strong as the mailbox: an attacker with email access
  owns every magic-link account. Encourage upgrading to
  [passkeys](../webauthn-passkey-authentication/README.md) after first login.
- Magic links are **phishable** (a fake "we sent you a link" page can proxy the flow)
  — unlike WebAuthn, nothing binds the link to the legitimate origin except user
  attention.
- Rotate the session ID when the session is established, same as any login
  (see [session-cookie](../session-cookie/README.md)).

## Diagrams

- [sequence.md](sequence.md) — request, email, click, verify; expired/reused/enumeration/cross-device alts.
- [swimlane.md](swimlane.md) — lanes for User, Browser, Server, Email, Directory.
- [flowchart.md](flowchart.md) — token validation pipeline with explicit failure terminals.

## Related diagrams

- [session-cookie](../session-cookie/README.md) — what the magic link ultimately establishes.
- [webauthn-passkey-authentication](../webauthn-passkey-authentication/README.md) — the phishing-resistant upgrade path.
- [Self-service password reset](../../password-management/self-service-reset/README.md) — the same mechanism guarding password recovery.
- [Auth0 lazy migration](../../platform-specific/auth0-universal-login-actions/README.md) — passwordless options during migration.
