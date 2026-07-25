---
title: "Branch-Based Code Promotion (GitFlow vs Trunk-Based)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Branch-Based Code Promotion (GitFlow vs Trunk-Based)

**Status:** ✅ Current

## Purpose

Promote code toward release through **branches, merges, and tags**, and contrast the
two dominant models for doing so:

- **Trunk-Based Development** — `✅ Current` / recommended. Short-lived feature
  branches merge frequently into a single `main`/trunk behind review and CI; releases
  are cut from trunk by tagging a commit; **feature flags** hide unfinished work so
  merging is decoupled from releasing.
- **GitFlow** — `🟡 Legacy` for many teams. Multiple long-lived branches (`main`,
  `develop`, `feature/*`, `release/*`, `hotfix/*`) with feature promoted
  `feature → develop → release/* → main` plus a tag. Powerful but heavyweight: slow
  integration, drift between long-lived branches, and painful merges make it a poor
  default for continuous delivery, though it still fits scheduled/versioned releases.

This diagram is about promoting **code** through branches. Promoting the *same built
artifact* across environments (dev → staging → prod) is a complementary concern —
see [Environment-based code promotion](../code-promotion-environment-based/README.md).

## When it's used

- Choosing or documenting a branching strategy for a repository or org.
- Trunk-based: teams practicing continuous integration / continuous delivery who want
  fast, frequent, low-risk integration and release-from-trunk via tags.
- GitFlow: products with explicit release trains, multiple supported versions, or a
  QA-stabilized `release/*` branch, where the heavier model earns its cost.

## Actors

| Actor | Role |
|---|---|
| Developer | Author of a feature or fix on a branch |
| Reviewer | Approves the pull/merge request before promotion |
| CI | Runs required checks that gate the merge and the tag |
| Repository | Hosts the branches, merges, tags, and branch protection rules |
| Release | The tagged, immutable commit that is built and shipped |

## Promotion paths

| Model | Feature promotion | Release cut | Hotfix |
|---|---|---|---|
| Trunk-based | short branch → PR → `main` | tag a `main` commit | fix on `main`, tag, cherry-pick if needed |
| GitFlow | `feature/*` → `develop` → `release/*` → `main` | tag on `main` after `release/*` merges | `hotfix/*` from `main` → back to `main` and `develop` |

## Alternate scenarios covered

- Trunk-based happy path — branch, PR, review, CI, merge to `main`, tag a release.
- GitFlow release-branch flow — cut `release/*` from `develop`, stabilize, merge to
  `main` and tag, merge back to `develop`.
- GitFlow hotfix — branch `hotfix/*` from `main`, fix, tag, merge back into both
  `main` and `develop`.
- Release-branch stabilization — only bug fixes allowed on `release/*`, no new features.
- Merge conflict or failed checks — promotion is blocked until resolved and green.

## Security notes

- **Protect `main` and `release/*`** branches: require reviews, passing CI, and block
  direct pushes — see [Branch protection and code review](../branch-protection-code-review/README.md).
- Treat **tags as immutable release markers**; protect them so a shipped version cannot
  be silently re-pointed.
- Use **feature flags to decouple deploy from release**, so incomplete code can merge to
  trunk safely and be revealed independently.
- Avoid **long-lived divergent branches**: they accumulate drift and turn integration
  into big, risky merges — the core reason trunk-based is preferred.
- Gate every promotion (merge and tag) on required checks so unreviewed or failing code
  cannot advance toward release.

## Diagrams

- [sequence.md](./sequence.md) — trunk-based happy path first, then GitFlow release and hotfix, with a blocked-promotion alternate.
- [swimlane.md](./swimlane.md) — lanes for Developer, Reviewer, CI, Repository, Release.
- [flowchart.md](./flowchart.md) — model choice and promotion gates with explicit blocked terminals.

## Related diagrams

- [Environment-based code promotion](../code-promotion-environment-based/README.md) — promoting the same artifact across environments, complementary to promoting code here.
- [Branch protection and code review](../branch-protection-code-review/README.md) — the rules that guard `main` and `release/*`.
- [GitOps pull-based deploy](../gitops-pull-based-deploy/README.md) — a tagged/main commit driving deployment via a Git source of truth.
- [CI/CD security and delivery](../README.md) — category index.
