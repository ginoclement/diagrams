# Kerberoasting — Sequence Diagram

The attack path (request SPN tickets, crack offline), then the defenses: gMSA/strong
passwords make cracking infeasible, AES-only slows it, and 4769 monitoring / honeytokens
detect the request pattern. The **Attacker** is a low-privileged but authenticated user.

```mermaid
sequenceDiagram
    autonumber
    actor Atk as Attacker (low-priv user)
    participant TGS as KDC / TGS
    participant Dir as Directory (AD)
    participant Crack as Offline cracking rig
    participant SIEM as Defender / SIEM

    Note over Atk,TGS: Precondition - attacker holds a valid TGT<br/>(any authenticated domain account)

    Atk->>Dir: LDAP query - enumerate accounts with an SPN
    Dir-->>Atk: List of SPNs (service accounts)
    Atk->>TGS: TGS-REQ for target SPN<br/>(request RC4 etype if allowed)
    TGS->>Dir: Look up SPN account + supported etypes
    TGS-->>Atk: TGS-REP - portion encrypted with<br/>service account password-derived key

    opt Detection - service-ticket monitoring
        TGS->>SIEM: Event 4769 (service-ticket request)
        SIEM->>SIEM: Many distinct SPNs from one account,<br/>or RC4 requested in an AES environment,<br/>or ticket for a honeypot SPN
        SIEM-->>Atk: Alert raised - investigate / disable account
    end

    Atk->>Crack: Feed encrypted ticket blob offline

    alt Service account uses gMSA or 25+ char random password (attack neutralized)
        Crack-->>Atk: Infeasible - keyspace too large, no crack
    else AES-only enforced (attack slowed)
        Crack->>Crack: AES key - orders of magnitude slower
        Note over Crack: Combined with a strong password,<br/>cracking is impractical
    else Weak password + RC4 allowed
        Crack-->>Atk: Password recovered
        Atk->>TGS: Authenticate as the service account
        Note over Atk,TGS: If that account is over-privileged,<br/>attacker escalates - hence least privilege
    end

    opt Containment after detection
        SIEM->>Dir: Disable/rotate account, migrate to gMSA,<br/>remove RC4, strip excess group membership
    end
```

Notes

- Steps 3–5 are exactly the normal TGS request from
  [kerberos/tgs-exchange](../../kerberos/tgs-exchange/README.md); nothing is malformed —
  the abuse is intent plus volume plus offline attack.
- The cracking step is **offline**: no traffic to the KDC, which is why event 4769 at
  request time is the practical detection point, not a failed logon.
- gMSA (first `alt` branch) is the neutralizing control; AES-only slows; monitoring detects.
