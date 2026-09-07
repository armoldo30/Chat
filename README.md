# HOI4 War Planner — 0.14.2

A mobile-friendly Hearts of Iron IV analytical planning suite. This release is version-locked to the public **HOI4 1.19.2** baseline dated 2026-09-06 and deliberately separates verified public mechanics, analytical approximations, and values that require imported game files.

## 0.14.2 release focus

0.14.2 is a veteran-familiarity interface pass: the same modeling surface reorganized around HOI4-like navigation, single-screen workspaces, compact stat abbreviations, and modal equipment selection.


0.14.2 turns the planner into a connected equipment-design and force-planning workflow:

**Country → Research → Doctrine/Mastery → MIO → Equipment Design → Combat Performance → IC Allocation**


### Veteran-familiarity UI

- Main navigation is a compact horizontal command strip rather than a permanent wide sidebar.
- Division Lab uses internal **Template / Tech & MIO / Combat / Analysis** tabs so only the task at hand is visible.
- Battalion and support selection opens as a centered game-style picker overlay instead of expanding the page.
- Common HOI4 abbreviations such as ORG, SA, HA, DEF, BRK, ARM and PIER are used in dense stat blocks; full names remain available as hover text.
- Battle setup keeps terrain, directions, entrenchment, forts, rivers, supply and air in the primary row while planning/night/seed/run controls live under an Advanced section.
- Tank/Air MIO and air-doctrine controls are collapsed into equipment drawers until needed.
- Industry assumptions/resources/stockpiles are collapsed so recommended production lines dominate the screen.
- No combat, air, doctrine, MIO, tank or production mechanics were intentionally changed in this release.

### Division Lab

- HOI-style 5×5 regiment grid with regiment-group restrictions.
- Five divisional support slots plus separate 1.19-style regimental-support row.
- Separate attacker/defender research profiles.
- Land Grand Doctrine plus four independent mastery tracks with stages 0–5.
- Tech availability locks unresearched battalions/support companies and blocks invalid simulations.
- Country/equipment-family MIO assignments alter applicable equipment/battalion stats.
- Terrain, extra attack axes, forts, rivers, supply, planning, night, air superiority and CAS inputs.
- Reproducible seeded Monte Carlo battles, confidence intervals and representative After Action Report timeline.
- Enemy-estimate uncertainty stress testing.

### Tank Designer

- Separate light, medium and heavy variants for both sides.
- Chassis, gun, turret, suspension, armor, engine, special modules and armor/engine upgrades.
- Variant output includes armor, piercing, soft/hard attack, breakthrough, defense, reliability, speed, fuel, IC and strategic-resource burden.
- Selected variants replace the reference tank values used by Division Lab.
- Tank IC/resource costs flow directly into Industry.
- Tank-family MIOs can modify both combat characteristics and production economics.

### Air Lab

- Separate friendly/enemy aircraft designers.
- Small and medium airframes, engines, weapon slots, defense modules and specials.
- Computes air attack/defense, agility, speed, range, reliability, ground/naval attack, fuel and IC.
- Compares estimated kill ratio, IC exchange, air-power share and mission output per IC.
- Supports air-superiority, CAS and naval-strike comparisons.
- Separate air Grand Doctrine and staged mastery tracks for each side.
- **Air MIOs are supported**: country-compatible small/medium-airframe organizations can modify aircraft stats, build cost, resources and production-efficiency/output modifiers.
- Imported air MIOs use the same trait dependency and mutually-exclusive selection rules as land/tank MIOs.

### Industry — “What Should I Build?”

- Uses the current Division Lab attacker as the force design.
- Uses the current matchup as a gate: weak designs receive a redesign recommendation instead of being efficiently mass-produced.
- Allocates available MIC across the equipment bill to maximize fully equipped division-equivalents by the deadline.
- Accounts for production efficiency, factory limits, stockpiles, resources and MIO production bonuses.
- Shows limiting equipment, projected complete divisions and best destination for the next MIC.
- Tank variant IC/resource cost is included automatically.

### Data Packs

Client-side importer accepts selected HOI4 `common` folders/files and normalizes:

- `common/defines/`
- `common/units/`
- `common/units/equipment/`
- `common/technologies/`
- `common/combat_tactics/`
- `common/terrain/`
- `common/modifier_definitions/`
- `common/military_industrial_organization/organizations/`

The MIO importer resolves country restrictions, inheritance/includes, initial traits, equipment bonuses, production bonuses, parent requirements and mutually exclusive traits. Imported organizations can be used by Division Lab, Tank Designer and Air Lab when their equipment-type rules match.

Equipment inheritance/year snapshots are available as diagnostics. Exact imported tank/air chassis-module compatibility is intentionally not auto-applied until the importer can resolve the complete compatibility chain safely.

## Accuracy policy

The app distinguishes:

1. **Version-locked public facts** — mechanics and values that can be tied to the selected HOI4 baseline.
2. **Analytical approximations** — aggregate reinforcement/reserve behavior, simplified air exchange, some battalion/module values and other places where executable parity is not available.
3. **Game-file/player-dependent values** — national MIOs, DLC/scripted doctrine effects, equipment variants, tank/air modules, technologies, mods and country-specific rules.

The UI should never imply executable parity where the model is approximate. Importing the user's real game files is the intended path toward version/mod-specific coverage.

## Known limits

Not yet executable-parity: combat tactic/counter selection, true per-division reinforcement timing and coordination, exact CAS direct damage, commander/leader traits, weather, experience, all scripted doctrine effects, every national/DLC MIO edge case, full regimental-support compatibility, exact imported tank/air module compatibility, and executable-parity air combat.

## Development and deployment

No package install is required.

```bash
npm test
npm run build
```

`npm run build` creates the dependency-free static site in `dist/`. The included GitHub Pages workflow runs the full test suite before building and deploying.

## Release verification

0.14.1 includes regression coverage for:

- combat/industry engine
- Clausewitz/data-pack parser
- division designer and legacy migration
- tech profiles
- tank designer
- air designer/comparison
- land doctrine/mastery
- air doctrine/mastery
- MIO effects
- MIO importer
- **airframe MIO combat + production effects**
- route-level UI smoke rendering
