# Choosing an MFA Factor — Decision Tree

Leaves name the recommended factor. Phishing-resistant options are preferred; SMS/voice is ⛔.

```mermaid
flowchart TD
    S(["Need a second / step-up factor"]) --> Q1{"Phishing resistance<br/>required or feasible?"}

    Q1 -->|Yes - strongly preferred| Q2{"Platform / assurance?"}
    Q2 -->|Cross-platform, user-friendly| PASS(["Use FIDO2 / passkey (WebAuthn)"])
    Q2 -->|Windows estate| WHFB(["Use Windows Hello for Business"])
    Q2 -->|High assurance / gov| PIV(["Use PIV / smartcard certificate"])

    Q1 -->|Not feasible yet| Q3{"Best available<br/>fallback?"}
    Q3 -->|Managed authenticator app| Q4{"Supports number<br/>matching?"}
    Q4 -->|Yes| PUSH(["Use push with number matching"])
    Q4 -->|No| TOTP(["Use TOTP authenticator app"])
    Q3 -->|Only SMS / voice available| SMS(["⛔ SMS / voice OTP -<br/>recovery only, migrate to FIDO2"])
```

Leaf links

- **Use FIDO2 / passkey (WebAuthn)** → [`../../tokenless/webauthn-passkey-authentication/`](../../tokenless/webauthn-passkey-authentication/README.md)
- **Use Windows Hello for Business** → [`../../cloud-iam/entra/windows-hello-for-business/`](../../cloud-iam/entra/windows-hello-for-business/README.md)
- **Use PIV / smartcard certificate** → [`../../kerberos/pkinit/`](../../kerberos/pkinit/README.md)
- **Use push with number matching** → [`../../platform-specific/okta-fastpass-passwordless/`](../../platform-specific/okta-fastpass-passwordless/README.md)
- **Use TOTP authenticator app** → [`../../tokenless/webauthn-passkey-authentication/`](../../tokenless/webauthn-passkey-authentication/README.md) (passwordless upgrade path)
- **⛔ SMS / voice OTP** → replacement [`../../tokenless/webauthn-passkey-authentication/`](../../tokenless/webauthn-passkey-authentication/README.md)
