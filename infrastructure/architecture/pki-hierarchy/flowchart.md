---
title: "PKI Hierarchy — Certificate Path Validation Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# PKI Hierarchy — Certificate Path Validation Flowchart

The relying party's decision path when validating a presented certificate: chain
building, per-certificate checks, trust-anchor confirmation, and revocation. Every failure
terminates in an explicit reject and validation fails closed.

```mermaid
flowchart TD
    Start(["Certificate presented to relying party"]) --> Build{"Chain builds to a<br/>candidate root?"}
    Build -->|No| RejectChain(["Reject: incomplete chain"])
    Build -->|Yes| Sig{"Every signature in the<br/>chain verifies?"}

    Sig -->|No| RejectSig(["Reject: bad signature in chain"])
    Sig -->|Yes| Dates{"All certs within<br/>validity window?"}

    Dates -->|No| RejectDates(["Reject: expired or not-yet-valid"])
    Dates -->|Yes| Constraints{"Basic + name + key-usage<br/>constraints satisfied?<br/>(CA:TRUE, path len, EKU)"}

    Constraints -->|No| RejectConstraints(["Reject: constraint violation"])
    Constraints -->|Yes| Anchor{"Root is in the<br/>trust store?"}

    Anchor -->|No| RejectAnchor(["Reject: untrusted anchor"])
    Anchor -->|Yes| Revoke{"Revocation status?<br/>(OCSP, then CRL)"}

    Revoke -->|"Revoked"| RejectRevoked(["Reject: certificate revoked"])
    Revoke -->|"Unknown / unreachable"| Policy{"Hard-fail policy?"}
    Policy -->|"Yes (fail closed)"| RejectUnknown(["Reject: cannot confirm status"])
    Policy -->|"No (soft-fail)"| Accept
    Revoke -->|"Good"| Accept(["Accept: certificate valid"])
```

Notes

- **Chain building and signature verification come first** — nothing downstream matters if
  the leaf does not cryptographically chain to a root.
- The **constraints** gate is where mis-issuance is caught: an end-entity cert must not
  assert `CA:TRUE`, and EKU/name constraints bound what each cert may be used for.
- **Trust-anchor confirmation is independent of chain math**: a technically valid chain to
  a root the RP does not trust is still rejected.
- The **revocation** gate distinguishes *revoked* from *status unknown*. Security-sensitive
  systems adopt **hard-fail** (reject when status cannot be confirmed); the soft-fail branch
  is shown for completeness but weakens the guarantee.
