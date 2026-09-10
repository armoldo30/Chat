# HOI4 1.19.2 Technology / Requirements Audit

Status: **IN PROGRESS — source inventory certified; planner-relevant effect corpus partially source-certified; narrow runtime application executable-inferred**

This file records the current technology/requirements milestone without overstating full `hoi4.exe` parity. The project remains theorycraft-first: technology, DLC, focus, Special Project, and similar requirements are informational metadata only and do not make structurally valid content unselectable.

## Source inventory — PASS

The supplied vanilla HOI4 1.19.2 technology corpus contains **13 source files and 552 unique technology records**. The permanent source manifest records every technology ID and the SHA-256 of every supplied technology file.

The audit corrected the old 588-record count: **36 `@...` Clausewitz/script constants were being misclassified as technologies**. They are now excluded from the technology census while valid empty technology blocks remain preserved.

Permanent coverage: `tests/technology-parser-certification.test.mjs`.

## Parser / requirements layer — PASS for audited fields

The technology parser now preserves and normalizes:

- technology IDs and source-file provenance
- local `@` script constants, including numeric resolution while retaining the original token in `raw`
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

Player prerequisite metadata is built only from actual technology graph dependencies/paths and source availability gates. `has_tech` conditions inside AI weighting no longer leak into player prerequisites.

### Theorycraft-first invariant

Requirements do **not** become selection locks. The planner may report unmet requirements, but structurally valid battalions, modules, tank designs, air designs, battle scenarios, and production choices remain usable.

## Bundled graph / unlock restoration — PARTIAL SOURCE CERTIFICATION

The original compacted built-in 1.19.2 technology records did not preserve every source graph field. Exact source-derived graph/unlock overlays have therefore been restored for the currently recovered planner-relevant source slices:

- industry
- support
- infantry
- BBA aircraft
- Special Project technologies

Representative permanent cases include:

- `basic_machine_tools` outgoing paths
- `flexible_line` prerequisite and XOR relationship
- `tech_signal_company` dependencies, path prerequisite, and sub-unit unlocks
- `aa_cannon_1` source path without AI-only prerequisite contamination
- `infantry_weapons` equipment/module unlocks
- `advanced_modern_tank_turret_tech` source `allow = { always = no }` retained as metadata only

Full source-derived graph restoration for every record in all 13 files is **not yet claimed**. The original raw source corpus is not currently available in File Library, so missing exact graph fields will not be replaced with wiki/public approximations.

## Direct technology effects — PARTIAL SOURCE CERTIFICATION

The audit has committed **208 source-derived direct-effect records across 9 source groups**:

- armor
- artillery / anti-tank / anti-air
- BBA aircraft
- electronics
- industry
- infantry
- NSB armor / projects
- Special Project technologies
- support companies

These payloads are wired into `BUILTIN_1192.technologies[*].directEffects` and permanently compared against the committed source-derived supplements in `tests/technology-effects-runtime-certification.test.mjs`.

Golden source-value cases include industry efficiency/capacity, research speed, radio modifiers, engineer entrenchment, logistics supply consumption, artillery soft attack, mountain-tank terrain data, and aircraft mothership range data.

The four technology source areas not represented in this 208-record direct-effect supplement set are primarily the currently non-planner naval/legacy-air slices. They remain outside this partial effect certification rather than being inferred.

## Runtime application — PASS for narrow supported subset / EXECUTABLE-INFERRED

`TechProfile` now supports an explicit `technologies: []` list. The planner does **not** infer a researched technology tree from an equipment-tier selector.

For explicitly selected technology IDs, the runtime currently applies only a narrow set of direct unit/category percentage modifiers whose planner mapping is unambiguous enough for an executable-inferred implementation:

- `soft_attack` → soft attack factor
- `hard_attack` → hard attack factor
- `defence` / `defense` → defense factor
- `breakthrough` → breakthrough factor
- `air_attack` → air attack factor
- `supply_consumption_factor` → supply-use factor

Multiple technology modifiers to the same unit/stat accumulate additively before the factor is applied. Source sub-unit IDs and `category_*` targets are resolved in separate namespaces; planner aliases/types are not allowed to collide with source sub-unit IDs.

Permanent runtime cases cover:

- line artillery +10% soft attack from `interwar_artillery`
- support artillery +5% soft attack from the same technology
- additive stacking with `artillery2`
- logistics-company supply-use reduction
- country-level `radio` effects remaining unapplied to unit stats
- unknown technology IDs remaining informational and never blocking theorycrafting
- selected technology effects surviving the normal downstream doctrine transformation

This runtime interpretation is classified **Executable inferred**, not Game-file exact executable behavior.

## Explicitly deferred technology semantics

The following source data is retained but intentionally not guessed into runtime calculations yet:

- country-level modifiers
- terrain-specific technology blocks
- `battalion_mult` and other special aggregation forms
- scripted `on_research_complete` effects and their limits
- unsupported unit stats such as organization/strength/recon/armor adjustments until field semantics are separately certified
- production-formula interactions
- exact ordering between all technology, doctrine, MIO, equipment, designer, terrain, and combat modifiers

These belong in the later technology/formula integration work and must retain the audit classification boundary.

## Current clean verification

Workflow: **Test and Deploy War Planner**

- Run: **234**
- Run ID: **34501109857**
- Head SHA: `360e5b164777816e0f114e0ad26f2ec4cf1d745f`
- Full `npm test`: **PASS**
- Static build: **PASS**
- Pages configure/upload: **skipped as intended**
- Deploy job: **skipped as intended**

Production `main` was not changed.

## Next technology work

1. Recover or re-supply the exact raw 1.19.2 technology source corpus if full 13-file graph/effect field certification is required.
2. Complete source graph/unlock overlays for remaining planner-relevant technology files.
3. Expand runtime application only after each additional effect family has a proven HOI4/planner semantic mapping.
4. Integrate an explicit researched-technology selector/state into UI only after the data/runtime semantics are stable; do not convert it into a legality gate.
5. When this phase is complete, update the overall matrix in `DATA_AUDIT_1.19.2.md` and proceed to Doctrines.
