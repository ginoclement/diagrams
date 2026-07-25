# AssumeRoleWithSAML — Sequence Diagram

Happy path first: SP-initiated SSO where AWS is the SP, ending in temporary credentials
and the console. Then alternates: multiple roles to choose from, invalid/expired
assertion, and an audience mismatch.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as Enterprise IdP
    participant STS as STS
    participant IAM as IAM (SAML provider + trust policy)

    User->>Browser: Open AWS from IdP portal (or start at signin)
    Browser->>IdP: Authenticate (credentials + MFA)
    IdP->>IdP: Build signed SAML assertion<br/>(Role attribute = RoleARN,PrincipalARN pairs,<br/>RoleSessionName, SAML:aud = signin.aws.amazon.com/saml)
    IdP-->>Browser: Auto-POST SAMLResponse<br/>to https://signin.aws.amazon.com/saml

    Browser->>STS: POST assertion (console ACS) or<br/>AssumeRoleWithSAML(RoleArn, PrincipalArn, SAMLAssertion)
    STS->>IAM: Match Issuer to IAM SAML provider,<br/>verify assertion signature vs metadata cert
    IAM-->>STS: Signature valid
    STS->>STS: Check NotBefore/NotOnOrAfter, SAML:aud
    STS->>IAM: Role trust policy allows sts:AssumeRoleWithSAML<br/>for this PrincipalArn + SAML:aud condition?
    IAM-->>STS: Allow

    STS-->>Browser: Temporary credentials<br/>(console sign-in token or CLI creds)
    Browser-->>User: AWS Console signed in as assumed-role session

    alt Assertion carries multiple Role values
        STS-->>Browser: AWS role-selection page (list of roles)
        User->>Browser: Choose a role
        Browser->>STS: AssumeRoleWithSAML for chosen RoleArn
        STS-->>Browser: Credentials for the selected role
    end

    alt Assertion signature invalid or expired
        STS->>IAM: Verify signature / check NotOnOrAfter
        IAM-->>STS: Invalid or stale
        STS-->>Browser: 403 error "Your request included an invalid SAML response"
    end

    alt SAML:aud not signin.aws.amazon.com/saml
        STS->>STS: Audience does not target AWS
        STS-->>Browser: AccessDenied (assertion not intended for AWS)
    end
```

Notes

- AWS acts as the SAML SP; the browser exchange mirrors generic
  [SP-initiated SSO](../../../saml/sp-initiated-sso/README.md).
- The `PrincipalArn` in `AssumeRoleWithSAML` is the IAM SAML provider ARN, not a user; the
  `RoleArn` is the role to assume — both arrive paired in the `Role` attribute.
- The `SAML:aud` check plus the assertion signature are what prevent replaying an assertion
  minted for a different service provider.
