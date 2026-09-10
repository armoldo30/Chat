# HOI4 1.19.2 Data Certification Audit

This document tracks source completeness, value correctness, and runtime use for HOI4 War Planner against the supplied vanilla HOI4 1.19.2 `common/` files.

## Audit standard

Each area is checked at three levels:

1. **Source completeness** — all planner-relevant source records are represented or explicitly excluded by scope.
2. **Value correctness** — normalized fields match the source files exactly.
3. **Runtime correctness** — planner selection/hydration consumes those records rather than stale fallback constants.

Technology, DLC, Special Project and similar requirements are audited as metadata only. They must never become theorycraft locks.

## Phase 1 — land sub-units and equipment

Status: **PASS — land data layer certified on `audit-1.19.2`**

Final certified branch implementation commit: `5c2c1a85ba7ce58401060fadf620c796227a6e37`.

The remaining Tank Designer work is a separate audit: final flame/amphibious/custom tank combat stats depend on the modules chosen by the player, so the source files do not contain one universal completed variant to copy into the land-data layer.

### Source inventory and scope

Raw 1.19.2 inventory from the supplied files:

- 157 total sub-unit records
- 308 ordinary `equipments` records
- 313 equipment-module records
- 21 tank `duplicate_archetypes` definitions
- 13 aircraft `duplicate_archetypes` definitions

Certified land/runtime representation:

- **121 / 121** Division Lab-relevant sub-unit records
- **218** static planner-scope equipment records after restoring the three omitted land records
- **21 / 21** tank `duplicate_archetypes` definitions preserved
- **87** tank equipment records materialized from those source duplicate rules
- **305** total runtime equipment records after materialization
- **313** equipment-module records

The 36 raw sub-units outside the 121-record set are ships, aircraft wings, missiles, or the two railway-gun map units (`railway_gun` and `super_heavy_railway_gun`). No ordinary division-template/support sub-unit is missing.

Of the 93 ordinary equipment records that were not in the original 215-record bundle, 90 are naval, missile, convoy/floating-harbor, or otherwise outside current planner scope. The three land-relevant omissions have now been restored:

- `motorbike_equipment_1`
- `land_cruiser_chassis_1`
- `land_cruiser_equipment_1`

### Normalized value verification — PASS

An independent source extractor was compared field-by-field against the built-in pack during the audit.

- Bundled land/support sub-units compared: **121 / 121**
- Normalized sub-unit mismatches: **0**
- Original bundled equipment records compared: **215 / 215**
- Normalized equipment mismatches: **0**
- Multi-category module-slot definitions independently checked/restored: **234 / 234**

Audited sub-unit fields include group, complete type/category lists, combat width, HP, organization, manpower, supply, hardness, armor, piercing, soft/hard attack, defense, breakthrough, air attack and equipment need.

Audited equipment fields include year, archetype, parent, IC cost, reliability, defense, breakthrough, hardness, armor, soft/hard attack, piercing, air attack, speed, fuel, weight, thrust, aircraft stats, resources, complete module-slot definitions, type lists and upgrades.

### L-001 — multi-value Clausewitz lists — FIXED

The importer previously applied scalar `last()` semantics to several list-valued Clausewitz fields. Values such as `type`, `categories`, `upgrades` and module equipment-type lists could therefore collapse to their final token.

The parser now recursively preserves list values. Permanent regression tests cover multi-token unit/equipment/module fixtures.

### L-002 — three omitted static land equipment records — FIXED

`motorbike_equipment_1`, `land_cruiser_chassis_1`, and the non-NSB `land_cruiser_equipment_1` fallback are now present as source-derived records.

At runtime the Land Cruiser family selects the real completed fallback when a completed static item is required. The certification test verifies its source values, including soft attack **75**, hard attack **62**, and armor **180**. The designable chassis remains available as chassis data rather than being confused with the completed fallback equipment.

### L-003 — nested module-slot category lists — FIXED

The audit found **234** `allowed_module_categories` lists that had been reduced to only the final category: **34 tank**, **184 aircraft**, and **16 other** slot definitions.

All 234 are restored from source and permanently checked. Examples include tank main-armament/turret/special slots, aircraft weapon/engine/special slots, and Land Cruiser special-feature slots.

### L-004 — flame and amphibious tank equipment families — SOURCE MODEL FIXED

The six relevant sub-units use equipment families created by HOI4 through `duplicate_archetypes` rather than ordinary static equipment records:

- `light_flame_tank`, `medium_flame_tank`, `heavy_flame_tank`
- `amphibious_light_armor`, `amphibious_medium_armor`, `amphibious_heavy_armor`

