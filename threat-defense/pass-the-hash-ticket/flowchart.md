---
title: "Pass-the-Hash / Pass-the-Ticket — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Pass-the-Hash / Pass-the-Ticket — Decision Flowchart

Where theft prevention, admin tiering, and replay detection force **deny**/**detect**
terminals. Valid credential material always authenticates — so defense is prevent-theft,
contain-reuse, detect-movement.

```mermaid
flowchart TD
    Start(["Attacker has admin on<br/>one compromised host"]) --> CgQ{"Credential Guard +<br/>LSASS protected (PPL)?"}
    CgQ -->|Yes| Deny1(["DENY: secrets isolated,<br/>nothing to steal"])
    CgQ -->|No| Steal["Extract NT hash and/or<br/>Kerberos ticket from memory"]

    Steal --> ModeQ{"Replay method?"}
    ModeQ -->|"NTLM hash (PtH)"| Nt["Authenticate to target via NTLM"]
    ModeQ -->|"Kerberos ticket (PtT)"| Kt["Inject + replay ticket to service"]

    Nt --> DetQ{"SIEM: NTLM from unusual host /<br/>priv account to many systems?"}
    Kt --> DetQ2{"SIEM: ticket used on host that<br/>never did AS/TGS exchange?"}

    DetQ -->|Yes| Detect1(["DETECT: lateral movement<br/>isolate, reset creds, rotate LAPS"])
    DetQ2 -->|Yes| Detect1
    DetQ -->|No| TierQ
    DetQ2 -->|No| TierQ

    TierQ{"Do stolen creds reach<br/>Tier-0 / other hosts?"}
    TierQ -->|"No - tiering + LAPS"| Contain(["CONTAINED: local/low-tier only,<br/>limited blast radius"])
    TierQ -->|Yes| Spread(["COMPROMISE: lateral movement<br/>succeeds - reduce cached creds,<br/>segment network"])
```

Notes

- **`CgQ` is the decisive prevention:** Credential Guard plus LSASS PPL removes the ability to
  read hashes/tickets, so PtH/PtT never begin on that host.
- The two `DetQ` branches are the practical detections — NTLM logon anomalies (PtH) and
  tickets appearing without a preceding AS/TGS exchange (PtT).
- **`TierQ`** shows why **tiering + LAPS** matter even after a successful replay: unique local
  passwords and never logging privileged accounts onto low-tier hosts bound the spread.
