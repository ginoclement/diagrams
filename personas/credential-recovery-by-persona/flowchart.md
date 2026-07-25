---
title: "Credential Recovery by Persona — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Credential Recovery by Persona — Decision Flowchart

Branch on principal type first, then on the persona-specific decisions each recovery path must
make. Terminal states are restored access or a denial.

```mermaid
flowchart TD
    Start(["Credential recovery request"]) --> Kind{"Principal type?"}

    Kind -->|consumer| CFactor{"Recovery factor<br/>proven?"}
    CFactor -->|No| DenyC(["Deny: cannot verify identity"])
    CFactor -->|Yes| CoOk(["Set new password - restored"])

    Kind -->|workforce| WFactor{"Enough MFA factors<br/>to self-serve?"}
    WFactor -->|Yes| WfOk(["SSPR - restored"])
    WFactor -->|No| Proof{"Helpdesk proofing<br/>passes?"}
    Proof -->|No| DenyW(["Deny: proofing failed"])
    Proof -->|Yes| WhOk(["One-time code + forced change"])

    Kind -->|privileged| Self{"Holder trying to<br/>self-reset?"}
    Self -->|Yes| Block(["Blocked: no self-reset<br/>route to vault"])
    Self -->|No, via vault| Appr{"Vault approval /<br/>SoD passes?"}
    Appr -->|No| DenyP(["Deny: checkout refused"])
    Appr -->|Yes| PvOk(["Rotate + time-boxed checkout<br/>(recorded)"])

    Kind -->|workload| Comp{"Compromise or<br/>expiry detected?"}
    Comp -->|No| NoOp(["No action needed"])
    Comp -->|Yes| Rotate["Revoke old, re-attest,<br/>issue new key/cert"]
    Rotate --> WkOk(["Workload re-credentialed"])
```

Notes

- The consumer leaf has no human fallback by design; the workforce leaf adds the proofed
  helpdesk path precisely because workforce lockouts are common and higher-value.
- The privileged `Self` diamond is a hard block: a self-reset attempt is refused and redirected
  to the vault, so approval and recording can never be bypassed.
- The workload path is the only one with no identity-proofing step — trust comes from
  re-attestation, not from a human vouching for the principal.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
