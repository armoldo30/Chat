# HOI4 1.19.2 Terrain / Tactics / Modifiers Audit

**Status: COMPLETE — bounded source/runtime certification**

This document records the certified boundary for terrain, combat tactics, and custom modifier definitions in the HOI4 War Planner 1.19.2 audit. The goal is to distinguish recovered source facts from planner runtime behavior and from formula behavior that still belongs to later audits.

## Certification standard

The phase uses the project-wide three-pass standard:

1. **Source completeness** — identify and fingerprint every record available in the recovered 1.19.2 evidence.
2. **Value correctness** — preserve and normalize exact recovered values without replacing missing source with public/wiki guesses.
3. **Runtime correctness** — verify only the behavior currently consumed by the planner, while assigning unresolved executable/formula semantics downstream.

Classifications remain:

- **Game-file exact** — directly recovered source data or exact preserved source structure.
- **Executable inferred** — planner behavior consistent with source inputs but not yet certified against exact `hoi4.exe` ordering/formulas.
- **Planner analytical** — convenience behavior or approximation not claimed as executable parity.

## Certification summary

| Surface | Certified evidence | Runtime status | Result |
| --- | --- | --- | --- |
| Land terrain catalog | 1 represented terrain source / 8 recovered land-combat records | Width/support-width and inherent attacker attack modifiers are consumed | **PASS — bounded recovered source** |
| Terrain consumed-field fingerprint | SHA-256 `dadda3f1766da3dccaf36165fb35474c7f4951979b54fc182292ad24e5b556d0` | Exact recovered compact payload locked by test | **PASS** |
| Combat tactics | 55 records / 55 retained raw blocks | Structured source fields normalized; tactic selection/application deferred | **PASS — source layer** |
| Combat-tactic raw fingerprint | SHA-256 `caec8a04d3bff8007fd2420a9b6a0410dc266179700d7df31c75dbc1fd03093e` | All 55 raw blocks locked by test | **PASS** |
| Custom modifier definitions | 3 records / 3 retained raw blocks | Display/type metadata only; no current land-combat runtime effect | **PASS — source layer** |
| Modifier-definition raw fingerprint | SHA-256 `6f19c3d9a73bd226a759371a68a228b34a9d0963b9ef3f89304dfa6f50316238` | Exact raw payload locked by test | **PASS** |
| Terrain parser | Full raw terrain block + planner-relevant scalar fields preserved on fresh import | Source preservation certified | **PASS** |
| Sub-unit terrain parser | Nested attack/defence/movement terrain blocks preserved separately | Formula application deferred | **PASS** |
| Current terrain runtime | Recovered width/support-width/inherent attack modifier reaches `battleContext` | **Executable inferred** | **PASS at current boundary** |
| Source-backed unit terrain fallback | Hand-written fallback terrain guesses no longer leak into source-backed hydrated units | Missing exact compact source remains explicitly absent | **PASS** |

## Recovered land terrain catalog

The bundled 1.19.2 compact source contains eight land-combat terrain records with the following consumed fields:

| Terrain | Combat width | Additional-direction width | Inherent attacker attack modifier |
| --- | ---: | ---: | ---: |
| Desert | 70 | 35 | 0% |
| Forest | 60 | 30 | -15% |
| Hills | 70 | 35 | -25% |
| Jungle | 60 | 30 | -30% |
| Marsh | 50 | 25 | -40% |
| Mountain | 50 | 25 | -50% |
| Plains | 70 | 35 | 0% |
| Urban | 80 | 40 | -30% |

These values are treated as **Game-file exact within the recovered compact evidence**. The original full raw terrain block was not retained in the historic bundle, so the audit does **not** claim that every 1.19.2 terrain field has been reconstructed from source.

Fresh source imports now preserve the full terrain raw block plus structured fields including combat width, support width, attack/defence, movement, movement cost, attrition, enemy-air-superiority factor, supply-flow penalty, truck attrition, and sickness chance when present.

## Unit-specific terrain modifiers

HOI4 source units can contain terrain-scoped blocks such as forest, river, plains, urban, and similar scopes with attack/defence/movement values. These are a different source layer from the terrain category's inherent attacker modifier.

The parser now preserves those blocks as `terrainModifiers` on freshly imported sub-units. Their source data is retained separately rather than prematurely folding it into unit combat stats.

The historic bundled 1.19.2 compact sub-unit records did **not** retain those exact blocks. Before this audit, hydration could therefore leave hand-written fallback terrain values from `src/data.js` attached to a source-backed unit. That could make an uncertified fallback look source-backed. The audit removes that leakage: source-backed units with no recovered terrain block now report `source-terrain-not-retained` and carry no guessed unit-terrain modifier.

