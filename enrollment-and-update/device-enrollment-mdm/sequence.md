# Device Enrollment (MDM) — Sequence Diagram

Happy path: user authenticates, MDM issues an enrollment profile, the device installs the
management profile (with push cert), compliance is evaluated, and a device identity
certificate is issued. Alternates: supervised/corporate zero-touch enrollment, compliance
failure and quarantine, re-enrollment, and unenroll/wipe.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Device
    participant MDM as MDM Server
    participant CA
    participant IdP as IdP Server

    %% ----- happy path: BYOD -----
    User->>Device: Open enrollment URL / MDM app
    Device->>MDM: Start enrollment
    MDM->>IdP: Redirect for user authentication
    User->>IdP: Authenticate (MFA as required)
    IdP-->>MDM: Verified user identity
    MDM-->>Device: Enrollment profile (server URL, challenge)
    User->>Device: Consent to management
    Device->>Device: Install management profile,<br/>register for push (MDM push cert)
    Device->>MDM: Checked in - awaiting configuration
    MDM->>Device: Evaluate compliance (encryption, passcode, OS version)
    Device-->>MDM: Attestation + posture signals
    MDM->>MDM: Compliance policy passes
    Device->>Device: Generate device key pair on-device,<br/>build CSR
    Device->>MDM: Submit CSR
    MDM->>CA: Forward CSR (often via SCEP)
    CA->>CA: Issue device identity certificate
    CA-->>MDM: Signed certificate
    MDM-->>Device: Install device identity cert + profiles (Wi-Fi, VPN)
    MDM->>IdP: Mark device managed + compliant
    IdP-->>Device: Device now trusted for conditional access

    %% ----- alternates -----
    alt Supervised / corporate zero-touch (ADE / Autopilot)
        Device->>MDM: First boot checks in via vendor enrollment program
        MDM-->>Device: Supervised profile (non-removable, mandatory)
        Note over Device,MDM: Device is company-owned and management-locked,<br/>no per-user consent step, full supervision
    end

    alt Compliance check fails
        Device-->>MDM: Posture: jailbroken / no passcode / OS too old
        MDM->>MDM: Mark device non-compliant
        MDM->>IdP: Report non-compliant
        IdP-->>Device: Quarantine - block access until remediated
        MDM-->>Device: Remediation steps (enable encryption, update OS)
    end

    opt Re-enrollment
        Device->>MDM: Profile expiring or new MDM tenant
        MDM-->>Device: Issue renewed enrollment + fresh identity cert
    end

    alt Unenroll / wipe
        alt User removes management (BYOD)
            User->>Device: Remove management profile
            Device->>MDM: Report unenrolled
            MDM->>Device: Selective wipe (work data + certs only)
        else Admin action (lost / terminated)
            MDM->>Device: Push remote wipe command
            Device->>Device: Erase device / remove work container
        end
        MDM->>IdP: Revoke device trust, mark unmanaged
    end
```
