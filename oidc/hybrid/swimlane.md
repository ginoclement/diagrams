# Hybrid Flow (code id_token) — Swimlane

The Client lane splits visibly into front-channel work (immediate session from the
fragment ID token, c_hash check) and back-channel work (code redemption).

```mermaid
flowchart TD
    subgraph User
        U1[Request app]
        U2[Authenticate + consent]
    end

    subgraph Browser
        B1["Follow 302 to /authorize<br/>(response_type=code id_token,<br/>state, nonce)"]
        B2["Receive fragment:<br/>code + id_token + state"]
        B3[Render immediate session UI]
    end

    subgraph Client
        C1[Store state + nonce]
        C2[Verify state]
        C3["Validate front-channel id_token<br/>(sig, iss, aud, exp, nonce)"]
        C4["Verify c_hash binds code<br/>to this id_token"]
        C5["Establish session NOW<br/>(before token call)"]
        C6["POST /token with code<br/>+ client auth"]
        C7["Check 2nd id_token:<br/>iss + sub match 1st"]
        C8["Call API with access_token"]
    end

    subgraph IdP
        I1[Authenticate user]
        I2["Issue code + id_token<br/>with nonce and c_hash"]
        I3["Validate code + client auth,<br/>issue access_token + id_token"]
    end

    subgraph API
        P1[Verify token, return data]
    end

    U1 --> C1 --> B1 --> I1
    U2 --> I1 --> I2 --> B2 --> C2 --> C3 --> C4
    C4 --> C5 --> B3
    C4 --> C6 --> I3 --> C7 --> C8 --> P1
```
