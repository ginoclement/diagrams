---
title: "Kubernetes Projected ServiceAccount Token — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Kubernetes Projected ServiceAccount Token — Decision Flowchart

Every gate from token request through external validation, with error terminals drawn
explicitly.

```mermaid
flowchart TD
    Start(["Pod needs external credential"]) --> Vol{"Projected token<br/>volume configured?"}
    Vol -->|No| Legacy["Legacy Secret token mounted<br/>(long-lived, discouraged)"]
    Legacy --> LegacyEnd(["Works, but not audience-bound<br/>- migrate to projected"])
    Vol -->|Yes| Req["Kubelet calls TokenRequest<br/>(aud, exp, bound to Pod)"]

    Req --> Mint["API signs OIDC JWT<br/>sub=system:serviceaccount:ns:sa"]
    Mint --> Read["Workload reads token from file"]
    Read --> Present["Present token to external system"]

    Present --> Iss{"Issuer trusted?<br/>(discovery + JWKS reachable)"}
    Iss -->|No| ErrIss(["Deny: untrusted / unreachable issuer"])
    Iss -->|Yes| Sig{"Signature + exp valid?"}
    Sig -->|No| ErrSig(["Deny: bad signature or expired"])
    Sig -->|Yes| Aud{"Audience matches<br/>relying party?"}
    Aud -->|No| ErrAud(["Deny: wrong audience"])
    Aud -->|Yes| Map{"Subject mapped to<br/>a role / policy?"}
    Map -->|No| ErrMap(["Deny: subject not authorized"])
    Map -->|Yes| Cred(["Issue short-lived credential"])

    Cred --> Use(["Workload calls external API"])
    Use --> Exp{"Token near expiry?"}
    Exp -->|Yes| Req
    Exp -->|No| Use
```

Notes

- The audience gate (`Aud`) is the core protection of the projected model: a token minted for
  the cloud STS cannot be replayed against a different relying party.
- Expiry loops back to TokenRequest via the kubelet, so credentials stay continuously fresh
  with no human and no stored secret.
- The `Legacy` branch is kept only to contrast: a long-lived Secret token skips the audience
  and expiry gates entirely, which is exactly why projected tokens replace it.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
