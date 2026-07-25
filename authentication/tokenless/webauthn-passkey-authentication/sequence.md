---
title: "WebAuthn / Passkey Authentication — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# WebAuthn / Passkey Authentication — Sequence Diagram

Happy path: challenge, `navigator.credentials.get()`, user verification, signed
assertion, server-side verification. Alternates: no credential for the RP ID,
user-verification failure, cross-device hybrid (QR/CaBLE) flow.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Auth as Authenticator
    participant Server as Server (Relying Party)

    %% ----- happy path -----
    User->>Browser: Click "Sign in with passkey"
    Browser->>Server: POST /webauthn/authenticate/options
    Server->>Server: Generate random challenge (>= 16 bytes),<br/>bind to pending login, set timeout
    Server-->>Browser: PublicKeyCredentialRequestOptions<br/>(challenge, rpId, allowCredentials, userVerification)
    Browser->>Browser: navigator.credentials.get(options)
    Browser->>Auth: Request assertion for rpId = example.com
    Note over Browser,Auth: Browser scopes lookup to the RP ID -<br/>phishing domains see no credentials
    Auth->>User: Prompt user verification (biometric / PIN)
    User->>Auth: Touch ID / face / PIN succeeds
    Auth->>Auth: Sign authenticatorData + hash of clientDataJSON<br/>with credential private key, increment counter
    Auth-->>Browser: Assertion (credentialId, authenticatorData,<br/>clientDataJSON, signature, userHandle)
    Browser->>Server: POST /webauthn/authenticate (assertion)
    Server->>Server: Look up public key by credentialId
    Server->>Server: Verify - type is webauthn.get, challenge matches,<br/>origin expected, rpIdHash correct
    Server->>Server: Verify signature with stored public key
    Server->>Server: Check UP/UV flags, counter greater than stored<br/>(synced passkeys may report 0)
    Server->>Server: Update stored counter, consume challenge
    Server-->>Browser: 200 + Set-Cookie session (rotated ID)
    Browser-->>User: Signed in - no password, nothing phishable

    %% ----- alternates -----
    alt No credential for this RP ID
        Browser->>Auth: Request assertion for rpId
        Auth-->>Browser: No matching credential
        Note over Browser,Auth: Also what a phishing look-alike domain sees -<br/>the scoping IS the phishing resistance
        Browser-->>User: "No passkey found here"
        Browser->>Server: Fall back to another factor<br/>or offer passkey enrollment
    end

    alt User verification fails
        Auth->>User: Prompt biometric / PIN
        User--xAuth: Biometric mismatch, wrong PIN, or cancel
        Auth->>Auth: Retry limit reached or user aborted
        Auth-->>Browser: Error - no assertion produced
        Browser->>Server: Nothing to submit - authentication not attempted
        Server-->>Browser: Login page unchanged (offer retry / other method)
    end

    alt Cross-device hybrid flow (CaBLE / QR)
        participant Phone as Phone (holds passkey)
        Browser->>Browser: No local passkey - show hybrid option
        Browser-->>User: Display QR code (FIDO hybrid pairing data)
        User->>Phone: Scan QR code with phone camera
        Phone->>Browser: Establish proximity-verified tunnel (BLE + relay)
        Note over Phone,Browser: BLE proximity check defeats remote phishing -<br/>attacker cannot relay the QR to a distant victim
        Phone->>User: Prompt biometric on phone
        User->>Phone: Verify
        Phone->>Phone: Sign assertion with passkey private key
        Phone-->>Browser: Assertion via tunnel
        Browser->>Server: POST assertion (same verification as above)
        Server-->>Browser: 200 - session on the computer
    end
```
