# B2B Guest Invitation and Redemption — Sequence Diagram

Happy path first (invite, redeem via home Entra tenant, access app), then social-account,
email-OTP, JIT redemption, and cross-tenant block alternates.

```mermaid
sequenceDiagram
    autonumber
    actor Inviter
    actor Guest
    participant RT as ResourceTenant
    participant Home as HomeIdP
    participant App as App

    Inviter->>RT: Invite external user (email, redirect URL)
    RT->>RT: Create guest object userType=Guest<br/>UPN user_domain#EXT#@tenant
    RT-->>Guest: Invitation email with redemption link

    Guest->>RT: Click redemption link
    RT->>RT: Check cross-tenant access settings for guest tenant
    RT-->>Guest: Redirect to home IdP for authentication

    alt Home tenant is Entra
        Guest->>Home: Authenticate at home Entra tenant
        Home-->>RT: Token (home MFA/device claims may be trusted)
    else Microsoft / Google social account
        Guest->>Home: Authenticate with social IdP
        Home-->>RT: Social id_token
    else Email one-time passcode
        RT-->>Guest: Email a one-time passcode
        Guest->>RT: Submit passcode
    end

    RT->>RT: Consent, mark guest redeemed
    RT->>RT: Apply Conditional Access for guests (e.g. require MFA)
    RT-->>App: Issue token for guest with resource-tenant authorization
    Guest->>App: Access shared resource
    App-->>Guest: 200 - resource shown

    alt Just-in-time redemption (no link clicked)
        Guest->>App: Access resource directly
        App->>RT: No session, start redemption inline
        RT-->>Guest: Authenticate at home IdP, then proceed
    else Cross-tenant access blocks the guest
        RT-->>Guest: Access denied - inbound tenant/user not allowed
    end
```

Notes

- Authentication happens at the guest's home IdP, authorization and Conditional Access are
  enforced by the resource tenant.
- If cross-tenant settings trust the home tenant's MFA, the guest is not re-challenged,
  otherwise the resource tenant's CA demands its own MFA.
- The `#EXT#` UPN and the guest object let the resource tenant manage lifecycle
  independently of the guest's home account.
