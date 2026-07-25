# Backlog — diagrams not yet built

The second-phase expansion (cloud IAM, authorization, workload identity, threat/defense,
CI/CD, personas, decision guides, directory sync, privileged access, adaptive access, and
the OIDC protocol-depth set) was **interrupted by an account spend limit** partway through.
Everything committed is complete (full sequence + swimlane + flowchart, or for decision
guides, flowchart + comparison table). The diagrams below were planned but not finished;
incomplete stubs were removed so the repo stays consistent. Rebuild these when budget resets.

## cloud-iam/aws
- sigv4-request-signing
- cross-account-role-assumption
- imdsv2-instance-credentials  *(IMDSv1 called out as ⛔ deprecated)*

## cloud-iam/entra
- managed-identity-imds
- workload-identity-federation
- hybrid-identity-sync  *(PHS vs PTA vs federation)*

## cloud-iam/gcp
- oauth-google-apis

## authorization
- scopes-claims-entitlements
- policy-decision-enforcement  *(generic PEP/PDP/PIP/PAP)*
- oauth-consent-authorization

## workload-identity
- kubernetes-serviceaccount-token
- mutual-tls-bootstrap

## threat-defense
- oauth-consent-phishing
- device-code-phishing
- aitm-mfa-phishing
- token-theft-replay

## personas
- credential-recovery-by-persona
- access-review-by-persona

## directory-and-sync
- pass-through-authentication
- federated-vs-managed-auth
- hr-driven-inbound-provisioning
- group-membership-sync

## privileged-access
- session-recording-monitoring
- ssh-bastion-jump-host
- secrets-broker-dynamic-credentials

## adaptive-access
- mfa-fatigue-number-matching
- device-posture-conditional-access
- impossible-travel-anomaly

## oidc (protocol depth)
- mtls-bound-tokens  *(RFC 8705)*
- dynamic-client-registration  *(RFC 7591/7592)*
- jar-jarm  *(RFC 9101)*
- rich-authorization-requests  *(RAR, RFC 9396)*
- session-management  *(🟡 legacy)*
- resource-owner-password-credentials  *(⛔ deprecated)*

## decision-guides
- choosing-an-authorization-model
- saml-to-oidc-migration

## Cross-cutting
- Backfill explicit `Status:` lines on first-pass diagrams (saml, oidc core, tokenless, kerberos, etc.)
