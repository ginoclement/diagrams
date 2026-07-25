---
title: "Email / Phone Verification — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Email / Phone Verification — Sequence Diagram

Happy path: the server issues a proof, delivers it over the channel, and marks the
channel verified once the user confirms. Alternates: verification link vs OTP code,
expired/invalid token, resend with rate limiting, and changing an already-verified
channel.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP Server
    participant VS as Verification Service

    %% ----- happy path: OTP code -----
    User->>Browser: Enter email / phone to verify
    Browser->>IdP: POST /contacts/verify/start (channel, value)
    IdP->>IdP: Generate token, store hash,<br/>set short expiry, bind to account + value
    IdP->>VS: Send OTP to the channel
    VS-->>User: Deliver 6-digit code (email / SMS)
    User->>Browser: Enter received code
    Browser->>IdP: POST /contacts/verify/confirm (code)
    IdP->>IdP: Hash and compare, check unexpired + unused
    IdP->>IdP: Mark channel VERIFIED, consume token
    IdP-->>Browser: 200 - channel verified

    %% ----- alternates -----
    alt Verification link instead of OTP
        IdP->>VS: Send signed verification link
        VS-->>User: Email with click-to-verify URL
        User->>Browser: Open link (signed token in URL)
        Browser->>IdP: GET /contacts/verify/confirm?token=...
        IdP->>IdP: Verify signature, expiry, single-use
        IdP-->>Browser: 200 - channel verified
    end

    alt Expired or invalid code / link
        User->>Browser: Enter old code or open stale link
        Browser->>IdP: POST /contacts/verify/confirm (token)
        IdP->>IdP: Token expired, already used, or mismatch
        IdP-->>Browser: 400 invalid or expired - request a new one
    end

    alt Resend with rate limit
        User->>Browser: Click "Resend code"
        Browser->>IdP: POST /contacts/verify/resend
        alt Within rate limit
            IdP->>IdP: Invalidate previous token, issue new one
            IdP->>VS: Send fresh code
            VS-->>User: New code delivered
        else Rate limit exceeded
            IdP-->>Browser: 429 too many requests - wait before retrying
            Note over IdP,VS: Throttle per address and per account<br/>to stop bombing and brute force
        end
    end

    alt Change of an already-verified channel
        User->>Browser: Update email / phone to a new value
        Browser->>IdP: POST /contacts (new value)
        IdP->>IdP: Mark new value UNVERIFIED,<br/>keep old value active until confirmed
        IdP->>VS: Send proof to the new value
        VS-->>User: Code / link at new address
        User->>Browser: Confirm new value
        Browser->>IdP: POST /contacts/verify/confirm
        IdP->>IdP: Verify, promote new value, retire old
        IdP-->>Browser: 200 - new channel active
    end
```
