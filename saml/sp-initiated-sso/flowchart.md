---
title: "SP-Initiated SSO — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SP-Initiated SSO — Decision Flowchart

SP-side logic with every validation gate the ACS endpoint must apply, plus the IdP-side
session decision. Error paths terminate explicitly.

```mermaid
flowchart TD
    Start(["User requests protected SP resource"]) --> HasSess{"Valid SP<br/>session?"}
    HasSess -->|Yes| Serve(["Serve resource"])
    HasSess -->|No| BuildReq["Build AuthnRequest, store request ID,<br/>set RelayState, redirect to IdP (HTTP-Redirect)"]

    BuildReq --> IdPVal{"IdP: AuthnRequest valid?<br/>(known Issuer, ACS URL in metadata,<br/>signature if required)"}
    IdPVal -->|No| ErrReq(["IdP error: invalid request"])
    IdPVal -->|Yes| Force{"ForceAuthn<br/>requested?"}

    Force -->|Yes| Login["Interactive login + MFA"]
    Force -->|No| IdPSess{"Live IdP<br/>session?"}
    IdPSess -->|Yes| Issue["Issue Response with signed Assertion<br/>(seamless SSO)"]
    IdPSess -->|No| Login

    Login --> AuthOK{"Credentials<br/>valid?"}
    AuthOK -->|No| FailResp["Response with Status AuthnFailed,<br/>no Assertion"] --> ErrAuth(["SP shows: authentication failed"])
    AuthOK -->|Yes| Issue

    Issue --> Post["HTTP-POST to ACS URL<br/>(SAMLResponse + RelayState)"]
    Post --> Sig{"Signature valid<br/>against IdP metadata cert?"}
    Sig -->|No| ErrSig(["Reject: bad signature"])
    Sig -->|Yes| Irt{"InResponseTo matches a<br/>pending, unconsumed request ID?"}
    Irt -->|No| ErrIrt(["Reject: unsolicited or replayed response"])
    Irt -->|Yes| Cond{"Conditions valid?<br/>NotBefore / NotOnOrAfter within skew,<br/>Audience = SP entityID"}
    Cond -->|No| ErrCond(["Reject: expired or wrong audience"])
    Cond -->|Yes| Replay{"Assertion ID<br/>seen before?"}
    Replay -->|Yes| ErrReplay(["Reject: assertion replay"])
    Replay -->|No| Map{"NameID maps to<br/>a local account?"}
    Map -->|No| ErrMap(["Reject: unknown user / provisioning error"])
    Map -->|Yes| Sess["Create SP session"] --> Redir["Redirect to validated RelayState target"] --> Serve
```

Notes

- The signature gate comes first: nothing after it can be trusted until the XML
  signature verifies against the certificate published in IdP metadata.
- `RelayState` is validated as an allow-listed relative URL before the final redirect
  to prevent open-redirect abuse.
- The replay gate requires a cache of consumed assertion IDs held at least until each
  assertion's `NotOnOrAfter`.
