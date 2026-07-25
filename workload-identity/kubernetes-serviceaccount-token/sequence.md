# Kubernetes ServiceAccount Token — Sequence Diagram

Happy path first: the kubelet projects a bound token, the pod uses it in-cluster, then
exchanges an audience-scoped token at an external STS. Alternates: audience mismatch,
refresh on expiry, and the legacy Secret token.

```mermaid
sequenceDiagram
    autonumber
    participant Pod as Pod
    participant Kubelet as Kubelet
    participant Api as API Server
    participant Ext as External Verifier

    Note over Kubelet,Api: Projection (bound, audience-scoped, time-bound)
    Kubelet->>Api: TokenRequest (aud, expirationSeconds,<br/>bound to pod uid)
    Api->>Api: Sign JWT with SA signing key<br/>iss, sub=system:serviceaccount:ns:name, aud, exp
    Api-->>Kubelet: Projected token
    Kubelet->>Pod: Mount token into projected volume

    Note over Pod,Api: In-cluster use (aud = api server)
    Pod->>Api: Call kube-apiserver with Bearer token
    Api->>Api: Verify signature, aud, exp, bound pod uid
    Api-->>Pod: 200 authorized

    Note over Pod,Ext: External exchange (aud = target cloud)
    Pod->>Kubelet: Read token with aud=sts.amazonaws.com
    Pod->>Ext: Present token<br/>(AssumeRoleWithWebIdentity / WIF / federated cred)
    Ext->>Api: Fetch JWKS from /openid/v1/jwks
    Api-->>Ext: Signing keys
    Ext->>Ext: Verify signature, iss, aud, exp,<br/>sub condition (ns + serviceaccount)
    Ext-->>Pod: Short-lived cloud credentials

    alt Audience mismatch
        Pod->>Ext: Present token with aud=api-server
        Ext-->>Pod: Denied: aud does not match expected audience
    else Token near expiry
        Kubelet->>Api: TokenRequest refresh at ~80% TTL
        Api-->>Kubelet: New token
        Kubelet->>Pod: Replace mounted token (silent)
    else Legacy auto-mounted Secret token (discouraged)
        Note over Pod,Api: Non-expiring, no audience, stored in etcd.<br/>Prefer bound projected tokens.
        Pod->>Api: Call with long-lived Secret token
        Api-->>Pod: 200 (valid but higher risk)
    end
```

Notes

- Binding the token to the pod uid means it stops validating once the pod terminates, unlike the legacy Secret token which stayed valid indefinitely.
- The same JWT is usable in-cluster or externally only when its `aud` matches the verifier; a token is minted per audience rather than reused across trust boundaries.
- External verifiers validate offline against the published JWKS, so no call back into the cluster's auth path is needed beyond fetching keys.
```
```
</content>
