---
title: "Primary Refresh Token (PRT)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Primary Refresh Token (PRT)

**Status:** ✅ Current

## What it is

The Primary Refresh Token is a top-level, device-bound refresh token that Microsoft Entra
ID issues to a registered/joined Windows (or macOS/mobile) device during sign-in. It is
the backbone of SSO on the endpoint: the **Cloud Authentication Provider (CloudAP)** on
Windows obtains the PRT, binds it to the device using a **key pair whose private key lives
in the TPM** (the Device key) plus a **session key** the Web Account Manager (WAM) uses to
sign token requests. Once the device holds a PRT, apps and browsers get access/refresh
tokens for any Entra app **without re-prompting** — WAM/CloudAP presents the PRT (as a
signed `x-ms-RefreshTokenCredential` JWT for browser SSO, or via the token broker for
native apps) and Entra returns app tokens.

## When it is used

- Interactive sign-in on Entra-joined, Hybrid-joined, or Entra-registered Windows devices;
  the PRT is minted at logon and renewed in the background (~every 4 hours, valid ~14 days
  with rolling renewal while used).
- Seamless SSO in Edge/Chrome (via the Windows Accounts / SSO extension) and in native
  apps using WAM/MSAL brokered auth.

## Actors

| Actor | Role |
|---|---|
| User | Human signing in to the device |
| CloudAP | Windows Cloud Authentication Provider plugin driving logon and PRT acquisition |
| TPM | Trusted Platform Module storing the device key and PRT session key |
| WAM | Web Account Manager / token broker requesting app tokens with the PRT |
| Entra | Entra ID token endpoint issuing the PRT and app tokens |
| App | Relying app or browser consuming the derived access token |

## Alternate scenarios covered

- First sign-in — PRT issued together with the device transport/session keys.
- PRT renewal — background refresh before expiry, preserving SSO.
- App token acquisition via the broker — no user prompt.
- Windows Hello for Business gesture as the PRT credential (key-trust).
- PRT invalidated (password change, device disabled, CA revoke) → re-authentication.

## Security notes

- The PRT is bound to the device key in the TPM; it cannot be replayed from another
  device because token requests must be signed with the TPM-held session key.
- The session key is delivered encrypted to the device transport key so it never appears
  in the clear off the TPM.
- PRT theft (e.g. token-broker abuse, `roadtx`-style attacks) is mitigated by device
  compliance CA policies and by binding — treat PRT extraction as a high-severity event.
- A PRT carries an MFA claim if MFA was performed at issuance, so downstream app tokens
  can inherit strong auth; revocation is enforced quickly when combined with
  [Continuous Access Evaluation](../continuous-access-evaluation/README.md).

## Related diagrams

- [Device Join and Registration](../device-join-registration/README.md) — establishes the device identity the PRT binds to
- [Windows Hello for Business](../windows-hello-for-business/README.md) — the TPM-bound gesture that unlocks PRT issuance
- [Conditional Access Evaluation](../conditional-access-evaluation/README.md) — consumes the PRT device + MFA claims as signals
- [Continuous Access Evaluation](../continuous-access-evaluation/README.md) — revokes PRT-derived tokens near real time
- [OIDC Authorization Code + PKCE](../../../oidc/authorization-code-pkce/README.md) — the token protocol underneath brokered auth
- [Kerberos SSO](../../../kerberos/README.md) — the on-prem SSO analogue (Cloud Kerberos ties them)

## Files

- [sequence.md](sequence.md) — PRT issuance, renewal, and brokered app-token acquisition
- [swimlane.md](swimlane.md) — lanes for User, CloudAP, TPM, WAM, Entra, App
- [flowchart.md](flowchart.md) — PRT presence / validity decisions and re-auth terminals
