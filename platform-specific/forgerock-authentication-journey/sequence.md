---
title: "ForgeRock / PingAM Authentication Journey — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# ForgeRock / PingAM Authentication Journey — Sequence Diagram

Happy path: the client POSTs to `/authenticate`, AM returns `authId` + callbacks per
node (Username Collector, Password Collector, Data Store Decision), the client fills
and resubmits until the tree reaches Success and AM issues a session `tokenId`. From
there app federation is standard
[OIDC](../../oidc/authorization-code-pkce/README.md). Alternates: failure branch, MFA
node, account lockout, progressive profiling inner tree.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client
    participant AM as PingAM
    participant Dir as Directory (DS)

    %% ----- happy path -----
    Client->>AM: POST /json/realms/root/authenticate (no body, tree name)
    AM->>AM: Start node -> Page Node<br/>(Username + Password Collectors)
    AM-->>Client: authId + callbacks (NameCallback, PasswordCallback)
    Client->>User: Render username + password prompts
    User->>Client: Enter username and password
    Client->>AM: POST authId + filled callbacks
    AM->>AM: Advance to Data Store Decision node
    AM->>Dir: Bind / verify credentials
    Dir-->>AM: Credentials valid (true outcome)
    AM->>AM: Follow true branch -> Success node
    AM-->>Client: tokenId (SSO session) + successUrl
    Client-->>User: Authenticated - session established

    Note over Client,AM: App SSO now proceeds via standard OIDC/SAML using the session

    %% ----- alternates -----
    alt Data Store Decision returns false
        AM->>Dir: Verify credentials
        Dir-->>AM: Invalid (false outcome)
        AM->>AM: Follow false branch -> Retry / failure node
        AM-->>Client: authId + callbacks again (re-prompt) or Failure
    end

    alt MFA node in the tree
        AM->>AM: Advance to Push / OTP / WebAuthn node
        AM-->>Client: authId + callbacks (e.g. HiddenValueCallback, poll)
        User->>Client: Approve push / enter OTP / sign WebAuthn
        Client->>AM: POST authId + MFA callbacks
        AM->>AM: MFA node true outcome -> continue
    end

    alt Account lockout node
        loop Repeated failures
            Client->>AM: POST authId + wrong password
            AM->>AM: Retry Limit node decrements counter
        end
        AM->>Dir: Set account lockout flag
        AM-->>Client: Failure - account locked
    end

    opt Progressive profiling (Inner Tree Evaluator)
        AM->>AM: Enter inner tree - collect missing attributes
        AM-->>Client: authId + callbacks (StringAttributeInputCallback)
        User->>Client: Provide missing profile fields
        Client->>AM: POST authId + attribute callbacks
        AM->>Dir: Update user profile
        AM->>AM: Inner tree returns -> outer tree Success
    end
```
