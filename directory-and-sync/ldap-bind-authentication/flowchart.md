---
title: "LDAP Bind Authentication — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# LDAP Bind Authentication — Decision Flowchart

Client and server decision logic for a bind, with the transport-security gate first and
explicit error terminals.

```mermaid
flowchart TD
    START(["User submits login + password"]) --> PW{"Password<br/>non-empty?"}
    PW -->|"no"| ERReject(["Reject: empty password<br/>(block unauthenticated bind)"])
    PW -->|"yes"| TLS{"Connection<br/>encrypted?<br/>(StartTLS or LDAPS)"}

    TLS -->|"no"| CONF{"Server allows simple bind<br/>without confidentiality?"}
    CONF -->|"no"| ERConf(["Reject: confidentialityRequired (13)"])
    CONF -->|"yes - misconfigured"| RISK(["RISK: cleartext password on wire -<br/>discouraged, enforce TLS"])
    RISK --> KNOWDN

    TLS -->|"yes"| MECH{"Bind<br/>mechanism?"}
    MECH -->|"SASL GSSAPI / EXTERNAL"| SASL["Prove identity via Kerberos ticket<br/>or client certificate, no password sent"]
    SASL --> SOK{"SASL exchange<br/>succeeds?"}
    SOK -->|"no"| ERSasl(["Reject: invalidCredentials (49)"])
    SOK -->|"yes"| OK(["Bind success (0):<br/>start authenticated session"])

    MECH -->|"Simple bind"| KNOWDN{"App already knows<br/>the user's DN?"}
    KNOWDN -->|"no"| SVC["Bind as service account, then<br/>search by login attribute for the DN"]
    SVC --> FOUND{"Exactly one<br/>entry found?"}
    FOUND -->|"no"| ERUser(["Reject: user not found<br/>or ambiguous"])
    FOUND -->|"yes"| USERBIND
    KNOWDN -->|"yes"| USERBIND["Re-bind as user DN + user password"]

    USERBIND --> VERIFY{"Password verifies?"}
    VERIFY -->|"no"| ERBad(["Reject: invalidCredentials (49)<br/>AD data 52e - feed lockout"])
    VERIFY -->|"yes"| USABLE{"Account enabled,<br/>not locked or expired?"}
    USABLE -->|"no"| ERLock(["Reject: (49) data 533 disabled /<br/>701 expired / 775 locked"])
    USABLE -->|"yes"| OK
```

Notes

- The confidentiality gate is first: a simple bind must not proceed in cleartext. A hardened
  server returns `confidentialityRequired (13)` instead of accepting the password.
- Search-then-bind adds the `SVC`/`SEARCH` detour only when the app does not already hold the
  user's DN; the credential is still only checked in the final `USERBIND`.
- SASL `EXTERNAL`/`GSSAPI` skip the password path entirely — identity comes from a certificate
  or a Kerberos ticket, so there is no `USERBIND` password to leak.
