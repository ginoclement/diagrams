---
title: "Device Code Phishing — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8628"
---

# Device Code Phishing — Sequence Diagram

The attack path (attacker initiates the device flow, lures the victim to enter the code at the
real IdP), then the defenses that block it (conditional access) or shrink and expose it (short
code lifetime, approval context). The **Attacker** is the polling client that collects the tokens.

```mermaid
sequenceDiagram
    autonumber
    actor Atk as Attacker
    actor Victim
    participant IdP as IdP (authorization server)
    participant API
    participant CA as Defender / Conditional access

    Note over Atk,IdP: Attacker starts the device flow on their OWN device

    Atk->>IdP: POST /devicecode (client_id, scope)
    IdP-->>Atk: device_code, user_code, verification_uri, expires_in
    Atk->>Victim: Phishing lure - "enter this code at the real IdP page<br/>to finish IT device enrollment"
    loop Attacker polls until approval or expiry
        Atk->>IdP: POST /token (device_code) - grant_type device_code
        IdP-->>Atk: authorization_pending
    end

    Victim->>IdP: Open real verification_uri, enter user_code

    alt user_code already expired (window closed)
        IdP-->>Victim: Code expired - restart on your device
        IdP-->>Atk: expired_token - poll fails
        Note over Atk,IdP: Short lifetime forces re-initiation, more signal
    else Victim authenticates and reaches approval
        Victim->>IdP: Authenticate (+ MFA)
        IdP->>Victim: Approval screen - app, origin, "did you start this?"
        alt Victim cancels (approval context understood)
            Victim-->>IdP: Cancel - I did not start this
            IdP-->>Atk: authorization_declined - no tokens
            IdP->>CA: Log declined device-grant attempt
        else Victim approves
            Victim->>IdP: Approve
            IdP->>CA: Evaluate conditional access on the polling client
            alt CA denies (untrusted device / network)
                CA-->>IdP: Block - device grant not allowed here
                IdP-->>Atk: Token request denied
                Note over CA,Atk: Approval happened, but attacker's client<br/>cannot obtain a token off-policy
            else CA allows
                IdP-->>Atk: access_token + refresh_token to attacker client
                Atk->>API: Access data with stolen tokens
                API-->>Atk: Data returned
                opt Detection - location mismatch
                    CA->>CA: Approval location != token-use location = alert
                    CA->>IdP: Revoke tokens, require reauth, notify user
                end
            end
        end
    end
```

Notes

- The victim only ever touches the **real** IdP, so fake-page and URL-reputation defenses do not
  apply — the tokens go to the attacker's pre-started polling client.
- Prevention is **conditional access** on the device grant and **short code lifetimes**;
  detection is **location/context mismatch** between approval and later token use.
- MFA is completed by the victim, so MFA alone does not stop this; a phishing-resistant approval
  context and policy restriction do.
