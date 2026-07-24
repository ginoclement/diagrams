# Auth0 Universal Login + Actions — Decision Flowchart

The post-login Actions pipeline: each Action can enrich, redirect-and-resume,
require MFA, or deny. Terminal states show blocked login and issued tokens.

```mermaid
flowchart TD
    Start(["User authenticated at<br/>Universal Login"]) --> Pipe["Start ordered<br/>post-login Actions"]
    Pipe --> Run["Run next Action<br/>(event, api)"]

    Run --> Deny{"api.access.deny<br/>called?"}
    Deny -->|yes| EDeny(["Login blocked -<br/>no tokens issued"])
    Deny -->|no| Redir{"api.redirect<br/>requested?"}

    Redir -->|yes| Out["302 to external page<br/>(signed state token)"]
    Out --> Back{"User returns to<br/>/continue with valid token?"}
    Back -->|"no / tampered"| EResume(["Abort: redirect state<br/>invalid or expired"])
    Back -->|yes| Resume["Resume Action pipeline"]
    Resume --> More
    Redir -->|no| Enrich["Apply setCustomClaim,<br/>maybe multifactor.enable"]

    Enrich --> More{"More Actions<br/>in pipeline?"}
    More -->|yes| Run
    More -->|no| MFA{"MFA enabled<br/>by an Action?"}

    MFA -->|yes| DoMFA{"MFA challenge<br/>passed?"}
    DoMFA -->|no| EMFA(["Login blocked -<br/>MFA failed"])
    DoMFA -->|yes| Tokens
    MFA -->|no| Tokens(["Mint code -> issue tokens<br/>with custom claims"])
```
