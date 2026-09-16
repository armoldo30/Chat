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

## Tier 1 — source-backed runtime gaps worth implementing now

### 1. Technology terrain attack/defense blocks — **implemented in this branch**

The technology corpus retains 161 terrain blocks. The battle engine already consumes unit `terrainModifiers` for attack and defense, but the technology application layer previously skipped nested terrain effects.

This branch applies source terrain `attack`, `defence` and `defense` fields for planner-supported terrain scopes to the matching source sub-unit/category. Movement-only fields remain deferred because the current battle model does not consume terrain movement speed.

Golden source case: `mountain_tanks -> light_armor -> mountain -> attack = 0.15`.

Evidence boundary: the source values are game-file exact; mapping those source modifiers into the existing planner terrain-combat path remains bounded/executable-inferred in the same sense as other selected technology sub-unit modifiers.

### 2. Doctrine terrain attack/defense blocks — **next candidate**

Doctrine coverage retains numerous nested terrain blocks while the battle engine already has a compatible per-unit terrain attack/defense path. This is the closest analogue to the technology fix and should be audited next. Only attack/defense fields that map directly into an already-consumed runtime stat should be considered initially; movement and other terrain semantics should remain deferred.

### 3. Direct support-company combat fields already represented by the division model

Selected technology/doctrine data retains fields such as entrenchment, recon and initiative. Initiative already exists on support records, while other specialist fields are preserved in source. Each field should only be promoted when its downstream combat meaning is actually modeled. Copying a value into a unit object without a result path does not count as support.

## Tier 2 — high user impact, but formula/runtime semantics remain incomplete

### Land operational mechanics

- recon and tactic selection/countering;
- initiative/coordination and reinforcement behavior;
- max entrenchment / dig-in speed / planning speed and decay;
- reinforcement rate;
- movement organization loss;
- no-supply grace and deeper out-of-supply behavior;
- doctrine air-superiority and CAS mitigation globals.

The repository has relevant source modifiers, but exact executable ordering/interaction is not sufficiently established. These are strong Oracle candidates rather than places to add new planner heuristics casually.

### Air operational context

- construction of detection rather than a manual detection input;
- air-superiority/interception detection modifiers;
- weather and night penalties;
- accidents and reliability attrition;
- sortie efficiency and wing availability;
- range/coverage interaction;
- ace/experience effects;
- targeting/wing-selection and combat scheduling.

Aircraft/module/mission data are source-certified and the current dogfight equation is executable-inferred, but these operational systems are not yet executable-validated. They are the main reason exact Air Lab loss counts remain less trustworthy than relative design ranking.

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

1. technology terrain attack/defense — this branch;
2. doctrine terrain attack/defense, if the retained doctrine structure maps cleanly into the same runtime path;
3. audit specialist land fields against actual consumers before implementing any of them;
4. recover authoritative MIO localization / `NAir` source whenever available;
5. Oracle validation for land operational mechanics and Air operational mechanics;
6. product/UX work once the remaining accuracy gains require missing source or executable evidence.

The governing rule remains unchanged: **a smaller model with explicit evidence boundaries is preferable to a broader model containing guessed HOI4 mechanics.**
