---
title: "AssumeRoleWithSAML — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AssumeRoleWithSAML — Swimlane Diagram

One lane per actor. The signed assertion crosses from the IdP through the browser to STS.

```mermaid
flowchart TD
    subgraph User
        U1["Open AWS from IdP portal"]
        U2["Choose role<br/>(only if multiple offered)"]
        U3(["Signed into AWS Console/CLI"])
    end

    subgraph Browser
        B1["Authenticate at IdP"]
        B2["Auto-POST SAMLResponse<br/>to AWS ACS URL"]
        B3["Present temp credentials / console token"]
    end

    subgraph IdP["Enterprise IdP"]
        I1["Authenticate user + MFA"]
        I2["Build signed assertion<br/>(Role, RoleSessionName, SAML:aud)"]
    end

    subgraph STS
        T1["Receive AssumeRoleWithSAML"]
        T2["Check NotBefore/NotOnOrAfter + SAML:aud"]
        T3["Mint temporary credentials"]
    end

    subgraph IAM["IAM"]
        M1{"Issuer matches an<br/>IAM SAML provider?"}
        M2{"Assertion signature valid<br/>vs metadata cert?"}
        M3{"Trust policy allows this<br/>PrincipalArn + SAML:aud?"}
        M4(["AccessDenied"])
    end

    U1 --> B1 --> I1 --> I2 --> B2 --> T1 --> M1
    M1 -->|No| M4
    M1 -->|Yes| M2
    M2 -->|No| M4
    M2 -->|Yes| T2 --> M3
    M3 -->|No| M4
    M3 -->|Yes| T3 --> B3 --> U3
    T3 -.->|"multiple roles"| U2 --> T3
```

Notes

- AWS is the SAML SP; the IAM lane holds the SAML provider metadata (`M1`, `M2`) and the
  role trust policy (`M3`).
- The role-selection loop (`U2`) only appears when the assertion carries more than one
  `Role` attribute value.
- For central multi-account assignment instead of one role per account, see
  [IAM Identity Center](../iam-identity-center-sso/README.md).
