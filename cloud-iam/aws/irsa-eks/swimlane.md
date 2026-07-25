---
title: "IRSA on EKS — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IRSA on EKS — Swimlane Diagram

One lane per actor. The projected token crosses from the cluster into AWS STS.

```mermaid
flowchart TD
    subgraph Cluster
        A1["ServiceAccount annotated<br/>with role-arn"]
        A2["Webhook injects env +<br/>projected token volume"]
        A3["Kubelet projects token<br/>aud=sts.amazonaws.com"]
    end

    subgraph Pod
        P1["SDK reads AWS_ROLE_ARN +<br/>token file"]
        P2["Call AssumeRoleWithWebIdentity"]
        P3["Use temporary credentials<br/>for AWS API calls"]
    end

    subgraph AWS_STS["AWS STS"]
        S1["Verify JWT via EKS JWKS"]
        S2{"Trust policy:<br/>aud and sub match?"}
        S3["Issue temporary credentials"]
        S4(["AccessDenied"])
    end

    A1 --> A2 --> A3 --> P1 --> P2 --> S1 --> S2
    S2 -->|Yes| S3 --> P3
    S2 -->|No| S4
```

Notes

- The trust-policy check `S2` is the security boundary: it must pin the exact
  `system:serviceaccount:<ns>:<sa>` subject, not just the audience.
