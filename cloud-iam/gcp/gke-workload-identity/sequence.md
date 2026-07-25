# GKE Workload Identity — Sequence Diagram

Happy path first (pod obtains a GSA token via the metadata server), then alternates: missing
`workloadIdentityUser` binding, unannotated KSA, and the direct `principal://` model.

```mermaid
sequenceDiagram
    autonumber
    participant Pod as Pod (client library / ADC)
    participant Metadata as GKE Metadata Server
    participant STS as Google STS
    participant IAMCreds as IAM Credentials API
    participant GSA as Google SA
    participant API as Google API

    Pod->>Metadata: GET /computeMetadata/v1/instance/<br/>service-accounts/default/token<br/>(Metadata-Flavor: Google)
    Metadata->>Metadata: Read pod's projected KSA token<br/>from mounted volume
    Metadata->>STS: Token exchange: KSA JWT for<br/>pool PROJECT.svc.id.goog

    alt Binding present (happy path)
        STS-->>Metadata: Federated token for KSA identity
        Metadata->>IAMCreds: generateAccessToken(GSA)<br/>using federated token
        IAMCreds->>IAMCreds: KSA member has<br/>roles/iam.workloadIdentityUser on GSA?
        IAMCreds-->>Metadata: GSA access token (short-lived)
        Metadata-->>Pod: access_token + expiry
        Pod->>API: Call API with Bearer GSA token
        API-->>Pod: 200 (authorized by GSA IAM)
    else workloadIdentityUser binding missing
        IAMCreds-->>Metadata: 403 PERMISSION_DENIED
        Metadata-->>Pod: 403 - cannot fetch token
        Pod->>Pod: Client library raises auth error
    else KSA not annotated / not mapped
        Metadata-->>Pod: 404 - no service account for this KSA<br/>(no node-SA fallback under Workload Identity)
    else Direct principal:// model (no GSA)
        STS-->>Metadata: Federated token for<br/>principal://.../subject/ns/NS/sa/KSA
        Metadata-->>Pod: Token bound to principal identity
        Pod->>API: Call resource where principal:// has a role
        API-->>Pod: 200
    end
```

Notes

- The pod never sees a key; it makes an ordinary metadata request and the metadata server does
  the STS + IAM Credentials work on its behalf.
- Under Workload Identity, the node's own service account is not exposed to pods, so a missing
  mapping fails closed rather than silently using the node SA.
- The projected KSA token is audience-scoped to the fleet pool and rotated by the kubelet, so the
  credential material the metadata server exchanges is always short-lived.
