# Active Directory Interactive Logon — Sequence Diagram

Happy path first (Kerberos AS/TGS/AP via Negotiate), then NTLM fallback, cached domain
logon, wrong password, and clock skew.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client (Winlogon / LSASS)
    participant KDC as KDC (Domain Controller)
    participant Dir as Directory (AD)

    User->>Client: Ctrl+Alt+Del, enter username + password
    Client->>Client: LSASS derives NT/AES key, Negotiate SSP selects mechanism

    Note over Client,KDC: Negotiate prefers Kerberos
    Client->>KDC: AS-REQ (cname=user, sname=krbtgt,<br/>PA-ENC-TIMESTAMP)
    KDC->>Dir: Look up account, keys, policy, group SIDs
    Dir-->>KDC: Account record + PAC data
    KDC-->>Client: AS-REP (TGT + session key), see kerberos/as-exchange
    Client->>KDC: TGS-REQ (present TGT, sname=host/workstation)
    KDC-->>Client: TGS-REP (service ticket)
    Client->>Client: AP exchange to local LSA, build access token from PAC groups
    Client-->>User: Desktop loads, logon complete

    alt NTLM fallback (no SPN / IP literal / no KDC reachable)
        Note over Client,KDC: Kerberos not possible for this target
        Client->>KDC: NEGOTIATE (advertise NTLM capabilities)
        KDC-->>Client: CHALLENGE (server nonce)
        Client->>KDC: AUTHENTICATE (NTLM response from NT hash)
        KDC->>Dir: Netlogon pass-through: verify response
        Dir-->>KDC: Match, return group SIDs
        KDC-->>Client: Success, build token
        Note over Client,KDC: NTLM = Legacy, discouraged (relay / pass-the-hash)
    end

    alt Cached domain logon (DC unreachable)
        Client->>Client: No DC reachable, compare against<br/>cached credential verifier (MSCACHE)
        Client-->>User: Offline logon with last-known token
    end

    alt Wrong password
        Client->>KDC: AS-REQ with bad PA-ENC-TIMESTAMP
        KDC-->>Client: KRB-ERROR PREAUTH_FAILED (event 4771)
        Client-->>User: Incorrect password, lockout counter increments
    end

    alt Clock skew beyond 5 minutes
        Client->>KDC: AS-REQ with stale timestamp
        KDC-->>Client: KRB-ERROR KRB_AP_ERR_SKEW
        Client->>Client: Sync time (or fall back to NTLM), retry
    end
```

Notes

- The happy path is Kerberos: AS-REQ/AS-REP for the TGT, TGS-REQ/TGS-REP for the
  `host/workstation` service ticket, then a local AP exchange to build the token from the PAC.
- NTLM fallback is a challenge/response verified by the DC over the Netlogon secure channel;
  it produces no ticket and is flagged here as Legacy.
- Cached (MSCACHE) logon lets a user in when no DC is reachable, using a stored verifier rather
  than live authentication.
