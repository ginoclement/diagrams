# IP Allowlist / Network-Location Authentication — Sequence Diagram

Happy path: request from an allowlisted source reaches the app. Alternates:
disallowed IP, and the recommended combination — allowlisted but still required
to authenticate (allowlist as filter, IdP as authentication).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client (device)
    participant VPN as VPN / office network
    participant GW as Gateway (firewall / LB)
    participant App
    participant IdP

    %% ----- happy path: on-network access -----
    User->>Client: Access internal-app.example.com
    Client->>VPN: Traffic routed via VPN / office egress
    VPN->>GW: Request arrives with source IP 10.20.0.0/16 range
    GW->>GW: Compare transport-level peer IP against allowlist
    Note over GW: Trust only the L3/L4 peer address -<br/>X-Forwarded-For is client-controlled
    GW->>App: Forward request (network check passed)
    App-->>User: 200 response
    Note over User,App: Location implied identity - nobody proved WHO is on the device

    %% ----- alternates -----
    alt Request from disallowed IP
        Client->>GW: Request from coffee-shop IP 203.0.113.50
        GW->>GW: Peer IP not in allowlist
        GW--xClient: Drop packet / TCP reset (service not even discoverable)
        Note over GW: Prefer silent drop over 403 -<br/>no signal to scanners that the service exists
    end

    alt Allowlisted but unauthenticated (recommended: combine with real authn)
        Client->>VPN: On trusted network
        VPN->>GW: Source IP in allowlist
        GW->>App: Forward request
        App->>App: Network OK, but no session / credential present
        App-->>Client: 302 to IdP login (allowlist is a filter, not authentication)
        Client->>IdP: Authenticate (password + MFA, or passkey)
        opt Network location as a conditional-access signal
            IdP->>IdP: On-network: lower risk score, maybe skip MFA<br/>Off-network: step-up required
        end
        IdP-->>Client: Authentication success
        Client->>App: Retry with authenticated session
        App-->>User: 200 response as a verified identity
    end
```
