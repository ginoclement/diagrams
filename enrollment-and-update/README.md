# Enrollment & Update (Registering and Updating Credentials, Devices, and Profile Data)

Before an identity can be used, its **authenticators, devices, credentials, and contact
data** have to be registered — and kept current. This category models the enrollment and
update flows that sit alongside the runtime login flows in [oidc/](../oidc/),
[saml/](../saml/), and [tokenless/](../tokenless/): how a user adds an MFA factor or a
passkey, how a device is brought under management and issued an identity certificate, how
a contact channel is proven, and how profile attributes are changed safely.

A theme runs through all of them: **registration and sensitive updates are themselves
privileged operations**. They happen inside an authenticated session, frequently behind a
**step-up re-authentication**, and a new credential or contact value is treated as
inactive/unverified until the user **proves possession or control** of it. Concepts are
kept technically accurate to real protocols — RFC 6238 TOTP, W3C WebAuthn/FIDO2, MDM/UEM
enrollment, RFC 8894 SCEP and RFC 7030 EST.

## Diagrams

- [mfa-enrollment](mfa-enrollment/README.md) — an authenticated user registers a new MFA factor (TOTP via QR/secret or push), proving possession with the first code and receiving backup codes; SMS/voice, failures, removal, and step-up as alternates.
- [fido2-passkey-registration](fido2-passkey-registration/README.md) — the WebAuthn registration (attestation) ceremony: `navigator.credentials.create()`, authenticator key-pair generation, and storing the credential public key + ID.
- [device-enrollment-mdm](device-enrollment-mdm/README.md) — device/MDM enrollment: user auth, enrollment + management profile, compliance policy, and a device identity certificate, with BYOD vs supervised and quarantine/wipe alternates.
- [certificate-enrollment-scep-est](certificate-enrollment-scep-est/README.md) — automated X.509 enrollment via SCEP (`GetCACaps`, `PKCSReq`) and EST (`/simpleenroll`): CSR, challenge, issuance, pending approval, and renewal.
- [email-phone-verification](email-phone-verification/README.md) — proving control of a contact channel by OTP code or signed link, with expiry, resend/rate-limit, and change-of-verified-channel alternates.
- [profile-attribute-update](profile-attribute-update/README.md) — self-service profile edits where sensitive attributes require step-up and re-verification, non-sensitive commit immediately, and admin-restricted ones are rejected.

## Reading order

Start with [mfa-enrollment](mfa-enrollment/README.md) and
[fido2-passkey-registration](fido2-passkey-registration/README.md) for authenticator
registration, then [device-enrollment-mdm](device-enrollment-mdm/README.md) and
[certificate-enrollment-scep-est](certificate-enrollment-scep-est/README.md) for device
and certificate identity. [email-phone-verification](email-phone-verification/README.md)
is the channel-proof primitive that [profile-attribute-update](profile-attribute-update/README.md)
reuses when a user changes sensitive contact data.

## Related categories

- [tokenless/](../tokenless/) — the authentication ceremonies (passkey, mTLS, magic link) that consume the credentials registered here.
- [kerberos/](../kerberos/) — [PKINIT](../kerberos/pkinit/README.md) uses the certificates issued by these enrollment flows.
- [user-lifecycle/](../user-lifecycle/) — the joiner/mover/leaver processes that trigger enrollment and govern admin-restricted attributes.
