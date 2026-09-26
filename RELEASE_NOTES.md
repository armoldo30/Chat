# HOI4 War Planner 0.17.17 — Release Notes

## Overview

0.17.17 promotes the completed **HOI4 1.19.3 Oracle validation of the core ordinary unarmored 1v1 land-combat resolver** into production. The port is intentionally narrow and starts from current `main`; the historical Oracle branch and mod laboratory are not merged.

## Resolver changes

- Combat now observes the Oracle-validated **one-hour initial fire delay** from controlled O1.
- Total attack points now use the O7-supported `round(attack / 10 + U[-1,+1])` sampler, clamped nonnegative, replacing the prior Oracle-divergent single-Bernoulli rounding path.
- Defense points retain stochastic `Defense / 10` rounding and are bounded by total attack points, consistent with O11/O12/O13.
- The existing 10% defended and 40% undefended hit gates remain game-file derived and are now backed by controlled O14/O15 validation plus O20 transport.
- Strength damage applies the O17v2-confirmed **0.9 executable scalar** on top of the game-file `LAND_COMBAT_STR_DAMAGE_MODIFIER`.
- The existing ordinary unarmored 1–4 ORG die and 1–2 strength die are retained with O16/O18 executable support.

## Final transport evidence

O20 moved the full point-partition plus normal hit-gate family to the independently validated Defense-18 boundary. At Soft Attack 20 / Defense 18, 160 firing intervals produced:

- 121 zero-hit intervals
- 36 one-hit intervals
- 3 two-hit intervals
- 0 three-hit intervals
- 0 four-plus intervals

Grouped as 121 / 36 / 3 against expected 114.624 / 39.808 / 5.568, Pearson χ² was **1.9033166318**, below the predeclared **9.21034** 1% critical value for df=2.

## Evidence boundary

The promoted behavior is **oracle-validated only at the controlled boundaries exercised by O1–O20**. The implementation remains an executable reconstruction, not source code from `hoi4.exe`. Armor/piercing special cases, armored-on-soft damage behavior, non-neutral tactic execution, broader RNG ordering, and other executable-only paths remain outside this certification. Bit-for-bit parity is not claimed.

---

# HOI4 War Planner 0.17.15 — Release Notes

## Overview

0.17.15 completes the bounded **support-specific runtime-effects audit** and replaces Counter's saved-production feasibility assumptions with a direct per-division IC comparison on the **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Support-specific runtime execution

- Executes source-retained `battalion_mult` for category-matched battalions when the affected stat is already represented by the planner.
- Supports percentage-style battalion factors and source `add = yes` flat adjustments.
- Applies selected support-company `supply_consumption_factor` to total division supply use.
- Applies `casualty_trickleback` to permanent manpower-loss reporting while leaving modeled strength damage and equipment losses unchanged.
- Adds current 1.19.3 fixtures for Recon → artillery soft attack, Field Hospital → infantry HP/trickleback, and Logistics → division supply use.
- Keeps recon/tactic selection, entrenchment state, recovery, reliability/attrition, equipment capture, fuel, experience loss, suppression, leader modifiers and enabled abilities source-retained but unexecuted.

## Counter cost simplification

- Removes saved production-line, spare-MIC, resource-shortfall and retooling feasibility from Counter screening and recommendation ranking.
- Removes the production-capacity projection runtime used only by Counter.
- Displays current and proposed equipment IC cost directly as X → Y IC per division, with absolute and percentage change.
- Keeps Best Raw combat-pure.
- Keeps Best Efficient limited to direct IC delta, modeled supply burden and edit complexity rather than live industrial assumptions.

## Evidence boundary

Support field values and categories are **game-file exact**. The newly executed support aggregation is **executable inferred** and remains pending Oracle validation. Counter IC comparison is descriptive/planner analytical. No bit-for-bit `hoi4.exe` parity is claimed.

---

# HOI4 War Planner 0.17.14 — Release Notes

## Overview

0.17.14 is a focused **Counter / Division Lab land-MIO target-coverage correction** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Source-derived land target coverage

