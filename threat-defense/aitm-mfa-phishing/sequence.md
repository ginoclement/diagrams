---
title: "AiTM MFA Phishing — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AiTM MFA Phishing — Sequence Diagram

The attack path (reverse-proxy relays the real login, captures the post-MFA session cookie, then
replays it), then the defenses that prevent it (origin-bound FIDO2) or defeat replay (token
binding, CAE). The **Attacker** is the reverse proxy in the middle.

```mermaid
sequenceDiagram
    autonumber
    actor Victim
    participant Proxy as Attacker (reverse proxy)
    participant IdP as IdP (real login)
    participant API
    participant CAE as Defender / CAE + risk

    Note over Victim,Proxy: Victim clicks a look-alike link to the proxy origin

    Victim->>Proxy: Open login page (proxy relays)
    Proxy->>IdP: Relay request to the real IdP
    IdP-->>Proxy: Real login page
    Proxy-->>Victim: Same page, attacker origin

    alt Phishing-resistant FIDO2 / passkey (attack prevented)
        Victim->>IdP: Passkey assertion signed over ORIGIN (via proxy)
        IdP->>IdP: Origin in assertion != expected IdP origin
        IdP-->>Victim: Reject - assertion not bound to this site
        Note over Victim,IdP: Origin binding breaks the relay, no session issued
    else Password + OTP / push (relayed)
        Victim->>Proxy: Enter password + complete MFA
        Proxy->>IdP: Relay credentials + MFA response
        IdP-->>Proxy: 200 - set session cookie / token
        Proxy->>Proxy: Capture session cookie from the relayed response
        Proxy-->>Victim: Show "signed in" (victim unaware)

        alt Token bound to client key (replay defeated)
            Proxy->>API: Replay captured cookie from attacker host
            API->>API: Proof-of-possession key absent / mismatched
            API-->>Proxy: 401 - sender-constrained token, replay rejected
        else Bearer session cookie (replayable)
            Proxy->>API: Replay cookie from attacker host
            API-->>Proxy: 200 - authenticated as victim
            opt Detection and eviction - CAE + risk
                API->>CAE: Session used from new ASN, impossible travel
                CAE->>CAE: Elevated sign-in risk on replayed session
                CAE->>IdP: Revoke session, require reauth
                IdP-->>Proxy: Session invalidated - access cut off
                CAE-->>Victim: Notify, force credential + MFA reset
            end
        end
    end
```

Notes

- The MFA challenge the victim solves is **real** — relayed through the proxy — which is why OTP
  and push do not stop AiTM; only **origin-bound** FIDO2/passkey does.
- Prevention is the first `alt` (passkey origin check); if a bearer cookie is issued, **token
  binding** makes it non-replayable and **CAE** evicts it fast on risk.
- The captured artifact is a live **session**, so the response is to **revoke the session**, not
  merely reset the password.
