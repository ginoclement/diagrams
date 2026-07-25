---
title: "AiTM MFA Phishing — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AiTM MFA Phishing — Swimlane Diagram

Lanes for Attacker, Victim, IdP, and Defender controls. Solid arrows are the relay/replay path;
dashed arrows into the Defender lane are risk signals and eviction.

```mermaid
flowchart TD
    subgraph Attacker["Attacker (reverse proxy)"]
        A1["Host look-alike site,<br/>relay to real IdP"]
        A2["Capture post-MFA<br/>session cookie"]
        A3["Replay cookie<br/>from attacker host"]
        A4(["Authenticated as victim"])
    end

    subgraph Victim
        V1["Click look-alike link"]
        V2{"Primary factor type?"}
        V3["Enter password<br/>+ complete MFA"]
        V4["Passkey assertion<br/>signed over origin"]
    end

    subgraph IdP["IdP / real login"]
        I1{"Passkey origin ==<br/>expected IdP origin?"}
        I2["Issue session<br/>cookie / token"]
        I3["Revoke session,<br/>require reauth"]
    end

    subgraph Defender["Defender controls"]
        D1(["DENY: origin mismatch,<br/>relay broken - no session"])
        D2{"Token bound to<br/>client key?"}
        D3(["DENY: replay from<br/>other host rejected"])
        D4{"CAE / risk: new ASN,<br/>impossible travel?"}
        D5(["DETECT: revoke session,<br/>notify, reset factors"])
    end

    V1 --> A1 --> V2
    V2 -->|"Passkey"| V4 --> I1
    I1 -->|No| D1
    I1 -->|Yes| I2
    V2 -->|"Password + OTP / push"| V3 --> I2 --> A2 --> A3 --> D2
    D2 -->|Yes| D3
    D2 -->|No| A4
    A4 -.->|session telemetry| D4
    D4 -->|Yes| D5 --> I3 -.->|revoked| A4
    D4 -->|No| A4
```

Notes

- The victim's MFA is genuine and relayed, so the fork that matters is `V2`: an **origin-bound
  passkey** (`I1`) prevents the login from completing at all.
- If a bearer cookie is issued, **token binding** (`D2`) blocks replay from the attacker's host;
  otherwise **CAE/risk** (`D4`) evicts the replayed session.
- Containment is **session revocation** (`I3`), because the stolen artifact is a live session, not
  a password.
