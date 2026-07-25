---
title: "Mutual TLS Bootstrap — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Mutual TLS Bootstrap — Decision Flowchart

Every gate from keypair generation through attestation and authorization to a usable mTLS
certificate, with error terminals drawn explicitly.

```mermaid
flowchart TD
    Start(["Workload starts, no cert"]) --> Key["Generate keypair,<br/>private key stays local"]
    Key --> Have{"Attestation evidence<br/>available?"}
    Have -->|No| ErrNoEv(["Cannot bootstrap:<br/>no evidence to present"])
    Have -->|Yes| CSR["Submit CSR (public key)<br/>+ evidence to CA"]

    CSR --> Fresh{"Evidence fresh<br/>+ not replayed?"}
    Fresh -->|No| ErrReplay(["Deny: stale / replayed evidence"])
    Fresh -->|Yes| Sig{"Evidence signature<br/>+ principal verified?"}
    Sig -->|No| ErrSig(["Deny: attestation failed"])
    Sig -->|Yes| Authz{"Requested identity<br/>authorized for principal?"}
    Authz -->|No| ErrAuthz(["Deny: identity not permitted"])
    Authz -->|Yes| Sign["CA signs short-lived leaf"]

    Sign --> Deliver["Deliver leaf cert + trust bundle"]
    Deliver --> Hand{"mTLS handshake:<br/>peer cert valid?"}
    Hand -->|No| ErrPeer(["Abort: peer not trusted"])
    Hand -->|Yes| Chan(["Mutually authenticated channel"])

    Chan --> Rot{"Near expiry?"}
    Rot -->|Yes, evidence still valid| CSR
    Rot -->|Yes, evidence expired| Have
    Rot -->|No| Chan
```

Notes

- Two independent gates protect issuance: attestation (`Fresh` + `Sig`) proves *which*
  principal is asking, authorization (`Authz`) decides *which* identity it may hold.
- Rotation loops back to the CSR when only the certificate is aging, or all the way back to
  re-attestation when the evidence itself has expired.
- The handshake gate is mutual: the workload also validates the peer against the returned
  trust bundle, so a valid leaf is necessary but not sufficient to talk to an untrusted peer.

Related: [README](./README.md) | [Sequence](./sequence.md) | [Swimlane](./swimlane.md)