- Derives source-backed runtime MIO targets from each hydrated battalion/support record's actual equipment `need`.
- Covers motorized artillery, motorized anti-tank and motorized anti-air without maintaining a parallel ID whitelist.
- Covers conventional line/support/Regimental Support rocket artillery through the artillery MIO selection while preserving the exact `rocket_artillery_equipment` restriction context.
- Keeps `motorized_rocket_equipment` distinct rather than silently treating it as towed rocket artillery.
- Applies the same target derivation to equipment/production records.
- Makes Division Lab and Counter consume the same unit/equipment target helpers.
- Retains the compact static land-family map only for the legacy packless coarse tech/availability fallback.
- Tightens conventional-vs-rocket artillery compatibility so `artillery_equipment` and `rocket_artillery_equipment` do not match solely through substring overlap.

## Regression coverage

- Motorized artillery / AT / AA receive the same selected-family MIO factor as their non-motorized counterparts when the source restriction is compatible.
- Conventional artillery-only traits apply to conventional motorized artillery but not rocket artillery.
- Rocket-only traits apply to line, motorized-towed, divisional-support and Regimental Support rocket artillery.
- Distinct motorized-rocket equipment does not inherit conventional or towed-rocket-only restrictions.

## Evidence boundary

This release derives target identity from **game-file-backed hydrated equipment needs** and executes the planner's existing MIO compatibility/bonus logic. It introduces no new MIO bonus formula, combat formula, executable classification, prerequisite rule, Oracle validation, or evidence promotion.

---

# HOI4 War Planner 0.17.13 — Release Notes

## Overview

0.17.13 is a focused **MIO equipment-restriction runtime correction** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Equipment-scoped MIO effects

- Passes an explicit equipment context into the existing `mioEffects(..., context)` restriction path in both Division Lab and Counter Analysis.
- Prevents equipment-restricted artillery and anti-tank traits from leaking across sibling land-equipment families.
- Evaluates light / medium / heavy tank MIO effects against each role's exact target equipment key, preventing armor, tank-destroyer, SP-artillery, and SP-AA restrictions from cross-applying inside one chassis family.
- Tightens direct tank compatibility so exact chassis restrictions stay exact; only the explicit broad `armor` source category keeps the prior any-tank behavior.
- Applies the same equipment-scoped effects to division-stat propagation, tank design stats, and equipment/production records.
- Adds a controlled runtime fixture with simultaneously selected artillery-only and AT-only traits plus armor-only and TD-only medium-tank traits.
- Anchors the audit to the bundled 1.19.3 Vickers-Ruwolt source restrictions.

## Evidence boundary

This release executes **existing source-backed `equipmentTypes` restriction data using the planner's already-implemented MIO compatibility logic**. It introduces no new MIO bonus formula, combat formula, executable classification, prerequisite rule, Oracle validation, or evidence promotion.

---

# HOI4 War Planner 0.17.12 — Release Notes

## Overview

0.17.12 is a focused **Division Lab / Counter MIO-context parity hardening release** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Shared land-MIO family identity

- Centralizes infantry-equipment, artillery, anti-tank and anti-air land-unit identity in one shared runtime map.
- Makes both Division Lab and Counter Analysis consume that same map when applying selected family MIO equipment bonuses.
- Makes the packless coarse equipment-tier and availability fallback consume the same current/legacy support aliases.
- Keeps current 1.19.3 `field_guns`, `anti_tank_battery`, and `anti_air_battery` together with their retained predecessor aliases for saved-state compatibility.
- Adds regressions that reject private duplicate maps in Division Lab or Counter and certify current plus legacy fallback aliases.

## Evidence boundary

This is a **runtime consistency / ID-mapping refactor**. 0.17.12 introduces no new MIO formula, combat formula, executable classification, prerequisite execution rule, Oracle validation, or game-file evidence promotion.

---

# HOI4 War Planner 0.17.11 — Release Notes

## Overview

0.17.11 is a focused **Counter Analysis 1.19.3 Regimental Support MIO propagation correction** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Current Regimental Support MIO mapping

- Adds `field_guns` to Counter's existing artillery MIO family propagation.
- Adds `anti_tank_battery` to the existing anti-tank MIO family propagation.
- Adds `anti_air_battery` to the existing anti-air MIO family propagation.
- Retains the legacy predecessor aliases for backward compatibility.
- Aligns the coarse artillery / AT / AA technology-availability aliases to the current 1.19.3 battery IDs.
- Adds runtime regression coverage proving each current battery receives the same selected family MIO equipment multiplier as its divisional support counterpart.

