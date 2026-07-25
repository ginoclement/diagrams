# Golden & Silver Ticket — Decision Flowchart

Where krbtgt rotation, PAC validation, and log correlation force **deny** or **detect**
terminals. A forged, correctly-encrypted ticket passes decryption — so defense is rotation,
PAC checks, and the KDC-vs-host log mismatch.

```mermaid
flowchart TD
    Start(["Attacker holds a stolen<br/>krbtgt or service key"]) --> TypeQ{"Which forgery?"}

    TypeQ -->|"Golden (krbtgt)"| G1["Forge TGT with elevated PAC"]
    TypeQ -->|"Silver (service key)"| S1["Forge service ticket with elevated PAC"]

    G1 --> RotQ{"krbtgt rotated twice<br/>since key theft?"}
    RotQ -->|Yes| Deny1(["DENY: old krbtgt retired,<br/>golden ticket invalid"])
    RotQ -->|No| PacQg{"KDC PAC validation<br/>rejects tampered PAC?"}
    PacQg -->|Yes| Deny2(["DENY: forged PAC rejected"])
    PacQg -->|No| GIssue["TGS accepts TGT,<br/>issues service tickets"]
    GIssue --> GmonQ{"SIEM: TGS activity with<br/>no AS-REP, odd lifetime, RC4?"}
    GmonQ -->|Yes| Detect1(["DETECT: golden ticket<br/>rotate krbtgt twice"])
    GmonQ -->|No| Gap1(["Residual risk: valid-looking TGT<br/>- shorten lifetimes, protect Tier-0"])

    S1 --> PacQs{"Service enforces PAC<br/>validation with KDC?"}
    PacQs -->|Yes| Deny3(["DENY: forged service<br/>ticket rejected"])
    PacQs -->|No| SAccess["Service grants access<br/>(KDC never contacted)"]
    SAccess --> SmonQ{"SIEM: host logon (4624) with<br/>no matching KDC 4769?"}
    SmonQ -->|Yes| Detect2(["DETECT: silver ticket<br/>rotate service key, enable PAC validation"])
    SmonQ -->|No| Gap2(["Residual risk: stealthy single-service<br/>access - enable PAC validation everywhere"])
```

Notes

- **Golden** has a decisive prevention: `RotQ` — rotating krbtgt twice retires the key the
  forgery depends on. Absent that, PAC validation and TGS/AS-REP correlation are the fallback.
- **Silver's** signature detection is `SmonQ`: a host logon with no corresponding KDC ticket
  request, because the KDC was bypassed by design.
- The `Gap` terminals name the residual risk honestly and point to the durable fixes:
  Tier-0 key protection and universal PAC validation.
