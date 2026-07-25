# Kerberos AP Exchange (AP-REQ / AP-REP)

**Status:** ✅ Current

## Purpose

The Application (AP) exchange is where the client actually authenticates to a
**service** using the service ticket obtained in the
[TGS Exchange](../tgs-exchange/README.md). The client sends an **AP-REQ**
(service ticket + a fresh authenticator); the service decrypts the ticket with
its own key, validates the authenticator against its **replay cache**, and
optionally returns an **AP-REP** for **mutual authentication**.

After the exchange both sides share the service session key `SK-svc` and can
protect the application traffic.

## When it is used

- Every application-layer Kerberos authentication: CIFS/SMB, LDAP, HTTP via
  [SPNEGO](../spnego-http/README.md), MSSQL, etc.
- The service, not the KDC, is contacted here — the KDC is offline for this step
  unless PAC validation is performed.

## Actors

| Actor | Role |
|---|---|
| `Client` | Holds the service ticket + `SK-svc` |
| `Service` | Application server that owns the SPN and its key `K-svc` |
| `DC` | Domain controller / KDC, contacted only for optional PAC validation |

## Key message contents

- **AP-REQ**: `ap-options` (e.g. `MUTUAL-REQUIRED`), service ticket
  (encrypted with `K-svc`), authenticator `{ cname, timestamp, seq-number,
  optional subkey }` encrypted with `SK-svc`.
- **AP-REP** (only if mutual auth requested): `{ timestamp, seq-number,
  optional subkey }` encrypted with `SK-svc`, echoing the client timestamp to
  prove the service holds `K-svc`.

## Alternate / error scenarios

- **Replay detected** — authenticator `{ cname, timestamp }` already in the
  replay cache: `KRB_AP_ERR_REPEAT`.
- **Clock skew** — authenticator timestamp outside the window:
  `KRB_AP_ERR_SKEW`.
- **Wrong service / key mismatch** — ticket does not decrypt with `K-svc`:
  `KRB_AP_ERR_BADMATCH` / `KRB_AP_ERR_MODIFIED` (e.g. SPN bound to the wrong
  account).
- **PAC validation (optional)** — the service asks the DC to verify the PAC
  signature before trusting group membership.

## Security notes

- The **replay cache** is the core anti-replay control; a shared or reset cache
  (load-balanced identical SPNs, restarts) can weaken it.
- **Silver tickets**: an attacker with `K-svc` can forge a valid service ticket
  and authenticate here without ever contacting the KDC — PAC validation against
  the DC is the main defense (though the PAC signature is also made with keys the
  attacker may hold; enable PAC validation and monitor).
- Require `MUTUAL-REQUIRED` so the client verifies the service, preventing
  rogue-server attacks.
- Channel binding (e.g. to TLS) blocks relay of the AP-REQ to a different
  endpoint.

## Diagrams

- [Sequence diagram](sequence.md)
- [Swimlane diagram](swimlane.md)
- [Flowchart (decision logic)](flowchart.md)

## Related diagrams

- [TGS Exchange](../tgs-exchange/README.md) — previous step: obtaining the service ticket.
- [AS Exchange](../as-exchange/README.md) — start of the chain.
- [SPNEGO over HTTP](../spnego-http/README.md) — AP-REQ wrapped in a SPNEGO token for HTTP.
