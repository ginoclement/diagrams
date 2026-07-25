# B2B Guest Invitation and Redemption — Swimlane

One lane per actor. Authentication crosses into the Home IdP lane; authorization stays in
the Resource Tenant lane.

```mermaid
flowchart TD
    subgraph Inviter
        N1["Send invitation<br/>(email, redirect URL)"]
    end

    subgraph Guest
        G1["Open redemption link"]
        G2["Authenticate at home IdP<br/>/ enter OTP"]
        G3(["Access shared resource"])
        G4(["Access denied"])
    end

    subgraph ResourceTenant
        R1["Create guest object<br/>userType=Guest, #EXT# UPN"]
        R2{"Cross-tenant access<br/>allows this guest?"}
        R3["Consent + mark redeemed"]
        R4["Apply guest Conditional Access"]
        R5["Issue token with<br/>resource-tenant authorization"]
    end

    subgraph HomeIdP
        H1["Authenticate guest,<br/>return token / claims"]
    end

    subgraph App
        P1["Serve shared resource"]
    end

    N1 --> R1 --> G1 --> R2
    R2 -->|No| G4
    R2 -->|Yes| G2 --> H1 --> R3 --> R4 --> R5 --> P1 --> G3
```

Notes

- `R2` is the cross-tenant access gate — inbound tenant/user allow-lists and MFA/device
  trust decisions live here.
- The Home IdP lane authenticates the guest; the Resource Tenant lane owns the guest object,
  Conditional Access, and the final authorization.
