---
title: "Header-Based SSO — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Header-Based SSO — Sequence Diagram

Happy path: proxy authenticates the user, injects identity headers, app trusts
them. Alternates: spoofed header direct-to-app (blocked by network policy),
unauthenticated request redirected to login.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Proxy as Proxy (access gateway)
    participant IdP
    participant App as App (backend)

    %% ----- happy path -----
    User->>Browser: Open https://app.example.com
    Browser->>Proxy: GET / (no proxy session)
    Proxy->>Proxy: Strip any inbound X-Forwarded-User / REMOTE_USER headers
    Note over Proxy: ALWAYS strip client-supplied identity headers,<br/>authenticated or not
    Proxy-->>Browser: 302 to login (proxy or IdP hosted)
    Browser->>IdP: Authenticate (form / OIDC / SAML / Kerberos)
    IdP-->>Browser: Success, return to proxy callback
    Browser->>Proxy: Callback with proof of authentication
    Proxy->>Proxy: Create proxy session, set proxy session cookie
    Proxy-->>Browser: 302 back to original URL + Set-Cookie
    Browser->>Proxy: GET / (proxy session cookie)
    Proxy->>Proxy: Validate session, resolve user = alice
    Proxy->>App: GET / + X-Forwarded-User: alice + X-Forwarded-Groups: eng
    Note over Proxy,App: Trust boundary - app is reachable ONLY from the proxy<br/>(network policy, ideally mTLS on this hop)
    App->>App: Accept identity header (peer is the proxy)
    App-->>Proxy: 200 page rendered for alice
    Proxy-->>Browser: 200 response

    %% ----- alternates -----
    alt Spoofed header sent directly to app
        participant Attacker
        Attacker->>App: GET / + X-Forwarded-User: admin (bypassing proxy)
        Note over Attacker,App: Connection attempt from outside the proxy segment
        App--xAttacker: Blocked by network policy / firewall - app not reachable
        opt Defense in depth if a packet does arrive
            App->>App: Peer address is not the proxy - reject header
            App-->>Attacker: 403 Forbidden (identity header from untrusted source)
        end
    end

    alt Unauthenticated request
        Browser->>Proxy: GET /reports (no or expired proxy session)
        Proxy->>Proxy: No valid session found
        Proxy-->>Browser: 302 to login (request never reaches App)
        Browser->>IdP: User authenticates
        IdP-->>Browser: Back to proxy, session established
        Browser->>Proxy: GET /reports (proxy session cookie)
        Proxy->>App: GET /reports + X-Forwarded-User: alice
        App-->>Browser: 200 via proxy
    end
```
