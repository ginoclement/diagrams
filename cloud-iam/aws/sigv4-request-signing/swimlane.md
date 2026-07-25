# SigV4 Request Signing — Swimlane Diagram

One lane per actor. The signing pipeline lives in the Client lane; verification lives in the
Service lane; the final allow/deny is in the IAM lane.

```mermaid
flowchart TD
    subgraph Client["Client (SDK/CLI)"]
        C1["Build canonical request<br/>(method, URI, query, headers, payload hash)"]
        C2["Build string to sign<br/>(algorithm, X-Amz-Date, scope, canonical hash)"]
        C3["Derive kSigning via HMAC chain"]
        C4["Compute signature"]
        C5["Attach Authorization header"]
        C6(["Receive response"])
    end

    subgraph Creds["Credentials"]
        K1["AccessKeyId + SecretAccessKey"]
        K2["SessionToken<br/>(only for STS temp creds)"]
    end

    subgraph Service["AWS Service"]
        S1["Rebuild canonical request<br/>from received bytes"]
        S2["Re-derive kSigning, recompute signature"]
        S3{"Signatures match<br/>and skew within 5 min?"}
        S4(["403 SignatureDoesNotMatch"])
    end

    subgraph IAM["IAM (authz)"]
        M1{"Identity policy allows<br/>the action?"}
        M2(["403 AccessDenied"])
        M3(["200 result"])
    end

    K1 --> C3
    K2 --> C5
    C1 --> C2 --> C3 --> C4 --> C5 --> S1
    S1 --> S2 --> S3
    S3 -->|No| S4
    S3 -->|Yes| M1
    M1 -->|No| M2
    M1 -->|Yes| M3 --> C6
```

Notes

- `Creds` feeds the secret into the HMAC chain (`C3`) and, for temp credentials, the session
  token into the signed request (`C5`).
- Verification (`S3`) is authentication, the IAM check (`M1`) is authorization — both must pass.
- A wrong region or service in the scope changes `kSigning`, so `S3` fails before IAM is reached.
