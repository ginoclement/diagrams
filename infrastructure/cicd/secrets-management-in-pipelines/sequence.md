---
title: "Secrets Management in Pipelines — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Management in Pipelines — Sequence Diagram

Happy path first (trusted job requests a secret, store checks context, injects, masks),
then alternates: fork PR denied secrets, a Vault dynamic secret with a short TTL, a leaked
secret detected and revoked, and a script-injection exfiltration attempt that is blocked.

```mermaid
sequenceDiagram
    autonumber
    participant Job as Job
    participant CI as CI/CD system
    participant Store as Secret store
    participant Log as Log sink

    Job->>CI: Step requests secret (ref, environment, identity)
    CI->>Store: Fetch secret for this context
    Store->>Store: Check requesting identity + environment<br/>+ branch/ref against policy
    Store-->>CI: Return value (protected context only)
    CI->>CI: Register value for log masking
    CI->>Job: Inject as env var / file at runtime
    Job->>Job: Use secret (registry login, deploy)
    Job-->>Log: Emit output
    Note over CI,Log: CI masks the value in logs.<br/>Treat logs as public regardless.

    alt Fork PR from untrusted contributor
        Job->>CI: Request secret from fork-context run
        CI->>Store: Fetch for fork ref
        Store-->>CI: Denied - context not protected/trusted
        CI-->>Job: No secret injected (build/test only)
    end

    alt Vault dynamic secret (short TTL)
        Job->>Store: Authenticate (OIDC / role), request dynamic cred
        Store->>Store: Generate ephemeral credential, set short TTL
        Store-->>Job: Lease + short-lived credential
        Job->>Job: Use before lease expires
        Store->>Store: Auto-revoke at TTL end
    end

    opt Prefer OIDC over stored secret
        Job->>Store: Present OIDC token, exchange for short-lived cloud cred
        Note over Job,Store: No long-lived secret at rest,<br/>nothing to leak. See oidc-to-cloud-federation.
    end

    alt Leaked secret detected
        Log->>CI: Secret scanner flags a value in logs / commit
        CI->>Store: Revoke and rotate credential
        Store-->>CI: New value issued, old one invalid
    end

    alt Script-injection exfiltration attempt
        Job->>Job: Untrusted input interpolated into run step<br/>tries to print / POST the secret
        CI->>CI: Fork run has no secret to steal,<br/>token is least-privilege
        Note over Job,CI: Exfiltration blocked, pass input via quoted env var,<br/>not inline shell. Pin actions to SHA.
    end
```

Notes

- The policy check in step 3 keys on **identity, environment, and branch/ref** — this is what
  keeps a feature branch or fork from reading production secrets.
- Masking (step 5) is best-effort; transformed forms of the value can still slip through, so
  logs are treated as public.
- The dynamic-secret and OIDC branches shrink the blast radius: short TTL means a leak expires
  quickly, and OIDC means there is no stored secret to leak at all.
- Revocation is the recovery path — detect, revoke, rotate — not "hope it wasn't seen".
