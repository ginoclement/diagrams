---
title: "Workload Identity Federation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Workload Identity Federation — Swimlane Diagram

One lane per actor. The exchange handoff (Workload to Target STS) is where the platform
token becomes target credentials.

```mermaid
flowchart TD
    subgraph Workload
        W1["Request OIDC token<br/>(aud = target)"]
        W2["Present token to STS"]
        W3["Receive short-lived credentials"]
        W4(["Call target API"])
    end

    subgraph IdP["Platform IdP"]
        I1["Sign JWT: iss, sub, aud, exp,<br/>platform claims"]
        I2["Publish JWKS at discovery"]
    end

    subgraph STS["Target STS"]
        S1["Fetch JWKS, verify signature"]
        S2{"iss, aud, exp valid?"}
        S3{"sub / claim conditions met?"}
        S4["Mint short-lived credentials<br/>scoped to role / SA"]
        S5["Deny exchange"]
    end

    subgraph API["Target API"]
        P1["Authorize credentials, return data"]
    end

    W1 --> I1 --> I2
    I1 --> W2 --> S1 --> S2
    S2 -->|No| S5
    S2 -->|Yes| S3
    S3 -->|No| S5
    S3 -->|Yes| S4 --> W3 --> W4 --> P1
```

Notes

- The `S3` condition gate — subject/claim matching — is the confused-deputy defense: right issuer is never enough on its own.
- JWKS publication (`I2`) is a standing capability of the platform IdP, consumed by the STS at `S1`, not a per-request handoff.
- See [flowchart.md](./flowchart.md) for the ordered validation gates and every deny terminal.
</content>
