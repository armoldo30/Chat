# HOI4 War Planner — 0.15.0

A mobile-friendly Hearts of Iron IV analytical planning suite using a bundled **vanilla HOI4 1.19.2 game-file baseline**. Version 0.15.0 moves major planner systems away from curated reference data and onto parsed game data while retaining the compact, HOI4-familiar interface introduced in 0.14.2.

## 0.15.0 release focus

0.15.0 is primarily a data-engine and accuracy overhaul. The planner now bundles normalized 1.19.2 data for combat/production defines, terrain, sub-units, equipment, tank and aircraft modules, technologies, doctrines, MIOs, combat tactics, modifiers, equipment upgrades and Special Projects.

**Country → Research/requirements info → Doctrine/MIO → Equipment Design → Division Design → Combat Performance → IC Allocation**

### Theorycraft first, legality second

Valid game content is available for theorycrafting immediately. Research, DLC, Special Project and related prerequisites are **informational only** in the planner; they do not disable or lock a valid battalion, support unit, chassis, module or design choice.

- Prerequisites are shown through requirement text/tooltips where applicable.
- Selecting a research profile does not unlock or remove design choices.
- Missing DLC or Special Projects do not block simulations or production analysis.
- Structural compatibility still applies: slot/category/regiment restrictions that define whether two game objects can actually be combined remain enforced.

This separation is deliberate: the planner is a design/analysis tool, not an in-game research progression simulator.

## Bundled 1.19.2 data

The built-in data pack is generated from the supplied HOI4 1.19.2 `common` files and is loaded automatically. It includes coverage for:

- combat and production defines
- terrain
- battalions, divisional supports and advanced/regimental supports
- equipment stats, costs and resource requirements
- tank chassis, modules and equipment upgrades
- aircraft airframes, engines, weapons and modules
- technologies and prerequisite relationships
- land and air doctrine records
- military industrial organizations and inheritance
- combat tactics
- modifier definitions
- Special Projects and relevant prerequisites

The Clausewitz parser supports modern nested defines, dotted override defines, anonymous list objects, inheritance and repeated top-level blocks such as multiple `equipment_modules = { ... }` sections in the same file.

### Tank Designer

The Tank Designer uses imported 1.19.2 chassis/module data when the bundled pack is active. Standard tank engines, armor types, suspensions, turrets, cannons, howitzers, AA weapons, flamethrowers and special modules are sourced from the game-file corpus rather than the previous curated module catalog. Requirements remain informational.

### Air Lab

Aircraft designers use parsed airframe/module data and real equipment fields where available. Friendly/enemy designs feed the analytical air comparison and mission-output model. The underlying air-exchange model remains analytical rather than a claim of executable parity.

### Division Lab

Division Lab preserves the compact 5×5 regiment workflow, five divisional support slots and 1.19-style regimental-support handling. Parsed game sub-units and equipment hydrate the planner automatically. Research profiles may alter equipment snapshots or display requirement context, but do not lock valid units.

### Doctrine and MIO

0.15.0 reads the 1.19 doctrine structure and uses source-derived doctrine rewards where the planner can map them safely. MIO inheritance/includes are resolved from the imported organization data, including trait requirements and mutually exclusive choices.

### Industry

Industry continues to use the current planner designs and equipment bills to estimate production allocation, resource constraints, stockpiles and division-equivalent output. Parsed equipment IC/resource costs are used where available.

## Accuracy policy

The app distinguishes three classes of behavior:

1. **Game-file facts** — values and relationships directly present in the bundled HOI4 1.19.2 files.
2. **Derived planner behavior** — deterministic transformations of those values, such as aggregating equipment/sub-unit stats into planner records.
3. **Analytical/inferred behavior** — mechanics whose exact implementation lives in `hoi4.exe` or cannot be proven from the supplied files.

The UI and documentation should not imply executable parity for category 3.

## Remaining analytical / inferred areas

Not claimed to be executable-parity include exact combat tactic/counter selection timing, per-division reinforcement/coordination behavior, exact CAS direct damage, some aggregate division-stat semantics, commander/leader effects not represented by the planner, weather/experience interactions, certain scripted doctrine/MIO edge cases, and the air-combat exchange model.

Where source files provide a rule or value, 0.15.0 prefers that source data over invented progression bonuses or hard-coded approximations.

## Development and deployment

No package install is required.

```bash
npm test
npm run build
```

`npm run build` creates the dependency-free static site in `dist/`. `dist/` is generated output and is not committed. GitHub Actions runs the complete test suite and clean static build before a `main` deployment is uploaded to GitHub Pages.

## 0.15.0 verification coverage

The release suite includes regression coverage for:

- combat and industry engine behavior
- nested and dotted defines parsing
- repeated Clausewitz top-level blocks
- bundled 1.19.2 data integrity and known source values
- division/game-data hydration
- theorycraft-first prerequisite behavior
- Tank Designer and real module catalog ingestion
- Air Designer/comparison
- land and air doctrine behavior, including pack-derived rewards
- MIO effects and inheritance parsing
- tech/equipment snapshots
- route-level UI smoke rendering

See `RELEASE_NOTES.md` for the release summary.