---
title: "Choosing a Kerberos Delegation Model"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing a Kerberos Delegation Model

**Status:** ✅ Current

When a front-end service must call a back-end service **as the user**, Kerberos offers
three delegation models. This guide picks between them. The recommendation:
**resource-based constrained delegation (RBCD)** is the modern default; classic
**constrained delegation (S4U2Proxy)** is fine where RBCD is not possible;
**unconstrained delegation is deprecated** and should be removed.

## How to use this guide

1. Walk [flowchart.md](./flowchart.md): the first question is whether you can avoid
   delegation at all, then who controls the back-end.
2. Follow the leaf's **Leaf link** to the concrete Kerberos flow.
3. Confirm the tradeoffs and attack surface in [comparison-table.md](./comparison-table.md).

## Options at a glance

- ✅ **Resource-based constrained delegation (RBCD)** — the back-end resource lists which
  front-ends may impersonate to it. Control sits with the resource owner. Preferred.
- ✅ **Constrained delegation (S4U2Proxy)** — the front-end is configured with an allow-list
  of specific back-end SPNs it may delegate to.
- ⛔ **Unconstrained delegation** — the back-end receives a forwardable TGT for the user and
  can impersonate them **anywhere**. **Use instead:** RBCD (or constrained delegation).

## Related diagrams

- [Resource-based constrained delegation](../../../authentication/kerberos/resource-based-constrained-delegation/README.md)
- [Constrained delegation (S4U2Proxy)](../../../authentication/kerberos/constrained-delegation/README.md)
- [Unconstrained delegation](../../../authentication/kerberos/unconstrained-delegation/README.md) — deprecated, kept for reference.
- [TGS exchange](../../../authentication/kerberos/tgs-exchange/README.md) — the underlying ticket mechanics.

## Files

- [flowchart.md](./flowchart.md) — the decision tree.
- [comparison-table.md](./comparison-table.md) — model-by-model tradeoffs and status.