The land-data layer now preserves the tank duplicate definitions and materializes their source-derived chassis families, including parent remapping, role/type changes and source `for_each` overrides such as hardness.

These units now resolve to the correct source chassis family instead of an absent equipment ID. They are explicitly marked **variant-dependent** when the source only defines a designer chassis rather than a completed variant. No invented flame/amphibious armament is supplied. Final soft/hard attack, piercing, IC and other module-dependent values will be certified in the Tank Designer phase.

### L-005 — regimental-support classification — FIXED

Explicit source category `category_regimental_support_battalions` now overrides name heuristics. This fixed the false classification of `super_heavy_tank_destroyer_brigade` and is regression-tested across every bundled unit with explicit categories.

### L-006 — `module_slots = inherit` and real chassis variants — FIXED

The normalizer previously converted `module_slots = inherit` into an empty slot object. That caused child chassis to lose inherited designer slots and made the Tank Designer see non-buildable archetypes instead of the actual year-specific chassis.

The parser/resolver now preserves the inheritance marker and inherits source types/upgrades/slots correctly. The land certification test verifies:

- light tank chassis 0–3
- medium tank chassis 0–3
- heavy tank chassis 0–3

The current light/medium/heavy Tank Designer catalog therefore exposes **12 real year-specific chassis** (four per class), while duplicate role archetypes and unrelated super-heavy/modern/Land Cruiser families are not incorrectly injected into those three class pickers.

### Runtime equipment resolution — PASS for land data

The permanent land certification test verifies that every equipment `need` referenced by all 121 bundled land/support sub-units resolves against the certified runtime pack.

It also verifies representative inheritance and selection behavior for:

- infantry/support equipment families
- motorbike equipment
- normal light/medium/heavy tank chassis
- flame chassis families
- amphibious chassis families
- Land Cruiser completed fallback
- tank source-unit equipment modifiers surviving designer replacement (for example the source medium-armor breakthrough modifier)

This is a **data-selection/hydration certification**, not a claim of executable parity for every combat aggregation formula. Combat aggregation remains part of the later combat-formula audit.

### Explicitly deferred from Phase 1

The following items were deferred from the land-data pass and handled in later designer/formula phases: exact tank module compatibility, designer defaults, player-designed variant stats, extended chassis UX, aircraft duplicate archetypes, and industry/combat formula parity.

## Overall certification matrix

| Area | Source completeness | Value correctness | Runtime correctness | Status |
|---|---|---|---|---|
| Land sub-units | **PASS** | **PASS** | **PASS for source selection/hydration** | **Certified** |
| Land equipment | **PASS for planner scope** | **PASS** | **PASS for source selection/hydration** | **Certified** |
| Tank modules/designer | **PASS for source-backed designer scope** | **PASS for source data and structural rules** | **PASS for 28 variants / 36 linked unit targets** | **Certified source/structural layer** |
| Air equipment/modules | **PASS — 21 frames / 94 slot modules / 13 duplicate archetypes** | **PASS — exact field fingerprints + 43/43 mission blocks** | **PASS for source-slot and mission-profile hydration** | **Certified data layer** |
| Technologies/requirements | Not started | Not started | Not started | Pending |
| Doctrines | Not started | Not started | Not started | Pending |
| MIOs | Not started | Not started | Not started | Pending |
| Terrain/tactics/modifiers | Not started | Not started | Not started | Pending |
| Defines | Not started | Not started | Not started | Pending |
| Production formulas | Not started | Not started | Not started | Pending |
| Combat formulas | Not started | Not started | Not started | Pending |

## Phase 3 — Air Designer

Status: **PASS — Air source-data layer certified; exact NAir combat remains a separate formula audit**

Initial source-graph audit identified **21 concrete designable airframes** (5 carrier-small, 6 land-small, 5 medium, 5 large), **29 slot categories**, and **94 equipment modules actually referenced by those frame slots**. The previous heuristic catalog exposed 25 frames and 88 alleged weapons, including archetype templates and unrelated module families.

The audit branch now derives the Air Designer catalog directly from each concrete airframe's `module_slots`. Required/optional slots and engine multiplicity are structural rules; technology/DLC/Special Project requirements remain informational only. Existing 0.15.0 Air Lab saves migrate into the source-slot model instead of being discarded.

### A-001 — heuristic module catalog / fixed slot layout — FIXED

Pack-mode Air Designer no longer uses a fixed 3-weapon + 1-defense + 2-special layout or text heuristics to decide which modules are aircraft modules. It renders the actual slots on the selected 1.19.2 frame and limits every picker to the source `allowed_module_categories` for that slot. The source corpus resolves to exactly **21 airframes / 29 categories / 94 slot modules / 33 engine modules / 29 weapon-role modules**.

