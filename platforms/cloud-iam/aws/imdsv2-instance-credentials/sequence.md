---
title: "IMDSv2 Instance Credentials — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IMDSv2 Instance Credentials — Sequence Diagram

Happy path first (PUT a session token, GET the credentials, then sign an API call), then
alternates: the deprecated IMDSv1 token-less path abused by SSRF, no profile attached, and a
missing token on a `required` instance.

```mermaid
sequenceDiagram
    autonumber
    participant App as App (SDK on instance)
    participant IMDS as IMDS 169.254.169.254
    participant Profile as Instance profile
    participant STS as STS
    participant API as AWS Service

    App->>IMDS: PUT /latest/api/token<br/>X-aws-ec2-metadata-token-ttl-seconds: 21600
    IMDS-->>App: 200 session token
    App->>IMDS: GET /latest/meta-data/iam/security-credentials/<br/>X-aws-ec2-metadata-token: token
    IMDS->>Profile: Resolve attached role name
    Profile-->>IMDS: RoleName
    App->>IMDS: GET .../security-credentials/RoleName<br/>X-aws-ec2-metadata-token: token
    IMDS->>STS: Fetch/refresh temporary credentials for role
    STS-->>IMDS: Credentials {AccessKeyId, SecretAccessKey,<br/>Token, Expiration}
    IMDS-->>App: 200 JSON credentials

    App->>API: SigV4-signed request with X-Amz-Security-Token
    API-->>App: 200 result

    alt IMDSv1 token-less path (deprecated, SSRF risk)
        App->>IMDS: GET .../security-credentials/RoleName<br/>(no token, no PUT)
        Note over App,IMDS: A single crafted GET returns credentials,<br/>an SSRF-vulnerable app can be tricked into<br/>proxying this and leaking the role creds.
        IMDS-->>App: 200 credentials (only if HttpTokens=optional)
    end

    alt No instance profile attached
        App->>IMDS: GET .../iam/security-credentials/
        IMDS-->>App: 404 Not Found (no role)
    end

    alt Token missing on HttpTokens=required
        App->>IMDS: GET .../security-credentials/RoleName (no token)
        IMDS-->>App: 401 Unauthorized
    end
```

Notes

- The `PUT`-first requirement plus hop limit 1 is what blocks SSRF, attackers rarely control a
  `PUT` with a custom header and the token cannot cross a proxy or container hop.
- Credentials rotate automatically, the SDK refreshes a few minutes before `Expiration`.
- With `HttpTokens=required` the IMDSv1 alternate returns 401, close IMDSv1 everywhere.
