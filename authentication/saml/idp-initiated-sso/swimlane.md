---
title: "IdP-Initiated SSO — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IdP-Initiated SSO — Swimlane Diagram

Lanes for User, Browser, IdP, SP. The flow begins in the IdP lane (portal), the
reverse of SP-initiated SSO.

```mermaid
flowchart TD
    subgraph User
        U1["Sign in to IdP portal"]
        U2["Click SP app tile"]
        U3(["Land on SP deep-link page"])
    end

    subgraph Browser
        B1["GET IdP portal"]
        B2["Auto-submit POST form to SP ACS URL<br/>SAMLResponse + RelayState"]
        B3["Follow redirect to deep-link target"]
    end

    subgraph IdP
        I1["Authenticate user or<br/>reuse IdP session"]
        I2["Render portal with app tiles"]
        I3["Build unsolicited Response + signed Assertion<br/>(no InResponseTo)<br/>RelayState = deep-link for this tile"]
        I4["Return auto-POST form<br/>(HTTP-POST binding)"]
    end

    subgraph SP
        S1{"Unsolicited responses<br/>allowed by policy?"}
        S2["Validate signature, Issuer, Destination,<br/>Audience, Conditions, replay cache"]
        S3["Create SP session"]
        S4["Validate RelayState as local URL,<br/>redirect to it"]
        S5["Serve deep-link page"]
        S6["Fallback: start SP-initiated SSO<br/>(send AuthnRequest)"]
    end

    U1 --> B1 --> I1 --> I2 --> U2 --> I3 --> I4 --> B2 --> S1
    S1 -->|Yes| S2 --> S3 --> S4 --> B3 --> S5 --> U3
    S1 -->|"No - SP-initiated only"| S6
```

Notes

- `S6` hands off to the [SP-initiated SSO swimlane](../sp-initiated-sso/swimlane.md);
  the user still reaches the app, but with proper request correlation.
- Validation failures inside `S2` (bad signature, expired conditions, replayed
  assertion ID) terminate the flow — see [flowchart.md](./flowchart.md).
