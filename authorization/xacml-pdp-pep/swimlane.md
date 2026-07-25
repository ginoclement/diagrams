# XACML — Swimlane Diagram

One lane per XACML component. The Context Handler sits between the PEP and PDP; the PAP feeds
policy and the PIP feeds attributes.

```mermaid
flowchart TD
    subgraph PEP
        E1["Intercept access request"]
        E2["Hand native request to<br/>Context Handler"]
        E3{"Decision?"}
        E4{"Obligations<br/>fulfillable?"}
        E5["Grant access"]
        E6["Deny (403)"]
    end

    subgraph CH["Context Handler"]
        H1["Build canonical XACML<br/>request context"]
        H2["Send request to PDP"]
        H3["Resolve attribute queries<br/>via PIP"]
        H4["Return decision + obligations"]
    end

    subgraph PDP
        D1["Match Target -> applicable policies"]
        D2["Evaluate rules + conditions"]
        D3["Apply combining algorithm"]
        D4["Return Permit/Deny/<br/>NotApplicable/Indeterminate"]
    end

    subgraph PIP
        I1["Supply subject/resource/<br/>environment attributes"]
    end

    subgraph PAP
        A1["Author + publish policies"]
    end

    A1 -.->|"policies"| D1
    E1 --> E2 --> H1 --> H2 --> D1 --> D2
    D2 -->|"needs attribute"| H3 --> I1 --> D2
    D2 --> D3 --> D4 --> H4 --> E3
    E3 -->|Permit| E4
    E4 -->|Yes| E5
    E4 -->|No| E6
    E3 -->|"Deny / NotApplicable / Indeterminate"| E6
```

Notes

- The PAP lane publishes policy to the PDP out of band (dashed); the PIP lane answers attribute
  queries mediated by the Context Handler during evaluation.
- The **obligation gate** (`E4`) is unique to the PEP lane: a Permit only becomes a grant if its
  obligations can be fulfilled — otherwise it collapses to deny.
- NotApplicable and Indeterminate both route to the deny terminal via the PEP's fail-closed default.
