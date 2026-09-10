# HOI4 1.19.2 Data Certification Audit

This document tracks source completeness, value correctness, and runtime use for HOI4 War Planner against the supplied vanilla HOI4 1.19.2 `common/` files.

## Audit standard

Each area is checked at three levels:

1. **Source completeness** — planner-relevant source records are present.
2. **Value correctness** — normalized fields exactly match the source files.
3. **Runtime correctness** — the planner actually consumes those normalized values rather than stale fallback constants.

Requirements such as technologies, DLC and Special Projects are audited as metadata only. They must not become theorycraft locks.

## Phase 1 — land sub-units and equipment

Status: **IN PROGRESS — normalized bundled records certified; dynamic designer families remain open**

### Source inventory

Raw 1.19.2 parser inventory from the supplied files:

- 157 total sub-unit records
- 308 ordinary `equipments` records
- 313 equipment-module records
- 21 tank `duplicate_archetypes` definitions
- 13 aircraft `duplicate_archetypes` definitions

Current bundled planner scope:

- 121 sub-unit records
- 215 ordinary equipment records
- 313 equipment-module records

#### Sub-unit completeness — PASS for Division Lab scope

There are 36 raw sub-unit IDs not bundled. Every omitted ID is outside division-template/support scope: naval vessels, aircraft wings, missiles, or the two railway-gun map units (`railway_gun` and `super_heavy_railway_gun`). No ordinary division-template/support sub-unit was found missing from the 121-record bundled set.

#### Ordinary equipment completeness

There are 93 raw ordinary equipment records not bundled. Ninety are naval, missile, convoy/floating-harbor or other out-of-scope equipment. Only three omitted ordinary records are directly land-relevant:

- `motorbike_equipment_1`
- `land_cruiser_chassis_1`
- `land_cruiser_equipment_1` (non-NSB fallback)

`motorbike_equipment_1` defines no distinct combat stats beyond its archetype, so this is primarily a provenance/completeness gap. The two Land Cruiser records are substantive because the currently bundled designer archetype does not itself contain a completed armament design.

### Value verification — PASS for all currently bundled normalized records on the audit branch

An independent source extractor was compared field-by-field against the audit-branch built-in pack after the list corrections.

- Bundled sub-units compared: **121 / 121**
- Normalized sub-unit field mismatches: **0**
- Bundled equipment compared: **215 / 215**
- Normalized equipment field mismatches: **0**

Audited sub-unit fields: group, complete type list, complete category list, combat width, HP, organization, manpower, supply, hardness, armor, piercing, soft attack, hard attack, defense, breakthrough, air attack and equipment need.

Audited equipment fields: year, archetype, parent, IC cost, reliability, defense, breakthrough, hardness, armor, soft/hard attack, piercing, air attack, speed, fuel, weight, thrust, air defense/agility/range, ground/naval attack, resources, complete module-slot definitions, complete type list and upgrades.

This certifies the normalized values we currently expose for the 121/215 bundled records. It does **not** claim that executable-only aggregation formulas or designer behavior are exact; those are separate runtime audits.

### Finding L-001 — multi-value Clausewitz lists could be truncated — FIXED ON AUDIT BRANCH

**Live 0.15.0 note:** the built-in top-level sub-unit/equipment lists were already correct, but client-side imports could truncate list-valued fields.

The extractor applied scalar `last()` semantics before decoding several list-valued fields. A source value such as:

```txt
type = { armor amphibious }
categories = { category_tanks category_front_line category_amphibious_tanks }
```

could therefore normalize to only the final token. Affected importer paths included sub-unit types/categories, equipment types/upgrades, module equipment-type lists and analogous extended-data list fields.

The audit branch now recursively preserves multi-value lists, with permanent regression fixtures.

### Finding L-002 — three ordinary land-family completeness candidates — OPEN

The three omitted land-relevant ordinary equipment IDs are:

- `motorbike_equipment_1`
- `land_cruiser_chassis_1`
- `land_cruiser_equipment_1`

Railway-gun sub-units are intentionally considered map units rather than Division Lab template units.

### Finding L-003 — nested module-slot lists were truncated — FIXED ON AUDIT BRANCH

A raw-structure audit found **234** multi-category slot definitions whose built-in `allowed_module_categories` had been reduced to only the final category: **34 tank**, **184 aircraft**, and **16 other** slot definitions.

Examples included:

- `light_tank_chassis.main_armament_slot`: small main armament **and** flamethrower
- medium/heavy/modern tank turret slots with multiple permitted turret categories
- tank special slots permitting special/radio/secondary-turret categories
- `small_plane_airframe.fixed_main_weapon_slot`: fighter/CAS/naval-bomber/kamikaze categories
- aircraft engine and special-module slots with multiple permitted categories
- Land Cruiser special-feature slots permitting radio/aerial/external/structural categories

