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
| Technologies/requirements | **PASS — 552-ID/13-file inventory; exact payload boundary measured** | **PASS — 226 exact graph + 208 exact direct-effect records** | **PASS — informational requirements + all current core-land scalar mappings; other domains classified/deferred** | **Audit complete / bounded source certification** |
| Doctrines | **PASS — 21 files / 121 doctrine nodes** | **PASS — 121/121 raw-record fingerprints** | **PASS for current Land/Air planner surfaces; unsupported formula paths explicitly deferred** | **Certified source layer / bounded runtime** |
| MIOs | **PASS — 55 files / 552 declarations / 51 source variables; payload boundary explicit** | **PASS for recovered exact payload — 85 trait corrections / 3 removals; 24 equipment groups / 22 policies retained** | **PASS for inheritance/tree/equipment-filter and current equipment/production behavior; policy/global/exact executable semantics deferred** | **Audit complete / bounded source certification** |
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

## Phase 4 — Technologies / Requirements

Status: **PASS — audit complete with bounded source certification; current planner-core land runtime certified as executable-inferred**

The source census is exactly **13 files / 552 technologies**, with every ID and source-file SHA-256 retained. The audit removed 36 false `@...` script-variable records from the old technology count while preserving valid empty technology definitions.

Exact recovered source overlays cover **226 graph/unlock records** across industry, support, infantry, BBA aircraft, and Special Project technologies, plus **208 direct-effect records across nine source groups**. The raw source text needed to reconstruct every omitted graph/effect field for all 552 technologies is not currently available, so the remaining exact-source surface is explicitly bounded rather than filled with public/wiki approximations.

The recovered effect corpus is now machine-classified. It contains **505 top-level effect targets**, **345 direct scalar effect occurrences**, **161 terrain-specific blocks**, and **12 `battalion_mult` blocks**. Of the 345 direct scalar occurrences, **257** map directly onto core land stats already represented by the planner and are supported by the explicit selected-technology runtime. These include soft/hard attack, defense, breakthrough, air attack, piercing, armor, hardness, supply factors, combat width, HP/strength, organization, and flat supply use.

The remaining source effects are not discarded: terrain effects are assigned to terrain/combat formulas; `battalion_mult` to aggregation formulas; country/global/industry/research/building effects to their global/production systems; specialist support/equipment/air fields to their relevant domain audits; and scripted completion effects remain separate from direct stat aggregation.

Requirements are source-backed and informational-only. Dependencies, path prerequisites, XOR conflicts, `allow` / `allow_branch`, Special Project metadata, and unknown technology IDs can be reported, but structurally valid theorycraft content remains selectable.

The all-effects certification fixture selects every one of the **208** exact effect-source technologies. **80** have effects applicable to the current core land model, producing **386** applied unit/stat modifier pairs with **0 unknown technology IDs**.

Detailed certification, field mappings, exclusions, test coverage, and the explicit non-parity boundary are recorded in `TECHNOLOGY_AUDIT_1.19.2.md`.

## Phase 5 — Doctrines

Status: **PASS — complete 1.19.2 doctrine source layer certified; current Land/Air planner runtime certified within an explicit bounded effect surface**

### D-001 — complete source inventory — PASS

An independent census of the supplied vanilla 1.19.2 `common/doctrines/` tree identifies exactly **21 doctrine source files / 121 doctrine nodes**: **12 grand doctrines, 14 tracks, and 95 subdoctrines**. The audit also preserves **36 doctrine-labelled metadata records** separately: 32 AI strategy/ratio definitions plus the four `land`, `air`, `naval`, and `special_forces` folder descriptors. Those metadata records are no longer mixed into the selectable doctrine-node catalog.

The old compact bundle was missing nine real source nodes. They are now restored from the supplied files: the naval grand doctrines `new_fleet_in_being`, `new_convoy_raiding`, and `new_base_strike`, plus the capital-ship subdoctrines `line_of_battle`, `battlecruiser_supremacy`, `armored_raiders`, `coastal_defence_fleet`, `naval_gunfire_support`, and `battleship_antiair_screen`.

The certified corpus preserves **474 ordered reward nodes** and **44 grand-doctrine milestone nodes**. Every current Land and Air doctrine choice exposed by the planner resolves to a source-pack record.

### D-002 — exact value certification — PASS

`doctrine-source-manifest-1192.js` records the 21 source-file SHA-256 values and exact ID inventory. A separate independent extraction produced a canonical SHA-256 fingerprint for the raw normalized payload of every doctrine record. Permanent CI compares the runtime bundle against those fingerprints: **121 / 121 records match, 0 mismatches**.

This validates source values, reward insertion order, milestone order, track assignment, XP metadata, source gates, DLC visibility metadata, tactics unlocks, category blocks, global modifiers, and the restored naval records without substituting wiki/public approximations.

### D-003 — requirements remain informational — PASS

Doctrine `available`, `visible`, `allowed`, and XOR data are preserved as requirement metadata. AI-only conditions are excluded from player prerequisite summaries, and generic doctrine AI/folder definitions are stored outside the doctrine-node catalog. DLC, technology, country, and similar gates do **not** lock otherwise structurally valid theorycraft selections.

This preserves the project-wide theorycraft-first rule.

### D-004 — Land doctrine runtime — PASS for certified planner-consumed fields

