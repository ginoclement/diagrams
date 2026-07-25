# Golden SAML — Sequence Diagram

The attack path (forging a SAML assertion with a stolen signing key), then the defenses
that prevent it (HSM-held key) or detect it (log correlation, short lifetimes). The
**Attacker** is the participant that never authenticates at the IdP.

```mermaid
sequenceDiagram
    autonumber
    actor Atk as Attacker
    participant IdP as IdP (federation server)
    participant SP as SP (relying party)
    participant SIEM as Defender / SIEM

    Note over Atk,IdP: Precondition - attacker already compromised the<br/>federation server or key store (post-exploitation)

    Atk->>IdP: Attempt to export token-signing private key
    alt Signing key protected by HSM (attack prevented)
        IdP-->>Atk: Key is non-exportable - export denied
        Note over Atk,IdP: No key means no forgery - Golden SAML never starts
    else Soft key store - key exportable
        IdP-->>Atk: Private key + certificate obtained
        Atk->>Atk: Build assertion for a chosen user<br/>with elevated groups, then sign with stolen key
        Atk->>SP: Submit forged SAMLResponse to ACS URL<br/>(no IdP login ever occurred)
        SP->>SP: Validate signature vs trusted IdP cert - passes
        SP->>SP: Check Conditions, Audience, NotOnOrAfter

        alt Assertion within short lifetime and well-formed
            SP-->>Atk: Session created - attacker impersonates victim
            opt Detection - correlate SP session with IdP auth
                SIEM->>SP: Ingest SP successful-login event
                SIEM->>IdP: Query for matching IdP authentication event
                IdP-->>SIEM: No sign-in event for this user at this time
                SIEM->>SIEM: SP success with no IdP auth = golden-assertion alert
                SIEM-->>SP: Trigger response - revoke session, isolate host
            end
        else Assertion stale (short lifetime enforced)
            SP-->>Atk: Reject - NotOnOrAfter expired
            Note over SP: Short lifetimes force re-forging,<br/>producing more detectable signal
        end
    end

    opt Post-incident containment
        SIEM->>IdP: Rotate token-signing key twice, re-issue metadata
        Note over IdP,SP: Old forged assertions no longer verify;<br/>SP trust re-anchored to new certificate
    end
```

Notes

- The defining property of Golden SAML: **step "IdP login" is absent**. The SP sees a valid
  signature and trusts it; only cross-log correlation exposes the missing authentication.
- HSM protection (the first `alt` branch) is prevention; SIEM correlation and short
  lifetimes are detection/containment.
- Key rotation done **twice** flushes any platform "previous key" slot the attacker's key
  might still occupy.
