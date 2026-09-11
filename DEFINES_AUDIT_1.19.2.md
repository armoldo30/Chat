# HOI4 War Planner — Defines Audit 1.19.2

**Status: COMPLETE — game-file-exact certification for the retained Defines corpus and all planner-consumed source-backed values; executable formula semantics remain explicitly bounded.**

## Source boundary

The preserved `HOI4-War-Planner-0.15.0-HANDOFF.zip` contains the user-supplied authoritative HOI4 1.19.2 `common` tree under `game-source/common/`. The Defines corpus is therefore retained rather than reconstructed from public mods.

| Source file | Bytes | SHA-256 |
| --- | ---: | --- |
| `common/defines/00_defines.lua` | 405,669 | `405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4` |
| `common/defines/00_graphics.lua` | 89,354 | `dfdab0a5fad7319d7b5ac524d98af49d3a0c1f95772e6b7a76abce54836f3d86` |
| `common/defines/01_career_profile.lua` | 3,101 | `49a3c68dde41a092b1af94674db6369a7abcfc0445153bb9da248cdb3f5c8604` |

Corpus census: **3 files / 498,124 bytes / 39 namespaces / 4,503 direct namespace assignments / 5,997 recursive scalar leaves**. Direct values comprise **4,124 numbers, 42 booleans, 22 strings, and 315 table-valued assignments**. Two duplicate graphics assignments repeat the same value and therefore create **0 effective value changes**.

## Planner-consumed exact mapping

The planner now consumes **36 game-file-exact Defines values**: 33 from `NMilitary` and 3 from `NProduction`. The original Defines phase certified 23 values; the downstream Combat audit added 13 exact `NMilitary` values from the same retained 1.19.2 source corpus. The exact 1.19.2 source establishes, among other values:

- `COMBAT_STACKING_START = 5` and `COMBAT_STACKING_EXTRA = 3`
- `LAND_COMBAT_ORG_DAMAGE_MODIFIER = 0.053`
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0.060`
- `BASE_NIGHT_ATTACK_PENALTY = -0.5`
- `EQUIPMENT_COMBAT_LOSS_FACTOR = 0.70`
- `ARMOR_VS_AVERAGE = 0.4` and `PEN_VS_AVERAGE = 0.4`
- `BASE_FACTORY_EFFICIENCY_GAIN = 1`
- `PRODUCTION_RESOURCE_LACK_PENALTY = -0.05`
- `MAX_MIL_FACTORIES_PER_LINE = 150`

The bundled runtime now overlays these exact consumed values onto the historic compact pack so stale compact values cannot survive.

## Corrections made by this audit

Five stale/incorrect runtime expectations were corrected against the retained source: night attack 0.75 → 0.50; stacking base 8 → 5; stacking additional-direction limit 4 → 3; organization damage modifier 0.05 → 0.053; and strength damage modifier 0.05 → 0.060.

A sixth issue was a provenance error rather than a numeric mismatch: the planner's `maxLineResourcePenalty = 0.90` had been attributed to `NProduction.MAX_LINE_RESOURCE_PENALTY = 90`. No such key exists anywhere in the retained 1.19.2 Defines corpus. The 0.90 cap is therefore retained only as **planner analytical** pending Production Formulas and is no longer represented as source-exact.

## Parser and import certification

The Defines parser now handles the 1.19-era nested `NDefines = { ... }` form, dotted override assignments, `NDefines_Graphics`/`NDefines_CareerProfile` roots, numbers, booleans, quoted strings, arrays/tables, and later-file override precedence. Imported packs retain per-key source-file provenance and assignment order. Permanent tests cover parser forms, arrays/strings, aliases, precedence, provenance, source census/hashes, exact consumed mappings, and runtime propagation.

Imported `ARMOR_VS_AVERAGE` and `PEN_VS_AVERAGE` now update the planner's armor/piercing weighting instead of leaving those two source-backed values outside the override layer. Imported `BASE_FACTORY_EFFICIENCY_GAIN` also reaches the planner through the explicitly **executable-inferred** `×0.001` scale.

## Classification boundary

**Game-file exact:** the retained three-file corpus fingerprints/census and the 36 planner-consumed source values now bound by the completed Defines, Production, and Combat audits.

**Executable inferred:** transformations such as sign normalization, hit chance derived from chance-to-avoid-hit, and `BASE_FACTORY_EFFICIENCY_GAIN × 0.001`. Exact executable formula ordering is not claimed here.

**Planner analytical:** no active Defines-stage analytical constant remains. The historical `maxLineResourcePenalty = 0.90` placeholder is superseded by the Production audit. Partial piercing, supply interpolation, planning/CAS behavior, and the simulation safety horizon were resolved or explicitly bounded by the Combat audit; exact `hoi4.exe` modifier ordering remains outside game-file-exact claims.

## Closure criteria

Defines is closed at the retained-source boundary. Downstream Production and Combat audits are complete and preserve the same classification rule: source values are exact only where the retained 1.19.2 files prove them, while executable-only behavior is separately bounded.

## Downstream Production-formula resolution

The subsequent Production Formulas audit resolved the two production items intentionally left provisional here. `BASE_FACTORY_EFFICIENCY_GAIN = 1` now feeds the bounded nonlinear efficiency curve through the executable-inferred `×0.001` scale. The provisional planner-analytical `maxLineResourcePenalty = 0.90` is **superseded**: modern 1.19.2 resource shortage is certified to reach a full 100% penalty / zero output for sufficiently starved factories. See `PRODUCTION_FORMULAS_AUDIT_1.19.2.md`.

