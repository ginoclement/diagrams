# LDAP Bind Authentication — Sequence Diagram

Happy path first (search-then-bind over StartTLS), then a SASL GSSAPI bind, an invalid
credential, a locked account, and the insecure cleartext simple bind.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as App (LDAP client)
    participant Dir as Directory (LDAP server)

    User->>App: Enter login name + password
    App->>Dir: TCP connect to :389
    App->>Dir: StartTLS extended request
    Dir-->>App: StartTLS success, negotiate TLS
    Note over App,Dir: Connection now encrypted<br/>(or use LDAPS :636 from connect)

    App->>Dir: Simple BindRequest as service account DN
    Dir-->>App: BindResponse success (0)
    App->>Dir: SearchRequest base=ou=people,<br/>filter=(uid=alice), scope=subtree
    Dir-->>App: SearchResultEntry dn=uid=alice,ou=people,dc=corp
    Dir-->>App: SearchResultDone success (0)

    App->>Dir: Simple BindRequest as user DN + user password
    Dir->>Dir: Verify password against userPassword / unicodePwd
    Dir-->>App: BindResponse success (0)
    App-->>User: Authenticated, start app session

    alt SASL bind (GSSAPI / Kerberos, no password on wire)
        App->>Dir: BindRequest SASL mechanism=GSSAPI<br/>(carries Kerberos AP-REQ)
        Dir-->>App: BindResponse saslBindInProgress (14)
        App->>Dir: SASL continuation (GSS token)
        Dir-->>App: BindResponse success (0), integrity layer set
        Note over App,Dir: Identity proven via Kerberos ticket,<br/>see kerberos/as-exchange
    end

    alt Invalid credentials
        App->>Dir: Simple BindRequest as user DN + wrong password
        Dir-->>App: BindResponse invalidCredentials (49)<br/>AD data 52e
        App-->>User: Login failed, increment lockout counter
    end

    alt Account locked or disabled
        App->>Dir: Simple BindRequest as user DN + password
        Dir-->>App: BindResponse invalidCredentials (49)<br/>AD data 775 locked / 533 disabled
        App-->>User: Account locked or disabled
    end

    opt Insecure: simple bind with NO TLS (discouraged)
        App->>Dir: Simple BindRequest as user DN + password over :389
        Note over App,Dir: Password is CLEARTEXT on the wire.<br/>Server should reject with confidentialityRequired (13).
    end
```

Notes

- Steps 3–5 (StartTLS) or connecting to LDAPS 636 must precede any simple bind so the
  credential is never sent in the clear.
- The first bind (service account) plus the search resolves the user's DN, which the second
  bind needs; the user's password is only checked in that second bind.
- SASL `GSSAPI` and `EXTERNAL` prove identity without sending a reusable password; `EXTERNAL`
  derives the DN from a client certificate presented during the TLS handshake.
- AD returns the specific failure reason in the diagnostic `data` sub-code of result 49.
