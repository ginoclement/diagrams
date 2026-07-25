---
title: "MFA Enrollment — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 6238"
---

# MFA Enrollment — Sequence Diagram

Happy path: an authenticated user adds a TOTP authenticator — secret provisioning via
QR, proof-of-possession with the first code, backup codes issued. Alternates: SMS/voice
OTP factor, proof-of-possession failure, replacing/removing a factor, and an
admin-required step-up before enrollment.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Auth as Authenticator App
    participant IdP as IdP Server
    participant OTP as OTP Delivery Service

    %% ----- happy path: TOTP -----
    User->>Browser: Open "Add authenticator app" (already signed in)
    Browser->>IdP: POST /mfa/factors (type=totp)
    IdP->>IdP: Generate per-user TOTP secret,<br/>store factor as PENDING
    IdP-->>Browser: otpauth URI + QR + manual key + issuer
    Browser-->>User: Show QR code and manual secret
    User->>Auth: Scan QR (or type manual key)
    Auth->>Auth: Store secret, derive TOTP<br/>from current 30s time step
    Auth-->>User: Show current 6-digit code
    User->>Browser: Enter first code to prove possession
    Browser->>IdP: POST /mfa/factors/verify (code)
    IdP->>IdP: Compute expected TOTP, allow small skew,<br/>compare in constant time
    IdP->>IdP: Activate factor (PENDING to ACTIVE),<br/>generate backup codes, store hashes
    IdP-->>Browser: 200 + one-time backup codes
    Browser-->>User: Factor active, save these backup codes now

    %% ----- alternates -----
    alt SMS / voice OTP factor
        User->>Browser: Choose "Text message" factor, enter phone number
        Browser->>IdP: POST /mfa/factors (type=sms, phone)
        IdP->>OTP: Send OTP to phone (SMS or voice call)
        OTP-->>User: Delivers 6-digit code out of band
        User->>Browser: Enter received code
        Browser->>IdP: POST /mfa/factors/verify (code)
        IdP->>IdP: Match code, activate SMS factor
        Note over IdP,OTP: SMS/voice is phishable and SIM-swappable -<br/>prefer TOTP or a passkey where policy allows
        IdP-->>Browser: 200 - SMS factor active
    end

    alt Proof-of-possession fails
        User->>Browser: Enter wrong or expired code
        Browser->>IdP: POST /mfa/factors/verify (code)
        IdP->>IdP: No time window matches, increment attempt counter
        IdP-->>Browser: 400 invalid code (factor stays PENDING)
        Browser-->>User: Try again, code refreshes every 30s
        Note over IdP: Throttle / lock after N failures,<br/>pending secret expires and must be re-provisioned
    end

    alt Replace or remove an existing factor
        User->>Browser: Choose "Remove this factor"
        Browser->>IdP: DELETE /mfa/factors/{id}
        IdP->>IdP: Require re-authentication for the delete
        IdP->>IdP: Check this is not the last remaining factor
        alt Last factor and MFA required
            IdP-->>Browser: 409 cannot remove last factor
        else Safe to remove
            IdP->>IdP: Revoke factor, invalidate its backup codes
            IdP-->>Browser: 200 - factor removed
        end
    end

    opt Admin-required step-up before enrolling
        Browser->>IdP: POST /mfa/factors (type=totp)
        IdP-->>Browser: 401 step_up_required (fresh auth or strong factor)
        User->>Browser: Re-authenticate (password + existing factor)
        Browser->>IdP: Retry POST /mfa/factors with elevated session
        IdP-->>Browser: Proceed to secret provisioning
    end
```
