---
title: "FIDO2 / Passkey Registration — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# FIDO2 / Passkey Registration — Swimlane

Lanes for User, Browser, Authenticator, and RP Server. The key pair is generated inside
the authenticator; only the public key and credential ID cross to the server.

```mermaid
flowchart TD
    subgraph User
        U1["Click 'Add a passkey'"]
        U2["Biometric / PIN gesture"]
    end

    subgraph Browser
        B1["Request creation options"]
        B2["navigator.credentials.create()"]
        B3["Forward attestation to RP"]
    end

    subgraph Auth["Authenticator"]
        A1{"Already enrolled?<br/>(excludeCredentials)"}
        A2["Generate key pair<br/>scoped to rpId"]
        A3["Build attestation object<br/>(none or direct)"]
        A4["Return InvalidStateError"]
    end

    subgraph RP["RP Server"]
        S1["Generate challenge,<br/>build creation options"]
        S2{"type, challenge, origin,<br/>rpIdHash, flags, attestation<br/>all valid?"}
        S3{"credentialId new?"}
        S4["Store public key,<br/>credentialId, signCount"]
        S5["Reject registration"]
    end

    U1 --> B1 --> S1
    S1 -->|"options + challenge"| B2 --> A1
    A1 -->|no| A2
    U2 --> A2 --> A3 -->|attestation| B3
    A1 -->|yes| A4 --> B2
    B3 --> S2
    S2 -->|no| S5
    S2 -->|yes| S3
    S3 -->|no| S5
    S3 -->|yes| S4
```
