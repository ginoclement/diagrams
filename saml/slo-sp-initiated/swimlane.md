---
title: "SP-Initiated Single Logout — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SP-Initiated Single Logout — Swimlane Diagram

Lanes for User, Browser, SP1 (initiator), IdP, SP2 (other participant). Shown with
front-channel propagation; the back-channel variant replaces the Browser hops to SP2
with a direct IdP-to-SP2 SOAP call.

```mermaid
flowchart TD
    subgraph User
        U1["Click Logout in SP1"]
        U2(["See logout confirmation<br/>(full or partial)"])
    end

    subgraph Browser
        B1["GET SP1 /logout"]
        B2["Carry LogoutRequest to IdP SLO endpoint"]
        B3["Carry LogoutRequest to SP2 SLO endpoint"]
        B4["Carry SP2 LogoutResponse back to IdP"]
        B5["Carry final LogoutResponse to SP1"]
    end

    subgraph SP1
        S1["Destroy SP1 session"]
        S2["Sign LogoutRequest<br/>(NameID + SessionIndex),<br/>redirect to IdP (HTTP-Redirect)"]
        S3["Verify LogoutResponse signature<br/>and InResponseTo"]
        S4["Render result: Success or<br/>PartialLogout warning"]
    end

    subgraph IdP
        I1["Verify signature, resolve session,<br/>list other participants"]
        I2["Terminate IdP session"]
        I3["Send signed LogoutRequest to SP2<br/>(front-channel via Browser,<br/>or back-channel SOAP)"]
        I4["Collect SP2 LogoutResponse,<br/>note any failures"]
        I5["Return LogoutResponse to SP1:<br/>Success or PartialLogout"]
    end

    subgraph SP2
        P1["Verify signature,<br/>destroy SP2 session + cookie"]
        P2["Return LogoutResponse (Success)"]
    end

    U1 --> B1 --> S1 --> S2 --> B2 --> I1 --> I2 --> I3
    I3 --> B3 --> P1 --> P2 --> B4 --> I4
    I3 -.->|"back-channel SOAP variant"| P1
    P2 -.->|"SOAP response direct to IdP"| I4
    I4 --> I5 --> B5 --> S3 --> S4 --> U2
```

Notes

- Solid arrows through the Browser lane are the front-channel chain; dotted arrows are
  the back-channel SOAP shortcut that bypasses the browser entirely.
- With more participants, the `I3 -> ... -> I4` segment repeats per SP.
- See [flowchart.md](flowchart.md) for how the IdP decides between Success and
  PartialLogout.
