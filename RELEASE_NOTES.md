# HOI4 War Planner 0.15.0 — Release Notes

## Overview

0.15.0 is a data-engine and accuracy overhaul built on the compact 0.14.2 interface. The planner now ships with a bundled vanilla HOI4 **1.19.2** game-data baseline and uses parsed source values across major planner systems instead of relying primarily on curated reference tables.

## Headline changes

- Bundled normalized HOI4 1.19.2 data for defines, terrain, sub-units, equipment, tank/air modules, technologies, doctrines, MIOs, tactics, modifiers, equipment upgrades and Special Projects.
- Added modern nested `NDefines = { ... }` parsing while preserving dotted override support.
- Fixed repeated Clausewitz top-level blocks so multiple `equipment_modules`, `equipments` or `sub_units` blocks in one file are merged instead of silently dropping earlier data.
- Restored the standard 1.19.2 tank module corpus, including engines, armor types, suspensions, turrets, guns, howitzers, AA, flamethrowers and special modules.
- Added parsed tank and aircraft designer catalogs with source-derived stats/costs/resources where available.
- Added 1.19 doctrine parsing and pack-derived doctrine reward support where mappings are safe.
- Added runtime MIO inheritance/include resolution for the bundled data pack.
- Added advanced/special support-unit coverage from the game files.
- Replaced runtime compressed-data recovery scaffolding with committed plain split data modules for a simpler and more reliable static release.

## Theorycraft-first prerequisite policy

Research, DLC, Special Projects and similar prerequisites are **informational only** in 0.15.0.

Valid battalions, support units, chassis, modules and design choices remain available at all times. Requirement metadata is displayed through tooltips/info text but does not disable selections, block simulations or invalidate production analysis. Structural compatibility rules still apply where the game object itself cannot fit a slot/category/regiment.

This policy is covered by dedicated regression tests.

## Accuracy model

0.15.0 prefers direct 1.19.2 game-file values whenever the source files expose the relevant rule or stat. The planner still labels executable-only or analytically reconstructed behavior conservatively rather than claiming exact `hoi4.exe` parity.

Remaining analytical/inferred areas include exact tactic/counter timing, reinforcement/coordination behavior, exact CAS direct damage, some aggregate stat semantics, commander/leader effects not modeled by the planner, certain scripted edge cases and the air-exchange model.

## Verification

Release-candidate staging passed from a **clean checkout with no source-mutating migrations or materialization steps**:

- `npm test` — PASS
- `npm run build` — PASS
- repeated Clausewitz block regression — PASS
- bundled 1.19.2 source-value checks — PASS
- Tank Designer catalog ingestion — PASS
- Air Designer/comparison — PASS
- doctrine/MIO/tech tests — PASS
- theorycraft/prerequisite behavior — PASS
- route-level UI smoke tests — PASS

GitHub Pages deployment remains gated on the same clean test/build workflow and only runs from `main`.