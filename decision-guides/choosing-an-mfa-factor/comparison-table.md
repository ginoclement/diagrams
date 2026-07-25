---
title: "MFA Factors — Comparison"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# MFA Factors — Comparison

| Option | Status | When to use | When NOT to use | Key tradeoffs | Security notes |
|---|---|---|---|---|---|
| **FIDO2 / passkey (WebAuthn)** | ✅ Current | Default MFA and passwordless; consumer and workforce | Environments with no platform/roaming authenticator support at all | Phishing-resistant, great UX; needs enrollment and recovery planning | Origin-bound assertion; resist replay; register a backup authenticator |
| **Windows Hello for Business** | ✅ Current | Windows workforce devices; passwordless desktop | Non-Windows or shared/kiosk devices | Phishing-resistant, seamless on Windows; platform-bound | TPM-backed keys; provisioning tied to device + Entra/AD |
| **PIV / smartcard (certificate)** | ✅ Current | High-assurance, government, regulated | Consumer scale; no card-issuance program | Strongest, but hardware and PKI overhead | Cert logon via PKINIT; protect card + PIN; check revocation |
| **Authenticator push (number matching)** | 🟡 Legacy | Broad rollout when passkeys aren't yet universal | High-value targets facing MITM proxies | Easy for users; phishable without number matching | Enforce number matching; block MFA-fatigue prompt bombing |
| **TOTP (authenticator app)** | 🟡 Legacy | Better-than-SMS fallback | Anywhere phishing resistance is required | No connectivity needed; shared secret is phishable | 30s codes, replayable via proxy; not origin-bound |
| **SMS / voice OTP** | ⛔ Deprecated (as primary) | Last-resort recovery only | **Any primary factor** | Universal reach, weakest security | **Why:** SIM-swap, SS7 intercept, phishing. **Use instead:** FIDO2/passkey |

Notes

- "Phishing-resistant" = the credential is cryptographically bound to the correct origin,
  so a reverse-proxy phishing site cannot relay it. FIDO2, WHfB, and PIV qualify; push,
  TOTP, and SMS do not.
- Pair factor selection with risk-based step-up in
  [Adaptive access](../../adaptive-access/README.md).
