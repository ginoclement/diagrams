# Pass-Through Authentication — Decision Flowchart

Validation logic from cloud sign-in through on-prem DC verdict, with explicit error
terminals for each failure the domain controller can report.

```mermaid
flowchart TD
    START(["User submits UPN + password to cloud"]) --> ENC["Cloud encrypts password<br/>with agent public key, queues it"]
    ENC --> AVAIL{"Any healthy agent<br/>picks up request?"}
    AVAIL -->|"no"| ERNoAgent(["Deny: no agent available,<br/>service unavailable"])
    AVAIL -->|"yes"| DEC["Agent decrypts with private key"]

    DEC --> DC{"DC reachable and<br/>LogonUser succeeds?"}
    DC -->|"no DC reachable"| ERDC(["Deny: cannot reach domain controller"])
    DC -->|"wrong password"| ERPwd(["Deny: invalid credentials,<br/>cloud smart-lockout++"])
    DC -->|"password expired / must change"| CHANGE(["Redirect to change-password flow"])
    DC -->|"locked / disabled / logon hours"| ERAcct(["Deny: account not permitted"])
    DC -->|"success"| RISK{"Conditional Access /<br/>risk allows sign-in?"}

    RISK -->|"blocked"| ERCA(["Deny: blocked by policy"])
    RISK -->|"MFA required"| MFA{"MFA satisfied?"}
    MFA -->|"no"| ERMfa(["Deny: MFA not completed"])
    MFA -->|"yes"| TOKEN["Cloud issues token / session"]
    RISK -->|"allow"| TOKEN
    TOKEN --> DONE(["Signed in to cloud app"])
```

Notes

- Availability is checked first: with no agent servicing the queue there is no cloud-side
  password fallback (unless PHS is separately enabled), so the sign-in simply fails.
- The domain controller is the authority for every credential and account-state verdict; the
  agent only relays that verdict and never caches a hash.
- The password check is a single factor — Conditional Access and MFA gates sit after a
  successful DC validation before a token is issued.
