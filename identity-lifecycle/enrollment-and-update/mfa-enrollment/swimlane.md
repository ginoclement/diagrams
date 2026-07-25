---
title: "MFA Enrollment — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 6238"
---

# MFA Enrollment — Swimlane

Lanes for each actor: the User drives the UI, the Browser renders the QR and posts the
proof, the Authenticator holds the secret, the IdP Server owns provisioning and
activation, and the OTP Delivery Service handles the SMS/voice alternate.

```mermaid
flowchart TD
    subgraph User
        U1["Choose 'Add authenticator'"]
        U2["Scan QR / type key"]
        U3["Enter first code"]
        U4["Save backup codes"]
    end

    subgraph Browser
        B1["Request new factor"]
        B2["Render QR + manual key"]
        B3["Post proof code"]
    end

    subgraph Auth["Authenticator App"]
        A1["Store secret"]
        A2["Derive current TOTP"]
    end

    subgraph IdP["IdP Server"]
        S0{"Step-up required?"}
        S1["Generate secret,<br/>store factor PENDING"]
        S2{"Proof code valid<br/>within time skew?"}
        S3["Activate factor,<br/>issue backup codes"]
        S4["Keep PENDING,<br/>throttle attempts"]
    end

    subgraph OTP["OTP Delivery Service"]
        O1["Send SMS / voice OTP"]
    end

    U1 --> B1 --> S0
    S0 -->|yes| U0["Re-authenticate"]
    U0 --> S1
    S0 -->|no| S1
    S1 -->|"otpauth URI + QR"| B2 --> U2 --> A1 --> A2
    A2 -->|"6-digit code"| U3 --> B3 --> S2
    S2 -->|yes| S3 -->|"backup codes"| U4
    S2 -->|no| S4 --> B2

    S1 -.->|"SMS factor"| O1
    O1 -.->|"code out of band"| U3
```
