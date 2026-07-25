---
title: "Secrets Management — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Management — Sequence Diagram

A representative runtime flow: an application authenticates to the secret store with its
platform identity, receives a policy-scoped token, and fetches a **dynamic database
credential** with a short lease. `alt`/`opt` cover encryption-as-a-service, lease renewal,
and revocation.

```mermaid
sequenceDiagram
    autonumber
    participant App as Application / Workload
    participant Auth as Auth Method
    participant Policy as Policy Engine
    participant Engine as Secret Engine (dynamic DB)
    participant Lease as Lease / Rotation Manager
    participant DB as Target Database
    participant Audit as Audit Log

    App->>Auth: Authenticate with platform identity<br/>(K8s / cloud IAM / signed JWT / mTLS)
    Auth->>Auth: Verify identity against trusted source
    alt Identity valid
        Auth->>Policy: Resolve policies for this identity
        Policy-->>Auth: Attached policies (allowed paths)
        Auth-->>App: Store token (scoped, short TTL)
        Auth->>Audit: Log successful auth

        App->>Engine: Request database credential (with token)
        Engine->>Policy: Is this token permitted on this path?
        alt Authorized
            Engine->>DB: Create ephemeral DB user + password
            DB-->>Engine: Credential created
            Engine->>Lease: Register lease (TTL, renewable)
            Engine->>Audit: Log secret issuance (lease id, path)
            Engine-->>App: Dynamic credential + lease id
            App->>DB: Connect using ephemeral credential

            opt Long-running workload renews before expiry
                App->>Lease: Renew lease id
                Lease-->>App: Extended TTL (up to max)
            end

            opt Encryption-as-a-service (no credential needed)
                App->>Engine: Encrypt / decrypt payload via transit
                Engine-->>App: Ciphertext / plaintext (key never leaves store)
            end
        else Not permitted by policy
            Engine->>Audit: Log denied access
            Engine-->>App: 403 permission denied
        end
    else Identity invalid
        Auth->>Audit: Log failed auth
        Auth-->>App: 401 authentication failed
    end

    Note over Lease,DB: On lease expiry or revocation, the Lease Manager<br/>deletes the ephemeral DB user automatically
```

Notes

- The app never holds a long-lived database password, it authenticates with its platform
  identity and receives a credential that lives only as long as its lease, steps 12-17.
- Authorization is a policy check on the token, step 10, authentication alone does not
  grant access to a secret path.
- Encryption-as-a-service lets the app protect data without ever seeing the key, the
  transit engine does the crypto inside the boundary.
- Expiry and revocation are enforced by the Lease Manager deleting the ephemeral DB user,
  so a leaked credential becomes useless quickly and automatically.
