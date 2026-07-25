---
title: "Kubernetes Projected ServiceAccount Token — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Kubernetes Projected ServiceAccount Token — Sequence Diagram

Happy path first: the kubelet mints a projected token via TokenRequest, the workload reads
it and exchanges it with an external system. Alternates: Vault exchange, refresh near expiry,
and rejection paths.

```mermaid
sequenceDiagram
    autonumber
    participant WL as Workload / Pod
    participant Kub as Kubelet
    participant API as kube-apiserver
    participant Ext as External system

    Note over Kub,API: Pod scheduled with a projected serviceAccountToken volume
    Kub->>API: TokenRequest for SA<br/>(aud=sts, expirationSeconds=3600, bound to Pod)
    API->>API: Sign JWT (RS256),<br/>sub=system:serviceaccount:ns:sa
    API-->>Kub: Signed OIDC token
    Kub->>WL: Project token into mounted file

    WL->>WL: Read token from projected volume path
    alt Cloud STS exchange
        WL->>Ext: AssumeRoleWithWebIdentity(token, role ARN)
        Ext->>API: Fetch OIDC discovery + JWKS
        API-->>Ext: issuer metadata, signing keys
        Ext->>Ext: Verify iss, aud, sig, exp,<br/>map sub to role
        Ext-->>WL: Short-lived cloud credentials
        WL->>Ext: Call cloud API with credentials
    else Vault / SaaS exchange
        WL->>Ext: Login with SA token (role=app)
        Ext->>API: TokenReview or JWKS verify
        API-->>Ext: token valid, claims
        Ext-->>WL: Short-lived Vault token / access token
    end

    opt Token near expiry
        Kub->>API: TokenRequest (refresh at ~80% TTL)
        API-->>Kub: New signed token
        Kub->>WL: Rewrite projected file, no restart
    end

    opt Rejection paths
        WL->>Ext: Present token
        Ext->>Ext: Wrong aud, expired, untrusted iss,<br/>or sub not mapped
        Ext-->>WL: Denied - no credential issued
    end
```

Notes

- The bound-object reference ties the token to the Pod, so the token is invalidated when the
  Pod is deleted even before `exp`.
- The external system verifies the token **offline** against JWKS in the common case, no
  callback into the cluster is required, only the initial discovery fetch is.
- The kubelet, not the workload, owns refresh: the app simply re-reads the file, it never
  calls TokenRequest itself.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
