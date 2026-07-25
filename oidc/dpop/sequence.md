# DPoP — Sequence Diagram

Happy path: DPoP proof at `/token` binds the access token to the key, then a proof
with `ath` at the API. Then the nonce challenge, a stolen-token replay, and a
proof replay.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as App (public client)
    participant IdP as IdP (authorization server)
    participant API as API (resource server)

    Note over App: Generate DPoP key pair (private key stays in app)
    User->>App: Sign in (authorization code + PKCE underneath)
    App->>App: Build DPoP proof: header jwk + typ dpop+jwt,<br/>payload htm=POST, htu=/token, iat, jti
    App->>IdP: POST /token grant_type=authorization_code<br/>DPoP: proof-JWT
    IdP->>IdP: Verify proof signature, htm/htu, iat, jti<br/>compute jkt = SHA-256 thumbprint of jwk
    IdP-->>App: 200 token_type=DPoP, access_token<br/>with cnf jkt bound
    App->>App: Build new proof: htm=GET, htu=/resource,<br/>iat, jti, ath = hash(access_token)
    App->>API: GET /resource<br/>Authorization: DPoP access_token<br/>DPoP: proof-JWT
    API->>API: Verify proof, jkt(jwk) == token cnf jkt,<br/>ath == hash(token), htm/htu, jti fresh
    API-->>App: 200 data

    alt Server requires a DPoP nonce
        App->>IdP: POST /token with DPoP proof (no nonce)
        IdP-->>App: 400 error=use_dpop_nonce<br/>DPoP-Nonce: n-0S6...
        App->>IdP: Retry proof including nonce claim
        IdP-->>App: 200 DPoP-bound access_token
    end

    alt Stolen access token, no valid proof
        Note over API: Attacker replays the bound token as plain Bearer
        API->>API: cnf jkt present but proof missing or key mismatch
        API-->>App: 401 error=invalid_token
    end

    alt Proof replay (jti reused)
        App->>API: GET /resource with a previously seen jti
        API->>API: jti already spent within window
        API-->>App: 401 error=invalid_token
    end
```
