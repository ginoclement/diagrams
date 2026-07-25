# Token Theft & Replay — Decision Flowchart

Where each control forces a **deny** (prevention) or **detect** terminal. A valid signature alone
never stops replay of a bearer token — so defense depends on token binding and reuse detection.

```mermaid
flowchart TD
    Start(["Attacker holds stolen<br/>access + refresh tokens"]) --> BindQ{"Access token<br/>sender-constrained?<br/>DPoP / mTLS"}
    BindQ -->|Yes| PopQ{"Proof-of-possession<br/>key present and matching?"}
    PopQ -->|"No - replayed from other host"| Deny1(["DENY: PoP mismatch,<br/>replay rejected"])
    PopQ -->|Yes| Legit(["Legitimate holder<br/>on bound host"])

    BindQ -->|"No - bearer"| Use["API accepts token,<br/>returns data"]
    Use --> CaeQ{"CAE / risk: new ASN,<br/>impossible travel?"}
    CaeQ -->|Yes| Detect1(["DETECT: revoke session,<br/>invalidate access token"])
    CaeQ -->|No| Expire["Access token expires"]

    Expire --> RefreshQ{"Refresh token rotated<br/>with reuse detection?"}
    RefreshQ -->|Yes| ReuseQ{"Presented token<br/>already used?"}
    ReuseQ -->|Yes| Detect2(["DETECT: reuse = theft,<br/>revoke token family, notify"])
    ReuseQ -->|No| Legit
    RefreshQ -->|"No - long-lived refresh"| Gap(["Residual risk: attacker mints<br/>fresh tokens undetected<br/>- add rotation + reuse detection,<br/>DPoP/mTLS, short lifetimes, CAE"])
```

Notes

- The **binding gate** (`BindQ` / `PopQ`) is the strongest prevention: a sender-constrained token
  is worthless off the victim's host regardless of a valid signature.
- **Rotation + reuse detection** (`RefreshQ` / `ReuseQ`) turns the stolen refresh token into its
  own tripwire — the first replay trips family revocation.
- The `Gap` terminal is honest about residual risk: an unbound bearer token with a long-lived,
  non-rotating refresh token can be replayed quietly, which is why DPoP/mTLS, rotation, and CAE
  together are the durable defense.
