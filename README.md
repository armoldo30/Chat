# HOI4 War Planner — lead build 0.10.1

A mobile-friendly analytical planning suite for Hearts of Iron IV. This build is version-locked to the current public **1.19.2** baseline as of 2026-09-06 rather than mixing mechanics from older 1.17/1.18-era references.

## Working modules

- Command dashboard with adverse-case readiness scoring
- HOI-style Division Lab with a 5×5 regiment grid, five divisional support slots, 1.19 regimental-support baseline, template migration/import/export, support-company organization/HP/manpower tradeoffs, multi-division commitment, terrain comparison, width-packing guidance and role coaching
- Combat model with target hardness, defense/breakthrough, weighted armor/piercing, partial piercing approximation, current terrain widths, flank widths, over-width, stacking, entrenchment, forts, rivers, supply, air superiority, CAS support, planning and night inputs
- Production planner using IC/day, a nonlinear efficiency-growth curve, output modifiers, priority-aware per-factory strategic-resource penalties, Division Lab equipment demand, battle replacement demand and an integer factory optimizer
- Front Planner combining adverse combat, industry, supply and air into a conservative go/no-go recommendation
- Intel uncertainty stress testing
- HOI-style multi-slot research queue with priority scheduling and projected start/finish dates, without fake hardcoded technology data
- Scenario persistence and JSON import/export
- Seeded/reproducible Monte Carlo combat with 95% win-rate intervals
- Client-side Data Packs importer for HOI4 Clausewitz text/Lua files, with normalized local packs, conservative structural/define overrides, and equipment inheritance/year-snapshot diagnostics
- Dependency-free static build/deploy pipeline (Node only; no Vite/runtime packages)
- Engine, parser and division-designer regression tests covering combat, production priority, resource caps, support companies, deterministic simulation, import normalization and legacy-template migration


## 0.10.1 interface milestone

- Rebuilt the command dashboard, Front Planner, Intel and Production screens in an original HOI-inspired general-staff visual language.
- Replaced aggregate battalion editing with a tested 5×5 regiment designer, divisional support rail and 1.19 regimental-support row.
- Enforced regiment UI groups (`infantry`, `mobile`, `armor`) and added Shift-fill for fast regiment construction.
- Added stale-result detection and a reproducible representative After Action Report timeline alongside Monte Carlo outcomes.
- Hardened scenario import/reset so data-pack overrides and designer migrations are reapplied from a clean page state.
- Added equipment lineage/year-snapshot diagnostics for imported game data.
- Moved division support to the right of the regiment grid, added an in-grid main-stat strip, and promoted equipment/IC cost to a highlighted design band to track the current 1.19 designer layout more closely.
- Split divisional and regimental support into distinct records so Support Artillery/AT/AA can coexist with regimental weapon support instead of replacing one another.
- Expanded battalion/support selection cards with width, organization, attack, armor/piercing and IC context for faster template decisions.

## Accuracy policy

This app should distinguish three things:

1. **Version-locked public facts** — e.g. the current 1.19-era terrain widths and the current public game version.
2. **Analytical approximations** — e.g. aggregate reserve rotation/reinforcement, partial piercing tiers, supply scaling, CAS support and representative support-company/battalion data.
3. **Player-specific or game-file-dependent values** — tank/aircraft designer outputs, exact technologies, tactics, doctrines/mastery, equipment files, commander traits and mods.

The third category should not be presented as executable parity until the user's actual `common/` game data is imported.

## Current data-pack milestone

The parser/data-pack pipeline is now implemented for the user's real Hearts of Iron IV files:

- `common/defines/`
- `common/units/`
- `common/units/equipment/`
- `common/technologies/`
- `common/combat_tactics/`
- `common/terrain/`
- `common/modifier_definitions/`

The current importer safely applies structural battalion/support values, terrain widths/modifiers and recognized defines. Equipment records now resolve archetype/parent inheritance and can be previewed as year-based family snapshots. Exact equipment-derived combat stats are deliberately **not** auto-applied yet because selecting the correct active equipment for every battalion still depends on technology, variants and player choices.

## Public references used for this pass

- Paradox/Steam announcements for the 1.19.2 public version and announced 1.19.3 schedule
- Current 1.19 community extraction of terrain combat widths
- Paradox defines mirrors for defended/undefended hit chances, armor dice, stacking and over-width constants
- Current community documentation for air-superiority defense/breakthrough effects and entrenchment behavior

These references are used as a baseline, not as a substitute for importing the actual game files. The app deliberately exposes a model/version label and avoids calling approximate mechanics exact.


## Local development

No package install is required.

```bash
npm test
npm run build
```

`npm run build` copies the static application into `dist/`; GitHub Pages can publish that directory directly.
