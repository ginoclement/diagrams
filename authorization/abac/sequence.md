# ABAC — Sequence Diagram

Happy path first (all attributes present, policy permits), then alternates: an attribute fetched
from a PIP, an environment condition failing, and an Indeterminate result when a PIP is unavailable.

```mermaid
sequenceDiagram
    autonumber
    actor Subject
    participant PEP as PEP
    participant PDP as PDP
    participant PIP as PIP
    participant API as Resource

    Subject->>PEP: Request read on resource 42
    PEP->>PEP: Gather known attributes<br/>(subject from token, action, resource id)
    PEP->>PDP: Decision request<br/>(subject, action=read, resource=42, env)
    PDP->>PDP: Select applicable policy<br/>compare subject.clearance vs resource.classification
    PDP-->>PEP: Permit
    PEP->>API: Forward read 42
    API-->>PEP: 200 data
    PEP-->>Subject: 200 data

    alt Missing attribute resolved via PIP
        PDP->>PIP: Fetch resource.region and subject.deviceManaged
        PIP-->>PDP: region=EU, deviceManaged=true
        PDP->>PDP: Re-evaluate with resolved attributes
        PDP-->>PEP: Permit
    else Environment condition fails
        PDP->>PDP: Policy requires env.time in business hours<br/>request is off-hours
        PDP-->>PEP: Deny
        PEP-->>Subject: 403 Forbidden (off-hours)
    else Attribute unavailable - Indeterminate
        PDP->>PIP: Fetch subject.clearance
        PIP-->>PDP: Error / timeout
        PDP->>PDP: Cannot evaluate condition<br/>combining algorithm: deny on Indeterminate
        PDP-->>PEP: Indeterminate -> treated as Deny
        PEP-->>Subject: 403 Forbidden (cannot verify clearance)
    end

    note over PDP: Combining algorithm resolves conflicts.<br/>deny-overrides: a single Deny beats any Permit.
```

Notes

- The PEP hands the PDP whatever attributes it already trusts (typically subject claims from a
  validated token); the PDP pulls the rest from PIPs.
- **Indeterminate** is a first-class outcome distinct from Deny: the policy could not be evaluated.
  For sensitive resources the combining algorithm maps it to Deny (fail-closed).
- Every decision should be logged with the attribute values and the rule id that matched — see the
  decision logs in [pbac-policy-engine](../pbac-policy-engine/README.md).
