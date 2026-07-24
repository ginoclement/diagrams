# MFA Enrollment — Decision Flowchart

Decision logic from the enrollment request through the step-up gate, secret
provisioning, proof-of-possession, and activation, with explicit error terminals.

```mermaid
flowchart TD
    Start(["User requests: add MFA factor<br/>(authenticated session)"]) --> Step{"Step-up / fresh<br/>auth required by policy?"}
    Step -->|yes| Reauth{"Re-authentication<br/>succeeds?"}
    Reauth -->|no| EReauth(["Deny: enrollment blocked,<br/>elevate session first"])
    Reauth -->|yes| Type
    Step -->|no| Type{"Factor type?"}

    Type -->|"TOTP app"| Gen["Generate secret,<br/>store factor PENDING,<br/>show QR + manual key"]
    Type -->|"SMS / voice"| Send["Send OTP to phone<br/>out of band"]
    Type -->|"Push app"| Push["Register device push token,<br/>store factor PENDING"]

    Gen --> Proof{"Entered code matches<br/>expected TOTP<br/>within time skew?"}
    Send --> Proof
    Push --> PushApprove{"User approves<br/>test push?"}
    PushApprove -->|no| EProof
    PushApprove -->|yes| Activate

    Proof -->|no| Retry{"Attempt limit<br/>reached?"}
    Retry -->|no| EProof(["Show error, code refreshes,<br/>factor stays PENDING"])
    Retry -->|yes| ELock(["Lock enrollment,<br/>pending secret expires"])
    Proof -->|yes| Activate["Activate factor<br/>(PENDING to ACTIVE)"]

    Activate --> Backup["Generate one-time backup codes,<br/>store only their hashes"]
    Backup --> OK(["Factor active,<br/>backup codes shown once"])

    EProof --> Proof
```

## Removing or replacing a factor

```mermaid
flowchart TD
    R0(["User requests: remove a factor"]) --> RA{"Re-authentication<br/>succeeds?"}
    RA -->|no| RErr(["Deny: sensitive change<br/>needs fresh auth"])
    RA -->|yes| Last{"Is this the last<br/>active factor and<br/>MFA is required?"}
    Last -->|yes| RLast(["Reject: cannot remove<br/>last remaining factor"])
    Last -->|no| RDel["Revoke factor,<br/>invalidate its backup codes"]
    RDel --> ROK(["Factor removed"])
```
