# Device Posture Conditional Access — Decision Flowchart

Identity plus device conditions mapped to grant / limited / block. The device gates sit
after identity but can override a valid user, and unevaluable posture fails closed.

```mermaid
flowchart TD
    S(["User requests access from a device"]) --> Id{"Identity valid?"}
    Id -->|No| DenyId(["Deny: authentication failed"])
    Id -->|Yes| Att{"Device identity attested?<br/>(cert / TPM / Secure Enclave)"}
    Att -->|No| DenyAtt(["Deny: device untrusted"])
    Att -->|Yes| Eval{"Posture evaluable?<br/>(compliance service reachable)"}
    Eval -->|"No"| Restricted

    Eval -->|Yes| Managed{"Device managed /<br/>enrolled?"}
    Managed -->|"No - unmanaged / BYOD"| Restricted(["Restricted: browser-only<br/>or deny, offer enrollment"])
    Managed -->|Yes| Comp{"Compliant?<br/>encryption, patch,<br/>EDR healthy, not jailbroken"}

    Comp -->|Yes| Grant(["Grant: full access"])
    Comp -->|"No"| Limited(["Limited session + remediation link"])

    Limited --> Remediate["User remediates<br/>(encrypt / patch / re-enroll)"]
    Remediate --> Comp
```

Notes

- The gates are ordered identity → device identity → posture, a valid user on an
  unattested or non-compliant device never reaches `Grant`, which is the Zero Trust point.
- `Eval -->|No| Restricted` is the fail-closed rule: if posture cannot be evaluated the
  request is restricted, never granted on assumption of health.
- `Limited --> Remediate --> Comp` is the loop back into the compliance check, so fixing the
  device is the intended route from a `Limited` outcome to a full `Grant`.
