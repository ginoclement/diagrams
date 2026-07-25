# Windows Hello for Business — Decision Flowchart

Provisioning eligibility, then the logon gesture and trust-model decisions. Deny paths
terminate explicitly.

```mermaid
flowchart TD
    Start(["User on an Entra device"]) --> Prov{"WHfB key already<br/>provisioned?"}
    Prov -->|No| Eligible{"Policy enabled +<br/>MFA satisfied?"}
    Eligible -->|No| DenyProv(["Cannot provision:<br/>complete MFA / enable policy"])
    Eligible -->|Yes| Gen["Generate key in TPM,<br/>register public key with Entra"]
    Gen --> Ready(["Credential ready"])

    Prov -->|Yes| Gesture{"Gesture type?"}
    Gesture -->|Biometric| Bio{"Biometric<br/>recognized?"}
    Bio -->|No| Pin
    Bio -->|Yes| Unlock
    Gesture -->|PIN| Pin{"PIN correct?"}
    Pin -->|No| Lock{"Too many<br/>attempts?"}
    Lock -->|Yes| DenyLock(["TPM anti-hammering lockout<br/>use recovery"])
    Lock -->|No| Pin
    Pin -->|Yes| Unlock["Unlock TPM private key"]

    Unlock --> Sign["Sign nonce, request PRT"]
    Sign --> Verify{"Entra verifies<br/>signature?"}
    Verify -->|No| DenySig(["Deny: signature invalid"])
    Verify -->|Yes| Token["Issue PRT with MFA claim"]

    Token --> OnPrem{"On-prem resource<br/>needed?"}
    OnPrem -->|No| Done(["Cloud SSO established"])
    OnPrem -->|Yes| Trust{"Trust model?"}
    Trust -->|Cloud Kerberos| CK["Entra issues partial TGT,<br/>DC returns full TGT"] --> Done
    Trust -->|Key trust| KT["DC PKINIT via<br/>msDS-KeyCredentialLink"] --> Done
    Trust -->|Cert trust legacy| CT["DC validates logon cert<br/>from enterprise CA"] --> Done
```

Notes

- Provisioning is gated on both policy being enabled and a fresh MFA; the resulting key is
  a reusable proof of that MFA.
- PIN and biometric both resolve to unlocking the same TPM-held private key — the gesture
  is local, only the signature leaves the device.
- Cloud Kerberos trust is the recommended on-prem path; certificate trust is legacy.
