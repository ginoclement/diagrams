# Identity-Aware Proxy (IAP)

**Status:** ✅ Current

## What it is

Google Cloud's **BeyondCorp** front door: a central authorization layer that sits in front of
applications (App Engine, Cloud Run, GCE/GKE behind an external HTTPS load balancer) and TCP
resources. IAP intercepts every request, requires the caller to authenticate with Google, and
checks that the identity holds `roles/iap.httpsResourceAccessor` (or the TCP equivalent) on the
resource — plus any **Access Context Manager access levels** (device posture, IP range,
geography) required by context-aware access. Only requests that pass reach the backend, which
receives a **signed IAP JWT** (`x-goog-iap-jwt-assertion`) it can verify to learn the user's
identity. This enforces access at the network edge without a VPN.

## When it is used

- Zero-trust access to internal web apps and admin consoles, replacing perimeter VPNs.
- SSH/RDP to VMs via IAP TCP forwarding without public IPs.
- Context-aware access: allow only managed, compliant devices from approved locations.

## Actors

| Actor | Role |
|---|---|
| User | Human (or service account) requesting a protected app |
| Browser | User agent carrying the Google sign-in and IAP session cookie |
| IAP | The Identity-Aware Proxy enforcing authentication + authorization |
| Google | Google Sign-In / OAuth issuing the identity IAP relies on |
| ACM | Access Context Manager evaluating access levels (device, IP, geo) |
| Backend | The protected application receiving the signed IAP JWT |

## Key mechanism details

- IAP runs as part of the external HTTPS load balancer; unauthenticated browser requests are
  redirected to Google Sign-In and an OAuth consent for the IAP-managed OAuth client.
- Authorization = IAM check for `roles/iap.httpsResourceAccessor` on the backend service /
  resource, evaluated with any IAM Conditions that reference access levels.
- **Access levels** are defined in Access Context Manager and bound via IAM Conditions
  (`request.auth.access_levels`) or the access policy; they encode device certificate, OS,
  screen lock, IP CIDR, and region requirements.
- The backend validates `x-goog-iap-jwt-assertion` against IAP's public keys
  (`https://www.gstatic.com/iap/verify/public_key`), checking `iss`, `aud` (the backend's
  signed header audience), and `exp`, then trusts the `email`/`sub` claims.

## Alternate scenarios covered

- Not signed in → redirect to Google Sign-In.
- Signed in but lacks `iap.httpsResourceAccessor` → 403 from IAP (backend never hit).
- Access level fails (unmanaged device / disallowed region) → denied even with the IAM role.
- Programmatic access with an OIDC ID token (`aud` = IAP client ID) instead of the browser cookie.

## Security notes

- The backend must **always** verify the IAP JWT and must be reachable only through IAP (lock
  the LB/firewall so the app cannot be hit directly, bypassing IAP).
- Context-aware access levels add device/location assurance on top of identity — treat them as
  required conditions, not optional hints.
- Grant `iap.httpsResourceAccessor` narrowly per app; it is the single gate to the backend.
- IAP sessions expire; combine with short session lifetimes and re-auth for sensitive apps.

## Related diagrams

- [IAM Policy Evaluation](../iam-policy-evaluation/README.md) — how the accessor role + conditions resolve
- [OAuth to Google APIs](../oauth-google-apis/README.md) — the Google sign-in / consent IAP leans on
- [Service Account Impersonation](../service-account-impersonation/README.md) — `generateIdToken` for programmatic IAP access
- [Entra Conditional Access](../../entra/conditional-access-evaluation/README.md) — the Microsoft context-aware-access analogue

## Files

- [sequence.md](sequence.md) — browser happy path plus not-signed-in, no-role, access-level, and programmatic alternates
- [swimlane.md](swimlane.md) — lanes for User, Browser, IAP, Google, ACM, Backend
- [flowchart.md](flowchart.md) — authentication, IAM, and access-level gates with deny terminals
