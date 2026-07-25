# Service-Account Key Lifecycle — Sequence Diagram

Happy path first: issue, store, and use a key. Alternates: scheduled rotation with an
overlap window, emergency revocation, rotation-order outage, and a leaked-key discovery.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant IAM as Cloud IAM
    participant Store as Secret Store
    participant WL as Workload

    Note over Admin,IAM: Issuance
    Admin->>IAM: Create key for service account
    IAM->>IAM: Generate keypair / access key,<br/>retain public half / key ID
    IAM-->>Admin: Secret returned once (not retrievable again)
    Admin->>Store: Write secret to secret manager
    Store-->>Admin: Stored with access policy + audit

    Note over WL,IAM: Use
    WL->>Store: Read key material
    Store-->>WL: Secret (leased)
    alt GCP - JWT assertion
        WL->>WL: Sign JWT with private key
        WL->>IAM: Exchange JWT at token endpoint
        IAM-->>WL: Short-lived access token
    else AWS - SigV4
        WL->>WL: Sign request with secret access key
        WL->>IAM: Call API with SigV4 signature
        IAM-->>WL: 200 (signature valid)
    end

    alt Scheduled rotation (make-before-break)
        Admin->>IAM: Create new key
        IAM-->>Admin: New secret
        Admin->>Store: Store new key alongside old
        WL->>Store: Pick up new key
        Admin->>IAM: Deactivate old key
        Admin->>IAM: Monitor - no use of old key
        Admin->>IAM: Delete old key
    else Emergency revocation (compromise)
        Admin->>IAM: Disable / delete key immediately
        Note over IAM,WL: GCP tokens already minted stay valid<br/>until they expire - keep TTLs short
        Admin->>Store: Purge secret from store
    else Rotation order error (outage)
        Admin->>IAM: Delete old key before new key deployed
        WL->>IAM: Authenticate with now-invalid key
        IAM-->>WL: 401 invalid credentials (outage)
    else Leaked key discovered
        IAM->>Admin: Leaked-credential scanner alert
        Admin->>IAM: Force revocation + investigate
    end
```

Notes

- The secret is shown to the admin exactly once at creation; the store, not IAM, is the system of record for the material thereafter.
- The make-before-break sequence — create, deploy, deactivate, monitor, delete — is what prevents rotation from causing an outage.
- Revocation is immediate at IAM, but any GCP access tokens already derived from the key live out their TTL, which is why short token lifetimes matter even with static keys.
</content>
