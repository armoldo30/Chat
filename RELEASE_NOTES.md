# HOI4 War Planner 0.16.0 — Release Notes

## Overview

0.16.0 is the launch-candidate release built on the certified HOI4 1.19.2 data/combat foundation completed in 0.15.0. It adds the finished visual/UX layer, Division Gauntlet, persistence hardening and production-deployment cleanup while preserving the evidence boundary between game-file exact, executable-inferred and planner-analytical behavior.

## Headline changes

- Added **Division Gauntlet** with Quick (~500 opponent designs) and Full (10,000 designs) modes.
- Full Gauntlet evaluates eight terrains in both attack and defense for **160,000 screening matchups**, then stochastically validates extreme cases.
- Added 16 plausible opponent archetype families with deterministic variation in widths, supports, equipment quality, doctrine profile, armor/piercing, IC and supply.
- Added Raw Combat and Practical Division grades, terrain/matchup breakdowns, efficiency scores, consistency, counter resilience, best/worst matchups and percentile.
- Completed the visual/navigation overhaul and mobile presentation while preserving keyboard focus and reduced-motion support.
- Added ad-ready/privacy infrastructure while keeping advertising disabled until explicit activation.
- Hardened full-scenario persistence/import/export: current schema is preserved, oversized/broken JSON imports are rejected gracefully, local-storage failures no longer crash the planner, and bundled data is omitted from redundant scenario exports.
- Preserved the permanent page shell by rendering the SPA into `#app` rather than replacing the document body, keeping privacy controls and enhancement modules intact.
- Removed historical MIO staging payloads and branch-specific temporary validation workflows from the release candidate.
- Simplified production deployment CI so GitHub Pages deploys only from `main`.

## Accuracy foundation retained from 0.15.0

The release continues to use the bundled vanilla HOI4 1.19.2 source corpus for certified land data, tank/air designer data, technologies, doctrines, MIOs, terrain/modifier definitions, Defines, production formulas and bounded combat formulas.

The planner does **not** claim bit-for-bit `hoi4.exe` parity. Remaining executable-only areas are documented in the audit files and include exact tactic/counter selection, true per-division reinforcement/coordination, direct CAS allocation/damage, commander/weather/experience interactions and other engine-ordering details.

## Theorycraft-first prerequisite policy

Research, DLC and Special Project requirements remain informational for otherwise valid game content. Structural compatibility rules still apply where an object cannot actually fit a slot/category/regiment.

## Verification target

The 0.16.0 launch candidate must pass from a clean checkout:

- complete `npm test`
- full 10,000-opponent / 160,000-matchup Gauntlet smoke
- `npm run build`
- built-site asset/privacy/robots checks
- served static-site smoke
- AdSense disabled/configuration sanity check
- no historical staging payloads or temporary write-enabled workflows

Production `main` is intentionally left unchanged until the release candidate is explicitly promoted.
