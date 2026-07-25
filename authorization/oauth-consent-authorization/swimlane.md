---
title: "OAuth Consent — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth Consent — Swimlane Diagram

One lane per actor. The IdP renders consent and records the grant; the consent store decides whether
a screen is needed; the admin lane handles tenant-wide consent.

```mermaid
flowchart TD
    subgraph User
        U1["Start action needing scopes"]
        U2{"Approve or deny?"}
        U3(["App connected or denied"])
    end

    subgraph Admin
        AD1["Grant tenant-wide consent<br/>for admin-only scopes"]
    end

    subgraph Client
        C1["Send authorize request<br/>(scopes, redirect_uri, PKCE)"]
        C2["Exchange code for token"]
        C3["Call API with scoped token"]
    end

    subgraph IdP["IdP (AuthZ Server)"]
        I1["Authenticate user"]
        I2{"Prior grant covers<br/>requested scopes?"}
        I3{"Any scope<br/>admin-only?"}
        I4["Show consent screen<br/>(scopes or delta)"]
        I5["Issue authorization code"]
        I6["Return access token<br/>(scope = granted)"]
        I7["Return consent_required (admin)"]
        I8["Return access_denied"]
    end

    subgraph Store["Consent / Grant Store"]
        S1["Look up client x user grant"]
        S2["Save / merge grant"]
        S3["Delete grant on revoke"]
    end

    subgraph API["Resource"]
        R1["Accept token bounded<br/>by granted scopes"]
    end

    U1 --> C1 --> I1 --> I2
    I2 --> S1 --> I2
    I2 -->|Yes| I5
    I2 -->|No| I3
    I3 -->|Yes, no admin grant| I7 --> AD1 --> S2
    I3 -->|No| I4 --> U2
    U2 -->|Deny| I8 --> U3
    U2 -->|Approve| S2 --> I5
    I5 --> C2 --> I6 --> C3 --> R1 --> U3
    S3 -.->|forces re-prompt| I2
```

Notes

- The `I2` gate (**prior grant?**) is what makes consent a one-time experience per scope set: the
  store (`S1`) decides whether the screen (`I4`) is shown at all.
- **Admin consent** short-circuits per-user prompts: once `AD1` saves a tenant grant (`S2`), later
  users hit `I2 → Yes` and never see the screen for that client.
- **Incremental consent** reuses this same path with only the scope **delta** shown in `I4` and merged
  by `S2`.
- **Revocation** (`S3`, dashed) deletes the grant so the next authorization falls back through `I2`
  to a fresh prompt.
