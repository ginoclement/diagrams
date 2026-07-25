# IRSA on EKS — Decision Flowchart

Every gate between a pod and temporary AWS credentials, with explicit denial terminals.

```mermaid
flowchart TD
    Start(["Pod needs AWS credentials"]) --> Assoc{"Cluster has an IAM<br/>OIDC provider?"}
    Assoc -->|No| ErrAssoc(["Associate IAM OIDC provider first"])
    Assoc -->|Yes| Ann{"ServiceAccount annotated<br/>with role-arn?"}
    Ann -->|No| ErrAnn(["No role injected: SDK finds no credentials"])
    Ann -->|Yes| Inj["Webhook injected env +<br/>projected token file"]

    Inj --> Assume["SDK calls AssumeRoleWithWebIdentity<br/>with the projected JWT"]
    Assume --> Sig{"JWT signature valid<br/>against EKS JWKS?"}
    Sig -->|No| ErrSig(["AccessDenied: invalid token"])
    Sig -->|Yes| Aud{"aud == sts.amazonaws.com?"}
    Aud -->|No| ErrAud(["AccessDenied: wrong audience"])
    Aud -->|Yes| Sub{"sub == expected<br/>system:serviceaccount:ns:sa?"}
    Sub -->|No| ErrSub(["AccessDenied: subject not trusted"])
    Sub -->|Yes| Creds["STS returns temporary credentials"]
    Creds --> Perm{"Role permission policy<br/>allows the API call?"}
    Perm -->|No| ErrPerm(["AccessDenied by permission policy"])
    Perm -->|Yes| Done(["AWS API call authorized"])
```

Notes

- Pinning only `aud` and not `sub` is the classic IRSA misconfiguration: it lets any
  ServiceAccount in the cluster assume the role.
- The permission-policy gate is separate from trust: trust decides *who* may assume the role,
  the permission policy decides *what* the role can do.
