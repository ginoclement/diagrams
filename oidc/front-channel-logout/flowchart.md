# Front-Channel Logout — Decision Flowchart

Decision logic from the IdP emitting iframes through each RP's handling of the
logout URI request, with explicit partial-logout terminals.

```mermaid
flowchart TD
    S([IdP session terminated - propagate logout]) --> A{"Any RPs registered with<br/>frontchannel_logout_uri<br/>in this session?"}
    A -->|no| Z([Nothing to propagate front-channel])
    A -->|yes| B["Render logout page with one hidden<br/>iframe per RP logout URI"]
    B --> C{"frontchannel_logout_session_required<br/>for this RP?"}
    C -->|yes| D["Append ?iss=issuer&sid=session_id"]
    C -->|no| E["Plain GET, no parameters"]
    D --> F{"Browser loads frame?"}
    E --> F

    F -->|"blocked (CSP / X-Frame-Options /<br/>network error / user navigated away)"| P1(["PARTIAL LOGOUT -<br/>RP session survives, IdP unaware"])
    F -->|loaded| G{"RP session cookie sent<br/>in third-party context?"}
    G -->|"no - cookies partitioned or blocked"| P2(["PARTIAL LOGOUT -<br/>RP cannot find its session"])
    G -->|yes| H{"RP requires iss + sid -<br/>are they present and valid?"}
    H -->|"missing / mismatch"| R1(["RP ignores request<br/>(logout-CSRF defense) - session kept"])
    H -->|"valid (or not required)"| I["RP clears local session<br/>cookie + server-side state"]
    I --> OK([RP logged out])

    OK --> T{"All RP frames succeeded?"}
    P1 --> T
    P2 --> T
    T -->|"unknowable - IdP gets no acks"| U(["IdP proceeds after timeout -<br/>logout is best-effort"])
```

Notes

- There is deliberately no "success" edge from the IdP's perspective: the final
  terminal reflects that completeness cannot be verified over the front channel.
- Pair with [Back-Channel Logout](../back-channel-logout/README.md) when reliable
  propagation is required.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
