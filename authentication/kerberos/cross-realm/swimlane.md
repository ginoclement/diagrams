---
title: "Cross-Realm Authentication — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cross-Realm Authentication — Swimlane Diagram

One lane per actor. The client carries every message: each arrow that leaves the
Client lane is a separate TGS exchange against a different realm's KDC.

```mermaid
flowchart TD
    subgraph User
        U1["Open resource hosted in REALM-B"]
        U2(["Access granted"])
    end

    subgraph Client
        C1["Hold home TGT krbtgt/REALM-A@REALM-A"]
        C2["TGS-REQ to KDC-A for the foreign SPN"]
        C3["Cache referral TGT krbtgt/REALM-ROOT@REALM-A"]
        C4["TGS-REQ to KDC-Root with the referral TGT"]
        C5["Cache referral TGT krbtgt/REALM-B@REALM-ROOT"]
        C6["TGS-REQ to KDC-B with the referral TGT"]
        C7["Cache service ticket, build authenticator"]
        C8["AP-REQ to the service"]
    end

    subgraph KDCA["KDC-A"]
        A1["SPN is not local - resolve trust path"]
        A2{"Trust path to<br/>REALM-B exists?"}
        A3["Issue referral TGT for the next realm,<br/>encrypted with the A-to-ROOT trust key"]
        A4(["KDC_ERR_PATH_NOT_ACCEPTED"])
    end

    subgraph KDCR["KDC-Root"]
        R1["Decrypt referral TGT with inter-realm key,<br/>verify PAC signatures"]
        R2["Append REALM-A to the transited field"]
        R3["Issue referral TGT krbtgt/REALM-B@REALM-ROOT"]
    end

    subgraph KDCB["KDC-B"]
        B1["Validate transited realms,<br/>set transited-policy-checked"]
        B2["Apply SID filtering, re-sign the PAC<br/>with the local krbtgt key"]
        B3{"Selective authentication:<br/>allowed to authenticate<br/>on this resource?"}
        B4["Issue service ticket encrypted with<br/>the service account long-term key"]
        B5(["KDC_ERR_POLICY - authentication firewall"])
    end

    subgraph Service
        S1["Decrypt ticket with own key,<br/>validate authenticator and replay cache"]
        S2["Read PAC groups for authorization"]
        S3["AP-REP mutual authentication"]
    end

    U1 --> C1 --> C2 --> A1 --> A2
    A2 -->|No| A4
    A2 -->|Yes| A3 --> C3 --> C4 --> R1 --> R2 --> R3 --> C5 --> C6 --> B1 --> B2 --> B3
    B3 -->|No| B5
    B3 -->|Yes| B4 --> C7 --> C8 --> S1 --> S2 --> S3 --> U2
```

Notes

- The `KDC-Root` lane exists only because the trust is **transitive**. A direct
  two-way trust between `REALM-A` and `REALM-B` collapses that lane and leaves a
  single referral.
- Each referral TGT is encrypted with the **inter-realm trust key** of that hop,
  so only the next KDC in the chain can read it — the client treats it as opaque.
- SID filtering (lane `KDC-B`, step `B2`) is what keeps a compromised trusted
  realm from asserting privileged SIDs in the resource realm.
- Deny terminals are drawn in the lane of the KDC that makes the decision; the
  full decision tree is in [flowchart.md](./flowchart.md).
