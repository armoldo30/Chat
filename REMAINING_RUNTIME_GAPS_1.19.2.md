# HOI4 War Planner — Remaining Runtime Gaps 1.19.2

**Status: ranked implementation queue after the completed land-data, tank, technology, doctrine, MIO, terrain, Defines, Production, Combat, Air-data and Air-dogfight audits.**

This document deliberately separates **source data that exists but is not yet consumed**, **formula semantics that still need executable evidence**, and **source material that is no longer retained in the compact repository**. A deferred field is not automatically a bug and is not automatically worth implementing.

## Ranking rule

Remaining work is ranked by:

1. whether it can change a result the current planner actually shows;
2. whether authoritative 1.19.2 source evidence is already retained;
3. whether the runtime destination already exists;
4. whether implementation can avoid inventing executable semantics;
5. expected user impact across Division Lab, Battle Planner, Counter Analysis, Production and Air Lab.

## Tier 1 — source-backed runtime gaps already closed

### 1. Technology terrain attack/defense blocks — **live**

The technology corpus retains 161 terrain blocks. Source terrain `attack`, `defence` and `defense` fields for planner-supported terrain scopes now flow to the matching source sub-unit/category through the existing battle-consumed `terrainModifiers` path. Movement-only fields remain deferred because the current battle model does not consume terrain movement speed.

Golden source case: `mountain_tanks -> light_armor -> mountain -> attack = 0.15`.

### 2. Doctrine terrain attack/defense blocks — **live**

The certified land-doctrine corpus includes nested terrain blocks in active selectable doctrine rewards. These now use the same battle-consumed `terrainModifiers` path as source unit and technology terrain effects.

Golden source cases:

- `commandos` mastery 3 / `rigorous_training_regimen`: infantry receives `+0.05` attack in desert, jungle and hills; movement remains deferred.
- `siege_artillery` mastery 1 / `fortress_busters`: `super_heavy_artillery` receives `+0.25` fort attack.

Only nested `attack`, `defence` and `defense` are promoted.

### 3. Specialist land-field audit — **completed; no unsupported promotion**

The remaining selected technology/doctrine specialist fields were checked against actual runtime consumers rather than object shape alone.

- `initiative` is aggregated onto division stats, but battle resolution does not consume it.
- recon fields do not have a modeled tactic-selection/countering consumer.
- entrenchment source modifiers cannot safely be merged into the existing manual battle `entrench` input because max entrenchment, dig-in accumulation and related HOI4 semantics are not modeled.

These remain explicit operational-model debt and are better Oracle candidates.

### 4. Air Superiority doctrine detection factor — **live**

The retained 1.19.2 Air Doctrine corpus contains mission-specific detection factors. Air Lab consumes `air_superiority_detect_factor` as a **relative modifier to the user's explicit Air Superiority detection baseline**.

Golden source case: `new_battlefield_support` carries `air_superiority_detect_factor = 0.15`, so a user-entered `0.25` baseline becomes `0.2875` before the existing detection/engagement cap runs.

The boundary remains narrow:

- absolute regional detection remains an explicit input;
- `air_interception_detect_factor` stays separate and deferred;
- Air Superiority detection does not leak into CAS or Naval Strike.

The source modifier is game-file exact; applying it to the explicit baseline is bounded/executable-inferred pending exact modifier-order / Oracle validation.

## Tier 2 — executable validation now has the highest value

### Air Oracle harness — **implemented in current branch; no real Air captures yet**

`src/air-oracle.js` adds a separate Air differential harness rather than overloading the land org/strength trace schema.

The harness:

- requires game version, checksum and scenario provenance;
- retains raw per-trial aircraft losses;
- reports observed mean, sample standard deviation, min/max and loss exchange ratio;
- compares expected planner losses against observed means;
- requires an explicit validation policy and sufficient sample count before it can return a pass;
- leaves captures `unvalidated` when policy/sample prerequisites are missing;
- returns `oracle-divergent` when an eligible capture exceeds declared tolerances;
- explicitly reports `distributionComparable: false` because the current Air model predicts expected losses rather than a stochastic loss distribution.