### A-002 — airframe archetype templates exposed as buildable — FIXED

The four unnumbered airframe archetypes are excluded. Only numbered concrete frames are selectable. Carrier-small frames remain distinguishable from land small frames.

### A-003 — repeated + multi-mission `mission_type_stats` loss — FIXED AND SOURCE-CERTIFIED

The authoritative supplied 1.19.2 `00_plane_modules.txt` has been recovered and fingerprinted (`b077c40bd386b53ea3b6af97acee44247c07056c9476a143de48e7130c74b692`). It contains **94** Air modules, **33** modules with mission-specific effects, and **43 / 43** `mission_type_stats` blocks. Nine modules contain repeated mission blocks; those repetitions are restored.

The audit also found and fixed a second parser issue: a single `limit = { ... }` block can name multiple missions, and the old normalizer collapsed that list to its final token. Multi-mission limits such as `bomb_locks = { cas attack_logistics }` and `torpedo_mounting = { naval_bomber port_strike }` are now preserved exactly. Permanent tests verify repeated blocks, multi-token limits, source counts, source hash, mission isolation, CAS/logistics reuse, naval-strike effects, and interception-only rocket effects. `add_average_stats` values are source-complete, but their exact executable aggregation semantics remain explicitly classified as inferred rather than treated as a data gap.

### A-004 — aircraft `duplicate_archetypes` — FIXED AND SOURCE-CERTIFIED

The authoritative supplied 1.19.2 `x_plane_airframes.txt` was recovered and fingerprinted (`0747e1a834d4c44eeee593bc0d5cbd7f636be6f34be89be53b19f83afcd08f8a`). All **13 / 13** aircraft `duplicate_archetypes` are retained alongside the 21 tank definitions, for **34** total duplicate-archetype specifications.

Their IDs, base archetypes, equipment types, `only_duplicate_archetype` flags, carrier metadata, variant-name mappings, `for_each` values, substitutes and other normalized source metadata are regression-tested. The Air Lab derives design roles from source module `add_equipment_type`; the duplicate specifications are therefore retained as exact source data rather than artificially exposed as selectable base airframes. `airDuplicateArchetypesCertified` is true.

### A-005 — 1933 airframe slot inheritance — FIXED AND SOURCE-CERTIFIED

Exact per-record fingerprinting found that four 1933 concrete frames had lost their source `module_slots = inherit` marker in the old built-in JSON: `small_plane_airframe_0`, `cv_small_plane_airframe_0`, `medium_plane_airframe_0`, and `large_plane_airframe_0`. Restoring the inheritance flag reproduces the authoritative normalized fingerprint for all four frames exactly.

The permanent Air field-value certification now checks **21 / 21 concrete airframes** across scalar stats, resources, archetype/parent metadata, slot topology/category lists, and slot-inheritance state.

### A-006 — Recon Camera exact-match category restrictions — FIXED AND SOURCE-CERTIFIED

The final 94-module structural fingerprint mismatch was isolated to a single source field on `recon_camera`: `forbid_equipment_type_exact_match_for_category`. The restored 1.19.2 map requires `scout_plane` when Recon Camera is combined with `fighter_weapon`, `cas_weapon`, `nav_bomber_weapon`, `tac_weapon`, or `mine_warfare_offense` categories.

After restoring that map, every independently hashed Air module field family matches the authoritative 1.19.2 extraction: category/gui/parent/XP metadata, allow/forbid equipment lists, `add_equipment_type`, allowed categories, exact-match restrictions, base effects/resources, and mission effects.

### Exact Air value certification — PASS

Permanent CI now fingerprints every planner-consumed normalized field for all **21 concrete airframes** and **94 source-slot-compatible modules**. It separately checks airframe scalar/resource metadata, airframe slot topology, module structural metadata, base effects/resources, and mission-specific effects. The normalized fingerprints match the supplied 1.19.2 source corpus after the A-005 and A-006 repairs.

### Current Air certification boundary

Certified as source data: all 21 concrete designable airframes, their complete source slot graph and inheritance state, all 94 slot-compatible Air modules and planner-consumed fields, base stats/resources, all 43 mission-specific stat blocks, all multi-mission limit lists, all 13 aircraft duplicate-archetype specifications, carrier identity, and equipment-role metadata. Runtime hydration applies the recovered mission blocks to the matching mission profile without cross-mission leakage.

This certifies the **Air data layer**, not bit-for-bit `hoi4.exe` behavior. Exact `NAir` combat resolution and executable aggregation semantics such as `add_average_stats` remain classified for the later formula audit.
