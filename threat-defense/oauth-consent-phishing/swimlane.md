---
title: "OAuth Consent Phishing — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth Consent Phishing — Swimlane Diagram

Lanes for Attacker, Victim, IdP, and Defender controls. Solid arrows are the phishing/consent
path; dashed arrows into the Defender lane are governance signals and revocation.

```mermaid
flowchart TD
    subgraph Attacker
        A1["Register or impersonate<br/>OAuth app (excess scopes)"]
        A2["Send consent lure<br/>to real /authorize URL"]
        A3["Exchange code at /token"]
        A4["Read mail / files<br/>with granted tokens"]
        A5(["Persistent token access<br/>(survives password reset)"])
    end

    subgraph Victim
        V1["Open lure link"]
        V2["Authenticate + MFA<br/>at the real IdP"]
        V3["Click Accept on<br/>consent screen"]
    end

    subgraph IdP["IdP / authorization server"]
        I1{"Publisher verified<br/>and scopes within policy?"}
        I2["Route to admin-consent<br/>approval request"]
        I3["Issue code, then<br/>access + refresh tokens"]
        I4(["Consent blocked<br/>- no tokens issued"])
        I5["Revoke grant<br/>+ refresh tokens"]
    end

    subgraph Defender["Defender controls"]
        D1{"Admin reviewer<br/>approves app?"}
        D2(["DENY: unknown app<br/>request rejected"])
        D3["Ingest app telemetry<br/>(rare app, burst reads)"]
        D4{"Risky-app<br/>behavior?"}
        D5(["DETECT: revoke grant,<br/>notify, access review"])
    end

    A1 --> A2 --> V1 --> V2 --> I1
    I1 -->|"No - unverified"| I4
    I1 -->|"Needs admin consent"| I2 --> D1
    D1 -->|No| D2
    D1 -->|Yes| I3
    I1 -->|"User consent allowed"| V3 --> I3
    I3 --> A3 --> A4 --> A5
    A4 -.->|API telemetry| D3 --> D4
    D4 -->|Yes| D5 --> I5 -.->|tokens revoked| A5
    D4 -->|No| A5
```

Notes

- The Victim performs a real, MFA-backed login — so MFA is not the control that stops this;
  **consent policy** (`I1`) and **app governance** (`D4`) are.
- The only outright-prevention paths are `I1 --> unverified` and the admin reviewer denying
  at `D1`; everything past `I3` is detection and revocation of an already-granted app.
- `A5` is durable precisely because the tokens are legitimate; containment means **revoking the
  grant and refresh tokens**, not resetting the password.
