---
title: "Email / Phone Verification — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Email / Phone Verification — Decision Flowchart

Decision logic for issuing and validating a verification token, including link vs OTP,
expiry, rate limiting, and re-verification of a changed channel.

```mermaid
flowchart TD
    Start(["User submits a channel to verify"]) --> New{"Channel already<br/>verified with a<br/>different value?"}
    New -->|yes| Mark["Mark new value UNVERIFIED,<br/>keep old value active"]
    New -->|no| Method
    Mark --> Method{"Delivery method?"}

    Method -->|"OTP code"| SendO["Generate token, store hash,<br/>send code over channel"]
    Method -->|"signed link"| SendL["Generate signed token,<br/>send verification link"]

    SendO --> Confirm{"User confirms<br/>in time?"}
    SendL --> Confirm

    Confirm -->|"no response"| Resend{"Resend requested?"}
    Resend -->|"within rate limit"| SendO
    Resend -->|"limit exceeded"| ELimit(["429: throttled,<br/>wait before retrying"])
    Resend -->|"no"| ENone(["Channel stays unverified"])

    Confirm -->|"submits token"| Valid{"Token matches, unexpired,<br/>unused, bound to this value?"}
    Valid -->|no| EInvalid(["Reject: invalid or expired -<br/>request a new one"])
    Valid -->|yes| Promote{"Was this a change<br/>of an existing channel?"}
    Promote -->|yes| Swap(["Promote new value,<br/>retire old, mark VERIFIED"])
    Promote -->|no| OK(["Channel VERIFIED"])
```
