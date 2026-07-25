---
title: "Workload Identity Federation — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Workload Identity Federation — Decision Flowchart

Provider validation, attribute mapping, and the federate-then-impersonate decision. Rejections
terminate explicitly.

```mermaid
flowchart TD
    Start(["External workload holds an IdP credential"]) --> Kind{"Subject token<br/>type?"}
    Kind -->|"OIDC JWT"| Iss{"Issuer + audience<br/>match the provider?"}
    Kind -->|"AWS GetCallerIdentity"| AwsSig{"AWS signature<br/>valid?"}
    Kind -->|"SAML assertion"| SamlSig{"SAML signature +<br/>audience valid?"}

    Iss -->|No| E1(["STS 400: unauthorized issuer/audience"])
    AwsSig -->|No| E1
    SamlSig -->|No| E1
    Iss -->|Yes| Sig{"JWT signature<br/>verifies via JWKS?"}
    Sig -->|No| E1
    Sig -->|Yes| Cond
    AwsSig -->|Yes| Cond
    SamlSig -->|Yes| Cond

    Cond{"attribute_condition<br/>CEL true?"} -->|No| E2(["STS 403: token rejected by condition"])
    Cond -->|Yes| Map["Map claims to attributes,<br/>build principalSet:// identity"]
    Map --> Fed["Issue short-lived federated access token"]

    Fed --> Path{"Impersonate a<br/>service account?"}
    Path -->|"Yes - common"| TC{"principalSet has<br/>Token Creator on SA?"}
    Path -->|"No - direct"| Direct{"principalSet granted<br/>a role on the resource?"}

    TC -->|No| E3(["403: cannot impersonate SA"])
    TC -->|Yes| OK1(["Target SA token -> call APIs"])
    Direct -->|No| E4(["403: no binding for principalSet"])
    Direct -->|Yes| OK2(["Federated token calls resource directly"])
```

Notes

- All three subject-token types converge on the same `attribute_condition` gate; the condition is
  the primary defense that stops an over-broad issuer from federating arbitrary workloads.
- The `principalSet://` identity produced by attribute mapping is what IAM bindings reference, both
  for Token Creator (impersonation) and for direct resource grants.
- Every success terminal yields only short-lived credentials — no key material persists.
