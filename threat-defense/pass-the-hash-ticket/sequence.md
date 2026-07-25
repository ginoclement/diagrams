# Pass-the-Hash / Pass-the-Ticket — Sequence Diagram

The replay attack (steal credential material from memory, reuse it against other systems),
then the defenses: Credential Guard/LSASS protection prevent the theft, tiering limits
reuse, and logon-anomaly monitoring detects the movement. The **Attacker** starts on one
compromised beachhead host.

```mermaid
sequenceDiagram
    autonumber
    actor Atk as Attacker
    participant Host as Compromised host (beachhead)
    participant KDC as KDC
    participant Target as Target server
    participant SIEM as Defender / SIEM

    Note over Atk,Host: Precondition - attacker has admin on one host<br/>where a victim (often privileged) has a session

    Atk->>Host: Attempt to read LSASS / cached secrets
    alt Credential Guard + LSASS protected (theft prevented)
        Host-->>Atk: Secrets VBS-isolated / PPL-blocked - no hash or ticket
        Note over Atk,Host: No reusable material - PtH/PtT cannot start here
    else Secrets readable
        Host-->>Atk: Extract NT hash (PtH) and/or Kerberos ticket (PtT)

        alt Pass-the-Hash (NTLM)
            Atk->>Target: NTLM authenticate as victim<br/>using the NT hash (no plaintext)
            Target->>Target: NTLM challenge/response verifies the hash
        else Pass-the-Ticket (Kerberos)
            Atk->>Atk: Inject stolen TGT/service ticket into session
            Atk->>KDC: Redeem stolen TGT for new service tickets (TGS-REQ)
            Atk->>Target: Present ticket to service (AP-REQ)
        end

        alt Tiering blocks reuse (blast radius limited)
            Target-->>Atk: Stolen creds are low-tier / local only<br/>- no access to Tier-0 assets
            Note over Target: Privileged accounts never logged on here,<br/>so nothing high-value was in memory
        else Reuse succeeds
            Target-->>Atk: Access granted as victim - lateral movement
        end

        opt Detection - logon anomaly
            Target->>SIEM: 4776 / 4624 type 3 (NTLM) or ticket use
            SIEM->>SIEM: NTLM from unusual host, privileged account<br/>hitting many systems, ticket from a host that<br/>never obtained it
            SIEM-->>Atk: Alert - lateral movement suspected
        end
    end

    opt Containment
        SIEM->>KDC: Reset victim + krbtgt (if ticket theft),<br/>rotate local admin (LAPS), isolate hosts,<br/>enforce Credential Guard + tiering
    end
```

Notes

- PtH replays the **NT hash** into NTLM; PtT injects a **Kerberos ticket** and redeems/presents
  it — see [ap-exchange](../../kerberos/ap-exchange/README.md) and
  [tgs-exchange](../../kerberos/tgs-exchange/README.md).
- The first `alt` (Credential Guard / LSASS PPL) is the prevention that removes the theft
  primitive; tiering limits what reuse can reach; SIEM anomaly rules detect the movement.
- Containment for stolen tickets ultimately means resetting the affected account (and krbtgt
  if a TGT/golden-ticket path is suspected — see [Golden & Silver Ticket](../golden-silver-ticket/README.md)).
