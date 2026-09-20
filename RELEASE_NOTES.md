# HOI4 War Planner 0.17.5 — Release Notes

## Overview

0.17.5 is an evidence-transparency release for support-specific mechanics on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Support source-effect transparency

- Adds a canonical support-effect presentation layer backed by the existing #46 runtime coverage ledger.
- Expands picker metadata beyond the earlier partial subset.
- Adds a persistent Source effects drawer for selected divisional and Regimental Support companies.
- Exposes retained recon, entrenchment, initiative, recovery, reliability/capture, supply/fuel factors, casualty trickleback, experience loss, suppression, maximum-speed fields, `battalion_mult`, deployed-leader modifiers and enabled abilities.
- Shows each retained effect with its current runtime state so source presence is not confused with planner execution.

## Evidence boundary

This release deliberately does **not** apply new support-specific combat formulas. The repository still lacks sufficient evidence to certify the executable aggregation/order for the remaining #46 mechanics.

Effects marked `source-retained-not-executed` remain informational. Initiative remains retained and aggregated but unused downstream by the battle resolver.

No Oracle evidence, combat formula, or executable-validation classification is promoted by 0.17.5.

---

# HOI4 War Planner 0.17.4 — Release Notes

## Overview

0.17.4 is a focused Division Designer structural-correctness patch on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Army-HQ-only battalion exclusion

- Recovers omitted HQ eligibility metadata for the seven 1.19.3 Army-HQ-only line battalion IDs where the compact runtime retained the battalion record.
- Excludes `allowInNonArmyHq === false` battalions from ordinary Division Designer choices.
- Uses one ordinary-division battalion allowlist for grid creation, saved/import normalization, regiment filling, calculation and export.
- Prevents hidden HQ-only battalions from surviving in ordinary templates after they disappear from the picker.
- Keeps the 0.17.3 exact six-group Regimental Support mapping unchanged.

## Evidence boundary

The compact runtime omitted the relevant HQ eligibility flags. A File Library search did not recover the original supplied `hq_support.txt` source record directly, so the missing structural fields are recovered from the bounded public 1.19.3 mirror at commit `228560dc3508a43c1eaef0774f1c0dcc3c954ada`.

That recovery remains **unvalidated** and is not relabeled `game-file exact`.

No Oracle evidence, executable combat formula, or resolver classification changes in 0.17.4.

---

# HOI4 War Planner 0.17.3 — Release Notes

## Overview

0.17.3 is a focused Division Designer correctness patch for Regimental Support on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Regimental Support regiment-group fix

- Fixed hydration collapsing exact source regiment groups into broader planner buckets before a later browser repair pass.
- Preserves all six source regiment groups directly during hydration:
  - infantry
  - combat_support
  - mobile
  - mobile_combat_support
  - armor
  - armor_combat_support
- Keeps the existing heuristic group recovery only for legacy or incomplete records.
- Removes initialization/import-order dependence from Regimental Support compatibility.
- Adds regressions for representative hydrated battalions in all six groups.
- Adds a permanent six-group compatibility-matrix regression for the 14 audited 1.19.3 Regimental Support entries.

## Evidence boundary

The certified/source-backed Regimental Support `allowed_battalion_groups` arrays are unchanged by this release. The defect was in planner runtime mapping of battalions to those source groups, not in the source compatibility records themselves.

No Oracle evidence, combat formula, or executable-validation classification is changed by 0.17.3.

---

# HOI4 War Planner 0.17.2 — Release Notes

## Overview

0.17.2 completes the support-company audit opened after live 0.17.1 testing. The release keeps the bundled game target at **HOI4 1.19.3.0.c01a (checksum 5632)** and focuses on Division Designer catalog correctness and support-company structure.

## Support-company audit

- Audited **68** support-category sub-units represented by the 1.19.3 source surface.
- Separated the **14 Regimental Support** entries from the divisional-support catalog.
- Identified **54** divisional-support-category entries, including **11 Army-HQ-only** support companies.
- Excluded those HQ-only entries from ordinary Division Designer templates, leaving **43 regular divisional support choices**.
- Restored specialist support records that were missing or incompletely represented by the compact runtime surface.
- Uses player-facing English support labels and source abbreviations where retained by the audit.
- Groups the expanded support picker by battlefield role and alphabetizes each group.

## Structural correctness

- Enforces source `same_support_type` conflicts instead of merely blocking exact duplicate IDs.
- Handles asymmetric support-type declarations by matching support-family tokens against source/runtime identities.
- Preserves `allow_in_army_hq` / `allow_in_non_army_hq` when parsing imported data packs.
- Keeps Regimental Support filtered by the source `allowed_battalion_groups` structure and the three-line-battalion slot requirement.
- Saved/imported templates are normalized so structurally invalid duplicate support families are removed deterministically.

## Retained support metadata

The audited runtime now preserves support-company metadata that the earlier reduced representation could drop, including:

- `battalion_mult`
- recon and initiative
- entrenchment
- reliability and equipment-capture factors
- supply/fuel-consumption factors
- casualty trickleback and experience-loss factors
- suppression-related fields
- HQ eligibility
- abilities and DLC requirements

## Evidence boundary

The supplied 1.19.3 source corpus remains the preferred authority for the certified game-data baseline. Where the compact runtime did not retain enough support metadata, 0.17.2 uses a bounded 1.19.3 source-mirror cross-check and labels that recovery separately rather than silently promoting the reconstructed record to `game-file exact`.

Catalog membership, structural constraints and directly retained source values do **not** validate every downstream executable aggregation rule. In particular, some support-specific mechanics such as complete `battalion_mult` ordering, casualty replacement behavior, equipment capture/reliability effects and specialist abilities remain preserved but not fully executed by the battle resolver.

The combat model's existing Oracle evidence classifications are unchanged by this release.

---

# HOI4 War Planner 0.17.1 — Release Notes

## Overview

0.17.1 is a focused Division Designer maintenance release on the existing certified HOI4 1.19.3 baseline.

## Division Designer fixes

- Fixed regimental-support choices opening correctly but failing to persist when clicked.
- Replaced the hardcoded line-battalion picker subset with the hydrated source-backed battalion catalog.
- Added armored combat-support battalions to the picker where structurally compatible, including light/medium/heavy Tank Destroyers, SP Artillery, and SP Anti-Air.
- Preserved source-backed regiment-group compatibility when normalizing designer grids.
- Grouped divisional support companies by battlefield role and alphabetized them within each group to make large support catalogs easier to navigate.
- Added permanent regressions for regimental-support selection, TD/SPG/SPAA picker availability, and support-company grouping.

## Evidence boundary

This patch changes Division Designer UI/state behavior and catalog exposure only. It does not promote or alter any Oracle combat finding, game-file certification, or executable-inferred formula.

The bundled game-data baseline remains **HOI4 1.19.3.0.c01a (checksum 5632)**. The broad combat resolver remains subject to the existing Oracle evidence boundary.

---

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

