# Service Account Impersonation — Sequence Diagram

Happy path first (`generateAccessToken` with the Token Creator role), then alternates:
missing role, a delegation chain, and `generateIdToken` for an OIDC backend.

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Caller (user / source SA)
    participant IAMCreds as IAM Credentials API
    participant IAM as Cloud IAM
    participant TargetSA as Target SA
    participant API as Google API

    Caller->>IAMCreds: generateAccessToken(name = target SA,<br/>scope, lifetime)
    IAMCreds->>IAM: Caller has roles/iam.serviceAccountTokenCreator<br/>on target SA?
    IAM-->>IAMCreds: Yes

    alt Access token issued (happy path)
        IAMCreds->>TargetSA: Mint short-lived OAuth token for this SA
        IAMCreds-->>Caller: accessToken + expireTime (<= 1h)
        Caller->>API: Call API with Bearer accessToken<br/>(acting as target SA)
        API-->>Caller: 200 (authorized by target SA's IAM)
    else Missing Token Creator role
        IAM-->>IAMCreds: No
        IAMCreds-->>Caller: 403 PERMISSION_DENIED
    else Delegation chain (Caller -> SA-A -> Target)
        Caller->>IAMCreds: generateAccessToken(name = Target,<br/>delegates = SA-A)
        IAMCreds->>IAM: Caller -> SA-A has Token Creator?<br/>SA-A -> Target has Token Creator?
        alt Every hop authorized
            IAM-->>IAMCreds: Yes for all edges
            IAMCreds-->>Caller: accessToken for Target
        else One hop lacks the role
            IAM-->>IAMCreds: No on SA-A -> Target
            IAMCreds-->>Caller: 403 - chain broken
        end
    else generateIdToken for an OIDC backend
        Caller->>IAMCreds: generateIdToken(name = Target,<br/>audience = https://run.app service URL)
        IAMCreds-->>Caller: Signed OIDC ID token (aud = service)
        Caller->>API: Call Cloud Run / IAP with ID token
        API-->>Caller: 200 (token audience + identity verified)
    end
```

Notes

- The Bearer token in the happy path is the target SA's; the API authorizes against the target
  SA's IAM bindings, not the caller's.
- In a delegation chain, every edge (caller → first delegate, delegate → delegate, last delegate
  → target) must independently grant Token Creator; a single missing edge fails the whole call.
- `generateIdToken` produces an OIDC token whose `aud` claim the backend validates — used for
  Cloud Run service-to-service and IAP-protected resources.
