# Threat ↔ Defense

**Status:** ✅ Current

A **defender-oriented** reference. Each diagram in this category pairs a well-known
identity/authentication **attack** with the **defensive controls** that detect or thwart it.
The intent is architectural understanding, blue-team detection engineering, and control
design — **not** offensive tradecraft. Diagrams are conceptual: they show *where* in an
authentication flow an attack applies and *which* control breaks it. They deliberately
contain **no working exploit code, no real payloads, and no step-by-step attack recipes**.

Every entry links back to the **legitimate flow it abuses** (in `saml/`, `oidc/`,
`kerberos/`, `tokenless/`, etc.) so you can compare the normal path with the abused one.

## How to read these

- **sequence.md** — the attack path first, then `alt`/`opt` blocks showing the defense that
  thwarts it. The attacker participant is always labelled.
- **swimlane.md** — lanes for **Attacker**, **Victim**, **IdP/KDC**, and **Defender controls**.
- **flowchart.md** — a decision tree showing exactly where a control forces a **detect** or
  **deny** terminal.
- **README.md** — what it is, when it applies, actors (including the attacker), alternate
  scenarios, and explicit **Detection** and **Mitigation** subsections.

## Diagrams

| Diagram | Abuses (legitimate flow) | One-line summary |
|---|---|---|
| [Golden SAML](golden-saml/README.md) | [SAML SSO](../saml/idp-initiated-sso/README.md) | Forged SAML assertions signed with a stolen IdP token-signing key |
| [Kerberoasting](kerberoasting/README.md) | [Kerberos TGS](../kerberos/tgs-exchange/README.md) | Cracking SPN service-account passwords offline from service tickets |
| [Golden & Silver Ticket](golden-silver-ticket/README.md) | [Kerberos AS](../kerberos/as-exchange/README.md) / [AP](../kerberos/ap-exchange/README.md) | Forged TGT from the krbtgt key, forged service ticket from a service key |
| [Pass-the-Hash / Pass-the-Ticket](pass-the-hash-ticket/README.md) | [Kerberos AP](../kerberos/ap-exchange/README.md) | Reusing stolen NTLM hashes or Kerberos tickets for lateral movement |
| OAuth Consent Phishing *(planned)* | OAuth consent *(planned)* | Illicit consent grant to a malicious app to harvest tokens |
| Device Code Phishing *(planned)* | [Device Authorization](../oidc/device-authorization/README.md) | Abusing the device-code grant to phish a victim's approval |
| AiTM MFA Phishing *(planned)* | [Passkey / WebAuthn](../tokenless/webauthn-passkey-authentication/README.md) | Reverse-proxy relay that steals the session cookie despite MFA |
| Token Theft & Replay *(planned)* | [Refresh Token](../oidc/refresh-token/README.md) | Replaying stolen bearer access/refresh tokens from another device |

## Cross-cutting defenses

Several controls appear across multiple diagrams and are worth internalizing as a system:

- **Phishing-resistant, origin-bound auth** (FIDO2 / passkeys) defeats AiTM and most
  credential phishing at the root — see [Passkey Authentication](../tokenless/webauthn-passkey-authentication/README.md).
- **Sender-constrained tokens** (DPoP, mTLS) turn stolen bearer tokens into useless bits.
- **Key protection** (HSM, no exportable signing/krbtgt keys) collapses forgery attacks
  (Golden SAML, Golden Ticket) into "not possible without the key".
- **Continuous evaluation** (CAE, conditional access, risk signals) shortens the window a
  stolen credential or token is useful.
- **Least privilege and tiering** limit how far any single compromise travels.
