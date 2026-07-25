# Privileged Session Recording & Monitoring

**Status:** ✅ Current

## What it is

A privileged session — RDP, SSH, database client, web admin console — is routed through a
**session proxy** instead of connecting directly to the target. The proxy brokers the
credential (see [credential-vault-checkout](../credential-vault-checkout/README.md)),
then **records everything**: full-motion video / screen for graphical sessions,
**keystroke and command logs** for terminals, SQL statements for database sessions, and
file-transfer metadata. A monitoring engine evaluates the stream **in real time** against
policy — flagging or blocking forbidden commands, and **terminating the session** on a
serious violation or on live operator command. The recording is stored tamper-evidently
for audit, forensics, and compliance replay.

## When it is used

- Third-party / vendor and contractor access to production, where you want an unforgeable
  record of exactly what was done.
- High-value targets (domain controllers, payment systems, jump hosts) under PCI DSS,
  SOX, HIPAA, or DORA session-monitoring obligations.
- Any place where "who ran which command on that box, and when" must be answerable after
  the fact and, ideally, stopped in the act.

## Actors

| Actor | Role |
|---|---|
| User | Privileged administrator or vendor whose session is proxied |
| Proxy | Session broker: mediates the connection, injects credentials, captures the stream |
| Monitor | Real-time policy / analytics engine that inspects commands and can terminate |
| Store | Tamper-evident recording store for video, keystroke, and command logs |
| Target | The system being administered through the proxy |

## Alternate scenarios covered

- **Clean session** — recorded and stored, no policy hits.
- **Forbidden command flagged** — a risky command raises a real-time alert but is allowed
  to continue (monitor-only policy).
- **Auto-termination** — a blocked command or threshold trips automatic session kill.
- **Live operator termination** — a SOC analyst watching the stream ends the session
  manually.
- **Direct-connect bypass attempt** — a user tries to reach the target off-proxy; network
  policy forces all privileged paths through the proxy or denies them.
- **Recording-store failure** — capture cannot be persisted; policy decides whether the
  session fails closed (no recording, no session) or continues degraded with an alert.

## Security notes

- **No recording, no session** (fail-closed) is the safest posture: if the capture path
  is down, a privileged session with no audit trail is usually worse than no session.
- **Enforce the proxy as the only path** — recording is meaningless if a user can connect
  directly to the target; combine with network segmentation and firewalling.
- **Protect the recordings** as sensitive data: they contain credentials typed on screen,
  secrets, and PII. Store encrypted, access-controlled, and tamper-evident (hash-chained /
  WORM), and mask captured secrets where possible.
- **Real-time termination** turns recording from purely forensic into preventive — the
  value is stopping the destructive command, not just replaying it later.
- Recording is **notice-and-consent** sensitive: privileged users must be told sessions
  are recorded, and scope must respect legal / works-council constraints.
- Correlate session identity back to the **individual human**, even for shared or brokered
  target accounts.

## Related diagrams

- [credential-vault-checkout](../credential-vault-checkout/README.md) — the brokered credential injection that opens the session being recorded here.
- [ssh-bastion-jump-host](../ssh-bastion-jump-host/README.md) — a common network choke point where session recording is applied.
- [jit-privilege-elevation](../jit-privilege-elevation/README.md) — the elevation that authorizes the session in the first place.
- [break-glass-emergency-access](../break-glass-emergency-access/README.md) — emergency sessions should be recorded like any other.

## Files

- [sequence.md](sequence.md) — proxied session setup, live monitoring, and termination, plus flagged-command, operator-kill, bypass, and store-failure alternates.
- [swimlane.md](swimlane.md) — lanes for User, Proxy, Monitor, Store, Target.
- [flowchart.md](flowchart.md) — capture / policy / termination decision gates with explicit deny and kill terminals.
