# HOI4 1.19.2 Technology / Requirements Audit

Status: **COMPLETE — bounded source certification; planner-core land runtime certified as executable-inferred**

This audit is complete for the current War Planner scope. “Complete” means every technology/requirements surface currently available from the supplied/recovered 1.19.2 evidence has been inventoried, tested, and either implemented or explicitly assigned to a later formula/domain audit. It does **not** mean the repository contains an exact reconstructed source payload for every field of all 552 technologies, and it does not claim bit-for-bit `hoi4.exe` execution parity.

The project remains theorycraft-first: technology, DLC, focus, Special Project, and similar requirements are informational metadata only and do not make structurally valid content unselectable.

## Final certification boundary

| Layer | Result | Certification |
|---|---:|---|
| Technology source inventory | **13 files / 552 unique technologies** | **PASS — source exact IDs + per-file SHA-256 manifest** |
| Exact graph/unlock overlays | **226 records** | **PASS for recovered source slices** |
| Exact direct-effect overlays | **208 records / 9 source groups** | **PASS for recovered source slices** |
| Direct scalar effect occurrences in the 208-record corpus | **345** | **Fully classified** |
| Core land-stat scalar occurrences supported by current planner | **257 / 345** | **PASS — runtime mapped, executable-inferred** |
| Terrain-specific effect blocks | **161** | **Classified/deferred to terrain + combat formula audit** |
| `battalion_mult` blocks | **12** | **Classified/deferred to aggregation formula audit** |
| Global/building target entries | **167** | **Classified/deferred to research/production/global-system audits** |
| Runtime all-effects certification fixture | **80 technologies / 386 applied unit-stat modifiers** | **PASS** |
| Unknown selected technology handling | **0 unknown in source-effect fixture** | **PASS** |
| Requirements behavior | **informational-only / selectable** | **PASS** |

Permanent measurement: `tests/technology-audit-coverage.test.mjs`.

## Source inventory — PASS

The supplied vanilla HOI4 1.19.2 technology corpus contains **13 source files and 552 unique technology records**. `src/builtin1192/technology-source-manifest-1192.js` records every technology ID plus the SHA-256 and record count of each supplied source file.

The audit corrected the old 588-record count: **36 `@...` Clausewitz/script constants were being misclassified as technologies**. They are now excluded from the technology census while valid empty technology blocks remain preserved.

Permanent coverage: `tests/technology-parser-certification.test.mjs`.

The original raw technology text is not currently available in File Library for a fresh 13-file re-extraction. Therefore no missing source graph/effect field is replaced with a wiki, public-repository, or guessed value. The source manifest and recovered exact source supplements define the certification boundary.

## Parser and requirements layer — PASS

The technology parser preserves and normalizes:

- technology IDs and source-file provenance
- local `@` script constants, including numeric resolution while retaining original source tokens in `raw`
- `start_year` / `year` and `research_cost`
- categories
- repeated `path` blocks and `research_cost_coeff`
- `dependencies`
- `XOR` / `xor`
- `enable_equipments`
- `enable_equipment_modules`
- `enable_subunits`
- `sub_technologies`
- Special Project specialization / technology flags
- `allow` and `allow_branch` source gates as informational metadata
- direct technology effects separately from scripted `on_research_complete` behavior

Player prerequisite metadata is built only from actual technology graph dependencies/paths and source availability gates. `has_tech` conditions inside AI weighting do not leak into player prerequisites.

### Theorycraft-first requirement invariant — PASS

`src/technologyRequirements.js` exposes source-backed requirement reports for exact technology selections. Reports include missing path/dependency technologies, XOR conflicts, source `allow` / `allow_branch` gates, and Special Project metadata. Unknown technology IDs are reported as unknown.

In every case the requirement report remains `selectable: true`. Requirements inform the player; they do not become legality locks. Permanent tests cover `flexible_line`, Signal Company dependencies, XOR behavior, AI-condition exclusion, Special Project gates, and unknown technology metadata.

Permanent coverage: `tests/technology-requirements-runtime-certification.test.mjs` and `tests/theorycraft.test.mjs`.

## Exact graph / unlock restoration — PASS for recovered source slices

The original compacted built-in 1.19.2 technology records did not preserve every source graph field. Exact source-derived graph/unlock overlays were restored for five recovered source slices:

- industry: **43**
- support: **45**
- infantry: **89**
- BBA aircraft: **43**
- Special Project technologies: **6**

Total exact graph/unlock overlay: **226 technologies**.

Representative permanent cases include:

- `basic_machine_tools` outgoing paths
- `flexible_line` prerequisite and XOR relationship
- `tech_signal_company` dependencies, path prerequisite, and sub-unit unlocks
- `aa_cannon_1` source path without AI-only prerequisite contamination
- `infantry_weapons` equipment/module unlocks
- `advanced_modern_tank_turret_tech` source `allow = { always = no }` retained as metadata only

The remaining technologies still exist in the certified 552-ID runtime inventory, but missing exact graph fields from unrecovered raw source are **not** asserted source-exact. This is a documented source-availability boundary, not an unresolved parser/runtime defect.

## Exact direct-effect restoration — PASS for recovered source slices

The audit restored and wired **208 exact source-derived direct-effect records across 9 source groups**:

- armor: **3**
- artillery / anti-tank / anti-air: **32**
- BBA aircraft: **4**
- electronics: **33**
- industry: **39**
- infantry: **61**
- NSB armor / projects: **5**
- Special Project technologies: **5**
- support companies: **26**

