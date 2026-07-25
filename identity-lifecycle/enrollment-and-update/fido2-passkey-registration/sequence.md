---
title: "FIDO2 / Passkey Registration — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# FIDO2 / Passkey Registration — Sequence Diagram

Happy path: the RP issues creation options with a challenge, the browser calls
`navigator.credentials.create()`, the authenticator generates a key pair and returns an
attestation object, and the server verifies it and stores the public key. Alternates:
platform vs roaming authenticator, attestation `none` vs `direct`, user verification
required, discoverable/resident key, and duplicate credential.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Auth as Authenticator
    participant RP as RP Server

    %% ----- happy path -----
    User->>Browser: Click "Add a passkey" (signed in)
    Browser->>RP: POST /webauthn/register/options
    RP->>RP: Generate challenge (>= 16 bytes),<br/>bind to session, set rp, user, pubKeyCredParams
    RP-->>Browser: PublicKeyCredentialCreationOptions<br/>(challenge, rp, user, excludeCredentials, authenticatorSelection)
    Browser->>Browser: navigator.credentials.create(options)
    Browser->>Auth: authenticatorMakeCredential (rpId, clientDataHash)
    Auth->>User: Prompt user verification (biometric / PIN)
    User->>Auth: Gesture succeeds, consents to create
    Auth->>Auth: Generate key pair scoped to rpId,<br/>keep private key, build attestation object
    Auth-->>Browser: Attestation (credentialId, publicKey,<br/>authenticatorData, attestationStatement)
    Browser->>RP: POST /webauthn/register (attestation + clientDataJSON)
    RP->>RP: Verify type is webauthn.create,<br/>challenge matches, origin + rpIdHash correct
    RP->>RP: Check UP flag (and UV if required),<br/>parse attestation, verify credentialId is new
    RP->>RP: Store public key, credentialId, signCount,<br/>transports, AAGUID against the account
    RP-->>Browser: 201 - passkey registered
    Browser-->>User: Passkey saved for this site

    %% ----- alternates -----
    alt Platform vs roaming authenticator
        Browser->>Auth: authenticatorSelection.authenticatorAttachment
        Note over Browser,Auth: platform = Touch ID / Windows Hello (device-bound),<br/>cross-platform = USB / NFC / BLE security key
    end

    alt Attestation none vs direct
        RP->>RP: attestation=none - accept self/none, do not identify model
        RP->>RP: attestation=direct - validate statement + trust path<br/>against FIDO MDS, record AAGUID
        Note over RP: Enterprises may require direct to allow-list<br/>only approved authenticator models
    end

    opt User verification required
        Auth->>User: userVerification=required forces biometric / PIN
        Auth->>Auth: Set UV flag in authenticatorData
        RP->>RP: Reject registration if UV flag not set
    end

    opt Discoverable / resident key for passkeys
        Browser->>Auth: residentKey=required (store client-side)
        Auth->>Auth: Persist credential keyed by rpId + userHandle
        Note over Auth,RP: Enables usernameless sign-in later -<br/>userHandle returned in the assertion
    end

    alt Duplicate credential (already enrolled)
        Browser->>Auth: create() with excludeCredentials listing this device
        Auth-->>Browser: InvalidStateError - credential already exists
        Browser-->>User: This authenticator is already registered
    end
```
