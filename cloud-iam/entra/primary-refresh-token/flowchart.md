# Primary Refresh Token — Decision Flowchart

Whether the endpoint can serve an app token silently from a PRT, or must fall back to
interactive authentication. Failure paths terminate explicitly.

```mermaid
flowchart TD
    Start(["App requests an Entra token on device"]) --> Has{"Device holds<br/>a PRT?"}
    Has -->|No| Interactive["Interactive sign-in via CloudAP"]
    Has -->|Yes| Expired{"PRT within<br/>validity window?"}

    Expired -->|"No - expired"| Renew{"Renewal<br/>succeeds?"}
    Renew -->|No| Interactive
    Renew -->|Yes| Sign
    Expired -->|Yes| Sign["Sign token request with<br/>TPM session key"]

    Sign --> Bound{"Signature + device<br/>binding valid?"}
    Bound -->|No| ErrBind(["invalid_grant: binding failed"])
    Bound -->|Yes| Revoked{"PRT revoked?<br/>(password change,<br/>device disabled, CA)"}
    Revoked -->|Yes| ErrRevoke(["invalid_grant: PRT revoked"]) --> Interactive
    Revoked -->|No| CA{"CA policy for<br/>target app satisfied?"}

    CA -->|"No - needs MFA/device"| Step["Return interrupt<br/>(step-up)"] --> Interactive
    CA -->|Yes| Token(["Issue app access_token silently"])

    Interactive --> AuthOK{"User auth<br/>succeeds?"}
    AuthOK -->|No| ErrAuth(["Deny: sign-in failed"])
    AuthOK -->|Yes| NewPRT["Issue fresh PRT<br/>+ session key"] --> Sign
```

Notes

- Silent token acquisition is only possible when a valid, bound, unrevoked PRT exists and
  the target app's CA controls are already met.
- Any binding or revocation failure forces a fall-back to interactive sign-in, which
  mints a fresh PRT before retrying.
- The PRT's MFA claim can pre-satisfy an app's MFA grant control, avoiding the step-up
  branch entirely.