## Evidence boundary

This release corrects ID mapping inside already-supported MIO and coarse-availability semantics. It introduces **no new MIO formula, combat formula, Oracle validation, prerequisite execution rule, support-runtime formula, or evidence promotion**.

---

# HOI4 War Planner 0.17.10 — Release Notes

## Overview

0.17.10 is a focused **Counter Analysis deep-redesign guard** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Saturated-win-rate deep-search guard

- Preserves the existing **+2 pp** meaningful-improvement threshold.
- Treats exactly **98%** baseline win rate as still eligible for deep redesign because 100% can meet the threshold.
- Suppresses third-step escalation above 98%, where the 100% modeled win-rate ceiling makes a qualifying +2 pp improvement impossible.
- Suppresses the **TRY DEEP REDESIGN** UI action in the same ceiling-limited cases.
- Explains the ceiling explicitly instead of spending additional battle-test budget on a search that cannot qualify.
- Leaves the normal 20+10 Counter search, optional third-step limits, candidate universe, and battle resolver unchanged.

## Evidence boundary

This is a **planner analytical** search-control and UI correction. 0.17.10 introduces no new combat formula, executable classification, Oracle validation, support-runtime formula, or game-file evidence promotion.

---

# HOI4 War Planner 0.17.9 — Release Notes

## Overview

0.17.9 is a focused **Counter Analysis candidate-screening correction** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Side-aware anti-air screening

- Fixes the cheap candidate preview that previously treated any nonzero air-superiority or CAS input as an AA threat.
- Gives AA its elevated preview weight only when the side being optimized is suffering modeled **enemy air superiority**.
- Keeps friendly air superiority at ordinary background AA weight instead of spending shortlist budget on a false AA priority.
- Keeps CAS-only contexts at ordinary background AA weight because the current resolver does not execute direct AA-versus-CAS damage or mitigation.
- Covers both attacker and defender air-superiority sign handling with permanent regression checks.
- Leaves the 20+10 normal Counter search, optional bounded third step, recommendation threshold, and battle resolver unchanged.

## Evidence boundary

This is a **planner analytical** candidate-screening correction. 0.17.9 introduces no new combat formula, executable classification, Oracle validation, support-runtime formula, or game-file evidence promotion.

---

# HOI4 War Planner 0.17.8 — Release Notes

## Overview

0.17.8 adds an optional **bounded three-step Counter deep redesign** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Deep-redesign fallback

- Leaves the normal Counter search unchanged at **20 first-step + 10 second-step battle tests**.
- Offers **TRY DEEP REDESIGN** only when the normal one/two-change search still fails the meaningful-improvement threshold.
- Reuses the same current 1.19.3 structural candidate universe rather than introducing a separate hand-maintained catalog.
- Seeds the third step from up to **3** diverse strong two-change attempts.
- Battle-tests at most **6** third-step candidates.
- Does not impose third-step cost on normal searches that already find a meaningful counter.
- Reports first-, second-, and third-step counts explicitly and visibly labels deep results as a bounded three-step analysis.
- Keeps the responsive yielding/cancellation path so the browser remains usable during the larger search.
- Makes no exhaustive-search claim; three changes remain a deliberately bounded fallback, not arbitrary division enumeration.

## Recommendation boundary

- **Best Raw Counter** remains combat-pure.
- Production, supply, IC and retooling remain secondary context for **Best Efficient Counter**, **Smallest Effective Change**, and explanatory warnings.
- Deep redesign does not turn production-plan optimization into the Counter objective.

## Evidence boundary

The third-step candidate selection, seed diversity, escalation threshold, and recommendation behavior remain **planner analytical**.

0.17.8 introduces no new combat formula, executable classification, Oracle validation, support-runtime formula, or game-file evidence promotion.

---

# HOI4 War Planner 0.17.7 — Release Notes

## Overview

0.17.7 is a **Counter recommendation-quality hardening release** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Recommendation-quality audit

- Adds a permanent hydrated 1.19.3 scenario matrix covering soft targets, reachable armor thresholds, high-hardness armor, enemy air superiority, defender-side optimization and Regimental Support.
- Runs those scenarios through the real bounded Counter search rather than only checking that candidate IDs exist.
- Exposes per-search coverage for line, divisional-support, Regimental Support and tank-design candidates, plus piercing-threshold, hard/soft attack, air-attack and defense/breakthrough improvements.
- Keeps the certification matrix compact while the existing Counter smoke still protects the full live 20-first-step + 10-second-step browser budget.