Exact aggregation/order of unit terrain modifiers, technology terrain modifiers, doctrine terrain modifiers, forts, rivers, and other combat modifiers remains a **combat-formula responsibility**.

## Combat tactics source certification

The recovered 1.19.2 corpus contains **55 combat tactics**, and all 55 retain their raw source payload. The aggregate raw payload fingerprint is:

`caec8a04d3bff8007fd2420a9b6a0410dc266179700d7df31c75dbc1fd03093e`

Top-level field incidence in the recovered raw blocks:

| Field | Records |
| --- | ---: |
| `base` | 55 |
| `is_attacker` | 55 |
| `picture` | 55 |
| `trigger` | 55 |
| `attacker` | 49 |
| `defender` | 45 |
| `active` | 38 |
| `display_phase` | 27 |
| `combat_width` | 24 |
| `attacker_movement_speed` | 15 |
| `countered_by` | 15 |
| `phase` | 9 |
| `attacker_org_damage_modifier` | 4 |
| `defender_org_damage_modifier` | 4 |
| `only_show_for` | 3 |

Built-in and freshly imported tactics now normalize the same source structure, including `base.factor`, the full base-weight block, attacker/defender role, phase, trigger, counter relationships, attacker/defender multipliers, movement modifiers, organisation-damage modifiers, combat-width modifier, and display-only gates.

### Tactic runtime boundary

The planner does **not** yet claim exact tactic execution. The following remain explicitly assigned to **Defines / Combat Formulas**:

- tactic-selection probability and `base.factor` modifier evaluation;
- leader skill, initiative, preferred-tactic, reconnaissance, and country/unit gating interactions;
- tactic swap frequency and timing;
- combat-phase transitions;
- counter-tactic selection and counter advantage;
- exact attacker/defender multiplier application;
- tactic combat-width modification;
- movement and organisation-damage modifier ordering;
- any hidden executable behavior not expressible from the recovered source blocks alone.

This is deliberate. Preserving a tactic's source fields is not the same as claiming `hoi4.exe` tactic-selection parity.

## Custom modifier definitions

The recovered `common/modifier_definitions` slice contains exactly three custom definitions:

| ID | Color type | Value type | Precision | Category |
| --- | --- | --- | ---: | --- |
| `operation_cost` | `bad` | `percentage` | 0 | `intelligence_agency` |
| `operation_infiltrate_outcome` | `good` | `percentage` | 0 | `intelligence_agency` |
| `operation_outcome` | `good` | `percentage` | 0 | `intelligence_agency` |

Aggregate raw fingerprint:

`6f19c3d9a73bd226a759371a68a228b34a9d0963b9ef3f89304dfa6f50316238`

These three records are **custom modifier-definition metadata**, not a catalog of every modifier keyword in HOI4. They affect operation/intelligence presentation semantics and are not a current land-combat runtime layer. The audit therefore does not create a fictitious generic modifier engine from these three definitions.

## Permanent certification tests

The phase is guarded by:

- `tests/terrain-tactics-modifier-parser-certification.test.mjs`
- `tests/terrain-tactics-modifier-audit-coverage.test.mjs`
- `tests/terrain-runtime-certification.test.mjs`

The tests certify the recovered corpus hashes and IDs, parser preservation, structured tactic/modifier normalization, source-backed terrain hydration, inherent terrain consumption, and removal of uncertified unit-terrain fallback leakage.

## Explicitly not claimed

This phase does **not** claim:

- a reconstructed full raw 1.19.2 terrain file beyond the eight recovered compact records;
- exact built-in 1.19.2 sub-unit terrain blocks where the historic compact bundle discarded them;
- exact technology terrain application (the technology audit measured 161 terrain-specific blocks);
- exact doctrine terrain/fort/battalion-mult application;
- exact terrain defence, movement, attrition, sickness, supply, truck-attrition, or air-superiority executable formulas;
- exact river, fort, weather, amphibious, or other contextual modifier ordering;
- exact tactic selection, tactic counters, phase transitions, or tactic effect ordering;
- a generic runtime interpretation of all HOI4 modifier keywords;
- bit-for-bit `hoi4.exe` combat parity.

Those are not hidden failures in this phase. They are explicitly assigned to the upcoming **Defines** and **Combat Formulas** audits, where the executable constants and modifier ordering can be certified together.

## Conclusion

**Terrain / tactics / modifiers audit: COMPLETE with bounded source/runtime certification.**

The recovered terrain, tactic, and custom modifier-definition evidence is inventoried and fingerprinted; current terrain data consumed by the planner is certified at its source boundary; exact future source imports preserve the richer terrain/unit source structure; and an uncertified fallback-terrain leakage path has been removed. Formula-dependent terrain and tactic execution remains deliberately deferred rather than presented as source-exact behavior.

**Next audit phase: Defines.**
