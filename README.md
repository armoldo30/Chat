# HOI4 War Planner — 0.16.0

A mobile-friendly Hearts of Iron IV analytical planning suite locked to a bundled **vanilla HOI4 1.19.2** game-file baseline. The planner combines source-certified game data with explicitly labeled executable-inferred and planner-analytical behavior rather than claiming `hoi4.exe` parity.

**Live site:** https://armoldo30.github.io/Chat/  
**Report a problem or request an improvement:** https://github.com/armoldo30/Chat/issues/new/choose

## 0.16.0 release focus

0.16.0 turns the certified 0.15.0 mechanics/data foundation into a launch-ready theorycrafting product. It keeps the audited 1.19.2 combat, production, technology, doctrine, MIO, tank and air data work; adds the visual/UX overhaul; and introduces **Division Gauntlet** as the headline analysis feature.

**Research assumptions → Equipment design → Division design → Combat performance → Division Gauntlet → IC/supply tradeoffs**

## Division Gauntlet

Quick Gauntlet generates about **500** plausible opponent divisions. Full Gauntlet generates **10,000** deterministic opponent designs and screens the tested division across eight terrain types while attacking and defending: **160,000 terrain/role matchups**.

Opponent families include infantry walls, artillery infantry, cheap holders, motorized/mechanized formations, light/medium/heavy armor, breakthrough tanks, high-hardness formations, AT/AA counters, space-marine-style hybrids, high-ORG infantry, low-cost spam and elite divisions. Widths, support companies, equipment quality, doctrine assumptions, armor/piercing, IC cost and supply burden vary procedurally.

The report separates **Raw Combat Grade** from **Practical Division Grade** and exposes offense, defense, terrain, matchup classes, IC efficiency, supply efficiency, consistency, counter resilience, best/worst matchups and percentile. Full-pool screening uses expected combat math; extreme cases receive a second-stage seeded stochastic check.

Gauntlet opponent generation and grading are **planner analytical**. Battle resolution consumes the certified bounded 1.19.2 combat engine.

## Accuracy policy

The project distinguishes:

1. **Game-file exact** — values/relationships directly retained from the supplied HOI4 1.19.2 files.
2. **Executable inferred** — behavior constrained by source evidence but not provable without engine internals.
3. **Planner analytical** — War Planner abstractions, scenario inputs, scoring and generated comparison systems.

Exact tactic/counter selection, per-division reinforcement/coordination, direct CAS allocation/damage, commander/weather/experience interactions, some modifier ordering and other executable-only details remain outside parity claims. See the audit documents for the certified boundary.

## Core tools

- HOI-style 5×5 Division Lab with divisional and 1.19 regimental supports
- Tank Designer and aircraft Air Lab using parsed 1.19.2 catalogs
- Technology, doctrine and MIO modeling with theorycraft-first prerequisite handling
- Stochastic battle simulation, uncertainty bands and terrain comparison
- Industry/resource planning and equipment replacement estimates
- Division Gauntlet Quick and Full modes
- Local scenario persistence plus JSON import/export
- Custom game-data pack import while retaining a bundled vanilla baseline

Research, DLC and Special Project requirements are informational unless they define structural compatibility. The planner is a theorycrafting tool, not an in-game progression gate simulator.

## Privacy, resilience and advertising readiness

The planner works without an account and stores planner state locally in the browser. A privacy page and advertising integration layer are present, but **advertising remains disabled in source configuration** until activation is deliberately completed. No publisher/client ID is active in 0.16.0.

The public build also includes a browser-side recovery path for failed module/runtime startup, a no-JavaScript fallback, local-state reset recovery, and structured GitHub bug/feature reporting. The recovery layer does not add telemetry.

## Development and deployment

No package install is required.

```bash
npm test
npm run build
```

`npm test` includes the certified mechanics/data suite, UI regressions, monetization-readiness checks, Gauntlet tests, runtime-recovery checks and a full 10,000-opponent/160,000-matchup smoke. `npm run build` creates a dependency-free static site in `dist/`.

Production deployment occurs only from `main` through GitHub Pages. Release-candidate branches are validation-only and do not deploy.

See `RELEASE_NOTES.md`, `DATA_AUDIT_1.19.2.md`, `COMBAT_FORMULAS_AUDIT_1.19.2.md` and `GAUNTLET_1.19.2.md` for details.
