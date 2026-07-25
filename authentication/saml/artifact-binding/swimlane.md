---
title: "HTTP-Artifact Binding — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# HTTP-Artifact Binding — Swimlane Diagram

Lanes for User, Browser, SP, IdP. The IdP lane contains both the SSO endpoint and the
Artifact Resolution Service; the SP-to-ARS arrows are the back channel, bypassing the
Browser lane entirely.

```mermaid
flowchart TD
    subgraph User
        U1["Request protected page"]
        U2["Authenticate at IdP<br/>(if no session)"]
        U3(["See signed-in app"])
    end

    subgraph Browser
        B1["GET protected resource"]
        B2["Follow redirect to IdP<br/>with SAMLRequest"]
        B3["Follow redirect to SP ACS URL<br/>carrying SAMLart + RelayState only"]
    end

    subgraph SP
        S1["Build AuthnRequest,<br/>redirect to IdP (HTTP-Redirect)"]
        S2["ACS: extract SAMLart parameter"]
        S3["Back channel: signed SOAP ArtifactResolve<br/>to ARS over mutual TLS"]
        S4{"ArtifactResponse<br/>contains the Response?"}
        S5["Validate Response + Assertion<br/>(signature, Audience, Conditions,<br/>InResponseTo)"]
        S6["Create SP session,<br/>redirect to RelayState target"]
        S7(["Error: artifact expired or replayed -<br/>restart SSO"])
    end

    subgraph IdP
        I1["Authenticate user or reuse session"]
        I2["Store Response, mint one-time artifact<br/>(SourceID + MessageHandle, short TTL)"]
        I3["Redirect Browser to ACS URL<br/>with SAMLart (HTTP-Artifact binding)"]
        I4["ARS: verify caller, look up artifact,<br/>delete on first resolution"]
        I5["Return ArtifactResponse<br/>(Response inside, or empty)"]
    end

    U1 --> B1 --> S1 --> B2 --> I1 --> I2 --> I3 --> B3 --> S2
    I1 -.->|"login needed"| U2 -.-> I1
    S2 --> S3 --> I4 --> I5 --> S4
    S4 -->|Yes| S5 --> S6 --> U3
    S4 -->|"No - empty"| S7
```

Notes

- Front channel: `S1 -> B2 -> I1` and `I3 -> B3 -> S2`. Back channel: `S3 -> I4 -> I5`.
  The assertion only ever exists on the back channel.
- `I4` enforces both one-time use (delete on resolve) and audience binding (artifact
  resolvable only by the SP it was issued for).
