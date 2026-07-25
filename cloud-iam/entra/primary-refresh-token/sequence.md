# Primary Refresh Token — Sequence Diagram

Happy path first (interactive logon issues the PRT, then a brokered app token), followed
by renewal, WHfB gesture, and PRT invalidation alternates.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant CloudAP as CloudAP
    participant TPM as TPM
    participant WAM as WAM
    participant Entra as Entra
    participant App as App

    User->>CloudAP: Sign in to device (password / WHfB)
    CloudAP->>TPM: Ensure device key exists (attested at join)
    CloudAP->>Entra: POST /token grant for PRT<br/>(device key proof of possession)
    Entra->>Entra: Validate device identity + user auth, capture MFA claim
    Entra-->>CloudAP: PRT + session key (encrypted to device transport key)
    CloudAP->>TPM: Import session key, protected by TPM
    CloudAP-->>User: Desktop unlocked, SSO ready

    User->>WAM: Launch app needing an Entra token
    WAM->>TPM: Sign token request with PRT session key
    WAM->>Entra: POST /token with PRT + signed request<br/>(scope for target app)
    Entra->>Entra: Verify PRT signature + binding, apply CA
    Entra-->>WAM: access_token (+ refresh_token) for app
    WAM-->>App: Present access_token
    App-->>User: Signed-in, no prompt

    alt PRT renewal (background, before expiry)
        CloudAP->>Entra: Renew PRT using existing PRT + device key
        Entra-->>CloudAP: Fresh PRT, rolling validity
    end

    opt Windows Hello for Business gesture (key trust)
        User->>CloudAP: PIN / biometric unlocks WHfB private key in TPM
        CloudAP->>Entra: PRT request signed by WHfB key
        Entra-->>CloudAP: PRT with strong-auth (MFA) claim
    end

    alt PRT invalidated (password change, device disabled, CA revoke)
        WAM->>Entra: POST /token with stale PRT
        Entra-->>WAM: invalid_grant - PRT no longer valid
        WAM->>CloudAP: Trigger interactive re-authentication
        CloudAP-->>User: Prompt to sign in again
    end
```

Notes

- The session key never leaves the TPM in the clear, it is delivered encrypted to the
  device transport key and imported directly into the TPM.
- Browser SSO uses the same PRT as a signed `x-ms-RefreshTokenCredential` cookie/header
  injected by the Windows Accounts extension.
- MFA performed at PRT issuance is carried as a claim so app tokens can satisfy MFA
  grant controls without re-prompting.
