# Kerberos AS Exchange (AS-REQ / AS-REP)

## Purpose

The Authentication Service (AS) exchange is the initial authentication step in
Kerberos. The client proves knowledge of the user's long-term key (derived from
the password, or a certificate with [PKINIT](../pkinit/README.md)) and receives:

- a **Ticket-Granting Ticket (TGT)** encrypted with the **krbtgt account key**
  (opaque to the client), and
- a **TGT session key** encrypted with the **user's long-term key**.

The TGT is then used in the [TGS Exchange](../tgs-exchange/README.md) to obtain
service tickets without re-entering the password.

## When it is used

- Interactive logon (Windows domain logon, `kinit` on Linux/macOS).
- Whenever no valid TGT exists in the credential cache (first logon, expired
  TGT, purged cache).
- Renewal past the renewable lifetime, or after a password change.

## Actors

| Actor | Role |
|---|---|
| `User` | Human entering credentials |
| `Client` | Kerberos client / OS logon process (LSASS, `kinit`) |
| `AS` | Authentication Service lane of the KDC |
| `Directory` | Account database consulted by the KDC (e.g. Active Directory) |

## Key message contents

- **AS-REQ**: `cname` (user principal), `realm`, `sname=krbtgt/REALM`,
  `nonce`, requested `etypes`, `PA-ENC-TIMESTAMP` pre-auth data (current time
  encrypted with the user's long-term key).
- **AS-REP**: TGT = `{ cname, session key SK-TGT, flags, auth time, endtime, PAC }`
  encrypted with krbtgt key; `enc-part` = `{ SK-TGT, nonce, times }` encrypted
  with the user's key.

## Alternate / error scenarios

- **Pre-auth required** — first AS-REQ without pre-auth data is rejected with
  `KRB5KDC_ERR_PREAUTH_REQUIRED` plus supported etypes and salt; the client
  retries with `PA-ENC-TIMESTAMP`.
- **Wrong password** — timestamp fails to decrypt: `KRB5KDC_ERR_PREAUTH_FAILED`
  (feeds account lockout counters).
- **Clock skew** — timestamp outside the allowed window (default 5 minutes):
  `KRB_AP_ERR_SKEW`.
- **Pre-auth disabled** — the KDC returns an AS-REP without proof of the
  password, enabling **AS-REP roasting** (see below).

## Security notes

- **AS-REP roasting**: if `DONT_REQ_PREAUTH` is set on an account, anyone can
  request an AS-REP for it and crack the user-key-encrypted portion offline.
  Audit for accounts with pre-auth disabled.
- **Etype downgrade**: reject RC4/DES; enforce AES128/AES256. Weak etypes make
  both AS-REP roasting and [Kerberoasting](../tgs-exchange/README.md) cheaper.
- **Password-spray visibility**: `PREAUTH_FAILED` events (Windows event 4771)
  are the primary detection signal for guessing attacks.
- The TGT embeds the **PAC** (group membership); a compromised krbtgt key
  enables golden-ticket forgery — plan periodic krbtgt key rotation.
- Delegation abuse builds on TGTs obtained here — see
  [Unconstrained Delegation](../unconstrained-delegation/README.md) and
  [Constrained Delegation](../constrained-delegation/README.md).

## Diagrams

- [Sequence diagram](sequence.md)
- [Swimlane diagram](swimlane.md)
- [Flowchart (decision logic)](flowchart.md)

## Related diagrams

- [TGS Exchange](../tgs-exchange/README.md) — next step: exchanging the TGT for a service ticket.
- [AP Exchange](../ap-exchange/README.md) — final step: presenting the service ticket to the service.
- [PKINIT](../pkinit/README.md) — certificate/smart-card variant of this exchange.
- [Cross-Realm](../cross-realm/README.md) — when the target service lives in another realm.
