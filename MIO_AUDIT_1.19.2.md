# HOI4 1.19.2 Military Industrial Organization Audit

Status: **COMPLETE — bounded source certification; current structural/runtime MIO behavior certified within the planner-consumed surface**

This audit separates what is recoverable exactly from the supplied/recovered HOI4 1.19.2 source evidence from what the planner can currently execute. It does **not** fill missing source payloads with wiki/public approximations and it does **not** claim bit-for-bit `hoi4.exe` MIO parity.

## Certification boundary

The MIO phase is closed at the following explicit boundary:

- **Game-file exact source census:** 55 organization source files, 552 organization declarations, and 51 file-local MIO script variables, with per-file SHA-256 hashes and declaration counts retained in `mio-source-manifest-1192.js`.
- **Game-file exact recovered payload:** five committed correction chunks touching 120 organizations. Their final merged recoverable payload contains 85 exact trait corrections and 3 exact `remove_trait` relationships, plus exact recovered organization flags/restrictions.
- **Game-file exact auxiliary MIO data:** 24 equipment-category groups and 22 MIO policy records are retained from the recovered 1.19.2 source evidence.
- **Executable-inferred and regression-tested:** include inheritance, post-inheritance trait removal, trait-tree structural prerequisites, mutual exclusion, source equipment restrictions, current equipment-stat bonuses, and current production adjustments.
- **Informational-only:** country ownership/eligibility requirements never become theorycraft locks.
- **Explicitly deferred:** full field-level reconstruction of all 552 source declarations, exact executable MIO-size/funds/research behavior, policy activation/application, unsupported equipment/organization modifiers, and exact `hoi4.exe` modifier ordering/formulas.

## Source census — PASS

`src/builtin1192/mio-source-manifest-1192.js` certifies the recovered organization tree as:

- **55 source files**
- **552 source declarations**
- **51 file-local MIO constants/variables**

The manifest stores each source file's SHA-256 and declaration count. The number 552 is the count of source declarations, **not** a claim that the compact runtime must contain 552 unique final organizations. Includes, overrides, country variants, helper/debug definitions, and compaction mean those are different measurements.

The current compact bundle diagnostic is:

- **429 bundled organization records**
- **960 bundled trait records**
- **401 bundled `include` relationships**
- **456 resolved runtime organizations** after the recovered source corrections and inheritance path are applied

These runtime counts are regression diagnostics. They are not substituted for the source census.

## Recovered exact organization/trait payload — PASS at bounded source surface

Five committed source-correction chunks are merged by `src/builtin1192/mio-source-corrections-1192.js`. The exact recoverable correction boundary is:

- **5 correction chunks**
- **120 organizations touched**
- **85 corrected trait definitions**
- **3 `remove_trait` relationships**
- **20 recovered `staticDisabled` organization flags**
- **31 recovered initial equipment restrictions**
- **36 recovered trait equipment restrictions**

Permanent certification verifies every recovered correction targets a runtime organization and that every corrected trait survives the merge with its recovered fields. Audited trait fields include equipment bonuses, production bonuses, organization modifiers, `parents`, `allParents`, N-of-parent `parentTraits`/`parentCount`, mutual exclusions, and equipment-type restrictions. Recovered organization country and static-disabled fields are also checked.

### Historical 235/9 target — rejected, not certified

An intermediate test asserted **235 corrected traits / 9 removals**. That assertion failed and is not source evidence. The branch-history recovery found five committed correction chunks and no sixth authoritative chunk. The permanent certification therefore uses the actually recoverable **85 / 3** payload rather than weakening tests or inventing missing data.

If additional authoritative 1.19.2 source text is supplied later, this boundary can be expanded and re-certified. Until then, 235/9 must not be described as achieved or certified.

## MIO parser and inheritance semantics — PASS

The MIO parser/resolver now preserves and regression-tests the structural semantics needed by the current planner:

- `include` inherits parent organization equipment types, initial bonuses, and traits.
- `remove_trait` is parsed in supported source forms and applied **after** inherited traits are assembled.
- `any_parent` is represented as an any-of prerequisite.
- `all_parents` is represented as an all-of prerequisite.
- `parent = { traits = { ... } num_parents_needed = N }` is represented as an N-of prerequisite.
- `mutually_exclusive` prevents structurally incompatible simultaneous trait selection.
- `limit_to_equipment_type` is retained as a structural equipment restriction.
- Static-disabled helper/debug organizations are not selectable.

