---
title: "Email / Phone Verification — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Email / Phone Verification — Swimlane

Lanes for User, Browser, IdP Server, and Verification Service. The IdP owns the token
lifecycle; the Verification Service only delivers the proof out of band.

```mermaid
flowchart TD
    subgraph User
        U1["Enter email / phone"]
        U2["Receive code / link"]
        U3["Confirm (type code<br/>or click link)"]
    end

    subgraph Browser
        B1["Start verification"]
        B2["Submit code / follow link"]
        B3["Resend request"]
    end

    subgraph IdP["IdP Server"]
        S1["Generate token, store hash,<br/>set expiry"]
        S2{"Token valid,<br/>unexpired, unused?"}
        S3["Mark channel VERIFIED,<br/>consume token"]
        S4["Reject: invalid / expired"]
        S5{"Resend within<br/>rate limit?"}
        S6["Issue fresh token"]
        S7["429 throttled"]
    end

    subgraph VS["Verification Service"]
        V1["Deliver OTP / link<br/>(email / SMS / voice)"]
    end

    U1 --> B1 --> S1 --> V1 --> U2 --> B2
    B2 --> S2
    S2 -->|yes| S3
    S2 -->|no| S4
    U3 --> B2
    B3 --> S5
    S5 -->|yes| S6 --> V1
    S5 -->|no| S7
```
