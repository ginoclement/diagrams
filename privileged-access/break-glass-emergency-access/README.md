---
title: "Break-Glass Emergency Access"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Break-Glass Emergency Access

**Status:** ✅ Current

## What it is

A small number of highly privileged accounts held in reserve for emergencies — the
identity provider is down, Conditional Access has locked everyone out, every normal admin
is unavailable, or a major incident demands immediate top-level access. Their credentials
are **sealed** (split into parts held by different custodians, stored in a physical safe
or a tightly controlled vault entry) so no single person can use one alone. "Breaking the
glass" is deliberately heavy: it triggers **multi-person control**, **loud real-time
alerting** to security and leadership, and a **mandatory post-use review** that reseals the
account and rotates its secret. Because these accounts bypass the usual guardrails, the
entire control set is compensating detection and accountability rather than prevention.

## When it is used

- **IdP / MFA outage** — the JIT/PIM and federated login paths themselves are unavailable,
  so ordinary elevation cannot be performed.
- **Lockout** — a misconfigured Conditional Access or policy change excludes all normal
  admins; break-glass accounts are the documented exclusion.
- **Severe incident** — ransomware or account compromise requires immediate,
  unquestionable top-level control.

## Actors

| Actor | Role |
|---|---|
| User | Incident responder who must invoke emergency access |
| Custodian | Second (and often third) person holding another credential part / co-authorizing |
| PAM | Vault / access system sealing the credential, enforcing multi-person control, logging |
| SIEM | Monitoring that raises high-severity, hard-to-suppress alerts on any break-glass use |
| Directory | Identity provider holding the emergency account (with standing high privilege) |

## Alternate scenarios covered

- **Multi-person (M-of-N) control** — two or more custodians must co-authorize before the
  seal opens.
- **Directory available vs unavailable** — normal login path down, so break-glass may use
  an out-of-band / cloud-only account that does not depend on the failed component.
- **Single-custodian emergency override** — a documented, even louder path for true
  lone-responder situations, with retroactive review.
- **Abuse / unauthorized attempt** — an invocation with no corresponding incident triggers
  containment rather than access.
- **Post-use review and reseal** — mandatory: rotate the secret, re-split, re-seal, and
  file the incident record; failure to reseal keeps the account quarantined.

## Security notes

- **Detection over prevention.** These accounts exist precisely to bypass controls, so the
  guarantees come from alerting, logging, and after-the-fact review — make every use
  impossible to hide and impossible to ignore.
- **Exclude them from the very controls that could lock them out** (e.g. exempt from the
  Conditional Access policy that failed) but monitor them the hardest.
- **No standing sessions and no everyday use** — a break-glass account signing in on a
  normal Tuesday is itself an incident.
- **Multi-person control** stops a single insider (or a single stolen credential half)
  from wielding emergency privilege alone.
- **Reseal and rotate after every use** — an emergency credential that stays valid after
  the incident is now just an unmonitored superuser password.
- Periodically **test and recertify** the break-glass procedure; a sealed account nobody
  can actually open in a crisis is worse than useless.

## Related diagrams

- [jit-privilege-elevation](../jit-privilege-elevation/README.md) — the everyday path this is the fallback for when PIM/approval is itself unavailable.
- [credential-vault-checkout](../credential-vault-checkout/README.md) — the vault mechanics; break-glass is a hardened, multi-person, alarmed variant of a check-out.
- [session-recording-monitoring](../session-recording-monitoring/README.md) — an invoked emergency session should still be fully recorded.

## Files

- [sequence.md](./sequence.md) — invocation with M-of-N custodian control, alerting, use, and mandatory reseal, plus lone-responder and abuse alternates.
- [swimlane.md](./swimlane.md) — lanes for User, Custodian, PAM, SIEM, Directory.
- [flowchart.md](./flowchart.md) — authorization, alerting, and reseal gates with explicit deny and containment terminals.
