---
title: "Zero Trust Architecture — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Zero Trust Architecture — Sequence Diagram

A resource request evaluated by the PDP: the PEP intercepts, the Policy Engine gathers
identity/device/risk signals and decides, the Policy Administrator establishes a scoped
session, and the connection is continuously re-verified. `alt`/`opt` cover denial and
mid-session revocation.

```mermaid
sequenceDiagram
    autonumber
    actor Subject
    participant Dev as Device / Endpoint
    participant PEP as Policy Enforcement Point
    participant PE as Policy Engine (PDP)
    participant PA as Policy Administrator (PDP)
    participant IdP as Identity / IdP
    participant Posture as Device Posture / EDR
    participant Risk as Threat / Risk Signals
    participant Res as Resource

    Subject->>Dev: Attempt to reach a protected resource
    Dev->>PEP: Request (no implicit trust by location)
    PEP->>PE: Authorization query (subject, device, resource, context)

    PE->>IdP: Verify identity + authentication assurance
    IdP-->>PE: Authenticated subject + claims (MFA level)
    PE->>Posture: Query device compliance / health
    Posture-->>PE: Posture report (managed, patched, encrypted)
    PE->>Risk: Query risk / threat signals
    Risk-->>PE: Risk score (geo, behavior, threat intel)

    PE->>PE: Evaluate policy against combined signals

    alt Access permitted
        PE-->>PA: Decision = allow (scoped, short TTL)
        PA->>PEP: Establish session, issue session credential
        PEP->>Res: Forward request on the authorized path
        Res-->>PEP: Resource response
        PEP-->>Dev: Deliver response
        Dev-->>Subject: Access granted

        loop Continuous verification (each request / interval)
            PEP->>PE: Re-evaluate with fresh signals
            opt Signal changed (posture fails or risk spikes)
                PE-->>PA: Revoke decision
                PA->>PEP: Terminate session
                PEP-->>Dev: Session ended, re-authenticate
            end
        end
    else Access denied
        PE-->>PA: Decision = deny
        PA->>PEP: Do not establish session
        PEP-->>Dev: 403 access denied
    end
```

Notes

- The PEP holds no policy of its own, steps 3 and every re-evaluation defer to the PDP, so
  the data plane cannot self-authorize.
- Identity, posture, and risk are gathered per decision, steps 4-9, a valid login alone is
  never sufficient.
- Continuous verification is the defining loop, a device that drops out of compliance is
  cut off on the next evaluation rather than at the next login.
- Access is granted to one resource for one short-lived session, there is no network
  segment handed over and no lateral movement implied.
