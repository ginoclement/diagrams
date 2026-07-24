# IdP-Initiated SSO — Decision Flowchart

SP-side acceptance policy and validation for an unsolicited `Response`. The
distinguishing gates are the unsolicited-policy check and the replay cache, which must
compensate for the missing `InResponseTo`.

```mermaid
flowchart TD
    Start(["POST arrives at ACS URL<br/>(SAMLResponse, RelayState)"]) --> Decode{"Parses as valid<br/>SAML Response?"}
    Decode -->|No| ErrParse(["Reject: malformed response"])
    Decode -->|Yes| HasIrt{"InResponseTo<br/>present?"}

    HasIrt -->|Yes| SpInit["Treat as SP-initiated response:<br/>correlate against pending request IDs"]
    SpInit --> SpFlow(["Continue per SP-initiated flowchart"])

    HasIrt -->|No| Policy{"SP policy allows<br/>unsolicited responses?"}
    Policy -->|No| Fallback["Discard response"] --> Reinit(["Redirect user into SP-initiated SSO"])
    Policy -->|Yes| Sig{"Signature valid against<br/>IdP metadata certificate?"}

    Sig -->|No| ErrSig(["Reject: bad signature"])
    Sig -->|Yes| Dest{"Destination = this ACS URL<br/>and Issuer is a known IdP?"}
    Dest -->|No| ErrDest(["Reject: wrong destination or issuer"])
    Dest -->|Yes| Cond{"Conditions valid?<br/>NotBefore / NotOnOrAfter, Audience"}
    Cond -->|No| ErrCond(["Reject: expired or wrong audience"])
    Cond -->|Yes| Replay{"Assertion ID already<br/>in replay cache?"}
    Replay -->|Yes| ErrReplay(["Reject: replayed assertion"])
    Replay -->|No| Cache["Mark assertion ID consumed<br/>until NotOnOrAfter"]

    Cache --> Map{"NameID maps to<br/>local account?"}
    Map -->|No| ErrMap(["Reject: unknown user"])
    Map -->|Yes| Sess["Create SP session"]
    Sess --> RS{"RelayState is an allow-listed<br/>relative SP URL?"}
    RS -->|No| Home(["Ignore RelayState,<br/>land on SP home page"])
    RS -->|Yes| Deep(["Redirect to deep-link target"])
```

Notes

- The `HasIrt` gate lets one ACS endpoint serve both flows safely: responses carrying
  `InResponseTo` are always correlated, never treated as unsolicited.
- The `RelayState` gate downgrades gracefully to the home page rather than failing the
  login — the session is already legitimate; only the redirect target is suspect.
- Because login-CSRF cannot be fully eliminated in this profile, security-sensitive SPs
  should choose the `Policy -> No` branch and support IdP tiles via SP-initiated deep links.
