---
title: "Application Default Credentials — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Application Default Credentials — Swimlane Diagram

One lane per credential source. The ADC lane walks the sources in fixed order.

```mermaid
flowchart TD
    subgraph App["App (client library)"]
        A1["Call getApplicationDefault()"]
        A2(["Receive credential or error"])
    end

    subgraph ADC["ADC resolver"]
        D1{"Env var set?"}
        D2{"gcloud ADC<br/>file present?"}
        D3{"Metadata server<br/>reachable?"}
        D4["Return credential"]
        D5["Raise DefaultCredentialsError"]
        D6["Raise error - do not fall through"]
    end

    subgraph EnvVar["GOOGLE_APPLICATION_CREDENTIALS"]
        E1{"File valid?<br/>(key / external_account /<br/>impersonated)"}
    end

    subgraph Gcloud["gcloud ADC file"]
        G1["User OAuth refresh token"]
    end

    subgraph Metadata["Metadata Server"]
        M1["Attached SA access token"]
    end

    A1 --> D1
    D1 -->|Yes| E1
    E1 -->|Valid| D4
    E1 -->|Invalid| D6
    D1 -->|No| D2
    D2 -->|Yes| G1 --> D4
    D2 -->|No| D3
    D3 -->|Yes| M1 --> D4
    D3 -->|No| D5
    D4 --> A2
    D5 --> A2
    D6 --> A2
```

Notes

- The env-var lane can itself hold a keyless config (`external_account` for WIF or
  `impersonated_service_account`), not only a raw key.
- The gcloud lane is a local-dev source (user credentials); the metadata lane is the
  production-on-GCP source.
- Only a set-but-invalid env var routes to `D6`; an unset env var simply advances to the next
  source.
