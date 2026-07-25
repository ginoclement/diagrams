# Privileged Session Recording and Monitoring

**Status:** ✅ Current

## What it is

A privileged connection to a sensitive target (server, database, network device) is not
made directly. It is brokered through a **session proxy** — a Privileged Session Manager
(PSM) or jump proxy — that sits inline between the operator and the target. The proxy
**injects the target credential** (so the human never sees it), **records the session**
(full-motion screen capture for graphical protocols, plus a structured **keystroke and
command log** for shell and database protocols), and runs a **real-time policy engine**
that inspects each command as it is issued. Benign activity passes through transparently;
a prohibited command can be **blocked in-line**, and a session that trips a hard rule (or
is flagged by a live reviewer) can be **terminated mid-stream**. The recording is sealed
and retained as tamper-evident audit evidence. Canonical implementations include CyberArk
PSM, BeyondTrust, Teleport, and StrongDM.

## When it is used

- High-value targets under change-control, compliance, or "four-eyes" mandates
  (PCI-DSS, SOX, HIPAA) where every privileged action must be attributable and replayable.
- Vendor / third-party remote access, where you must supervise and can revoke a session
  you do not otherwise control.
- The enforcement point an elevated or vaulted session is routed through, so that
  "who did what" survives even when the underlying account is shared.

## Actors

| Actor | Role |
|---|---|
| User | Privileged operator connecting to a target |
| Proxy | Session proxy / PSM that brokers the connection, injects credentials, and captures the session |
| Policy | Real-time policy / command-filtering engine consulted per command |
| Recorder | Recording and keystroke / command log store (tamper-evident) |
| Target | Target host, database, or device being administered |
| Reviewer | SOC analyst / auditor watching live or reviewing the recording later |

## Alternate scenarios covered

- **Allowed session** — commands pass the real-time policy, the session completes, and the
  recording is sealed and indexed.
- **Command blocked in-line** — a prohibited command matches a filter rule and is rejected
  without reaching the target, while the session continues.
- **Session terminated** — a hard-rule violation (or a live reviewer's kill action) tears
  the connection down mid-stream and raises an alert.
- **Idle / max-duration timeout** — an unattended or over-long session is closed
  automatically.
- **Live four-eyes monitoring** — a reviewer shadows the session in real time and can
  intervene.

## Security notes

- **Credential injection is the point** — the operator authenticates to the proxy, never
  to the target directly, so the target secret is never exposed and can be rotated freely.
- **Protect the recordings** — write them to append-only / WORM storage with integrity
  hashing, because a session log an admin can edit is not audit evidence.
- **Command filtering is defence-in-depth, not a boundary** — treat it as high-signal
  detection and containment; a determined operator on an interactive shell can obfuscate,
  so pair it with least-privilege on the target account itself.
- **Fail closed on the proxy** — if the recorder or policy engine is unavailable, deny new
  privileged sessions rather than allowing an unrecorded one.
- **Feed live alerts to the SOC** — real-time termination and reviewer intervention are
  only useful if someone is actually watching high-risk sessions.

## Related diagrams

- [jit-privilege-elevation](../jit-privilege-elevation/README.md) — the elevated role whose session is routed through this recording proxy.
- [ssh-bastion-jump-host](../ssh-bastion-jump-host/README.md) — the certificate-based bastion that is often the transport the proxy records over.
- [credential-vault-checkout](../credential-vault-checkout/README.md) — the vault that supplies the injected target credential.
- [break-glass-emergency-access](../break-glass-emergency-access/README.md) — emergency access that must still be recorded and reviewed after the fact.

## Files

- [sequence.md](sequence.md) — connect → credential injection → per-command policy → sealed recording, plus block, terminate, and timeout alternates.
- [swimlane.md](swimlane.md) — lanes for User, Proxy, Policy, Recorder, Target, Reviewer.
- [flowchart.md](flowchart.md) — per-command decision loop with explicit block and terminate terminals.
