# IRSA on EKS — Sequence Diagram

Happy path first (pod assumes its role via a projected OIDC token), then token rotation,
trust-policy mismatch, and the EKS Pod Identity alternative.

```mermaid
sequenceDiagram
    autonumber
    participant Pod as Pod (AWS SDK)
    participant Kubelet
    participant Webhook as Pod Identity Webhook
    participant STS as AWS STS
    participant OIDC as EKS OIDC Provider

    Note over Webhook,Pod: At admission, the webhook saw the SA annotation<br/>eks.amazonaws.com/role-arn and injected env +<br/>a projected serviceAccountToken volume
    Webhook-->>Pod: Inject AWS_ROLE_ARN, AWS_WEB_IDENTITY_TOKEN_FILE
    Kubelet->>Pod: Project SA token (aud=sts.amazonaws.com), mount to file

    Pod->>Pod: SDK reads token file + AWS_ROLE_ARN
    Pod->>STS: AssumeRoleWithWebIdentity(RoleArn, WebIdentityToken=JWT)
    STS->>OIDC: Fetch JWKS from the EKS issuer, verify JWT signature
    OIDC-->>STS: Public keys
    STS->>STS: Check trust policy conditions<br/>aud == sts.amazonaws.com,<br/>sub == system:serviceaccount:ns:sa
    STS-->>Pod: Temporary credentials (AccessKeyId, SecretAccessKey, SessionToken)
    Pod->>STS: Call AWS APIs with temporary credentials
    STS-->>Pod: 200 authorized by the role's permission policy

    opt Token rotation
        Kubelet->>Pod: Refresh projected token before expiry
        Pod->>Pod: SDK re-reads token file on next AssumeRole
    end

    alt Trust policy mismatch
        Pod->>STS: AssumeRoleWithWebIdentity with unexpected sub or aud
        STS-->>Pod: AccessDenied (Not authorized to perform sts:AssumeRoleWithWebIdentity)
    end

    alt EKS Pod Identity (alternative, no OIDC provider)
        Note over Pod,STS: The Pod Identity Agent on the node calls STS with the<br/>pod identity association, returning credentials via the<br/>agent instead of AssumeRoleWithWebIdentity.
    end
```

Notes

- The projected token is a short-lived, audience-bound JWT signed by the cluster's OIDC issuer;
  the SDK re-reads it from `AWS_WEB_IDENTITY_TOKEN_FILE` on each assume.
- No static access keys exist anywhere in this flow.
