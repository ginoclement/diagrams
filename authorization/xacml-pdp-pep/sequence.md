---
title: "XACML — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# XACML — Sequence Diagram

Happy path first (Permit with a fulfilled obligation), then alternates: an attribute resolved via a
PIP, a Deny, NotApplicable, and Indeterminate. The Context Handler mediates between PEP and PDP.

```mermaid
sequenceDiagram
    autonumber
    actor Subject
    participant PEP as PEP
    participant CH as Context Handler
    participant PDP as PDP
    participant PIP as PIP

    Note over PDP: PAP has published policies to the PDP out of band

    Subject->>PEP: Access request (action on resource)
    PEP->>CH: Native request
    CH->>CH: Build canonical XACML request context<br/>(subject, resource, action, environment)
    CH->>PDP: XACML decision request
    PDP->>PDP: Find applicable policies (Target match)
    PDP->>PDP: Evaluate rules + conditions
    PDP-->>CH: Permit + Obligation "log access"
    CH-->>PEP: Decision Permit + obligations
    PEP->>PEP: Fulfill obligation (write audit log)
    PEP-->>Subject: 200 Access granted

    alt Attribute missing - resolved via PIP
        PDP->>CH: Need subject.clearance, resource.classification
        CH->>PIP: Query attributes
        PIP-->>CH: clearance=secret, classification=confidential
        CH-->>PDP: Attribute values
        PDP-->>CH: Permit (clearance >= classification)
    else Deny
        PDP->>PDP: Rule matches with Effect=Deny
        PDP-->>CH: Deny
        CH-->>PEP: Deny
        PEP-->>Subject: 403 Forbidden
    else NotApplicable - no policy targets request
        PDP-->>CH: NotApplicable
        CH-->>PEP: NotApplicable
        PEP->>PEP: Apply PEP default = deny
        PEP-->>Subject: 403 Forbidden (no applicable policy)
    else Indeterminate - evaluation error
        PDP->>PDP: Attribute unresolved / processing error
        PDP-->>CH: Indeterminate
        CH-->>PEP: Indeterminate
        PEP->>PEP: Fail closed = deny
        PEP-->>Subject: 403 Forbidden
    end

    note over PEP: Obligation MUST be fulfilled for a Permit to stand.<br/>Advice MAY be ignored. Cannot fulfill obligation -> deny.
```

Notes

- The **Context Handler** is the integration seam: it canonicalizes the request and drives PIP
  attribute retrieval so the PDP only sees a complete XACML request context.
- A Permit is **conditional on its obligations**: if the PEP cannot fulfill a returned obligation,
  it must not grant access.
- **NotApplicable** (no policy targets the request) and **Indeterminate** (evaluation error) are
  distinct from Deny; the PEP maps both to a fail-closed deny.
