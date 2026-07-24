# Authenticated Password Change — Decision Flowchart

Branch-focused view: reauthentication with the current password, optional step-up
MFA, new-password policy/history/breach checks, and the post-change session
decision.

```mermaid
flowchart TD
    Start(["Logged-in user submits<br/>current + new password"]) --> Reauth{"Current password<br/>correct?"}
    Reauth -->|no| Count["Increment reauth-failure<br/>counter, rate-limit"] --> EReauth(["Reject:<br/>current password incorrect"])
    Reauth -->|yes| StepUp{"Step-up MFA required<br/>for this account?"}

    StepUp -->|yes| Mfa{"MFA challenge passed?"}
    Mfa -->|no| EMfa(["Deny:<br/>MFA verification failed"])
    Mfa -->|yes| SameOld
    StepUp -->|no| SameOld{"New == old password?"}

    SameOld -->|yes| ESame(["Reject:<br/>new must differ from current"])
    SameOld -->|no| Hist{"In password history?"}
    Hist -->|yes| EHist(["Reject:<br/>password recently used"])
    Hist -->|no| Policy{"Meets policy + breach<br/>+ min-length checks?"}
    Policy -->|no| EPolicy(["Reject:<br/>choose a stronger password"])
    Policy -->|yes| Store["Store new hash,<br/>append old to history"]

    Store --> Choice{"Keep this session or<br/>kill everything?"}
    Choice -->|keep this| KillOthers["Revoke all OTHER<br/>sessions + tokens"] --> DoneKeep(["Changed:<br/>this session stays,<br/>others evicted"])
    Choice -->|kill all| KillAll["Revoke ALL sessions<br/>+ tokens"] --> DoneAll(["Changed:<br/>sign in again everywhere"])
```
