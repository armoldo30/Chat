# HOI4 War Planner 0.17.0 — Release Notes

## Overview

0.17.0 migrates the bundled vanilla game-data baseline from HOI4 1.19.2 to **HOI4 1.19.3.0.c01a (checksum 5632)**. The migration is based on the supplied 1.19.3 `common` and English-localisation files, not on release-note transcription.

The update preserves the project's evidence boundary: 1.19.3 game-file data can be certified from the supplied source corpus, while executable-only combat and production behavior remains explicitly carried forward from the prior 1.19.2 executable-inferred work until the Oracle suite is rerun against 1.19.3.

## 1.19.3 source-data changes

The migration updates the affected planner/runtime surfaces for:

- land and support sub-units, including artillery, rocket artillery, anti-air/anti-tank batteries, heavy-weapons companies and regimental TD/SPAA support
- artillery, rocket-artillery, motorized rocket-artillery and armored-car equipment
- Heavy Howitzer and Rocket Launcher tank-module breakthrough values
- technology effects in the changed artillery, infantry, support and electronics files
- changed land, naval and special-forces doctrine records
- changed Australian, British and Siamese MIO organization records
- 1.19.3 source-backed English display labels for the affected planner-facing records
- planner-consumed Defines provenance

The supplied source census contains 158 sub-unit declarations, 308 equipment declarations, 313 equipment modules, 552 technologies, 121 doctrines and 552 MIO organization declarations. Source-declaration counts are kept separate from compact runtime inventories where the planner intentionally bundles a scoped subset or materialized variants.

## Accuracy and certification

The 36 Defines values currently consumed by the planner are numerically unchanged in the supplied 1.19.3 corpus. They are nevertheless re-certified with 1.19.3 provenance.

The migration follows the supplied game files when patch-note prose and source disagree. In particular, the supplied 1.19.3 `common/units/hq_support.txt` still contains light/medium/heavy armored-HQ supply consumption values of 0.26 / 0.28 / 0.34, so those values are retained and regression-tested rather than being halved from patch-note text alone.

Combat tactics are source-unchanged at the normalized-record level. That does not constitute executable validation of tactic selection or resolution.

## Runtime/build changes

- Added a source-certified `BUILTIN_1193` overlay and switched the application runtime to it.
- Updated the build materializer to emit `builtin1193-runtime.js`.
- Added permanent 1.19.3 migration regression coverage.
- Updated scenario bootstrap tests to the current game version.
- Updated public page version labels/metadata from 1.19.2 to 1.19.3.
- Added a 1.19.3 display-localization overlay while retaining source-identical baseline labels.
- Bumped planner version to **0.17.0**.

## Evidence boundary

**Game-file exact:** the updated 1.19.3 source-backed data and relationships covered by the migration audit.

**Executable inferred:** the existing bounded combat/production behavior derived under 1.19.2. It remains usable but is labeled as prior-executable inference until the 1.19.3 Oracle suite is rerun.

**Planner analytical:** scenario inputs, grading, generated counters, Gauntlet opponent generation and other planner-created analytical systems.

The planner does not claim bit-for-bit `hoi4.exe` parity.

## Next executable-validation step

After the 0.17.0 source migration is production-stable, Oracle testing moves to `1.19.3.0.c01a / 5632`. The first step is executable validation of the six-hour `d_oracle_o1_trial6` helper, followed by a preliminary 10-run O1 distribution sample.

---

## 0.16.0 — Public launch release

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

## Production validation completed

The deployed 0.16.0 production tree passed:

- complete `npm test`
- full 10,000-opponent / 160,000-matchup Gauntlet smoke
- `npm run build`
- built-site asset/privacy/robots checks
- served desktop/mobile static-site smoke
- runtime-recovery and public-feedback regression checks
- AdSense disabled/configuration sanity check
- no historical staging payloads or temporary write-enabled workflows
- GitHub Pages artifact upload and production deployment

## Intentionally separate from 0.16.0 launch completion

- **Oracle validation:** black-box HOI4-vs-Planner experiments remain the path toward higher executable fidelity.
- **AdSense activation:** ad infrastructure is present, but publisher/client/slot IDs and consent activation remain deliberately disabled until the custom domain and account are ready.

Live site: https://armoldo30.github.io/Chat/

