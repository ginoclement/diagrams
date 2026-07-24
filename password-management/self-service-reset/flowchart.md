# Self-Service Password Reset — Decision Flowchart

Branch-focused view: enumeration guard on request, reset-token validity, recovery
factor verification with rate limiting, password policy, and mandatory session
invalidation.

```mermaid
flowchart TD
    Start(["User submits identifier"]) --> Exists{"Account exists?"}

    %% ----- uniform response regardless of existence -----
    Exists -->|no| Uniform["Do nothing internally"]
    Exists -->|yes| Issue["Issue single-use,<br/>time-limited reset token"]
    Uniform --> Msg(["Uniform message:<br/>'if an account exists,<br/>we've sent instructions'"])
    Issue --> Msg

    Msg --> Click["User opens reset link"]
    Click --> Token{"Token valid, unused,<br/>not expired?"}
    Token -->|no| EToken(["Reject:<br/>request a new reset link"])
    Token -->|yes| MfaReq{"Account has<br/>registered MFA?"}

    MfaReq -->|yes| Mfa{"MFA challenge<br/>passed?"}
    Mfa -->|no| EMfa(["Deny:<br/>MFA verification failed"])
    Mfa -->|yes| Otp
    MfaReq -->|no| Otp{"Recovery OTP /<br/>answers correct?"}

    Otp -->|no| Count["Increment attempt counter"]
    Count --> Thresh{"Attempts >= threshold?"}
    Thresh -->|yes| Invalidate["Invalidate reset token"] --> EAttempts(["Reject:<br/>too many attempts,<br/>start over"])
    Thresh -->|no| ERetry(["Incorrect code,<br/>try again"])

    Otp -->|yes| Policy{"New password meets<br/>policy + history + breach?"}
    Policy -->|no| EPolicy(["Reject:<br/>choose a stronger,<br/>unused password"])
    Policy -->|yes| Store["Store new hash,<br/>consume token"]
    Store --> Revoke["Revoke all sessions<br/>+ refresh tokens"]
    Revoke --> Done(["Reset complete:<br/>user must sign in again"])
```
