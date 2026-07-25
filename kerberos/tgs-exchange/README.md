# Kerberos TGS Exchange (TGS-REQ / TGS-REP)

**Status:** ✅ Current

## Purpose

The Ticket-Granting Service (TGS) exchange converts a TGT (obtained in the
[AS Exchange](../as-exchange/README.md)) into a **service ticket** for a
specific service, identified by its **Service Principal Name (SPN)**, e.g.
`HTTP/web01.example.com` or `cifs/fs01.example.com`.

The client proves possession of the TGT session key with an **authenticator**;
the KDC returns a service ticket encrypted with the **service account's
long-term key** plus a fresh service session key.

## When it is used

- Every time the client needs to reach a service it has no cached, unexpired
  service ticket for.
- Transparent to the user — no password entry; only the TGT and its session
  key are needed.

## Actors

| Actor | Role |
|---|---|
| `Client` | Kerberos client holding a cached TGT |
| `TGS` | Ticket-Granting Service lane of the KDC |
| `Directory` | Account database used for SPN resolution |

## Key message contents

- **TGS-REQ**: `sname` (target SPN), `realm`, `nonce`, `PA-TGS-REQ` containing
  the **AP-REQ**: TGT (encrypted with `K-krbtgt`) + authenticator
  `{ cname, timestamp }` encrypted with the TGT session key `SK-TGT`.
- **TGS-REP**: service ticket = `{ cname, SK-svc, flags, times, PAC }`
  encrypted with the **service account key** `K-svc`; `enc-part` =
  `{ SK-svc, nonce, times, sname }` encrypted with `SK-TGT`.

## Alternate / error scenarios

- **SPN not found** — no account holds the requested SPN:
  `KRB5KDC_ERR_S_PRINCIPAL_UNKNOWN` (common cause of NTLM fallback in
  [SPNEGO](../spnego-http/README.md)).
- **Expired TGT** — `KRB5KDC_ERR_TKT_EXPIRED`; client runs a new
  [AS Exchange](../as-exchange/README.md) and retries.
- **Kerberoasting** — any authenticated user can request a ticket for any SPN;
  tickets encrypted with RC4 (key = NT hash of the service account password)
  are crackable offline.

## Security notes

- **Kerberoasting**: service tickets are encrypted with the service account
  key, so a requested ticket is an offline-crackable sample. Mitigate with
  long random service passwords, gMSAs, AES-only etypes, and alerting on
  RC4 (`etype 0x17`) TGS requests (event 4769).
- The **PAC** is copied from the TGT into the service ticket — the TGS does
  not re-derive authorization data; a forged TGT (golden ticket) yields
  arbitrary service tickets. A forged service ticket made directly with a
  stolen `K-svc` is a **silver ticket** and never touches the KDC.
- Delegation flags (`forwardable`, S4U extensions) are evaluated here — see
  [Constrained Delegation](../constrained-delegation/README.md) and
  [RBCD](../resource-based-constrained-delegation/README.md).
- Cross-realm referrals are a TGS-exchange variant — see
  [Cross-Realm](../cross-realm/README.md).

## Diagrams

- [Sequence diagram](sequence.md)
- [Swimlane diagram](swimlane.md)
- [Flowchart (decision logic)](flowchart.md)

## Related diagrams

- [AS Exchange](../as-exchange/README.md) — previous step: obtaining the TGT.
- [AP Exchange](../ap-exchange/README.md) — next step: presenting the service ticket.
- [Cross-Realm](../cross-realm/README.md) — referral TGTs when the SPN is in another realm.