No Air behavior is promoted to `oracle-validated` merely by adding this harness. Real HOI4 1.19.2 observations are still required.

### Land operational mechanics

- recon and tactic selection/countering;
- initiative/coordination and reinforcement behavior;
- max entrenchment / dig-in speed / planning speed and decay;
- reinforcement rate;
- movement organization loss;
- no-supply grace and deeper out-of-supply behavior;
- remaining doctrine air-superiority/CAS interaction globals not already consumed by the current battle path.

The repository has relevant source modifiers, but exact executable ordering/interaction is not sufficiently established. These are Oracle candidates rather than places to add new planner heuristics casually.

### Air operational context

- construction of the absolute detection baseline from regional/game state;
- interception-specific detection application;
- weather and night penalties;
- accidents and reliability attrition;
- sortie efficiency and wing availability;
- range/coverage interaction;
- ace/experience effects;
- targeting/wing-selection and combat scheduling.

Aircraft/module/mission data are source-certified and the current dogfight equation is executable-inferred. These operational systems remain the main reason exact Air Lab loss counts are less trustworthy than controlled relative design ranking.

### Production history / retooling

The production engine still does not invent line-switch retention, dated factory histories, conversion/licensing details, automatic trade changes, country-level energy derivation or campaign fuel logistics. Exact projection requires production-line history/state the current scenario model does not store.

## Tier 3 — blocked source recovery

### Exact 1.19.2 `NAir` Defines — **current recoverable-source search exhausted**

The exact Defines certification proves the authoritative `common/defines/00_defines.lua` was 405,669 bytes with SHA-256:

`405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4`

The original source lived inside:

`HOI4-War-Planner-0.15.0-HANDOFF.zip/game-source/common/defines/00_defines.lua`

Recovery was re-checked across:

- current and historical Git trees/commits;
- deleted Defines helper commits;
- historical Actions runs, artifacts and job logs around the exact certification transition;
- File Library content and metadata for the audit upload window;
- exact-SHA / exact-census public search.

The surviving Git history contains generated certification patches, fingerprints/census and selected consumed values, but the raw Lua was never committed and no surviving workflow artifact contains it. File Library does not expose the original handoff ZIP. No public byte-identical copy surfaced by exact hash.

Therefore current Air dogfight constants remain **executable inferred**. Do not assign guessed `NAir` values. Re-open source recovery only if the original handoff/archive becomes available again or a candidate file can be proven byte-identical to the certified SHA.

### MIO English localization Phase 2

Current source-backed live coverage includes MIO categories and organization labels A–M. Organizations N–Z, MIO trait labels, and unresolved `[KEY]` references cannot be promoted to source-exact while the authoritative localization ZIP/extraction is not materialized.

## Tier 4 — lower current-product value

- full MIO funds/size/research/policy lifecycle semantics;
- naval MIO runtime;
- naval doctrine/combat systems outside the current planner surface;
- country-wide research/industry/political modifiers that do not feed an active planner result;
- specialist fields with no modeled downstream consumer.

## Current recommended order

1. technology terrain attack/defense — live;
2. doctrine terrain attack/defense — live;
3. specialist land-field consumer audit — completed; no unsafe promotion;
4. Air Superiority doctrine detection factor — live;
5. raw `NAir` recovery — exhausted with current recoverable sources;
6. Air Oracle harness — current branch;
7. collect controlled HOI4 1.19.2 Air captures, beginning with symmetric fighter-vs-fighter baselines and one-variable changes;
8. promote/correct Air behavior only from retained Oracle evidence;
9. recover authoritative MIO localization or original source archives if they become available;
10. product/UX work once remaining accuracy gains require unavailable evidence.

The governing rule remains unchanged: **a smaller model with explicit evidence boundaries is preferable to a broader model containing guessed HOI4 mechanics.**
