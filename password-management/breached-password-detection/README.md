---
title: "Breached Password Detection"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Breached Password Detection

**Status:** ✅ Current

Checking a **candidate password** — at registration, change, or reset time — against a
corpus of **known-breached passwords**, so users cannot pick a credential that already
appears in public dumps. The canonical implementation is the **Have I Been Pwned (HIBP)
Pwned Passwords range API**, which uses **k-anonymity**: the client hashes the password
with SHA-1, sends only the **first 5 hex characters** of the hash, receives every breached
suffix sharing that prefix, and matches the remaining suffix **locally**. The full
password — and even its full hash — never leaves the auth server.

## When it's used

- Registration, [password change](../password-change-authenticated/README.md),
  [reset](../self-service-reset/README.md), and
  [expiry rotation](../password-expiry-rotation/README.md) — anywhere a new password is set.
- As the compromise signal that should drive rotation instead of blind calendar expiry
  (NIST SP 800-63B recommends screening new passwords against known-breached lists).

## Actors

| Actor | Role |
|---|---|
| User | Human choosing or changing a password |
| Browser | Submits the candidate password over TLS |
| IdP | Auth server: hashes the candidate, queries the breach API, decides |
| BreachAPI | Breach corpus range API (e.g. HIBP Pwned Passwords) |
| Directory | User store where the accepted password hash is persisted |

## How k-anonymity protects the candidate

1. IdP computes `SHA1(password)` = 40 hex chars, e.g. `21BD1...F2077`.
2. It sends **only the 5-char prefix** (`21BD1`) to the range API.
3. The API returns **all suffixes** (the remaining 35 chars) it holds for that prefix,
   each with a breach count — typically hundreds of rows.
4. The IdP scans the returned list **locally** for its own suffix. A match means the
   password is breached; no match means it is not — and the API learned only the prefix,
   which is shared by many thousands of distinct passwords.

## Alternate scenarios covered

- **Breached — reject** — a matched suffix means the password is known-compromised; the
  IdP refuses it and asks for a different one.
- **Count threshold** — instead of rejecting any appearance, reject only when the breach
  **count** exceeds a threshold (e.g. seen > 10 times), tolerating rare/near-unique hits.
- **Offline bloom-filter variant** — for air-gapped or high-volume deployments, ship a
  downloaded breach set as a local **bloom filter** and check with **no network call**,
  accepting a small false-positive rate.

## Security notes

- **Never send the full password or full hash.** The prefix (5 hex chars = 20 bits)
  buckets the hash into ~1M groups; the API cannot recover the password from a prefix.
- **Fail open or closed deliberately:** decide in advance whether a breach-API timeout
  blocks the password set (fail closed, more secure) or allows it with a warning (fail
  open, more available). Log the outcome either way.
- **Send `Add-Padding`** (HIBP feature) so responses are a uniform size and a network
  observer cannot infer the bucket size.
- SHA-1 is used here only as a **corpus index**, not to store passwords. Persist accepted
  passwords with a slow salted hash (bcrypt/scrypt/argon2) in the
  [Directory](../../architecture/identity-provider-reference-architecture/README.md).
- Screening detects *known* breaches only; combine with strong hashing, MFA, and rate
  limiting.

## Diagrams

- [sequence.md](sequence.md) — SHA-1, prefix query, local suffix match, accept/reject, plus alts.
- [swimlane.md](swimlane.md) — lanes for User, Browser, IdP, BreachAPI, Directory.
- [flowchart.md](flowchart.md) — decision logic: prefix query, suffix match, threshold, offline variant.

## Related diagrams

- [password-change-authenticated](../password-change-authenticated/README.md) — invokes this check on the new password.
- [self-service-reset](../self-service-reset/README.md) — invokes this check at reset time.
- [password-expiry-rotation](../password-expiry-rotation/README.md) — breach signal as the better trigger for rotation.
- [admin-initiated-reset](../admin-initiated-reset/README.md) — temp passwords should also be screened.
- [identity-provider-reference-architecture](../../architecture/identity-provider-reference-architecture/README.md) — where password hashing and screening sit.
