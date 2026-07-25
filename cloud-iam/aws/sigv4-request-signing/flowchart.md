# SigV4 Request Signing — Decision Flowchart

The signing pipeline and every verification gate the service applies, with explicit error
terminals.

```mermaid
flowchart TD
    Start(["Client prepares AWS API request"]) --> Temp{"Using temporary<br/>STS credentials?"}
    Temp -->|Yes| Tok["Add X-Amz-Security-Token<br/>to signed headers"] --> Canon
    Temp -->|No| Canon["Build canonical request<br/>(hash payload, sort headers/query)"]

    Canon --> Sts["Build string to sign<br/>(algorithm, X-Amz-Date, scope, canonical hash)"]
    Sts --> Key["Derive kSigning:<br/>kDate to kRegion to kService to kSigning"]
    Key --> Sig["signature = hex HMAC(kSigning, stringToSign)"]

    Sig --> Mode{"Presigned URL<br/>requested?"}
    Mode -->|Yes| Pre["Put signature + X-Amz-Expires in query string"] --> Send
    Mode -->|No| Auth["Put signature in Authorization header"] --> Send

    Send["Send request to service"] --> Skew{"X-Amz-Date within<br/>5 min of server clock?"}
    Skew -->|No| ErrSkew(["403 RequestTimeTooSkewed"])
    Skew -->|Yes| Rebuild["Service rebuilds canonical request<br/>and recomputes signature"]

    Rebuild --> Match{"Recomputed signature<br/>equals sent signature?"}
    Match -->|No| ErrSig(["403 SignatureDoesNotMatch"])
    Match -->|Yes| Expired{"Presigned URL<br/>past X-Amz-Expires?"}
    Expired -->|Yes| ErrExp(["403 AccessDenied: expired"])
    Expired -->|No| Authz{"IAM allows the<br/>requested action?"}
    Authz -->|No| ErrAuthz(["403 AccessDenied"])
    Authz -->|Yes| Ok(["200 result"])
```

Notes

- A mismatch at `Match` most often means bad canonicalization (unsorted headers, unencoded path)
  or the wrong region/service in the scope.
- Skew (`Skew`) is checked before signature comparison, so a correct signature on a stale clock
  still fails.
- For presigned URLs, `X-Amz-Expires` is the only time bound — there is no separate revocation.
