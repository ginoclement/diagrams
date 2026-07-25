---
title: "mTLS in a Service Mesh — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# mTLS in a Service Mesh — Swimlane

Zones are the control plane and two workload pods. Note that each app talks plaintext to
its **local** sidecar; only sidecar-to-sidecar traffic crosses the network, encrypted.

```mermaid
flowchart LR
    subgraph CP["Control plane"]
        CP1["Attest workloads<br/>(verify selectors)"]
        CP2["Mesh CA signs<br/>short-lived SVIDs"]
        CP3["Distribute policy +<br/>trust bundle"]
    end

    subgraph PodA["Pod A (workload + sidecar)"]
        WA["Workload A<br/>(plaintext app)"]
        PA["Sidecar A (Envoy)<br/>holds SVID A"]
    end

    subgraph PodB["Pod B (workload + sidecar)"]
        PB["Sidecar B (Envoy)<br/>holds SVID B"]
        DEC{"Authz policy on<br/>source SPIFFE ID?"}
        WB["Workload B<br/>(plaintext app)"]
        DENY(["RBAC deny (403)"])
    end

    CP1 --> CP2 --> CP3
    CP3 -->|"SDS: SVID + bundle"| PA
    CP3 -->|"SDS: SVID + bundle"| PB

    WA -->|loopback plaintext| PA
    PA -->|"mutual TLS (SVID A / SVID B)"| PB
    PB --> DEC
    DEC -->|allow| WB
    DEC -->|deny| DENY
    WB -->|loopback plaintext| PB
```
