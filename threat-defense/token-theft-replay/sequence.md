# Token Theft & Replay — Sequence Diagram

The attack path (replaying a stolen access token, then a stolen refresh token from another host),
then the defenses that prevent replay (DPoP/mTLS binding) or contain it (rotation + reuse
detection, CAE). The **Attacker** presents tokens it never was issued.

```mermaid
sequenceDiagram
    autonumber
    actor Atk as Attacker
    actor Victim
    participant API
    participant IdP as IdP (authorization server)
    participant CAE as Defender / CAE + reuse detection

    Note over Atk,Victim: Attacker obtained victim's tokens (infostealer, log,<br/>memory dump, or AiTM) - no password needed

    Atk->>API: Replay stolen access_token from attacker host

    alt Token sender-constrained (DPoP / mTLS) - replay prevented
        API->>API: Require proof-of-possession (DPoP sig / client cert)
        API-->>Atk: 401 - PoP key absent / mismatch, replay rejected
        Note over Atk,API: Bound token is useless off the victim's host
    else Bearer access_token (replayable until expiry)
        API-->>Atk: 200 - data returned as victim
        opt Continuous access evaluation
            API->>CAE: Call from new ASN / impossible travel
            CAE->>IdP: Revoke session, invalidate access_token
            IdP-->>API: Token no longer valid mid-lifetime
        end
    end

    Note over Atk,IdP: Access token expires - attacker tries the stolen refresh token

    Atk->>IdP: POST /token grant_type=refresh_token (stolen)
    alt Rotation + reuse detection - theft contained
        IdP->>IdP: This refresh token was already rotated / used
        IdP->>CAE: Reuse detected - possible token theft
        CAE->>IdP: Revoke entire token family
        IdP-->>Atk: 400 invalid_grant - family revoked
        CAE-->>Victim: Notify, force reauthentication
    else No rotation (long-lived refresh token)
        IdP-->>Atk: New access_token issued - persistence achieved
        Note over IdP,Atk: Without rotation, theft is hard to detect<br/>- prefer rotation + reuse detection
    end
```

Notes

- The victim is passive during replay — the attacker simply presents tokens — so detection relies
  on **binding failures**, **reuse detection**, and **network/risk signals**, not on a login event.
- Prevention is **sender-constraining** the token (DPoP/mTLS); containment is **refresh-token
  rotation with reuse detection** revoking the family, plus **CAE** evicting the access token.
- Revocation targets the **token family / session**, since no password was involved.