The audit branch now uses a targeted slot normalizer. The 1.19.2 inventory showed that slot objects use `required`, `allowed_module_categories`, and occasional `gfx`; only `allowed_module_categories` is list-valued. A source-derived built-in supplement restores all 234 multi-category lists, and permanent tests verify every restored slot. This correction is not yet on live `main`.

### Finding L-004 — six selectable dynamic tank roles currently resolve to zero equipment stats — OPEN

The following included sub-units request designer-derived equipment families that do not exist as ordinary static equipment records in the current built-in selection path:

- `amphibious_light_armor` → `light_tank_amphibious_chassis`
- `amphibious_medium_armor` → `medium_tank_amphibious_chassis`
- `amphibious_heavy_armor` → `heavy_tank_amphibious_chassis`
- `light_flame_tank` → `light_tank_flame_chassis`
- `medium_flame_tank` → `medium_tank_flame_chassis`
- `heavy_flame_tank` → `heavy_tank_flame_chassis`

At present these can hydrate with an empty `sourceEquipment` set and zero equipment-derived combat stats. The source explains why: these families are created through `duplicate_archetypes`, then require actual designer variants. This needs an explicit designer-role solution; inventing fallback combat numbers would violate the certification standard.

### Finding L-005 — explicit regimental-support category should override name heuristics — FIXED ON AUDIT BRANCH

`super_heavy_tank_destroyer_brigade` was falsely classified as regimental support by a name heuristic even though the source marks it as divisional support. The audit branch now treats `category_regimental_support_battalions` as authoritative whenever explicit categories are present, retaining heuristics only for legacy/category-less data. A full bundled-category regression test now checks this behavior.

### Finding L-006 — `duplicate_archetypes` is not yet represented by the normalized data model — OPEN

HOI4 1.19.2 uses `duplicate_archetypes` in two source files:

- `x_tank_chassis.txt`: **21** tank-derived archetype definitions
- `x_plane_airframes.txt`: **13** aircraft-derived archetype definitions

These definitions clone base chassis/airframe families and then change role/type and, in some cases, `for_each` properties such as hardness or air-superiority values. The current ordinary-equipment extractor ignores this construct.

For land data, this is directly responsible for the missing flame/amphibious equipment families. Other tank-role families often appear to work because separate non-designer fallback equipment records exist, but that does not make the duplicate-archetype source information optional. The correct solution is to preserve the duplicate-archetype definitions as source data and let the Tank/Air Designer materialize role variants deliberately rather than silently inventing static equipment.

### Equipment-family selection/inheritance notes

A full-source versus bundled equipment-family selection comparison covered all 44 equipment families requested by bundled land sub-units at 1936/1940/1945/1950. Only seven selection-ID differences were found:

- four Land Cruiser cases
- three motorbike cases

No scalar resolved-value mismatches were found for the ordinary equipment records that are present. The apparent missing-parent warnings for several dynamic tank/air families largely reflect `duplicate_archetypes` identifiers rather than lost scalar values.

### Next checks

- Preserve `duplicate_archetypes` as normalized source metadata without automatically turning every role into a generic chassis option.
- Design the correct flame/amphibious role-variant path so selectable units never silently receive zero equipment stats.
- Resolve Land Cruiser default/designer behavior using its `land_cruiser_chassis_1` and non-NSB fallback data without conflating the two systems.
- Decide whether to include `motorbike_equipment_1` for exact provenance even though it adds no distinct combat stats.
- Audit runtime hydration to distinguish game-file-exact input values from executable-inferred sub-unit/equipment aggregation behavior.
- After the land runtime path is resolved, certify Industry consumption of the same equipment costs/resources.

## Overall certification matrix

| Area | Source completeness | Value correctness | Runtime correctness | Status |
|---|---|---|---|---|
| Land sub-units | **PASS for Division scope** | **PASS** | Dynamic tank roles open | In progress |
| Land equipment | 3 ordinary records + duplicate archetypes open | **PASS for all bundled normalized records** | Flame/amphibious/Land Cruiser open | In progress |
| Tank modules/designer | Slot-list defect fixed; full audit not started | Not fully certified | Not fully certified | Pending |
| Air equipment/modules | Slot-list defect fixed incidentally; full audit not started | Not fully certified | Not fully certified | Pending |
| Technologies/requirements | Not started | Not started | Not started | Pending |
| Doctrines | Not started | Not started | Not started | Pending |
| MIOs | Not started | Not started | Not started | Pending |
| Terrain/tactics/modifiers | Not started | Not started | Not started | Pending |
| Defines | Not started | Not started | Not started | Pending |
| Production formulas | Not started | Not started | Not started | Pending |
| Combat formulas | Not started | Not started | Not started | Pending |
