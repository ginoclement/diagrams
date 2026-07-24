# PocketID — Passkey Login + OIDC Issuance Sequence Diagram

Happy path: a client redirects to PocketID's `/authorize`; PocketID authenticates the
user with a passkey (the WebAuthn ceremony detailed in
[WebAuthn / Passkey Authentication](../../tokenless/webauthn-passkey-authentication/README.md)),
then issues an authorization code exchanged for tokens per
[OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md).
Alternates: first-time one-time-link registration, admin-created user, multiple
passkeys.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Client as Client App
    participant PID as PocketID
    actor Admin

    %% ----- happy path -----
    User->>Client: Open app, click "Log in"
    Client-->>Browser: Redirect to PocketID /authorize (PKCE, state, scope)
    Browser->>PID: GET /authorize
    PID->>PID: No PocketID session - begin passkey login
    PID-->>Browser: WebAuthn request options (challenge, rpId, allowCredentials)
    Note over Browser,PID: WebAuthn assertion ceremony - see webauthn-passkey-authentication
    Browser->>User: Prompt biometric / PIN
    User->>Browser: Authorize with passkey
    Browser->>PID: Signed assertion (credentialId, authenticatorData, signature)
    PID->>PID: Verify signature vs stored public key,<br/>challenge, origin, rpIdHash, counter
    PID->>PID: Establish PocketID session, mint authorization code
    PID-->>Browser: Redirect to Client callback with code
    Browser->>Client: GET /callback?code=...
    Client->>PID: POST /token (code + PKCE verifier)
    PID->>PID: Validate code, build ID + access tokens
    PID-->>Client: id_token + access_token
    Client-->>User: Signed in - passwordless, self-hosted

    %% ----- alternates -----
    alt First-time passkey registration via one-time link
        Admin->>PID: Create user, generate one-time enrollment link
        PID-->>User: One-time link (out of band)
        User->>Browser: Open one-time link
        Browser->>PID: GET enrollment page (validate one-time token)
        PID-->>Browser: WebAuthn creation options (challenge, user, rp)
        Browser->>User: Prompt to create passkey
        User->>Browser: Create passkey (biometric)
        Browser->>PID: Attestation (new credential public key)
        PID->>PID: Store credential, consume one-time link
        PID-->>Browser: Passkey registered - ready to log in
    end

    opt Admin-created user (no self sign-up)
        Admin->>PID: Provision user account + attributes
        Note over Admin,PID: PocketID has no open registration - admin creates users
    end

    opt Multiple passkeys per user
        User->>PID: While signed in, add another passkey (second device / roaming key)
        PID->>PID: Store additional credential under same user
        Note over User,PID: Any registered passkey can satisfy future logins
    end
```
