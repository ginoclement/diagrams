# Okta FastPass — Sequence Diagram

Happy path: Okta challenges FastPass, the Sign-In Widget probes the local Okta Verify
app over loopback, Okta Verify returns a device-bound signed attestation, Okta
verifies it and device assurance. This runs as one factor inside the OIE
[policy pipeline](../okta-identity-engine-signin/README.md). Alternates: universal-link
fallback, device not registered, user-verification required.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant OV as Okta Verify (local app)
    participant Okta as Okta (org)

    %% ----- happy path (loopback) -----
    User->>Browser: Choose "Sign in with Okta FastPass"
    Browser->>Okta: Request FastPass challenge
    Okta->>Okta: Generate nonce, bind to pending sign-in
    Okta-->>Browser: FastPass challenge (nonce, org, rp context)
    Browser->>OV: Loopback probe http://localhost:port (challenge)
    Note over Browser,OV: Widget discovers local Okta Verify via loopback HTTP server
    OV->>OV: Locate device-bound private key for this org
    OV->>OV: Collect device signals (managed state, OS, integrity)
    OV->>OV: Sign challenge nonce + device attestation<br/>with hardware-protected key
    OV-->>Browser: Signed attestation + device claims
    Browser->>Okta: Submit signed attestation
    Okta->>Okta: Verify signature against enrolled device public key
    Okta->>Okta: Verify nonce fresh + bound, check device assurance
    Okta-->>Browser: Factor satisfied - continue OIE remediation
    Browser-->>User: Passwordless, phishing-resistant sign-in

    %% ----- alternates -----
    alt Loopback blocked - universal link fallback
        Browser->>OV: Open universal / app link (okta-verify://...) with challenge
        Note over Browser,OV: Used when loopback server cannot bind, e.g. mobile / locked-down
        OV-->>Browser: Signed attestation returned via app-link callback
    end

    alt Device not registered for this org
        Browser->>OV: Probe local Okta Verify
        OV-->>Browser: No enrollment / key for this org
        Browser->>Okta: FastPass unavailable
        Okta-->>Browser: Fall back to another factor or enroll Okta Verify
    end

    opt User verification required by policy
        Okta->>Okta: Authentication Policy demands UV
        OV->>User: Prompt biometric / device PIN
        User->>OV: Verify (Touch ID / Face / PIN)
        OV->>OV: Set UV flag before signing attestation
    end
```
