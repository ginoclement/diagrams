# Artifact Signing and Provenance — Decision Flowchart

The admission-time verification gates, in order. Every failure terminates in an explicit deny
node. Build-time choices (keyless vs key-based) feed the same admission checks.

```mermaid
flowchart TD
    S(["Deploy request for image digest"]) --> Q1{"Signature present<br/>for this digest?"}
    Q1 -->|"No"| E1(["Deny: unsigned artifact"])
    Q1 -->|"Yes"| Q2{"Recorded in Rekor<br/>transparency log?"}

    Q2 -->|"No"| E2(["Deny: no transparency entry"])
    Q2 -->|"Yes"| Q3{"Signer identity on allow-list?<br/>(OIDC issuer + subject)"}

    Q3 -->|"No"| E3(["Deny: untrusted signer identity"])
    Q3 -->|"Yes"| Q4{"Provenance attestation<br/>present and signed?"}

    Q4 -->|"No"| E4(["Deny: missing provenance"])
    Q4 -->|"Yes"| Q5{"Builder trusted and<br/>source repo matches policy?"}

    Q5 -->|"No"| E5(["Deny: provenance policy failure"])
    Q5 -->|"Yes"| Q6{"SLSA level meets<br/>required minimum?"}

    Q6 -->|"No"| E6(["Deny: SLSA level too low"])
    Q6 -->|"Yes"| OK(["Admit: run the artifact"])
```

Notes

- Order matters: presence of a signature (`Q1`) is checked before who signed it (`Q3`), and
  identity is checked before provenance policy (`Q5`) — a valid signature from the wrong
  identity is denied regardless of provenance.
- `Q3` is the check most often skipped in practice: verifying **who** signed, not just that
  **a** signature verifies. Keyless signing makes the identity a first-class, logged claim.
- The same gates apply to key-based signing; only the identity check differs (matching a
  pinned public key instead of an OIDC identity). Keyless is preferred to avoid key storage.
