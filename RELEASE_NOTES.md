# HOI4 War Planner 0.16.0 — Release Notes

## Overview

0.16.0 is the public launch release built on the certified HOI4 1.19.2 data/combat foundation completed in 0.15.0. It adds the finished visual/UX layer, Division Gauntlet, persistence and browser-recovery hardening, public feedback tooling, and production-deployment cleanup while preserving the evidence boundary between game-file exact, executable-inferred and planner-analytical behavior.

## Headline changes

- Added **Division Gauntlet** with Quick (~500 opponent designs) and Full (10,000 designs) modes.
- Full Gauntlet evaluates eight terrains in both attack and defense for **160,000 screening matchups**, then stochastically validates extreme cases.
- Added 16 plausible opponent archetype families with deterministic variation in widths, supports, equipment quality, doctrine profile, armor/piercing, IC and supply.
- Added Raw Combat and Practical Division grades, terrain/matchup breakdowns, efficiency scores, consistency, counter resilience, best/worst matchups and percentile.
- Completed the visual/navigation overhaul and mobile presentation while preserving keyboard focus and reduced-motion support.
- Added ad-ready/privacy infrastructure while keeping advertising disabled until explicit activation.
- Hardened full-scenario persistence/import/export: current schema is preserved, oversized/broken JSON imports are rejected gracefully, local-storage failures no longer crash the planner, and bundled data is omitted from redundant scenario exports.
- Preserved the permanent page shell by rendering the SPA into `#app` rather than replacing the document body, keeping privacy controls and enhancement modules intact.
- Added a browser-side runtime recovery banner, local-state reset recovery and a no-JavaScript fallback so failed startup does not become a blank page. The recovery layer adds no telemetry.
- Added structured public GitHub bug-report and feature-request templates plus an in-site **Report issue** link.
- Removed historical MIO staging payloads and branch-specific temporary validation workflows from the release tree.
- Simplified production deployment CI so GitHub Pages deploys only from `main`.

## Accuracy foundation retained from 0.15.0

The release continues to use the bundled vanilla HOI4 1.19.2 source corpus for certified land data, tank/air designer data, technologies, doctrines, MIOs, terrain/modifier definitions, Defines, production formulas and bounded combat formulas.

The planner does **not** claim bit-for-bit `hoi4.exe` parity. Remaining executable-only areas are documented in the audit files and include exact tactic/counter selection, true per-division reinforcement/coordination, direct CAS allocation/damage, commander/weather/experience interactions and other engine-ordering details.

## Theorycraft-first prerequisite policy

Research, DLC and Special Project requirements remain informational for otherwise valid game content. Structural compatibility rules still apply where an object cannot actually fit a slot/category/regiment.

## Verification target

The 0.16.0 release must pass from a clean checkout:

- complete `npm test`
- full 10,000-opponent / 160,000-matchup Gauntlet smoke
- `npm run build`
- built-site asset/privacy/robots checks
- served desktop/mobile static-site smoke
- runtime-recovery and public-feedback regression checks
- AdSense disabled/configuration sanity check
- no historical staging payloads or temporary write-enabled workflows

## Intentionally separate from 0.16.0 launch completion

- **Oracle validation:** black-box HOI4-vs-Planner experiments remain the path toward higher executable fidelity.
- **AdSense activation:** ad infrastructure is present, but publisher/client/slot IDs and consent activation remain deliberately disabled until the custom domain and account are ready.

Live site: https://armoldo30.github.io/Chat/
