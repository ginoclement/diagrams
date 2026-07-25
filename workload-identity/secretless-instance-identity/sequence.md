# Secretless Instance Identity — Sequence Diagram

Happy path first: AWS IMDSv2 session token then credentials, and the GCP/Azure header
variant. Alternates: IMDSv1, no attached identity, SSRF attempt, and missing header.

```mermaid
sequenceDiagram
    autonumber
    participant WL as Workload
    participant IMDS as IMDS
    participant IAM as Cloud IAM
    participant API as Cloud API

    alt AWS IMDSv2 (session-oriented)
        WL->>IMDS: PUT /latest/api/token<br/>X-aws-ec2-metadata-token-ttl-seconds
        IMDS-->>WL: Session token
        WL->>IMDS: GET .../iam/security-credentials/role<br/>X-aws-ec2-metadata-token header
        IMDS->>IAM: Resolve attached role
        IAM-->>IMDS: Short-lived STS credentials
        IMDS-->>WL: AccessKeyId, SecretAccessKey, Token, Expiration
    else GCP / Azure (header-gated GET)
        WL->>IMDS: GET .../token<br/>Metadata-Flavor: Google  /  Metadata: true
        IMDS->>IAM: Resolve service account / managed identity
        IAM-->>IMDS: Short-lived access token
        IMDS-->>WL: access_token + expires_in
    end

    WL->>API: Call API with credentials / access token
    API-->>WL: 200 data
    WL->>WL: Cache creds, refresh before expiry

    alt AWS IMDSv1 (deprecated)
        WL->>IMDS: GET credentials with no session token
        Note over WL,IMDS: Plain request/response - easier to abuse via SSRF.<br/>Disable v1; require v2.
        IMDS-->>WL: Credentials (if v1 still enabled)
    else No identity attached to instance
        WL->>IMDS: GET credentials
        IMDS-->>WL: 404 - no role / identity
    else SSRF attempt via a tricked app
        WL->>IMDS: GET metadata URL (attacker-controlled fetch)
        Note over WL,IMDS: Blocked by IMDSv2 PUT-then-GET, hop limit 1,<br/>required header, and egress rules
        IMDS-->>WL: Denied / unreachable
    else Missing required header
        WL->>IMDS: GET token without Metadata-Flavor / Metadata header
        IMDS-->>WL: 403 - header required
    end
```

Notes

- On AWS the two-step `PUT`-then-`GET` means a naive SSRF that can only issue GETs cannot obtain the session token, so it cannot read credentials.
- The GCP/Azure required header serves the same purpose: a simple reflected fetch that cannot set custom headers is rejected.
- The metadata service authenticates purely by network reachability; there is no secret to present, which is exactly why SSRF is the dominant risk.
</content>
