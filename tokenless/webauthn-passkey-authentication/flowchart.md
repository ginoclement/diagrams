# WebAuthn / Passkey Authentication — Verification Flowchart

Client-side branching (credential discovery, user verification, hybrid
cross-device) followed by the server-side assertion validation pipeline.

```mermaid
flowchart TD
    Start(["credentials.get() called<br/>with challenge + rpId"]) --> Has{"Credential exists<br/>for this rpId?"}

    Has -->|"no (or phishing domain:<br/>rpId never matches)"| Hybrid{"Try cross-device<br/>hybrid flow?"}
    Hybrid -->|no| EFall(["Fall back: other factor<br/>or passkey enrollment"])
    Hybrid -->|yes| QR["Show QR, phone scans,<br/>BLE proximity tunnel"]
    QR --> UV
    Has -->|yes| UV{"User verification<br/>(biometric / PIN) passes?"}

    UV -->|"no / cancelled"| EUV(["No assertion produced -<br/>retry or choose other method"])
    UV -->|yes| Sign["Authenticator signs<br/>challenge + client data"]
    Sign --> Submit["POST assertion to server"]

    Submit --> Known{"credentialId known,<br/>public key found?"}
    Known -->|no| EKey(["Reject: unknown credential"])
    Known -->|yes| Type{"clientDataJSON.type<br/>== webauthn.get?"}
    Type -->|no| EType(["Reject: wrong ceremony type"])
    Type -->|yes| Chal{"Challenge matches issued,<br/>unexpired, unused?"}
    Chal -->|no| EChal(["Reject: bad or replayed<br/>challenge"])
    Chal -->|yes| Origin{"origin and rpIdHash<br/>match expected RP?"}
    Origin -->|no| EOrig(["Reject: origin mismatch<br/>(phishing / misconfig)"])
    Origin -->|yes| SigOk{"Signature valid against<br/>stored public key?"}
    SigOk -->|no| ESig(["Reject: invalid signature"])
    SigOk -->|yes| Flags{"UP set, and UV set<br/>when required?"}
    Flags -->|no| EFlag(["Reject: verification<br/>policy not met"])
    Flags -->|yes| Ctr{"Counter plausible?<br/>(greater than stored,<br/>or 0 for synced passkeys)"}
    Ctr -->|"regression detected"| EClone(["Block / step up:<br/>possible cloned authenticator"])
    Ctr -->|yes| OK(["Consume challenge, update counter,<br/>establish session (rotated ID)"])
```
