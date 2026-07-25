# SigV4 Request Signing — Sequence Diagram

Happy path first (build canonical request, derive the key chain, sign, and let the service
verify), then alternates: temporary credentials, presigned URL, and a signature mismatch.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client (SDK/CLI)
    participant Creds as Credentials
    participant Service as AWS Service
    participant IAM as IAM (authz)

    Client->>Client: Canonical request = METHOD, URI, query,<br/>canonical headers, SignedHeaders, hex SHA256 payload
    Client->>Client: String to sign = "AWS4-HMAC-SHA256", X-Amz-Date,<br/>scope date/region/service/aws4_request,<br/>hex SHA256 of canonical request
    Client->>Creds: Read AccessKeyId + SecretAccessKey
    Client->>Client: kDate = HMAC "AWS4"+secret, date<br/>kRegion = HMAC kDate, region<br/>kService = HMAC kRegion, service<br/>kSigning = HMAC kService, "aws4_request"
    Client->>Client: signature = hex HMAC kSigning, stringToSign
    Client->>Service: Request + Authorization: AWS4-HMAC-SHA256<br/>Credential, SignedHeaders, Signature

    Service->>Service: Rebuild canonical request from received bytes
    Service->>Service: Re-derive kSigning and recompute signature
    alt Signatures match and within 5 min skew
        Service->>IAM: Identity resolved, authorize action
        IAM-->>Service: Allow
        Service-->>Client: 200 result
    else Mismatch or skew
        Service-->>Client: 403 SignatureDoesNotMatch
    end

    alt Temporary STS credentials
        Client->>Creds: Read SessionToken too
        Client->>Service: Add X-Amz-Security-Token to signed headers
        Note over Client,Service: Session token is part of SignedHeaders,<br/>omitting it breaks verification.
        Service-->>Client: 200 result
    end

    alt Presigned URL (browser upload/download)
        Client->>Client: Move signature into query:<br/>X-Amz-Algorithm, X-Amz-Credential, X-Amz-Date,<br/>X-Amz-Expires, X-Amz-SignedHeaders, X-Amz-Signature
        Client-->>Service: Anyone with the URL redeems it until X-Amz-Expires
        Service-->>Client: 200 object
    end

    alt Wrong region in scope
        Client->>Service: Scope says us-west-2 but endpoint is us-east-1
        Service-->>Client: 403 SignatureDoesNotMatch<br/>(scope binds the signature to one region/service)
    end
```

Notes

- The service never receives the secret key, it re-derives `kSigning` from its own stored copy.
- Scope (`date/region/service/aws4_request`) is what makes a captured signature non-portable.
- `X-Amz-Content-Sha256` is mandatory for S3, `UNSIGNED-PAYLOAD` is allowed only over HTTPS.
