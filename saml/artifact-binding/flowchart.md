---
title: "HTTP-Artifact Binding — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# HTTP-Artifact Binding — Decision Flowchart

Two decision clusters: the ARS deciding whether to release the stored message, and the
SP deciding what to do with the `ArtifactResponse`.

```mermaid
flowchart TD
    Start(["Browser hits ACS URL with SAMLart"]) --> Parse{"SAMLart parses as a<br/>valid type-0x0004 artifact?"}
    Parse -->|No| ErrParse(["Reject: malformed artifact"])
    Parse -->|Yes| Src{"SourceID matches a<br/>known, trusted IdP?"}
    Src -->|No| ErrSrc(["Reject: unknown issuer"])
    Src -->|Yes| Call["Send signed SOAP ArtifactResolve<br/>to that IdP's ARS endpoint<br/>over mutual TLS"]

    Call --> Reach{"ARS reachable and<br/>TLS + signature checks pass?"}
    Reach -->|No| ErrNet(["Fail: back channel unavailable -<br/>show retry, alert operations"])
    Reach -->|Yes| ArsAuth{"ARS: caller authenticated AND<br/>artifact issued for this SP?"}
    ArsAuth -->|No| Empty1["Return empty ArtifactResponse"]
    ArsAuth -->|Yes| Ttl{"ARS: artifact within TTL?"}
    Ttl -->|"No - expired"| Empty2["Return empty ArtifactResponse"]
    Ttl -->|Yes| Used{"ARS: already<br/>dereferenced?"}
    Used -->|"Yes - replay"| LogRep["Log replay event"] --> Empty3["Return empty ArtifactResponse"]
    Used -->|No| Release["Delete artifact, return ArtifactResponse<br/>containing original Response"]

    Empty1 --> SpEmpty
    Empty2 --> SpEmpty
    Empty3 --> SpEmpty
    SpEmpty{"SP: ArtifactResponse<br/>contains a Response?"}
    Release --> SpEmpty
    SpEmpty -->|No| ErrEmpty(["Fail: expired or replayed artifact -<br/>restart SSO with fresh AuthnRequest"])
    SpEmpty -->|Yes| Validate{"Response + Assertion valid?<br/>signature, Audience, Conditions,<br/>InResponseTo"}
    Validate -->|No| ErrAssert(["Reject: invalid assertion"])
    Validate -->|Yes| Sess["Create SP session"] --> Done(["Redirect to RelayState target"])
```

Notes

- The ARS answers every unauthorized, expired, or replayed request the same way — an
  empty `ArtifactResponse` — so probing callers learn nothing.
- The SP treats an empty response as a soft failure (restart SSO), but a *replay
  detected at the ARS* is IdP-side signal worth alerting on: someone re-used a
  `SAMLart` URL.
- Back-channel unreachability is an operational failure mode unique to this binding;
  monitor it separately from assertion-validation errors.
