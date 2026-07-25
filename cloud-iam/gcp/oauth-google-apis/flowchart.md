# 3-Legged OAuth to Google APIs — Decision Flowchart

Consent, offline-token, and refresh decision logic with explicit error terminals.

```mermaid
flowchart TD
    Start(["App needs to act for a Google user"]) --> Have{"Valid access_token<br/>cached?"}
    Have -->|Yes| Call
    Have -->|No| Refresh{"Have a refresh_token?"}

    Refresh -->|Yes| DoRefresh["POST /token grant_type=refresh_token"]
    DoRefresh --> RefOk{"Refresh succeeded?"}
    RefOk -->|"invalid_grant (revoked/expired)"| Reauth
    RefOk -->|Yes| Call

    Refresh -->|No| Reauth["Redirect to /auth<br/>(scope, state, access_type=offline)"]
    Reauth --> Consent{"User approves consent?"}
    Consent -->|No| ErrDeny(["error=access_denied:<br/>cannot continue"])
    Consent -->|Yes| StateChk{"Returned state matches?"}

    StateChk -->|No| ErrState(["Reject: possible CSRF"])
    StateChk -->|Yes| Exchange["POST /token exchange code<br/>(client_secret or PKCE verifier)"]
    Exchange --> ExOk{"Exchange valid?"}
    ExOk -->|No| ErrExch(["invalid_grant / invalid_client"])
    ExOk -->|Yes| Store["Store access_token<br/>(+ refresh_token if offline)"]

    Store --> Call["Call API with Bearer token"]
    Call --> Scope{"Token scope covers<br/>the request?"}
    Scope -->|No| ErrScope(["403 insufficient scope<br/>(re-consent, incremental auth)"])
    Scope -->|Yes| Ok(["200 data"])
```

Notes

- The refresh branch is tried before any user interaction; only `invalid_grant` forces a full
  re-authorization.
- A refresh token is stored only when `access_type=offline` was used and consent was granted the
  first time.
- Insufficient scope is resolved by incremental authorization (`include_granted_scopes=true`)
  rather than discarding existing grants.
