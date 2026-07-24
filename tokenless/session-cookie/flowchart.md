# Session Cookie Authentication — Decision Flowchart

Branch-focused view: credential validation with lockout, session validation on
subsequent requests, and the CSRF gate for state-changing requests.

```mermaid
flowchart TD
    Start(["Request arrives"]) --> HasSid{"Has session cookie?"}

    %% ----- no session: login path -----
    HasSid -->|no| Login["Show login form<br/>(anonymous session + CSRF token)"]
    Login --> Submit["POST /login"]
    Submit --> Locked{"Account locked?"}
    Locked -->|yes| ELock(["Generic error:<br/>try again later"])
    Locked -->|no| Creds{"Credentials valid?"}
    Creds -->|no| Count["Increment failed-attempt counter"]
    Count --> Thresh{"Counter >= threshold?"}
    Thresh -->|yes| DoLock["Lock account temporarily"] --> ELock
    Thresh -->|no| EBad(["Generic error:<br/>invalid credentials"])
    Creds -->|yes| Rotate["Rotate session ID<br/>(destroy pre-login sid)"]
    Rotate --> SetCookie["Set-Cookie: new sid<br/>HttpOnly, Secure, SameSite"]
    SetCookie --> OK(["Authenticated session established"])

    %% ----- has session: validation path -----
    HasSid -->|yes| Lookup{"Session found in store?"}
    Lookup -->|no| EStale(["302 to login:<br/>session unknown"])
    Lookup -->|yes| Expired{"Idle or absolute<br/>timeout exceeded?"}
    Expired -->|yes| Destroy["Destroy session record"] --> EExp(["302 to login:<br/>session expired"])
    Expired -->|no| Mutating{"State-changing request?<br/>(POST/PUT/DELETE)"}
    Mutating -->|no| Serve(["200: serve resource"])
    Mutating -->|yes| Csrf{"CSRF token matches<br/>session-bound value?"}
    Csrf -->|no| ECsrf(["403 Forbidden:<br/>CSRF check failed"])
    Csrf -->|yes| Act(["200: perform action"])
```
