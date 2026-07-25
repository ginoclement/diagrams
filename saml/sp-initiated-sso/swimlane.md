---
title: "SP-Initiated SSO — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SP-Initiated SSO — Swimlane Diagram

One lane per actor. Arrows crossing lanes are front-channel handoffs through the browser.

```mermaid
flowchart TD
    subgraph User
        U1["Request protected page"]
        U2["Enter credentials + MFA<br/>(only if login needed)"]
        U3(["See signed-in app"])
    end

    subgraph Browser
        B1["GET protected resource"]
        B2["Follow 302 to IdP SSO endpoint<br/>with SAMLRequest + RelayState"]
        B3["Auto-submit POST form<br/>SAMLResponse + RelayState to ACS URL"]
        B4["Follow redirect to original URL"]
    end

    subgraph SP
        S1["No session: build AuthnRequest,<br/>store request ID + RelayState"]
        S2["302 Redirect (HTTP-Redirect binding)"]
        S3["ACS endpoint: decode SAMLResponse"]
        S4["Validate: signature, Issuer, Destination,<br/>Audience, Conditions, InResponseTo, replay"]
        S5["Create SP session,<br/>redirect to RelayState target"]
        S6["Serve protected resource"]
    end

    subgraph IdP
        I1["Validate AuthnRequest<br/>(Issuer, ACS URL vs metadata)"]
        I2{"Existing IdP session<br/>and no ForceAuthn?"}
        I3["Authenticate user,<br/>set IdP session cookie"]
        I4["Issue Response with signed Assertion<br/>(InResponseTo, Audience, Conditions)"]
        I5["Return auto-POST form<br/>(HTTP-POST binding)"]
    end

    U1 --> B1 --> S1 --> S2 --> B2 --> I1 --> I2
    I2 -->|"No - login required"| U2 --> I3 --> I4
    I2 -->|"Yes - seamless SSO"| I4
    I4 --> I5 --> B3 --> S3 --> S4 --> S5 --> B4 --> S6 --> U3
```

Notes

- Seamless SSO is the `I2 --> I4` shortcut: the IdP session cookie satisfies the
  request without user interaction.
- `ForceAuthn="true"` disables that shortcut, always routing through `U2`/`I3`.
- Validation failures branch out of `S4`; see [flowchart.md](flowchart.md) for the
  full decision tree and error terminals.
