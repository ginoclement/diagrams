---
title: "Authentication by Persona — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Authentication by Persona — Swimlane Diagram

A router lane resolves the persona; each persona then flows through its own path across the
shared IdP and target lanes.

```mermaid
flowchart TD
    subgraph Router["Persona resolution"]
        P0["Incoming auth request"]
        P1{"Principal type?"}
    end

    subgraph Human["Human sign-in"]
        W1["Workforce: corporate SSO<br/>plus MFA, risk step-up"]
        C1["Consumer: social or passwordless<br/>(passkey / magic-link)"]
        B1["Partner: home-realm discovery<br/>then federate to partner IdP"]
        V1["Privileged: base session<br/>plus phishing-resistant step-up"]
    end

    subgraph IdP["Local IdP / Auth server"]
        I1["Issue assertion / token<br/>(amr, authn-context)"]
        I2["Map partner identity<br/>to local external user"]
    end

    subgraph PIM["PIM / JIT"]
        M1["Grant time-boxed admin role<br/>(justification, expiry)"]
    end

    subgraph NonHuman["Machine auth"]
        K1["Workload: client-credentials<br/>or mTLS, no user"]
        K2["Validate client cert / secret,<br/>issue short-lived token"]
    end

    subgraph Target["Client / API"]
        T1(["Signed-in human session"])
        T2(["Elevated admin session (expiring)"])
        T3(["Workload token accepted"])
    end

    P0 --> P1
    P1 -->|workforce| W1 --> I1 --> T1
    P1 -->|consumer| C1 --> I1
    P1 -->|partner| B1 --> I2 --> I1
    P1 -->|privileged| V1 --> I1 --> M1 --> T2
    P1 -->|workload| K1 --> K2 --> T3
```

Notes

- The router is the fork point: everything downstream differs because the persona differs,
  not because the mechanism does.
- Privileged is the only human path that continues **past** the IdP into PIM before reaching
  a usable (elevated, expiring) session.
- The machine lane never touches the Human or PIM lanes — no interactive step exists for it.

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
