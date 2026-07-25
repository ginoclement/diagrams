---
title: "Active Directory Interactive Logon — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Active Directory Interactive Logon — Swimlane Diagram

One lane per actor. The Negotiate SSP in the Client lane decides Kerberos vs NTLM.

```mermaid
flowchart TD
    subgraph User
        U1["Ctrl+Alt+Del, enter credentials"]
        U2(["Desktop / session loads"])
    end

    subgraph Client["Client (Winlogon / LSASS)"]
        C1["Derive key, Negotiate SSP picks mechanism"]
        C2{"Kerberos possible?<br/>(SPN + KDC reachable +<br/>hostname, not IP)"}
        C3["Kerberos: AS-REQ then TGS-REQ"]
        C4["NTLM: NEGOTIATE / respond to CHALLENGE"]
        C5["Build access token from PAC / SIDs"]
        C6["No DC: cached MSCACHE verifier"]
    end

    subgraph KDC["KDC (Domain Controller)"]
        K1["AS: issue TGT"]
        K2["TGS: issue service ticket"]
        K3["NTLM: send CHALLENGE, verify via Netlogon"]
    end

    subgraph Directory["Directory (AD)"]
        D1["Look up account, keys, policy, group SIDs"]
    end

    U1 --> C1 --> C2
    C2 -->|"yes - Kerberos preferred"| C3
    C3 --> K1
    K1 --> D1
    D1 --> K1
    K1 --> K2
    K2 --> C5
    C2 -->|"no - fall back to NTLM (Legacy)"| C4
    C4 --> K3
    K3 --> D1
    D1 --> K3
    K3 --> C5
    C2 -->|"no DC reachable"| C6
    C6 --> C5
    C5 --> U2
```

Notes

- The `C2` decision is the whole story: Kerberos is preferred and used whenever a target SPN
  and a reachable KDC (by hostname) exist; otherwise the Client falls back to NTLM (Legacy) or,
  with no DC at all, to a cached verifier.
- Both Kerberos and NTLM ultimately read group SIDs from the Directory; the token the Client
  builds is the same shape regardless of mechanism.
- Error branches (bad password, skew, lockout) exit from the KDC lane as KRB-ERROR / NTLM
  failure — see [flowchart.md](flowchart.md).
