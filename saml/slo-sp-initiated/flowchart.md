---
title: "SP-Initiated Single Logout — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SP-Initiated Single Logout — Decision Flowchart

Focus: IdP-side validation, the propagation loop over session participants, binding
selection, and how failures roll up into a `PartialLogout` status.

```mermaid
flowchart TD
    Start(["LogoutRequest arrives at IdP SLO endpoint"]) --> Sig{"Signature valid for<br/>the issuing SP?"}
    Sig -->|No| ErrSig(["Reject: unsigned or forged<br/>logout request - do not log out"])
    Sig -->|Yes| Match{"NameID + SessionIndex<br/>match a live IdP session?"}
    Match -->|No| ErrNoSess(["Return LogoutResponse:<br/>no matching session"])
    Match -->|Yes| Kill["Terminate IdP session immediately"]

    Kill --> Next{"More session-participant<br/>SPs to notify?"}
    Next -->|Yes| Binding{"SP supports which<br/>SLO binding?"}
    Binding -->|"HTTP-Redirect / HTTP-POST"| FC["Front-channel: route Browser to SP<br/>SLO endpoint with signed LogoutRequest"]
    Binding -->|SOAP| BC["Back-channel: direct SOAP<br/>LogoutRequest to SP endpoint"]

    FC --> FCResp{"Browser returned with<br/>LogoutResponse Success?"}
    BC --> BCResp{"SOAP LogoutResponse<br/>Success received?"}
    FCResp -->|Yes| MarkOK["Mark SP logged out"] --> Next
    BCResp -->|Yes| MarkOK
    FCResp -->|"No - timeout, error,<br/>or chain broken"| MarkFail["Mark SP failed"] --> Next
    BCResp -->|"No - unreachable<br/>or error status"| MarkFail

    Next -->|No| AnyFail{"Any participant<br/>failed?"}
    AnyFail -->|No| RespOK["LogoutResponse to initiating SP:<br/>Status Success"]
    AnyFail -->|Yes| RespPartial["LogoutResponse to initiating SP:<br/>second-level status PartialLogout"]
    RespOK --> Done(["SP1 shows: signed out everywhere"])
    RespPartial --> Warn(["SP1 shows: partial logout -<br/>some sessions may remain"])
```

Notes

- The signature gate is critical: accepting unsigned `LogoutRequest`s lets any attacker
  force-logout users (denial of service) or disguise session fixation.
- The IdP session dies before propagation begins, so a broken front-channel chain can
  strand SP sessions but never revive SSO.
- `PartialLogout` is a signal to the UI, not an error: the initiating SP should tell
  the user to close the browser to clear any surviving sessions.
