---
title: "Password Hash Sync — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Password Hash Sync — Decision Flowchart

Two decision domains: the sync pipeline that populates the cloud verifier, and the cloud-only
sign-in that consumes it. Error terminals are explicit.

```mermaid
flowchart TD
    START(["Password set or changed on-prem"]) --> SCOPE{"Account in<br/>sync scope?"}
    SCOPE -->|"no"| SKIP(["Not synced: no cloud sign-in for this user"])
    SCOPE -->|"yes"| READ["Agent reads new NT hash"]
    READ --> DERIVE["Derive PBKDF2(HMAC-SHA256,<br/>NThash, per-user salt, 1000)"]
    DERIVE --> UP{"Upload to cloud<br/>succeeds?"}
    UP -->|"no"| LAG(["Sync lag / retry:<br/>cloud keeps old verifier until success"])
    LAG --> READ
    UP -->|"yes"| STORE["Cloud stores derived hash"]

    STORE --> SIGNIN(["Later: user signs in to cloud"])
    SIGNIN --> ENABLED{"Cloud account<br/>enabled?"}
    ENABLED -->|"no"| ERDisabled(["Deny: account disabled / blocked"])
    ENABLED -->|"yes"| MATCH{"PBKDF2 of presented<br/>password matches stored hash?"}
    MATCH -->|"no"| ERPwd(["Deny: wrong password<br/>(no on-prem call made)"])
    MATCH -->|"yes"| RISK{"Conditional Access:<br/>risk / device / location ok?"}
    RISK -->|"block"| ERCA(["Deny: blocked by policy"])
    RISK -->|"challenge"| MFA{"MFA satisfied?"}
    MFA -->|"no"| ERMfa(["Deny: MFA failed"])
    MFA -->|"yes"| OK
    RISK -->|"allow"| OK(["Issue tokens: signed in"])
```

Notes

- The sign-in branch never depends on the Directory being reachable — the match is against the
  stored cloud verifier, giving PHS its outage resilience.
- A disabled or out-of-scope on-prem account should sync as blocked / not-synced so cloud
  sign-in is denied; verify scoping so a leaver is actually stopped.
- Conditional Access and MFA gates run **after** a successful password match, so PHS composes
  with risk-based policy rather than replacing it.
