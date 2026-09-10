# HOI4 1.19.2 Data Certification Audit

This document tracks source completeness, value correctness, and runtime use for HOI4 War Planner against the supplied vanilla HOI4 1.19.2 `common/` files.

## Audit standard

Each area is checked at three levels:

1. **Source completeness** — planner-relevant source records are present.
2. **Value correctness** — normalized fields exactly match the source files.
3. **Runtime correctness** — the planner actually consumes those normalized values rather than stale fallback constants.

Requirements such as technologies, DLC and Special Projects are audited as metadata only. They must not become theorycraft locks.

## Phase 1 — land sub-units and equipment

Status: **IN PROGRESS**

### Source inventory

Raw 1.19.2 parser inventory from the supplied files:

- 157 total sub-unit records
- 308 total equipment records
- 313 equipment-module records

Current bundled planner scope:

- 121 sub-unit records
- 215 equipment records
- 313 equipment-module records

The omitted records are primarily naval, missile and map-unit content outside the current Division/Tank/Air planner scope. Scope exclusions must be explicit rather than accidental.

### Value verification — PASS for currently bundled land/equipment records

An independent corrected extraction was compared field-by-field against the deployed 0.15.0 bundle.

- Shipped sub-units compared: 121
- Sub-unit field mismatches: **0**
- Shipped equipment compared: 215
- Equipment field mismatches: **0**

Audited sub-unit fields: group, type list, category list, combat width, HP, organization, manpower, supply, hardness, armor, piercing, soft attack, hard attack, defense, breakthrough, air attack and equipment need.

Audited equipment fields: year, archetype, parent, IC cost, reliability, defense, breakthrough, hardness, armor, soft/hard attack, piercing, air attack, speed, fuel, weight, thrust, air defense/agility/range, ground/naval attack, resources, module slots, type list and upgrades.

### Finding L-001 — multi-value Clausewitz lists can be truncated by the importer

**Severity: high for imported packs; built-in 0.15.0 bundle is not affected.**

The current extractor applies `last()` before decoding several list-valued fields. A source value such as:

```txt
type = { armor amphibious }
categories = { category_tanks category_front_line category_amphibious_tanks }
```

can therefore normalize to only the final token. Affected paths include sub-unit types/categories, equipment types/upgrades, module equipment-type lists, and analogous extended-data list fields.

Fix requirement: recursively flatten list values and never apply scalar `last()` semantics to Clausewitz list fields. Permanent regression coverage must use multi-token fixtures.

### Finding L-002 — land-family completeness candidates

The bundle intentionally filters many records outside current planner scope. Three omitted equipment IDs are directly related to land families already present and require explicit resolution rather than silent exclusion:

- `motorbike_equipment_1`
- `land_cruiser_chassis_1`
- `land_cruiser_equipment_1` (non-NSB fallback)

Railway-gun sub-units are also omitted, but they are map units rather than division-template units and may remain explicitly out of planner scope.


### Finding L-003 — nested module-slot lists were truncated — FIXED ON AUDIT BRANCH

The first scalar/top-level comparison did not independently decode nested `module_slots`. A second raw-structure audit found **234** multi-category slot definitions whose built-in `allowed_module_categories` had been reduced to only the final category: **34 tank**, **184 aircraft**, and **16 other** slot definitions. Examples included tank gun/turret/special slots and aircraft weapon/engine/special slots.

The audit branch now uses a targeted slot normalizer (the only list-valued slot field in the 1.19.2 inventory is `allowed_module_categories`) and a source-derived built-in supplement. Permanent tests verify all 234 restored lists. This correction is not yet on live `main`.

### Finding L-004 — six selectable dynamic tank roles currently resolve to zero equipment stats — OPEN

The following included sub-units request designer-derived equipment families that do not exist as normal static equipment records in the current built-in selection path:

- `amphibious_light_armor` → `light_tank_amphibious_chassis`
- `amphibious_medium_armor` → `medium_tank_amphibious_chassis`
- `amphibious_heavy_armor` → `heavy_tank_amphibious_chassis`
- `light_flame_tank` → `light_tank_flame_chassis`
- `medium_flame_tank` → `medium_tank_flame_chassis`
- `heavy_flame_tank` → `heavy_tank_flame_chassis`

At present these can hydrate with an empty `sourceEquipment` set and zero equipment-derived combat stats. This requires an explicit designer-role solution; inventing fallback stats would violate the certification standard.

### Finding L-005 — explicit regimental-support category should override name heuristics — FIXED ON AUDIT BRANCH

`super_heavy_tank_destroyer_brigade` was falsely classified as regimental support by a name heuristic even though the source marks it as divisional support. The audit branch now treats `category_regimental_support_battalions` as authoritative whenever explicit categories are present, retaining heuristics only for legacy/category-less data.

### Inheritance/completeness notes

A full-source versus bundled equipment-family selection comparison found only seven selection-ID differences across the 44 equipment families requested by bundled land sub-units at 1936/1940/1945/1950: four Land Cruiser cases and three motorbike cases. `motorbike_equipment_1` carries no distinct combat stats beyond its archetype, so that gap is mainly provenance/completeness. Land Cruiser remains a substantive open case because the bundled archetype alone has no designed armament stats.

### Next checks

- Fix and regression-test multi-value list parsing.
- Resolve the three land-family completeness candidates.
- Verify every included sub-unit `need` family resolves to the correct equipment family/snapshot.
- Verify support/regimental classification against raw categories/types.
- Verify equipment inheritance and year snapshots for representative infantry, artillery, motorized/mechanized and armor families.
- Audit runtime hydration to prove Division Lab/Industry consume source-normalized values.

## Overall certification matrix

| Area | Source completeness | Value correctness | Runtime correctness | Status |
|---|---|---|---|---|
| Land sub-units | In progress | PASS for shipped records | Not yet certified | In progress |
| Land equipment | In progress | PASS for shipped records | Not yet certified | In progress |
| Tank modules/designer | Not started | Not started | Not started | Pending |
| Air equipment/modules | Not started | Not started | Not started | Pending |
| Technologies/requirements | Not started | Not started | Not started | Pending |
| Doctrines | Not started | Not started | Not started | Pending |
| MIOs | Not started | Not started | Not started | Pending |
| Terrain/tactics/modifiers | Not started | Not started | Not started | Pending |
| Defines | Not started | Not started | Not started | Pending |
| Production formulas | Not started | Not started | Not started | Pending |
| Combat formulas | Not started | Not started | Not started | Pending |
