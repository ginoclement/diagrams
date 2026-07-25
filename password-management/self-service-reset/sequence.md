---
title: "Self-Service Password Reset — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Self-Service Password Reset — Sequence Diagram

Happy path: request reset, receive an emailed link, verify a recovery OTP, set a
policy-compliant new password, and invalidate all old sessions. Alternates:
account-enumeration protection, wrong OTP with rate limiting, expired reset link,
and an MFA-backed reset.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP (auth server)
    participant Dir as Directory
    participant Rec as RecoverySvc

    %% ----- happy path -----
    User->>Browser: Click "Forgot password"
    Browser->>IdP: GET /reset (show request form)
    IdP-->>Browser: Enter your email/username
    User->>Browser: Submit identifier
    Browser->>IdP: POST /reset-request (identifier)
    IdP->>Dir: Look up account by identifier
    Dir-->>IdP: Account found, recovery factors on file
    Note over IdP,Rec: Response is uniform whether or not the account exists (no enumeration)
    IdP->>Rec: Send single-use, time-limited reset link
    Rec-->>User: Email reset link (token bound to account)
    IdP-->>Browser: "If an account exists, we've sent instructions"

    User->>Browser: Open reset link
    Browser->>IdP: GET /reset?token=... 
    IdP->>IdP: Validate token (unused, not expired, hash matches)
    IdP->>Rec: Send OTP to verify recovery channel
    Rec-->>User: SMS/email OTP
    User->>Browser: Enter OTP + new password
    Browser->>IdP: POST /reset-complete (token, OTP, new password)
    IdP->>IdP: Verify OTP, check password policy + history + breach
    IdP->>Dir: Store new password hash, consume reset token
    Dir-->>IdP: Updated
    IdP->>Dir: Revoke all sessions + refresh tokens for account
    Note over IdP,Dir: Session invalidation on reset limits blast radius of a prior compromise
    IdP-->>Browser: Password reset, please sign in

    %% ----- alternates -----
    alt Account not found (enumeration protection)
        Browser->>IdP: POST /reset-request (unknown identifier)
        IdP->>Dir: Look up account
        Dir-->>IdP: Not found
        IdP-->>Browser: Same "if an account exists..." message, same timing
    end

    alt Recovery factor fails (wrong OTP)
        Browser->>IdP: POST /reset-complete (wrong OTP)
        IdP->>IdP: Increment attempt counter, rate-limit
        opt Counter >= threshold
            IdP->>IdP: Invalidate this reset token, require new request
            IdP-->>Browser: Too many attempts, start over
        end
        IdP-->>Browser: Incorrect code, try again
    end

    alt Reset link expired or reused
        Browser->>IdP: GET /reset?token=OLD
        IdP->>IdP: Token expired / already consumed
        IdP-->>Browser: Link no longer valid, request a new reset
    end

    alt MFA-backed reset (authenticator on file)
        Browser->>IdP: POST /reset-complete (token, OTP, new password)
        IdP->>IdP: Account has registered MFA, step-up required
        IdP-->>Browser: Approve on your authenticator
        User->>Browser: Complete MFA challenge
        Browser->>IdP: MFA assertion
        IdP->>IdP: Verify MFA, then apply new password
        IdP->>Dir: Store new password hash, revoke sessions
        IdP-->>Browser: Password reset, please sign in
    end
```