## Saturated-outcome tie-breaking

- Keeps modeled win-rate improvement as the primary Best Raw combat criterion.
- When candidates have equal modeled win-rate gain, uses modeled enemy-versus-own strength-loss exchange as the next combat-only discriminator.
- Retains enemy casualty rate, own casualty rate, change count and IC only as later deterministic tie-breakers.
- Shows the modeled strength-loss exchange in recommendation cards and ranked alternatives so the tie-break is not hidden from the user.

## Air-threat diagnosis boundary

- Makes anti-air prioritization side-aware: AA receives extra priority only when the side being improved is suffering the modeled enemy-air-superiority penalty.
- Removes the previous absolute-air check that could boost AA under friendly air superiority.
- Does not infer direct AA-versus-CAS mitigation from CAS alone because the current resolver does not execute direct AA/CAS damage interaction.
- Surfaces that CAS boundary explicitly in diagnosis copy.

## Runtime-path certification

- Counter quality and smoke tests now hydrate the same bundled 1.19.3 runtime data path used by the live planner before evaluating recommendations.
- This closes a test blind spot where standalone Counter tests could exercise legacy seed maps instead of the hydrated 1.19.3 catalog.
- Regimental Support is verified at the battle-tested search layer, not only at raw candidate construction.

## Baseline copy cleanup

- Generic active-baseline UI copy now follows `MODEL_META.gameVersion` instead of stale 1.19.2 / 0.16.0 wording.
- Evidence-specific 1.19.2 references remain where they describe retained provenance, including the production energy model and recovered air mission-stat corpus.

## Evidence boundary

Counter diagnosis, candidate screening, search coverage, recommendation ranking and the quality matrix remain **planner analytical**.

No combat resolver formula, executable classification, Oracle finding, support-effect runtime classification, or game-file evidence class is promoted by 0.17.7.

---

# HOI4 War Planner 0.17.6 — Release Notes

## Overview

0.17.6 is a **Counter Analysis search upgrade** on the existing **HOI4 1.19.3.0.c01a (checksum 5632)** baseline.

## Counter candidate universe

- Replaces the old hardcoded nine-line-battalion and seven-support-company Counter whitelists with the same structural 1.19.3 ordinary-division battalion and divisional-support catalogs used by the Division Designer.
- Preserves Army-HQ-only line/support exclusions.
- Applies divisional support conflict rules during candidate construction.
- Adds source-valid 1.19.3 Regimental Support edits when the regiment has at least three battalions and the exact allowed battalion-group relationship permits that support.
- Adds Regimental Support layout to candidate identity so structurally different templates cannot collapse to one Counter key.
- Moves the Counter fallback pack from stale 1.19.2 to the current 1.19.3 bundle.

## Matchup-driven bounded search

- Screens a broader candidate pool cheaply before full battle simulation.
- Prioritizes the exact target's hardness, armor/piercing thresholds, attacker breakthrough or defender defense, organization and battlefield-relevant anti-air value.
- Preserves line, divisional-support, Regimental Support and active tank-design diversity in the limited battle-test budget.
- Expands the default battle-tested budget modestly to 20 first-step and 10 second-step candidates while screening up to four times that many candidates first.
- Uses a diversified four-seed second-step beam so combinations are less dependent on one candidate family winning the first pass.
- Keeps the responsive yielding/cancellation path.

## Recommendation policy

- **Best Raw Counter** remains the strongest battle result.
- **Best Efficient Counter** considers the full meaningful counter set and balances combat gain against IC, supply and change complexity instead of hard-excluding a new armor family.
- **Smallest Effective Change** still prefers a local edit when a meaningful one exists.
- Production/retooling burden remains visible but is secondary context rather than the primary counter objective.

## Evidence boundary

The broader catalog is source/structure-backed where already certified, but the **candidate screening, diversity selection, beam search and recommendation policy remain planner analytical**.

No combat resolver formula, executable classification, Oracle finding, support-effect runtime classification or game-file evidence class is promoted by 0.17.6.

---

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