The source-pack path applies doctrine effects directly to the planner's current land-unit stat model. Certified unit fields are soft attack, hard attack, defense, breakthrough, piercing, air attack, organization, HP/strength, combat width, and supply consumption. Flat `supply_consumption` is applied as a flat base-stat change; it is not treated as a percentage. Global `supply_consumption_factor` is then applied after flat supply changes. Source `land_night_attack` feeds the battle runtime.

Permanent real-pack tests cover Superior Firepower category bonuses, Armored Spearhead reward order and organization, mastery-5 milestone selection, Mass Assault flat supply changes, and global supply-factor propagation.

Fields not represented by an audited downstream planner formula are deliberately **not** applied. Examples include doctrine `maximum_speed`, planning accumulation/max-planning modifiers, maximum entrenchment, reinforce rate, organization-loss rules, command-power effects, training rules, design-cost factors, and specialized terrain/equipment/script blocks. Their source values remain preserved and are classified for later movement/combat/production/defines audits rather than silently mapped to unrelated planner fields.

### D-005 — Air doctrine runtime — PASS for certified Air Lab fields

Air doctrine category matching now uses the exact 1.19 category vocabulary and source equipment types, including fighter, carrier fighter, heavy fighter, CAS, carrier CAS, naval bomber, carrier naval bomber, maritime patrol, tactical bomber, strategic bomber, and scout-plane targets. Global effects from every selected Air track are evaluated; category-scoped blocks then self-filter against the aircraft rather than being skipped because the track was considered "irrelevant" by a size heuristic.

The bounded runtime supports source aircraft stat factors used by the Air Lab and the audited mission-efficiency fields for air superiority, CAS, naval strike, and general air mission efficiency. It also supports audited global aircraft factors for ground attack, range, fuel consumption, and strategic-bomber defense where applicable.

`air_cas_present_factor` is **not** treated as Air Lab mission efficiency; it belongs to land-combat CAS resolution. Air-superiority/interception detection modifiers are preserved as exact source data but deliberately deferred until the dedicated detection/combat formula path is audited, preventing cross-mission leakage.

### D-006 — Naval and Special Forces doctrine boundary — SOURCE-CERTIFIED / runtime intentionally not invented

All Naval and Special Forces doctrine records are present and exact in the 121-record source corpus, including their complete rewards and milestones. The current planner does not expose dedicated Naval Doctrine or Special Forces Doctrine runtime surfaces, so these effects are retained as certified source data rather than being forced through Land/Air calculations. This is an explicit product-scope boundary, not a source-data gap.

### Doctrine certification classification

- **Game-file exact:** 21 source files, 121 doctrine records, 36 separated metadata records, 474 rewards, 44 milestones, raw values, track topology, gates and source ordering.
- **Executable inferred / planner-consumed and regression-tested:** current Land and Air stat application described above, including additive-before-factor supply handling and source category targeting.
- **Explicitly deferred:** unsupported movement/planning/entrenchment/reinforcement/training/command/equipment/script effects; mission-specific Air detection and land-combat CAS-presence behavior; Naval/Special Forces runtime; any exact executable ordering or formula behavior assigned to later combat/production/defines audits.

Permanent certification coverage is provided by `doctrine-parser-certification.test.mjs`, `doctrine-source-certification.test.mjs`, `doctrine-audit-coverage.test.mjs`, `doctrine-effect-coverage.test.mjs`, `doctrine-runtime-certification.test.mjs`, and the existing doctrine regression tests.

## Phase 6 — Military Industrial Organizations

Status: **PASS — audit complete with bounded source certification; current structural/equipment/production runtime certified as executable-inferred**

The recovered source census covers **55 organization files / 552 source declarations / 51 file-local MIO variables** with per-file SHA-256 hashes and declaration counts. The compact bundle contains **429 organization records / 960 traits / 401 include relationships**, resolving to **456 runtime organizations** after the recovered source-correction and inheritance path. Source declarations and final runtime organization counts are intentionally kept as separate measurements.

Five committed source-correction chunks provide the exact recoverable organization/trait payload boundary. They touch **120 organizations** and retain **85 exact corrected trait definitions / 3 exact `remove_trait` relationships**, plus recovered static-disabled flags, country fields, initial equipment restrictions, and trait equipment restrictions. Permanent CI verifies every recovered correction reaches the resolved runtime catalog and every recovered removal is applied after inheritance.

The earlier **235 trait / 9 removal** assertion was an unverified intermediate target and failed. No sixth authoritative correction chunk exists in the recovered branch history, so the audit does not relabel that failed expectation as source evidence.

Parser/runtime certification covers include inheritance, post-inheritance removal, any/all/N-of-parent tree prerequisites, mutual exclusion, static-disabled structural behavior, exact equipment-group targeting, and prevention of trait-effect leakage onto incompatible equipment. Country eligibility remains informational-only so theorycraft-valid organizations are not research/country locked.

The recovered auxiliary source corpus also retains **24 MIO equipment groups** and **22 MIO policy records**. Equipment groups participate in current structural runtime filtering. Policies are source-preserved but their complete size/funds/research/availability/application lifecycle is explicitly deferred; the current planner does not invent that executable behavior.

Current equipment and designed-variant MIO stat application, together with current production-factor helpers, is regression-tested and classified **Executable inferred**. Exact HOI4 production-line interaction, organization/funds/task mechanics, unsupported modifier families, naval runtime, and modifier ordering remain assigned to later production/defines/combat formula work.

Detailed boundaries, recovered payload counts, rejected historical targets, runtime semantics, and explicit non-parity claims are recorded in `MIO_AUDIT_1.19.2.md`.
