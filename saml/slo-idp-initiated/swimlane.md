---
title: "IdP-Initiated Single Logout — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IdP-Initiated Single Logout — Swimlane Diagram

Lanes for User, Browser, IdP, SP1, SP2. Front-channel fan-out shown solid; the
back-channel SOAP variant is dotted (bypasses the Browser lane).

```mermaid
flowchart TD
    subgraph User
        U1["Click Sign out on IdP portal"]
        U2(["See result page:<br/>complete or partial logout"])
    end

    subgraph Browser
        B1["GET IdP /portal/logout"]
        B2["Load SP1 SLO endpoint<br/>(redirect or hidden iframe)"]
        B3["Load SP2 SLO endpoint<br/>(redirect or hidden iframe)"]
        B4["Return LogoutResponses to IdP"]
    end

    subgraph IdP
        I1["List session participants<br/>with NameID + SessionIndex"]
        I2["Terminate IdP session first"]
        I3["Fan out signed LogoutRequests<br/>front-channel or SOAP"]
        I4["Collect LogoutResponses,<br/>track missing / failed SPs"]
        I5["Render aggregate result<br/>(Success or PartialLogout)"]
    end

    subgraph SP1
        P1["Verify signature,<br/>destroy session + cookie"]
        P2["LogoutResponse (Success)"]
    end

    subgraph SP2
        Q1["Verify signature,<br/>destroy session + cookie"]
        Q2["LogoutResponse (Success)"]
    end

    U1 --> B1 --> I1 --> I2 --> I3
    I3 --> B2 --> P1 --> P2 --> B4
    I3 --> B3 --> Q1 --> Q2 --> B4
    B4 --> I4
    I3 -.->|"SOAP LogoutRequest"| P1
    I3 -.->|"SOAP LogoutRequest"| Q1
    P2 -.->|"SOAP response"| I4
    Q2 -.->|"SOAP response"| I4
    I4 --> I5 --> U2
```

Notes

- In the back-channel variant (dotted), SP cookies survive; SP1/SP2 must invalidate
  sessions server-side so the stale cookie is useless on the next request.
- If either `P2`/`Q2` never reaches `I4` (blocked iframe, timeout), the flow still
  completes but `I5` reports partial logout — see [flowchart.md](flowchart.md).
