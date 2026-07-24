# Okta Identity Engine Sign-In — Decision Flowchart

Two-layer policy evaluation: **Global Session Policy** gates the org session,
then the app **Authentication Policy** gates release of the specific app. The
`/idx` remediation loop sequences and enrolls factors dynamically.

```mermaid
flowchart TD
    Start(["GET /authorize<br/>(app requests sign-in)"]) --> Zone{"Network zone rule:<br/>location allowed?"}
    Zone -->|"deny zone"| EZone(["Blocked: access denied<br/>from this location"])
    Zone -->|allowed| GSess{"Valid org session<br/>within idle/lifetime?"}

    GSess -->|yes| AuthPol
    GSess -->|no| Ident["Remediation: identify<br/>(collect username)"]
    Ident --> Resolve["Resolve user +<br/>enrolled authenticators"]
    Resolve --> GFactor{"Global Session Policy:<br/>factors satisfied?"}
    GFactor -->|"no, prompt more"| Seq["Sequence next factor<br/>from policy"]
    Seq --> Enrolled{"Factor enrolled?"}
    Enrolled -->|no| Enroll["Remediation:<br/>enroll-authenticator"]
    Enroll --> Challenge
    Enrolled -->|yes| Challenge["Challenge factor"]
    Challenge --> Verify{"Factor verified?"}
    Verify -->|no| ERetry(["Retry or choose<br/>another authenticator"])
    Verify -->|yes| GFactor
    GFactor -->|yes| MkSess["Create org<br/>session cookie"]
    MkSess --> AuthPol{"App Authentication Policy:<br/>assurance met for this app?"}

    AuthPol -->|"device assurance fails"| EDev(["Deny: device not<br/>managed / registered"])
    AuthPol -->|"step-up required"| StepUp["Challenge additional<br/>factor for this app"]
    StepUp --> StepOk{"Verified?"}
    StepOk -->|no| ERetry
    StepOk -->|yes| AuthPol
    AuthPol -->|satisfied| Code(["Mint authorization code -<br/>hand off to OIDC token exchange"])
```
