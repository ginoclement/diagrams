# Enrollment by Persona — Sequence Diagram

Each `alt` branch differs in who starts enrolment and how identity is proven before a factor
is registered. Base factor mechanics live in the linked enrolment diagrams.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant IT as IT / MDM
    participant IdP as IdP
    participant Inviter as Inviter

    alt Workforce (IT / MDM-pushed)
        IT->>IdP: Pre-stage account plus factor policy
        IT->>User: Enrol managed device (MDM)
        User->>IT: Complete device enrolment
        IT->>IdP: Push device certificate (see SCEP/EST)
        IdP->>User: Prompt to register factor on managed device
        User->>IdP: Register phishing-resistant factor (see FIDO2)
        IdP->>IdP: Bind factor to managed, attested device
        IdP-->>User: Enrolment complete, policy satisfied
    else Consumer (self-service, progressive)
        User->>IdP: Self-register (email / social)
        IdP->>User: Verify proof of control (see email/phone verification)
        User->>IdP: Confirm
        IdP-->>User: Account active (minimal factors)
        opt Later, at sensitive action or by choice
            User->>IdP: Add factor (passkey / authenticator)
            IdP->>IdP: Rate-limit, bind factor
            IdP-->>User: Factor added
        end
    else Guest (invite-redeem)
        Inviter->>IdP: Issue single-use, time-limited invitation
        IdP-->>User: Deliver invite link
        User->>IdP: Redeem invitation
        IdP->>User: Light verification (proof of control of invited address)
        User->>IdP: Confirm
        IdP->>IdP: Create minimal identity scoped to shared resource
        IdP-->>User: Guest access granted (expiring)
    end
```

Notes

- Workforce enrolment is **pushed** and device-bound; the user never chooses the policy, they
  satisfy it on a managed device.
- Consumer enrolment is **pulled and progressive**: the account exists with minimal factors and
  the user (or a sensitive-action prompt) drives factor addition later.
- Guest enrolment is gated entirely by the **invitation**: no invite, no enrolment, and the
  resulting identity is minimal and time-limited.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
