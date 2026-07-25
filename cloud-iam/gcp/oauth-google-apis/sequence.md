# 3-Legged OAuth to Google APIs — Sequence Diagram

Happy path first (consent, code exchange, API call), then alternates: offline refresh,
incremental authorization, and a user denying consent.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as App (OAuth client)
    participant Google as Google (accounts.google.com)
    participant API as Google API

    User->>App: Click Connect Google account
    App->>Google: GET /o/oauth2/v2/auth<br/>client_id, redirect_uri, response_type=code,<br/>scope=...drive.readonly, state,<br/>access_type=offline, prompt=consent
    Google->>User: Authenticate + consent screen (scopes listed)
    User->>Google: Approve requested scopes
    Google-->>App: 302 redirect_uri?code=4/0Ax...&state
    App->>App: Verify state
    App->>Google: POST /token grant_type=authorization_code,<br/>code, redirect_uri, client_id,<br/>client_secret or code_verifier (PKCE)
    Google-->>App: 200 access_token, expires_in=3599,<br/>scope, refresh_token (first offline consent)
    App->>API: GET /drive/v3/files (Authorization: Bearer)
    API-->>App: 200 data

    alt Offline refresh when access_token expires
        App->>Google: POST /token grant_type=refresh_token,<br/>refresh_token, client_id (+ secret)
        Google-->>App: 200 new access_token, expires_in
        App->>API: Retry request with new token
        API-->>App: 200 data
    end

    alt Incremental authorization (add a scope)
        App->>Google: GET /o/oauth2/v2/auth<br/>scope=...calendar.readonly,<br/>include_granted_scopes=true
        Google->>User: Consent for the new scope only
        User->>Google: Approve
        Google-->>App: code covering old + new scopes
    end

    alt User denies consent
        User->>Google: Cancel at consent screen
        Google-->>App: 302 redirect_uri?error=access_denied&state
        App->>App: Show cannot-continue, offer retry
    end

    alt Refresh token revoked or expired
        App->>Google: POST /token grant_type=refresh_token
        Google-->>App: 400 error=invalid_grant
        App->>App: Restart authorization from /auth
    end
```

Notes

- `access_type=offline` plus first-time consent is what yields a `refresh_token`, subsequent
  consents omit it unless `prompt=consent` forces a new one.
- `include_granted_scopes=true` merges new scopes with already-granted ones so one token covers
  both.
- Public clients use PKCE (`code_verifier`) and send no client secret, confidential clients keep
  the secret server-side.
