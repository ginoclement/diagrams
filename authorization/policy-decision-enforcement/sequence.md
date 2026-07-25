# Policy Decision and Enforcement — Sequence Diagram

Happy path first: the PEP builds a decision request, the PDP fetches a missing attribute from a PIP,
returns Permit, and the PEP enforces it. Alternates: Deny, Permit-with-obligations, PIP unavailable
(Indeterminate → fail closed), and PDP unreachable. Policy arrives from the PAP out of band.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant PEP as PEP (Gateway / Sidecar)
    participant PDP as PDP (Policy Engine)
    participant PIP as PIP (Attributes)
    participant PAP as PAP (Control Plane)
    participant API as Resource

    Note over PAP,PDP: Out of band - PAP distributes signed policy to PDP
    PAP-->>PDP: Publish policy version N (verified)

    Client->>PEP: Request action write on resource doc-42
    PEP->>PEP: Build decision request:<br/>subject, action=write, resource=doc-42, context
    PEP->>PDP: Evaluate (decision request)
    PDP->>PIP: Fetch missing attribute: resource owner + subject dept
    PIP-->>PDP: owner=alice, dept=finance
    PDP->>PDP: Evaluate policy N against request + attributes
    PDP-->>PEP: Permit
    PEP->>API: Forward write doc-42
    API-->>PEP: 200 Done
    PEP-->>Client: 200 OK

    alt Deny decision
        PEP->>PDP: Evaluate (delete on doc-42)
        PDP-->>PEP: Deny
        PEP-->>Client: 403 Forbidden
    else Permit with obligations
        PEP->>PDP: Evaluate (read on doc-42)
        PDP-->>PEP: Permit + obligation: redact SSN, audit-log
        PEP->>API: Forward read
        API-->>PEP: 200 record
        PEP->>PEP: Apply obligation (redact field, emit audit event)
        PEP-->>Client: 200 redacted record
    else Required attribute unavailable
        PEP->>PDP: Evaluate (policy needs risk score)
        PDP->>PIP: Fetch risk score
        PIP-->>PDP: timeout / unavailable
        PDP-->>PEP: Indeterminate
        PEP-->>Client: 403 Forbidden (fail closed)
    else PDP unreachable
        PEP->>PDP: Evaluate (...)
        PDP--xPEP: no response
        PEP-->>Client: 403 Forbidden (fail closed)
    end

    note over PEP,PDP: Decision + obligations enforced by the PEP.<br/>Every outcome (permit and deny) is written to the decision log.
```

Notes

- **Decision vs enforcement split**: the PDP only returns a verdict (+ obligations); the PEP is the
  only component that touches the request/response and actually blocks, forwards, or transforms.
- **Obligations are mandatory**: on Permit-with-obligation the PEP must complete the obligation
  (redact, log, set header) before releasing the response; if it cannot, the effective result is deny.
- **Fail-closed defaults**: `Indeterminate` (unresolvable attribute) and an unreachable PDP both
  become a deny at the PEP — the request is never allowed on a gap.
- **PAP is off the request path**: policy is distributed to the PDP asynchronously, so policy changes
  do not require redeploying the PEP or services.
