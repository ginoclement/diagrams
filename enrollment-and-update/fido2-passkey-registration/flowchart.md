---
title: "FIDO2 / Passkey Registration — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# FIDO2 / Passkey Registration — Decision Flowchart

Client-side branching (attachment, exclude list, user verification) followed by the
server-side attestation validation pipeline, with explicit rejection terminals.

```mermaid
flowchart TD
    Start(["credentials.create() called<br/>with challenge + creation options"]) --> Excl{"Authenticator already in<br/>excludeCredentials?"}
    Excl -->|yes| EDup(["InvalidStateError:<br/>credential already exists"])
    Excl -->|no| UV{"User verification<br/>(biometric / PIN) passes?"}

    UV -->|"no / cancelled"| EUV(["No credential created -<br/>ceremony aborted"])
    UV -->|yes| Gen["Generate key pair scoped to rpId,<br/>build attestation object"]
    Gen --> Res{"residentKey required?"}
    Res -->|yes| Disc["Store discoverable credential<br/>keyed by rpId + userHandle"]
    Res -->|no| Submit
    Disc --> Submit["POST attestation to RP server"]

    Submit --> Type{"clientDataJSON.type<br/>== webauthn.create?"}
    Type -->|no| EType(["Reject: wrong ceremony type"])
    Type -->|yes| Chal{"Challenge matches issued,<br/>unexpired, unused?"}
    Chal -->|no| EChal(["Reject: bad or replayed<br/>challenge"])
    Chal -->|yes| Origin{"origin and rpIdHash<br/>match expected RP?"}
    Origin -->|no| EOrig(["Reject: origin mismatch"])
    Origin -->|yes| Flags{"UP set, and UV set<br/>when required?"}
    Flags -->|no| EFlag(["Reject: verification<br/>policy not met"])
    Flags -->|yes| Att{"Attestation acceptable?<br/>(none, or direct trusted<br/>via FIDO MDS)"}
    Att -->|no| EAtt(["Reject: untrusted<br/>attestation / model"])
    Att -->|yes| New{"credentialId not<br/>already stored?"}
    New -->|no| ENew(["Reject: duplicate<br/>credential ID"])
    New -->|yes| OK(["Store public key, credentialId,<br/>signCount, transports, AAGUID"])
```
