---
title: "Front-Channel Logout — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Front-Channel Logout — Swimlane Diagram

One lane per actor. Both RP lanes receive iframe loads from the browser; the
failure exits show how each lane can silently produce a partial logout.

```mermaid
flowchart TD
    subgraph User
        U1["Trigger logout (e.g. at an RP)"]
        U2["See logged-out page<br/>(best-effort assurance)"]
    end

    subgraph Browser
        B1["Load IdP logout page"]
        B2["Render hidden iframe per RP<br/>frontchannel_logout_uri?iss&sid"]
        B3{"Frame loads and cookies<br/>usable cross-site?"}
    end

    subgraph IdP["IdP (OpenID Provider)"]
        I1["Terminate SSO session"]
        I2["Enumerate RPs in session,<br/>emit logout page with iframes"]
        I3["Wait fixed timeout,<br/>then continue redirect<br/>(no per-RP status)"]
    end

    subgraph RP1["RP1"]
        R1["Validate iss + sid<br/>against known session"]
        R2["Clear local session cookie/state"]
        R3([RP1 logged out])
        R1x["Request arrives without<br/>session cookie - nothing cleared"]
        S2x(["PARTIAL LOGOUT -<br/>RP1 session survives"])
    end

    subgraph RP2["RP2"]
        S1["Never receives request<br/>(unreachable / frame blocked)"]
        S2(["PARTIAL LOGOUT -<br/>RP2 session survives"])
    end

    U1 --> B1 --> I1 --> I2 --> B2 --> B3
    B3 -->|"frame OK, cookie sent"| R1 --> R2 --> R3
    B3 -->|"third-party cookies blocked"| R1x
    R1x --> S2x
    B3 -->|"timeout / DNS / CSP blocks frame"| S1 --> S2
    I2 --> I3 --> U2
```

The IdP lane never learns which RP lanes actually cleared their sessions —
that asymmetry is the core reliability caveat of front-channel logout.

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
