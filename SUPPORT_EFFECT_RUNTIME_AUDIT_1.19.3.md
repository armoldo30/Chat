# HOI4 War Planner — Support Effect Runtime Audit 1.19.3

Date: 2026-09-19  
Target: HOI4 1.19.3.0.c01a  
Production baseline: 0.17.2  
Tracking issue: #46

## Purpose

0.17.2 completed the **catalog and structure** audit for support companies. This follow-up deliberately asks a different question:

> Which support-specific source mechanics does the planner actually execute, and which are merely preserved for transparency?

The answer must not be inferred from the presence of a field in the data model. A retained source field is not automatically a modeled executable effect.

## Current classification

### Structurally consumed

These rules are enforced directly by the Division Designer:

- `allowed_battalion_groups` — Regimental Support compatibility
- `same_support_type` — mutually exclusive support families
- `allow_in_non_army_hq` — excludes Army-HQ-only support from ordinary divisions
- DLC / unlock requirements — displayed informationally only by design

The first three are direct structural source rules. Theorycraft mode intentionally does not hard-lock research, DLC, focus, or Special Project requirements.

### Consumed by the existing planner model, but not promoted by this audit

The existing division aggregation consumes ordinary numeric unit fields from support companies:

- Soft Attack
- Hard Attack
- Defense
- Breakthrough
- Air Attack
- Armor
- Piercing
- HP
- Organization
- Manpower
- Supply
- retained terrain attack/defense modifiers

These values participate in the planner's existing combat model. This audit does **not** claim that their complete support-specific executable aggregation/order is newly `oracle-validated`.

### Retained and aggregated, but not used downstream

- Initiative

`calcDivision` currently sums support-company initiative. The battle resolver does not consume that division initiative value, so the practical support effect remains `unvalidated`.

### Retained but not currently executed

- `battalion_mult`
- recon
- entrenchment
- recovery
- reliability factor
- equipment capture factor
- supply-consumption factor
- fuel-consumption factor
- casualty trickleback
- experience-loss factor
- suppression
- suppression factor
- maximum speed
- deployed leader modifiers
- enabled specialist abilities

The UI may expose these source-defined effects for transparency, but they must not be described as fully modeled until their aggregation and ordering are established.

## Important entrenchment distinction

The battle screen already has a separate battlefield entrenchment input. A support company's source `entrenchment` value is **not** automatically added to that input today.

Doing so without first establishing the executable relationship between support-company entrenchment, maximum entrenchment, current entrenchment, doctrine modifiers, and battle start state would create a new unsupported assumption.

## Important battalion_mult distinction

Several support companies modify battalion categories through `battalion_mult`. Examples in the 1.19.3 support catalog include effects on:

- artillery Soft Attack;
- armored Hard Attack / Breakthrough;
- infantry Entrenchment / HP / morale-related fields;
- supply consumption;
- suppression;
- initiative.

The source values themselves are retained. The planner does not yet apply these modifiers to matching line battalions because the exact category matching, additive-vs-factor semantics, and ordering relative to technology/doctrine/equipment resolution have not yet been certified end-to-end.

## Runtime priorities

The remaining support-effect work should be done in this order:

1. **Static semantics first** — use source structure, defines, technology/doctrine parser evidence, and existing certified formulas to determine whether a field has an unambiguous mapping.
2. **Planner-only regression second** — implement only effects whose semantics are adequately supported and lock them with exact source fixtures.
3. **Executable testing only where necessary** — reserve new Oracle/manual tests for effects whose result materially changes combat and whose ordering cannot be established from source/runtime evidence.
4. **No broad promotion** — validating one support mechanic does not validate the full combat resolver.

## Current conclusion

The 0.17.2 support-company **catalog/structure audit is complete and released**.

The remaining work is not “which companies exist?” or “which support company belongs in which slot?” Those questions are now regression-locked.

The remaining work is the narrower **runtime effect semantics** listed above. Those mechanics stay `unvalidated` until addressed individually.
