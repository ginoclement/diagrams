# Impossible Travel / Anomalous Session Detection

**Status:** ✅ Current

## What it is

A detection that flags a sign-in or session as suspicious when the **geographic distance**
between two authentication events, divided by the **time between them**, implies a travel
speed no human could achieve — a login from New York and, twenty minutes later, one from
Singapore. The **detection engine** consumes **geolocation and velocity** derived from IP
(with ASN / VPN context) plus behavioural baselines, and when the implied velocity is
**infeasible** it raises an **impossible-travel** anomaly. Policy then responds: **force
re-authentication / step-up** to confirm it is really the user, or, for high-confidence or
compounded signals, **block and revoke** the session outright and alert. Because IP
geolocation is noisy, mature implementations account for **corporate VPN / egress**,
**known travel**, and **allowlisted networks** to suppress false positives. This is one of
the strongest **hard signals** in adaptive access — it frequently drives the deny branch of
risk-based policy and the mid-session revocation of continuous evaluation.

## When it is used

- Account-takeover detection in workforce and consumer IdPs, catching an attacker signing
  in from a different geography than the legitimate user's active session.
- As a **hard signal** feeding risk-based adaptive authentication and as a trigger for
  continuous access evaluation to re-check an already-issued session.
- Anywhere concurrent sessions from implausibly distant locations should force
  re-verification rather than silently coexisting.

## Actors

| Actor | Role |
|---|---|
| User | Legitimate account holder (and, in the attack case, a distant attacker) |
| IdP | Identity Provider handling sign-in and holding the active session |
| Detection | Anomaly / UEBA engine computing travel velocity against history |
| GeoIP | Geolocation, ASN / VPN, and reputation feed the engine relies on |
| Enforcement | Session / token authority that forces re-auth or revokes (CAE / policy enforcement) |

## Alternate scenarios covered

- **Feasible travel → allow** — the velocity between events is physically plausible; no
  action, the session continues.
- **Impossible travel → step-up** — infeasible velocity forces re-authentication; on success
  the anomaly is cleared and access continues.
- **High-confidence anomaly → block + revoke** — impossible travel compounded with other
  signals (known-bad IP, leaked credential) blocks and revokes active sessions, with an
  alert.
- **Step-up fails → revoke** — the user cannot re-verify; the session is revoked and blocked.
- **False-positive suppression** — corporate VPN egress, known travel, or an allowlisted
  network downgrades or clears the flag.

## Security notes

- **Impossible travel is a hint, not proof.** VPNs, mobile carrier NAT, and CGNAT routinely
  make geolocation jump — weight it as high-signal but confirm with step-up rather than
  blocking blindly, except when compounded with a hard signal.
- **Prefer revoke over allow on failure.** If the user cannot re-verify, revoke the session;
  fail closed rather than leaving a possibly-hijacked session live.
- **Detection is only useful with enforcement.** The anomaly must reach a session authority
  that can actually force re-auth or revoke mid-session — pair it with continuous access
  evaluation, not just sign-in-time checks.
- **Tune against the VPN corpus.** Maintain egress-IP and known-travel context so the signal
  stays trustworthy; an alert that cries wolf trains responders to ignore it.
- **Log the pair of events.** Record both locations, the time delta, and the computed
  velocity so the decision is auditable and the detection can be tuned.

## Related diagrams

- [risk-based-adaptive-authentication](../risk-based-adaptive-authentication/README.md) — the risk policy this anomaly feeds as a hard signal.
- [continuous-access-evaluation](../continuous-access-evaluation/README.md) — the mechanism that revokes an already-issued session when this fires mid-session.
- [step-up-authentication](../step-up-authentication/README.md) — the re-authentication challenge used to confirm a flagged session.
- [device-posture-conditional-access](../device-posture-conditional-access/README.md) — a device signal that combines with location in the same policy.

## Files

- [sequence.md](sequence.md) — two sign-in events → velocity check → allow / step-up / block + revoke, plus step-up-failure and false-positive alternates.
- [swimlane.md](swimlane.md) — lanes for User, IdP, Detection, GeoIP, Enforcement.
- [flowchart.md](flowchart.md) — the velocity-to-outcome decision tree with explicit block and revoke terminals.
