# Credential Vault Check-Out / Check-In

**Status:** ✅ Current

## What it is

A privileged credential — a shared local-admin password, a domain-admin account, a
database `sa` password, an appliance root — lives only inside a PAM **vault**, never on
an administrator's machine. To use it, an administrator **checks it out**: the vault
verifies who they are, checks entitlement and (optionally) an approval, then either
reveals the secret for a bounded window or, in the stronger **brokered** model, injects
it directly into a session so the human never sees it at all. On **check-in** — explicit,
on session end, or at the end of a lease — the vault **rotates** the credential so the
value that was checked out can never be reused.

## When it is used

- Shared / break-glass style accounts that cannot practically be made per-person
  (network gear, hypervisors, legacy apps, DB superusers).
- Meeting "no standing shared passwords" and "rotate after every use" control
  requirements (PCI DSS, SOX, ISO 27001, cyber-insurance attestations).
- As the enforcement point in front of accounts that also feed
  [session recording](../session-recording-monitoring/README.md).

## Actors

| Actor | Role |
|---|---|
| User | Privileged administrator requesting the credential |
| PAM | Vault + access broker: authenticates the admin, enforces policy, stores and rotates the secret |
| Approver | Optional human who authorizes high-risk check-outs |
| Target | The managed system whose privileged account is being used (server, DB, appliance) |
| Directory | Identity source authenticating the admin and (for domain accounts) holding the account being rotated |

## Alternate scenarios covered

- **Reveal model** — the vault displays / copies the password for a time-boxed window.
- **Brokered / proxied model** — the vault injects the credential into an RDP/SSH/DB
  session; the human never learns the value (strongly preferred).
- **Exclusive lock vs concurrent** — one-at-a-time check-out to preserve accountability,
  versus concurrent check-out with per-session attribution.
- **Approval required** — a check-out that trips a policy threshold waits for an approver.
- **Auto check-in on timeout** — abandoned sessions are reclaimed and the secret rotated.
- **Rotation failure** — the target is unreachable at check-in; the credential is flagged,
  the account quarantined, and the value not returned to the available pool.

## Security notes

- **Rotate on every check-in.** The whole model collapses if a revealed password
  outlives the session; treat any credential that was displayed as burned.
- Prefer **brokering over revealing** — a secret the human never sees cannot be
  written down, pasted into a chat, or phished later.
- The **vault's own** authentication must be strong (phishing-resistant MFA) and its
  master keys protected by an HSM; the vault is now the single highest-value target.
- Bind each check-out to a **specific human** even for a shared account, so the audit
  log answers "who used root at 02:00", not just "root logged in".
- Store a **verifiable reconciliation** loop: the vault should periodically confirm the
  password it holds still works, and detect out-of-band changes.
- Auto check-in / forced rotation on session timeout closes the "walked away with it
  checked out" gap.

## Related diagrams

- [session-recording-monitoring](../session-recording-monitoring/README.md) — the brokered session opened here is usually also recorded.
- [jit-privilege-elevation](../jit-privilege-elevation/README.md) — the account-role alternative to vaulting a shared secret.
- [break-glass-emergency-access](../break-glass-emergency-access/README.md) — a special sealed check-out with multi-person control.
- [secrets-broker-dynamic-credentials](../secrets-broker-dynamic-credentials/README.md) — instead of rotating one shared secret, mint a fresh short-lived one per use.

## Files

- [sequence.md](sequence.md) — check-out, brokered session, check-in with rotation, plus approval and rotation-failure alternates.
- [swimlane.md](swimlane.md) — lanes for User, PAM, Approver, Target, Directory.
- [flowchart.md](flowchart.md) — entitlement / approval / rotation decision gates with explicit deny and error terminals.
