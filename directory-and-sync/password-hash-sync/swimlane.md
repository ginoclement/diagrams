# Password Hash Sync — Swimlane Diagram

One lane per actor. The Agent bridges on-prem and cloud; sign-in stays entirely in the IdP
lane.

```mermaid
flowchart TD
    subgraph User
        U1["Set / change password on-prem"]
        U2["Sign in with corporate password"]
        U3(["Authenticated to cloud"])
    end

    subgraph Directory["Directory (AD)"]
        D1["Store NT hash of password"]
        D2["Expose changed hashes to sync"]
    end

    subgraph Agent["Agent (Entra Connect)"]
        G1["Read changed NT hashes"]
        G2["Derive PBKDF2(HMAC-SHA256,<br/>NThash, salt, 1000)"]
        G3["Upload derived hash + salt over TLS"]
    end

    subgraph IdP["IdP (Cloud)"]
        I1["Store derived hash per user"]
        I2["Hash presented password the same way"]
        I3{"Derived hashes match?"}
        I4["Apply Conditional Access / MFA"]
        I5["Issue tokens"]
        I6(["Reject: wrong password"])
    end

    U1 --> D1
    D1 --> D2
    D2 --> G1
    G1 --> G2
    G2 --> G3
    G3 --> I1

    U2 --> I2
    I1 -.->|"stored verifier"| I3
    I2 --> I3
    I3 -->|"yes"| I4
    I4 --> I5
    I5 --> U3
    I3 -->|"no"| I6
```

Notes

- The Agent lane is the only place the on-prem hash is touched; it emits a salted PBKDF2
  derivation, never the plaintext or the raw NT hash.
- Sign-in flows entirely within the IdP lane against the stored verifier (dashed link),
  which is why an offline Directory does not block cloud sign-in.
- Conditional Access and MFA (`I4`) layer on top of the password check, not instead of it.
