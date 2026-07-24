# Certificate Enrollment (SCEP / EST) — Decision Flowchart

Protocol selection, capability/CA-cert discovery, challenge or client-auth validation,
pending-approval polling, and issuance, with explicit failure terminals.

```mermaid
flowchart TD
    Start(["Client needs a certificate"]) --> Key["Generate key pair,<br/>build PKCS#10 CSR"]
    Key --> Proto{"Protocol?"}

    Proto -->|SCEP| Caps["GetCACaps + GetCACert,<br/>wrap CSR + challenge in PKCS#7"]
    Proto -->|EST| Tls["GET /cacerts,<br/>POST /simpleenroll over TLS"]

    Caps --> Chal{"Challenge password<br/>valid and unused?"}
    Tls --> Auth{"TLS client-auth /<br/>credential valid?"}

    Chal -->|no| EChal(["FAILURE: badRequest -<br/>need fresh one-time password"])
    Auth -->|no| EAuth(["401: authentication failed"])

    Chal -->|yes| Approve
    Auth -->|yes| Approve{"Manual approval<br/>required?"}

    Approve -->|yes| Pend["Return PENDING"]
    Pend --> Poll{"Poll: decided yet?"}
    Poll -->|"still pending"| Poll
    Poll -->|denied| EDeny(["FAILURE: request rejected<br/>by operator"])
    Poll -->|approved| Issue
    Approve -->|no| Issue["CA issues certificate"]

    Issue --> Match{"Issued key matches<br/>CSR public key?"}
    Match -->|no| EMatch(["Abort: key mismatch,<br/>do not install"])
    Match -->|yes| Install["Install certificate"]

    Install --> Expiry{"Approaching notAfter?"}
    Expiry -->|yes| Renew(["Re-enroll early<br/>(SCEP renewal / EST simplereenroll)"])
    Expiry -->|no| Done(["Certificate in service"])
    Renew --> Proto
```
