---
title: "Choosing an MFA Factor"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing an MFA Factor

**Status:** ✅ Current

A decision guide for selecting a multi-factor / step-up authenticator. The overriding
principle is **phishing resistance**: prefer FIDO2/passkeys, Windows Hello for Business
(WHfB), or PIV/smartcard, which cryptographically bind the credential to the origin and
cannot be replayed by a proxy. Push and TOTP are acceptable second tiers.
**SMS and voice OTP are deprecated as a primary factor.**

## How to use this guide

1. Walk [flowchart.md](./flowchart.md): start from "is a phishing-resistant factor
   feasible?", then branch by platform and assurance level.
2. Follow the leaf's **Leaf link** to the concrete flow where available.
3. Confirm assurance and tradeoffs in [comparison-table.md](./comparison-table.md).

## Options at a glance

- ✅ **FIDO2 / passkey (WebAuthn)** — phishing-resistant; the recommended default.
- ✅ **Windows Hello for Business** — phishing-resistant, platform-bound for Windows estates.
- ✅ **PIV / smartcard (certificate)** — phishing-resistant; high-assurance / government.
- 🟡 **Authenticator push (number-matching)** — good, but phishable/fatigue-prone without
  number matching.
- 🟡 **TOTP (authenticator app)** — shared-secret OTP; better than SMS, still phishable.
- ⛔ **SMS / voice OTP** — deprecated as a **primary** factor. **Use instead:**
  FIDO2/passkey. Keep only as a last-resort recovery path if unavoidable.

## Related diagrams

- [WebAuthn / Passkey Authentication](../../../authentication/tokenless/webauthn-passkey-authentication/README.md)
- [Windows Hello for Business](../../../platforms/cloud-iam/entra/windows-hello-for-business/README.md)
- [Kerberos PKINIT](../../../authentication/kerberos/pkinit/README.md) — smartcard/PIV certificate logon.
- [Okta FastPass passwordless](../../../platforms/platform-specific/okta-fastpass-passwordless/README.md) — a push/passwordless example.
- [Adaptive access](../../../authentication/adaptive-access/README.md) — when to step up.

## Files

- [flowchart.md](./flowchart.md) — the decision tree.
- [comparison-table.md](./comparison-table.md) — factor-by-factor assurance and tradeoffs.