The resolver consumes `remove_trait` directives after applying them so downstream runtime code sees the resolved trait catalog rather than stale removal instructions.

## Equipment-category groups — PASS

`mio-equipment-groups-1192.js` retains **24 exact 1.19.2 MIO equipment groups**. Current runtime compatibility expands these source groups before testing the selected equipment family. Permanent regression coverage verifies that group restrictions are structural and that a trait bonus does not leak onto an incompatible equipment family.

This includes current land and aircraft family targeting used by the planner. Naval groups are retained as source data even though a dedicated naval designer/runtime is outside the current product surface.

## Theorycraft-first eligibility — PASS

Country ownership requirements are reported but do not become legality locks. `mioEligibility(...)` separates:

- structural compatibility/selectability; and
- country eligibility metadata.

A country mismatch therefore remains visible to the planner while a structurally valid MIO can still be selected for theorycrafting. Equipment incompatibility and `staticDisabled`, by contrast, remain structural restrictions.

## Current effect runtime — PASS within bounded planner surface

The current MIO runtime accumulates selected initial/trait effects after structural filtering and applies the planner-supported fields to equipment or designed variants.

Current equipment/variant mappings include planner-consumed attack, defense, breakthrough, armor, piercing, reliability, speed, air attack/defense/agility, ground/naval attack, range, and build-cost fields where represented by the target record. Production helpers expose current cost, output/capacity, efficiency-cap, efficiency-gain, and resource-need factors; cost/resource factors are applied to current equipment/variant records where supported.

This layer is classified **Executable inferred**, not game-executable exact. The tests demonstrate deterministic planner behavior and prevention of cross-equipment leakage; they do not establish the internal HOI4 modifier stack/order.

## MIO policies — SOURCE-CERTIFIED / runtime deferred

The recovered policy corpus contains **22 source policy records** across Air, General, Land, and Navy policy files, with normalized raw source payloads and per-record hashes retained in `mio-policy-source-1192.js`.

The current planner does not expose a dedicated complete MIO policy lifecycle/runtime. Policy `allowed`/`available` gates, MIO-size thresholds, organization research/funds modifiers, and policy-specific application ordering are therefore retained as source data and explicitly deferred rather than being forced through unrelated equipment calculations.

## Explicit non-parity boundary

This audit does **not** claim:

- full exact normalized field reconstruction for every one of the 552 source declarations;
- complete executable behavior for every MIO trait field or organization modifier;
- exact funds, size, research-bonus, task, policy-unlock, or policy-selection mechanics;
- exact production-line interaction or modifier ordering inside `hoi4.exe`;
- complete naval MIO runtime;
- that the failed historical 235/9 target was ever certified.

Those are either unavailable-source payload or downstream executable/formula domains. They are classified here so they cannot silently become hidden MIO debt.

## Permanent certification coverage

The current phase is protected by:

- `tests/mio-parser.test.mjs`
- `tests/mio.test.mjs`
- `tests/mio-audit-coverage.test.mjs`
- the full project `npm test` suite

At the closing pre-documentation head, the full project test/build workflow passed with MIO diagnostics reporting 429 bundled organizations, 456 runtime organizations, 960 bundled traits, 401 include relationships, and exact recovered correction coverage of 120 organizations / 85 traits / 3 removals.

## Classification summary

- **Game-file exact:** 55-file / 552-declaration / 51-variable census and file hashes; five recovered correction chunks and their 85 trait corrections / 3 removals; 24 equipment groups; 22 policy source records.
- **Executable inferred / regression-tested:** current include/removal resolution, trait structural prerequisites, equipment filtering, equipment/variant bonus application, and current production-factor helpers.
- **Informational-only:** country eligibility in theorycraft mode.
- **Deferred:** unrecovered full declaration payload; MIO policy lifecycle; funds/size/research/task mechanics; unsupported source-effect families; exact production interaction and executable modifier order; naval runtime.

**MIO audit: COMPLETE with bounded source certification.**
