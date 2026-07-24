# Profile Attribute Update — Sequence Diagram

Happy path shows a non-sensitive attribute committing immediately. Alternates: a sensitive
attribute requiring step-up re-authentication, re-verification of a new contact value, and
rejection of an admin-restricted attribute.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP Server
    participant Dir as Directory
    participant VS as Verification Service

    %% ----- happy path: non-sensitive -----
    User->>Browser: Edit display name (non-sensitive)
    Browser->>IdP: PATCH /me (displayName)
    IdP->>IdP: Classify attribute - non-sensitive
    IdP->>IdP: Validate value (format, length)
    IdP->>Dir: Write updated attribute
    Dir-->>IdP: Committed
    IdP-->>Browser: 200 - profile updated

    %% ----- alternates -----
    alt Sensitive attribute requires step-up
        User->>Browser: Change email / recovery contact
        Browser->>IdP: PATCH /me (email)
        IdP->>IdP: Classify - sensitive, session not freshly authenticated
        IdP-->>Browser: 401 step_up_required
        User->>Browser: Re-authenticate (password + MFA)
        Browser->>IdP: Retry PATCH /me with elevated auth
        IdP->>IdP: Step-up satisfied - proceed to verify new value
        Note over IdP: Notify the OLD channel of the pending change<br/>so takeover is detectable
    end

    alt Verification of the new value
        IdP->>VS: Send proof to the new email / phone
        VS-->>User: Deliver code / verification link
        User->>Browser: Confirm new value
        Browser->>IdP: POST /me/verify (token)
        IdP->>IdP: Token valid - promote new value
        IdP->>Dir: Write new value, retire old
        Dir-->>IdP: Committed
        IdP-->>Browser: 200 - new value active
    end

    alt Admin-restricted attribute rejected
        User->>Browser: Try to edit employeeId / group membership
        Browser->>IdP: PATCH /me (employeeId)
        IdP->>IdP: Classify - admin-restricted, not self-serviceable
        IdP-->>Browser: 403 forbidden - use the request / lifecycle process
        Note over IdP,Dir: Directory is not touched,<br/>change must go through governance
    end
```