These payloads are merged into `BUILTIN_1192.technologies[*].directEffects` and permanently compared against the committed source-derived supplements in `tests/technology-effects-runtime-certification.test.mjs`.

Golden source-value cases include industry efficiency/capacity, research speed, radio modifiers, engineer entrenchment, logistics supply consumption, artillery soft attack, mountain-tank terrain data, aircraft mothership data, and Special Project effects.

The unrecovered source areas are not silently inferred. In particular, naval and legacy-air technology slices that are outside the current planner’s certified technology-effect surface remain outside exact direct-effect source certification.

## Runtime core land-stat application — PASS / EXECUTABLE-INFERRED

`TechProfile` supports an explicit `technologies: []` list. The planner does **not** infer a researched technology tree from equipment-tier selectors.

The 208-record exact effect corpus contains **505 top-level effect targets**. The permanent coverage classifier separates source sub-unit IDs, source `category_*` selectors, global/building effects, and other object targets. It also keeps sub-unit IDs and categories in distinct namespaces, preventing planner aliases or broad unit `type` values from accidentally matching a different HOI4 source target.

Across that corpus there are **345 direct scalar field occurrences** under unit/category/equipment-style targets. **257** map directly to core land stats already represented by the planner and are now handled by the technology runtime.

### Factor mappings

These source sub-unit/category modifiers accumulate additively by stat before a factor is applied:

- `soft_attack` → soft attack
- `hard_attack` → hard attack
- `defence` / `defense` → defense
- `breakthrough` → breakthrough
- `air_attack` → air attack
- `ap_attack` → piercing
- `armor_value` → armor
- `hardness` → hardness
- `supply_consumption_factor` → supply use

### Flat mappings

These source fields modify the corresponding base sub-unit value directly:

- `combat_width` → combat width
- `max_strength` → HP/strength
- `max_organisation` → organization
- `supply_consumption` → supply use

When a selected technology contributes both forms to the same current planner stat, the runtime applies flat changes before factor changes. That ordering, like the rest of this runtime layer, is classified **Executable inferred** until exact cross-system ordering is resolved during the formula audits.

Permanent runtime cases cover line/support artillery distinction and stacking, anti-tank piercing, motorized-artillery hardness, armored-car recon armor, paratrooper organization, support-company HP, infantry combat width, flat supply consumption, logistics supply factor, country-only effects remaining unapplied, unknown technologies remaining informational, and downstream doctrine composition.

In the all-effects certification fixture, selecting all **208** exact effect-source technologies results in **80 technologies with applicable current core land effects** and **386 applied unit/stat modifier pairs**, with **0 unknown technology IDs**.

Permanent coverage: `tests/technology-effect-application.test.mjs` and `tests/technology-audit-coverage.test.mjs`.

## Remaining effect families — fully classified, not part of this tech-runtime layer

The audit identified the remaining semantics rather than treating them as unfinished technology parsing:

- **161 terrain-specific blocks** — assigned to terrain/combat formula audit. The recovered corpus contains 136 attack, 120 movement, and 18 defense terrain-field occurrences inside those blocks.
- **12 `battalion_mult` blocks** — assigned to division aggregation/combat formula audit.
- **167 global/building target entries** — research speed, industrial capacity/efficiency, construction, fuel/resources, encryption/decryption, radar/building limits, nuclear production, reinforcement/coordination, and similar country/global mechanics belong to research/production/global-system formula audits.
- **88 remaining direct scalar occurrences outside the current core-land mapping** — specialist support/equipment/air semantics such as recon, initiative, entrenchment, suppression, reliability, equipment capture, recovery, casualty trickleback, experience loss, fuel use/speed, acclimatization, and aircraft/equipment fields are assigned to their relevant support/equipment/air/formula audits.
- scripted `on_research_complete` effects and limits remain separately preserved and belong to scripted/event semantics, not direct stat aggregation.

No value in these categories is discarded merely because it is not executed by the current core land planner.

## Audit result

**Technology / Requirements audit: COMPLETE with bounded source certification.**

What is certified exactly:

1. the 13-file / 552-technology source inventory and source-file hashes;
2. parser behavior for audited technology/requirement structures;
3. exact graph/unlock payloads for the 226 recovered source-overlay records;
4. exact direct-effect payloads for the 208 recovered source-effect records;
5. complete classification of the recovered effect corpus;
6. theorycraft-first requirement reporting; and
7. current planner-core land technology application for every recovered direct scalar field that maps to the planner’s core land-stat model.

What is deliberately **not** claimed:

- exact unrecovered graph/effect fields for all 552 technologies;
- exact naval/legacy-air technology runtime behavior;
- exact country/global/production/terrain/support-specialist formula behavior;
- exact `hoi4.exe` modifier ordering or scripted-event execution.

Those are explicit downstream domain/formula boundaries, not open technology-audit defects.

## Core implementation verification

Workflow: **Test and Deploy War Planner**

- Run: **244**
- Run ID: **34503517073**
- Head SHA: `ac5105f1f235e686cf512362a4e6050fbfe0c5a6`
- Full `npm test`: **PASS**
- Static build: **PASS**
- Pages configure/upload: **skipped as intended on audit branch**
- Deploy job: **skipped as intended on audit branch**

Production `main` was not changed by the technology audit.

## Next audit phase

Proceed to **Doctrines**. Technology effects that interact with doctrine, terrain, production, MIO, equipment, or combat ordering should be certified in those domain/formula phases rather than reopening this source/requirements audit without new authoritative source evidence.
