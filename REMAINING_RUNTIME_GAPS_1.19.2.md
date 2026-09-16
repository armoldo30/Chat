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

The technology corpus retains 161 terrain blocks. The battle engine already consumes unit `terrainModifiers` for attack and defense, but the technology application layer previously skipped nested terrain effects.

Source terrain `attack`, `defence` and `defense` fields for planner-supported terrain scopes now flow to the matching source sub-unit/category. Movement-only fields remain deferred because the current battle model does not consume terrain movement speed.

Golden source case: `mountain_tanks -> light_armor -> mountain -> attack = 0.15`.

Evidence boundary: the source values are game-file exact; mapping those source modifiers into the existing planner terrain-combat path remains bounded/executable-inferred in the same sense as other selected technology sub-unit modifiers.

### 2. Doctrine terrain attack/defense blocks — **live**

The certified land-doctrine corpus includes nested terrain blocks in active selectable doctrine rewards. These use the same battle-consumed `terrainModifiers` path as source unit and technology terrain effects.

Golden source cases:

- `commandos` mastery 3 / `rigorous_training_regimen`: infantry receives `+0.05` attack in desert, jungle and hills. Its accompanying `+0.10` movement remains deliberately deferred.
- `siege_artillery` mastery 1 / `fortress_busters`: `super_heavy_artillery` receives `+0.25` fort attack through the existing fort-attack modifier path.

Only nested `attack`, `defence` and `defense` are promoted. Terrain `movement` remains measured as deferred rather than being silently treated as supported.

### 3. Specialist land-field audit — **completed; no unsupported promotion**

The remaining selected technology/doctrine specialist fields were checked against actual runtime consumers rather than against object shape alone.

- `initiative` is currently aggregated onto division stats, but battle resolution does not consume it.
- recon-related fields do not have a modeled tactic-selection/countering consumer.
- entrenchment source modifiers cannot safely be merged into the existing manual battle `entrench` input because max entrenchment, dig-in accumulation and related HOI4 semantics are not yet modeled.

Accordingly, none of these fields were promoted merely to improve coverage numbers. They remain explicit operational-model debt and are better Oracle candidates.

### 4. Air Superiority doctrine detection factor — **implemented in current branch**

The retained 1.19.2 Air Doctrine corpus contains mission-specific detection factors. Air Lab now consumes `air_superiority_detect_factor` as a **relative modifier to the user's explicit Air Superiority detection baseline**.

Golden source case: `new_battlefield_support` carries `air_superiority_detect_factor = 0.15`, so a user-entered `0.25` Air Superiority detection baseline becomes `0.2875` before the existing detection/engagement cap runs.

The boundary is deliberately narrow:

- absolute regional detection remains an explicit input, not a derived game-state result;
- `air_interception_detect_factor` stays separate and deferred;
- Air Superiority detection does not leak into CAS or Naval Strike;
- active grand/base, reward and mastery-5 milestone source values are resolved from the selected game-pack doctrine state.

The source modifier is game-file exact; applying it to the explicit baseline is bounded/executable-inferred pending exact modifier-order / Oracle validation.

## Tier 2 — high user impact, but formula/runtime semantics remain incomplete

### Land operational mechanics

- recon and tactic selection/countering;
- initiative/coordination and reinforcement behavior;
- max entrenchment / dig-in speed / planning speed and decay;
- reinforcement rate;
- movement organization loss;
- no-supply grace and deeper out-of-supply behavior;
- remaining doctrine air-superiority/CAS interaction globals not already consumed by the current battle path.

The repository has relevant source modifiers, but exact executable ordering/interaction is not sufficiently established. These are strong Oracle candidates rather than places to add new planner heuristics casually.

### Air operational context

- construction of the absolute detection baseline from regional/game state;
- interception-specific detection application;
- weather and night penalties;
- accidents and reliability attrition;
- sortie efficiency and wing availability;
- range/coverage interaction;
- ace/experience effects;
- targeting/wing-selection and combat scheduling.

Aircraft/module/mission data are source-certified and the current dogfight equation is executable-inferred. The new Air Superiority doctrine factor improves a real existing input, but it does not solve the larger regional-detection problem. These operational systems remain the main reason exact Air Lab loss counts are less trustworthy than controlled relative design ranking.

### Production history / retooling

The production engine now prices Counter recommendations against current spare factories and strategic resources, but still does not invent:

- line-switch retention by variant/parent/family/archetype;
- dated factory additions/removals and separate efficiency histories;
- conversion/licensing details;
- automatic trade changes;
- country-level energy derivation;
- campaign fuel logistics.

The source contains several relevant constants, but exact projection requires production-line history/state the current scenario model does not store.

## Tier 3 — blocked by missing retained authoritative source

### MIO English localization Phase 2

Current source-backed live coverage includes MIO categories and organization labels A–M. Organizations N–Z, MIO trait labels, and unresolved `[KEY]` references cannot be promoted to source-exact from the compact repository because the authoritative localization ZIP/extraction that originally supplied them is no longer materialized.

Do not fill these labels from guessed humanization or public secondary sources while calling them authoritative.

### Exact 1.19.2 `NAir` Defines

The retained authoritative Defines corpus fingerprint proves the source file existed during the audit, but the compact runtime slice only preserves planner-consumed land/production keys, not the full `NAir` block. Current dogfight constants therefore remain **executable inferred** pending recovery of the authoritative `NAir` source or Oracle validation.

## Tier 4 — lower current-product value

These may be source-interesting but do not currently justify priority over result-changing mechanics above:

- full MIO funds/size/research/policy lifecycle semantics;
- naval MIO runtime;
- naval doctrine/combat systems outside the current planner surface;
- country-wide research/industry/political modifiers that do not feed an active planner result;
- specialist fields with no modeled downstream consumer.

## Current recommended order

1. technology terrain attack/defense — live;
2. doctrine terrain attack/defense — live;
3. specialist land-field consumer audit — completed; no unsafe promotion;
4. Air Superiority doctrine detection factor — current branch;
5. recover authoritative MIO localization / `NAir` source whenever available;
6. Oracle validation for land operational mechanics and Air operational mechanics;
7. product/UX work once the remaining accuracy gains require missing source or executable evidence.

The governing rule remains unchanged: **a smaller model with explicit evidence boundaries is preferable to a broader model containing guessed HOI4 mechanics.**
