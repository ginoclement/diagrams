# LDAP Bind Authentication — Swimlane Diagram

One lane per actor. The search-then-bind pattern spans two round trips into the Directory.

```mermaid
flowchart TD
    subgraph User
        U1["Enter login name + password"]
        U2(["Authenticated session"])
    end

    subgraph App["App (LDAP client)"]
        A1["Connect and upgrade with StartTLS<br/>(or LDAPS :636)"]
        A2["Bind as service account DN"]
        A3["Search for user by login attribute<br/>filter=(uid=login)"]
        A4["Extract user DN from result"]
        A5["Re-bind as user DN + user password"]
        A6["Handle result code<br/>(49 invalid, 50/53 denied)"]
    end

    subgraph Directory["Directory (LDAP server)"]
        D1["Complete TLS, require confidentiality"]
        D2["Verify service-account bind"]
        D3["Return matching entry DN"]
        D4["Verify user password against<br/>userPassword / unicodePwd"]
        D5{"Password correct and<br/>account usable?"}
        D6["BindResponse success (0)"]
        D7["BindResponse invalidCredentials (49)<br/>with AD data sub-code"]
    end

    U1 --> A1
    A1 --> D1
    D1 --> A2
    A2 --> D2
    D2 --> A3
    A3 --> D3
    D3 --> A4
    A4 --> A5
    A5 --> D4
    D4 --> D5
    D5 -->|"yes"| D6
    D6 --> U2
    D5 -->|"no - bad pwd / locked / disabled"| D7
    D7 --> A6
    A6 -->|"retry"| U1
```

Notes

- The App lane binds **twice**: once as the service account (to search), once as the user (to
  verify the password). Only the second bind proves the user's identity.
- A SASL `EXTERNAL` variant collapses this: the user's DN comes from the client certificate in
  the TLS handshake (D1), so no separate search or password bind is needed.
- The Directory lane enforces confidentiality at D1 so a cleartext simple bind can be refused
  before any password is accepted.
