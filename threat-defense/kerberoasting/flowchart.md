# Kerberoasting — Decision Flowchart

Where password strength, encryption type, and monitoring force a **detect** or **deny**
terminal. The ticket is always issued — defense lives after issuance.

```mermaid
flowchart TD
    Start(["Attacker holds a valid TGT"]) --> Enum["Enumerate SPN accounts"]
    Enum --> Req["TGS-REQ for target SPN"]
    Req --> MonQ{"SIEM: 4769 anomaly?<br/>many SPNs / RC4 / honeypot SPN"}
    MonQ -->|Yes| Detect(["DETECT: alert, disable account,<br/>rotate, strip privileges"])
    MonQ -->|No| Issue["KDC issues TGS-REP<br/>(normal behavior)"]

    Issue --> EtypeQ{"Ticket encryption type?"}
    EtypeQ -->|"RC4 (weak)"| PwQ1{"Password strong<br/>and random?"}
    EtypeQ -->|"AES (enforced)"| PwQ2{"Password strong<br/>and random?"}

    PwQ2 -->|"Yes / gMSA"| Deny1(["DENY: AES + strong secret,<br/>cracking infeasible"])
    PwQ2 -->|No| Slow["Crack possible but slow"] --> Weak

    PwQ1 -->|"Yes / gMSA"| Deny2(["DENY: strong/random secret,<br/>crack infeasible even on RC4"])
    PwQ1 -->|No| Weak(["COMPROMISE risk: password cracked<br/>- limited if account least-privileged"])

    Deny1 --> Note1
    Deny2 --> Note1
    Weak --> PrivQ{"Account over-privileged?<br/>(Tier-0 / admin groups)"}
    PrivQ -->|Yes| Esc(["ESCALATION: high-impact takeover"])
    PrivQ -->|No| Contained(["Contained: low-value account,<br/>limited blast radius"])
    Note1["Migrate remaining accounts to gMSA,<br/>remove RC4, keep 4769 monitoring on"]
```

Notes

- **`MonQ` first:** detection at request time (event 4769, honeypot SPN) can catch the roast
  before any crack completes, regardless of password strength.
- The two `Deny` terminals show the neutralizing controls: a gMSA or long random secret makes
  the offline crack infeasible; **AES-only** removes the cheap-RC4 shortcut.
- The `PrivQ` branch is why **least privilege** matters even when a weak account is cracked —
  it bounds the blast radius.
