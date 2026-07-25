# Active Directory Interactive Logon — Decision Flowchart

Logon-stack decision logic: choose Kerberos, fall back to NTLM (Legacy), or cached logon,
with explicit error terminals.

```mermaid
flowchart TD
    START(["User submits domain credentials"]) --> DC{"Domain controller<br/>reachable?"}
    DC -->|"no"| CACHE{"Cached credentials<br/>available?"}
    CACHE -->|"no"| ERNoDC(["Deny: no DC and no cached logon"])
    CACHE -->|"yes"| OFFLINE(["Offline logon via MSCACHE verifier"])

    DC -->|"yes"| KRB{"Kerberos possible?<br/>target has SPN, addressed by<br/>hostname, KDC reachable"}
    KRB -->|"no"| NTLM["NTLM fallback (Legacy, discouraged)"]
    KRB -->|"yes"| AS{"AS pre-auth valid?<br/>correct key + clock in skew"}

    AS -->|"bad password"| ERPwd(["KRB-ERROR PREAUTH_FAILED<br/>event 4771, lockout++"])
    AS -->|"clock skew"| SKEW{"Time sync fixes it?"}
    SKEW -->|"no"| ERSkew(["KRB_AP_ERR_SKEW - retry or NTLM"])
    SKEW -->|"yes"| AS
    AS -->|"ok"| TGT["Receive TGT, then TGS service ticket"]
    TGT --> TOKEN

    NTLM --> NRESP{"NTLM response verifies<br/>via Netlogon?"}
    NRESP -->|"no"| ERNtlm(["Deny: bad NTLM response"])
    NRESP -->|"yes"| ACCT

    AS -.->|"account state"| ACCT
    TGT --> ACCT{"Account enabled,<br/>not locked/expired,<br/>logon hours allow?"}
    ACCT -->|"no"| ERAcct(["Deny: disabled / locked /<br/>outside logon hours"])
    ACCT -->|"yes"| TOKEN["Build access token from PAC / group SIDs"]
    TOKEN --> DONE(["Interactive logon complete"])
```

Notes

- The first fork is availability: no DC forces the cached-logon path, which never contacts the
  directory and grants the last-known token if a verifier exists.
- The Kerberos-vs-NTLM fork turns on whether a ticket can be obtained (SPN present, hostname
  addressing, KDC reachable). NTLM is only the fallback and is marked Legacy/discouraged.
- Account-state checks (disabled, locked, logon hours) apply regardless of mechanism before the
  token is built.
