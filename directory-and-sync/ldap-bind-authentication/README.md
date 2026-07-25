# LDAP Bind Authentication

**Status:** ✅ Current

## What it is

LDAP authentication is performed by a **Bind** operation: the client presents a
Distinguished Name (DN) and a credential to a directory server (OpenLDAP, 389 Directory
Server, Active Directory, etc.), and the server verifies it against the stored password.

Two bind mechanisms exist:

- **Simple bind** — DN + cleartext password sent in a single `BindRequest`. The password
  travels in the clear on the wire, so simple bind is only safe **inside** a TLS-protected
  connection (LDAPS on port 636, or StartTLS on port 389).
- **SASL bind** — a pluggable authentication layer (`DIGEST-MD5`, `GSSAPI`/Kerberos,
  `EXTERNAL` for client-certificate identity, `PLAIN`). SASL can authenticate without ever
  sending a reusable password and can negotiate a confidentiality/integrity layer of its own.

Because a user rarely knows their own DN, real applications use the **search-then-bind**
(bind-search-bind) pattern: bind as a low-privilege *service account*, search for the user
entry by a login attribute (`uid`, `sAMAccountName`, `mail`), retrieve the DN, then perform a
second bind **as that DN** with the user-supplied password to verify it.

## When it is used

- Applications and appliances that authenticate users directly against a corporate directory
  (VPNs, network gear, Linux PAM/`sssd`, Jenkins, GitLab, Grafana, wikis).
- Any "LDAP authentication" checkbox in an app config — under the hood it is a bind.
- As the credential-validation backend behind other flows (e.g. an IdP that stores no
  passwords itself and binds to a directory to check them).

## Actors

| Actor | Role |
|---|---|
| `User` | Human supplying a login name and password |
| `App` | Relying application / LDAP client performing binds on the user's behalf |
| `Directory` | LDAP server (Directory) that stores entries and verifies credentials |

## Key protocol details

- **StartTLS** is an LDAP extended operation on the plaintext port (389) that upgrades the
  existing connection to TLS *before* any bind. **LDAPS** is TLS-from-connect on port 636.
  Either protects the credential; without one, simple bind is cleartext on the network.
- A search-then-bind requires a **bind DN / service account** with permission to read user
  entries. It should be least-privilege and its password rotated / vaulted.
- **Anonymous bind** (empty DN and password) and **unauthenticated bind** (a DN with an empty
  password) are distinct; many servers accept the latter and can be tricked into treating a
  blank password as success — applications must reject empty passwords explicitly.
- Result codes: `success (0)`, `invalidCredentials (49)`, `insufficientAccessRights (50)`,
  `unwillingToPerform (53)`. AD encodes lockout/expiry sub-reasons in the `data` field of the
  `49` diagnostic message (e.g. `data 52e` bad password, `data 533` account disabled,
  `data 775` account locked).

## Alternate scenarios covered

- **Simple bind over cleartext** — the discouraged, insecure baseline (see security notes).
- **Simple bind over LDAPS / StartTLS** — the acceptable use of simple bind.
- **SASL bind** — `GSSAPI`/Kerberos and `EXTERNAL` (client-cert) that avoid sending a password.
- **Search-then-bind** — resolving an unknown DN via a service account before the user bind.
- Invalid credentials, locked/disabled/expired account, and referral to another server.

## Security notes

- **⛔ Simple bind over an unencrypted connection sends the password in cleartext** and must
  never be used across an untrusted network. Require StartTLS or LDAPS, and configure the
  server to **reject** simple binds on unencrypted connections
  (`olcSecurity`/`minssf`, or AD's *LDAP server signing / channel binding* requirements).
- Reject empty-password binds to avoid the unauthenticated-bind pitfall being read as success.
- Prefer **SASL GSSAPI (Kerberos)** or **EXTERNAL (mutual TLS)** where possible — no reusable
  secret crosses the wire and integrity/confidentiality layers are negotiated.
- Validate the directory server's TLS certificate; do not disable certificate checking to
  "make LDAPS work". A MITM on an unvalidated LDAPS is as bad as cleartext.
- Give the search service account read-only, least-privilege access; store its credential in a
  secret manager, not in app config files.
- Feed `invalidCredentials` events into lockout/rate-limiting to blunt password spraying.

## Related diagrams

- [Active Directory Logon](../active-directory-logon/README.md) — Kerberos/NTLM logon to the same directory
- [Kerberos AS Exchange](../../kerberos/as-exchange/README.md) — what SASL `GSSAPI` binds rely on
- [Mutual TLS](../../tokenless/mutual-tls/README.md) — the transport behind SASL `EXTERNAL`
- [HTTP Basic Authentication](../../tokenless/http-basic-auth/README.md) — the app-tier equivalent of simple bind
- Pass-through Authentication *(planned)* — a cloud agent that validates the same way

## Files

- [sequence.md](sequence.md) — bind message exchange with alternates
- [swimlane.md](swimlane.md) — lanes for User, App, Directory
- [flowchart.md](flowchart.md) — bind decision logic and error terminals
