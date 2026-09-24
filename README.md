# HOI4 War Planner — 0.17.16

A mobile-friendly Hearts of Iron IV analytical planning suite locked to a bundled **vanilla HOI4 1.19.3** game-file baseline. The planner combines source-certified game data with explicitly labeled executable-inferred and planner-analytical behavior rather than claiming `hoi4.exe` parity.

**Live site:** https://hoioracle.com/  
**Report a problem or request an improvement:** https://github.com/armoldo30/Chat/issues/new/choose

## 0.17.16 release focus

0.17.16 is a **pre-launch presentation and copy pass**. It does not change planner formulas, game data, Counter search behavior, Oracle evidence, or any combat result.

- The large AdSense-oriented homepage intro is replaced with a compact player-first header.
- Public guide copy is shorter, plainer, and written around the questions HOI4 players actually bring to the tool.
- Existing crawlable guide, methodology, About, designer, Counter, and Gauntlet pages remain public rather than hiding publisher content from users.
- Stale 0.17.0 release references are updated.
- Counter documentation now matches the 0.17.15 product decision: show direct per-division IC change without pretending to reconstruct live production feasibility.
- Advertising remains disabled.

## 0.17.15 release focus

0.17.15 closes the remaining **support-specific runtime-effects audit** at a bounded evidence boundary and simplifies Counter production context.

### Support runtime effects

The 1.19.3 support catalog already retained specialist source fields but intentionally did not execute fields whose aggregation semantics were not yet defensible. This release promotes only the subset that maps cleanly onto existing planner concepts:

- source `battalion_mult` now applies category-scoped modifiers for planner-consumed battalion stats such as soft/hard attack, defense, breakthrough, armor/piercing, HP, organization and supply use;
- `add = yes` blocks are treated as flat sub-unit adjustments, while other supported battalion modifiers use the same additive-then-factor convention as the audited technology runtime;
- support `supply_consumption_factor` now adjusts the resolved division's total supply use;
- `casualty_trickleback` now reduces reported permanent manpower losses without altering combat strength damage or equipment losses.

Current 1.19.3 regression fixtures cover Recon's artillery soft-attack multiplier, Field Hospital infantry HP/trickleback, and Logistics Company supply reduction.

Recon/tactic selection, entrenchment state, recovery, reliability/attrition, equipment capture, fuel, experience loss, suppression, deployed-leader modifiers and specialist abilities remain retained and visible but not executed because their downstream systems or exact aggregation/order are outside the certified runtime.

The source values remain **game-file exact**. The newly executed aggregation is **executable inferred**, not Oracle-validated.

### Counter IC context

Counter no longer consumes saved production lines, spare factory capacity, strategic-resource availability or armor-family retooling heuristics to accept, reject, screen or rank proposed counters. Production feasibility is deliberately not inferred.

Recommendation cards now show the direct per-division equipment cost comparison:

`current IC/div → proposed IC/div`

plus the absolute and percentage change. Best Raw remains combat-pure; Best Efficient may use the direct IC delta, supply burden and change complexity, but not the user's live production plan.

## 0.17.14 release focus

0.17.14 completes the current **Counter land-MIO target-coverage audit** by replacing the source-backed runtime's remaining hand-picked artillery / AT / AA unit list with targets derived from each hydrated unit's actual equipment `need`.

That makes MIO propagation follow the same 1.19.3 data that defines Counter's candidate universe. Motorized artillery, motorized anti-tank, motorized anti-air, infantry-equipment support units, and conventional / rocket-artillery variants no longer fall outside the runtime simply because they use a newer or more specific sub-unit ID.

Rocket artillery keeps its actual `rocket_artillery_equipment` context, and `motorized_rocket_equipment` remains distinct. The equipment-compatibility matcher now prevents conventional `artillery_equipment` restrictions from matching rocket artillery merely through substring overlap.

Division Lab and Counter share the same unit-target and equipment-target helpers, while the old static map remains only for the legacy packless coarse tech/availability fallback.

This is **source-derived target coverage using existing MIO restriction and bonus semantics**. It adds no new MIO bonus formula, combat formula, Oracle result, prerequisite rule, or evidence promotion.

## 0.17.13 release focus

0.17.13 fixes a **source-backed MIO equipment-restriction leak** found during the Counter audit.

The MIO runtime already retained and understood organization/trait `equipmentTypes` restrictions, but Division Lab and Counter previously requested one aggregate family effect without an equipment context. A selected trait restricted to anti-tank equipment could therefore leak into artillery-family calculations, and tank-role restrictions could leak between armor, tank destroyer, SP artillery, and SP anti-air variants inside the same chassis family.

Both runtimes now pass the equipment context into the existing MIO compatibility logic. Artillery / anti-tank / anti-air families are filtered by their selected family identity, while tank variants are filtered by each role's exact target equipment key. The 1.19.3 Vickers-Ruwolt source record provides the audit fixture: its anti-tank improvements are restricted to `anti_tank_equipment`, while its defensive-emplacement trait is restricted to artillery / rocket-artillery equipment.

The compatibility matcher is also tightened so an exact tank restriction such as `medium_tank_destroyer_chassis` no longer matches every other tank chassis merely because both contain the word `tank`; the intentionally broad source category `armor` remains broad.

Regression coverage proves that sibling artillery and anti-tank traits no longer cross-apply, and that medium-tank armor- and tank-destroyer-only traits stay on their correct role.

This executes **already source-backed restriction data through the planner's existing MIO compatibility interpretation**. It adds no new combat formula, MIO bonus formula, Oracle result, or evidence promotion.

## 0.17.12 release focus

0.17.12 eliminates the **Division Lab / Counter MIO identity-map drift** exposed by the 0.17.11 audit.

Division Lab, Counter Analysis, and the legacy coarse equipment-tier / availability fallback now consume one shared land-MIO family map. That shared map contains the current 1.19.3 Regimental Support IDs (`field_guns`, `anti_tank_battery`, `anti_air_battery`) alongside the retained predecessor aliases, so the three runtime paths cannot silently diverge on artillery / anti-tank / anti-air family membership.

Regression coverage now requires both Division Lab and Counter to import and iterate the shared map, forbids reintroducing their former private maps, and checks current plus legacy support aliases through the fallback/availability path.

This is a **runtime consistency and identity-mapping refactor**. It adds no new MIO formula, combat formula, prerequisite execution rule, Oracle result, or evidence promotion.

## 0.17.11 release focus

0.17.11 corrects **Counter Analysis MIO propagation for the current 1.19.3 Regimental Support batteries**.

The 1.19.3 support catalog uses `field_guns`, `anti_tank_battery`, and `anti_air_battery`, but Counter's family-MIO mapping still covered only the older predecessor IDs. The current batteries now receive the same selected artillery, anti-tank, and anti-air MIO equipment bonuses as their divisional support counterparts, while the legacy aliases remain supported for older saved state.

The adjacent coarse technology-availability aliases are aligned to the same current IDs. Runtime regression coverage verifies all three current battery families through Counter's real tech/MIO-adjusted data path.

This is a **mapping/current-ID correction**. It adds no new MIO formula, combat formula, Oracle result, prerequisite execution rule, or evidence promotion.

## 0.17.10 release focus

0.17.10 hardens the optional **Counter deep redesign** against a saturated-win-rate edge case found during the post-release behavior audit.

Counter recommendations require at least a **+2 percentage-point modeled win-rate improvement**. When the selected side is already above 98%, that threshold cannot fit below the model's 100% win-rate ceiling. The previous UI could still offer **TRY DEEP REDESIGN**, even though no third-step candidate could mathematically qualify.

The search engine now blocks that impossible third-step escalation, the UI suppresses the deep-redesign action in ceiling-limited cases, and the diagnosis explains why. A baseline of exactly 98% remains eligible because a 100% result can still reach the +2 pp threshold.

This changes only **planner-analytical search control and UI behavior**. It does not change the battle resolver, recommendation threshold, candidate universe, combat formulas, Oracle status, or game-file evidence.

## 0.17.9 release focus

0.17.9 corrects an early **Counter Analysis anti-air screening** inconsistency found during the post-0.17.8 recommendation audit. The cheap candidate preview now gives AA its elevated screening weight only when the side being improved is actually suffering modeled enemy air superiority.

Friendly air superiority no longer biases AA into the limited candidate shortlist, and CAS-only contexts remain at ordinary background AA weight because the current resolver does not execute direct AA-versus-CAS damage or mitigation. This aligns the early shortlist with the side-aware diagnosis and preserves more of the bounded battle-test budget for matchup-relevant candidates.

Regression coverage now checks attacker and defender air-superiority sign handling plus the CAS-only evidence boundary. This is a **planner analytical** screening correction only; it does not change a combat formula, Oracle classification, or game-file evidence status.

## 0.17.8 release focus

0.17.8 adds an optional **bounded Counter deep redesign** for matchups where the normal local search cannot find a meaningful one- or two-change improvement.

The normal Counter path is unchanged at **20 first-step + 10 second-step battle tests**. Only after that bounded local search fails does the UI offer **TRY DEEP REDESIGN**. The optional deep pass re-evaluates the same matchup, seeds from a small diverse set of strong two-change attempts, and battle-tests at most **6 third-step candidates**.

Deep redesign remains responsive through the same yielding/cancellation path used by the normal Counter search, reports first/second/third-step test counts explicitly, and labels the result as a bounded three-step analysis. It is **not** an exhaustive template search.

The third-step search and its escalation policy are **planner analytical**. 0.17.8 does not add or promote any combat formula, executable behavior, Oracle result, or game-file evidence class. Best Raw remains combat-pure, while production, supply, IC and retooling remain secondary context for efficiency and disruption-oriented recommendations.

## 0.17.7 release focus

0.17.7 hardens **Counter Analysis recommendation quality** after the 0.17.6 candidate-universe expansion. A permanent hydrated 1.19.3 quality matrix now checks representative soft-target, armor-threshold, high-hardness, enemy-air-superiority, defender and Regimental Support matchups against the real bounded Counter search.

When candidates tie on modeled win-rate improvement, Counter now uses the modeled **strength-loss exchange** as a combat-only secondary discriminator before non-combat tie-breakers, and exposes that exchange in the result UI. This prevents saturated 0%/100% matchups from falling through to arbitrary ordering while keeping Best Raw combat-pure.

Air-threat diagnosis is now side-aware. Anti-air is prioritized when the side being improved is actually suffering the modeled enemy-air-superiority penalty; CAS alone no longer claims direct AA mitigation because direct AA-versus-CAS damage/mitigation is not executed by the current resolver.

The quality matrix also exposes search coverage for line, divisional-support, Regimental Support and tank-design candidates plus piercing, hard/soft attack, air-attack and survival improvements. Counter smoke and quality tests now hydrate the same bundled 1.19.3 runtime data path used by the live app.

This release also removes stale generic 1.19.2 / 0.16.0 active-baseline UI wording while deliberately preserving evidence-specific 1.19.2 provenance for retained production/combat/air-source work.

All recommendation ranking, coverage accounting and quality-matrix expectations remain **planner analytical**. No new combat formula, executable behavior, Oracle evidence, or game-file evidence class is promoted.

## 0.17.6 release focus


0.17.6 upgrades **Counter Analysis** around the matchup itself. Counter now screens the current 1.19.3 ordinary battalion, divisional-support and Regimental Support catalogs instead of the old hardcoded battalion/support whitelists, while preserving the Division Designer's HQ-only exclusions and support-structure rules.

Candidate screening is now matchup-driven before the expensive battle simulation. It prioritizes armor/piercing thresholds, target hardness, attacker breakthrough or defender defense, organization and relevant anti-air value, then preserves line/support/Regimental/tank-design diversity inside the browser-safe simulation budget. Two-step search also uses a diversified beam so one candidate family cannot crowd out every combination path.

Best Raw remains combat-pure. Best Efficient balances combat gain against IC, supply and change complexity; production burden remains secondary context rather than a hard gate. Smallest Effective Change continues to favor the least disruptive meaningful answer.

This release changes **planner-analytical search strategy only**. It does not promote any new combat formula, executable behavior, or Oracle evidence.

## 0.17.5 release focus

0.17.5 advances the support-effects audit without inventing new combat formulas. The Division Designer now exposes retained 1.19.3 support-specific source effects through an evidence-bounded summary for selected divisional and Regimental Support companies.

The summary covers recon, entrenchment, initiative, recovery, reliability/capture, supply/fuel factors, casualty trickleback, experience loss, suppression, speed fields, battalion_mult blocks, deployed-leader modifiers and enabled abilities. Each item carries its current runtime state. Effects that remain `source-retained-not-executed` are explicitly shown as informational rather than silently applied.

No Oracle evidence or combat resolver formula is promoted by this release.

## 0.17.4 release focus

0.17.4 closes the remaining normal-Division-Designer eligibility leak discovered during the Regimental Support cleanup. Army-HQ-only line battalions are now excluded from ordinary division templates, and saved/imported templates are normalized against the same structural allowlist.

The missing compact HQ-eligibility flags are recovered conservatively from the bounded public 1.19.3 source mirror and remain `unvalidated`; they are not silently promoted to `game-file exact`. Oracle evidence and combat formulas are unchanged.

## 0.17.3 release focus

0.17.3 fixes Regimental Support compatibility mapping in the Division Designer. Hydration now preserves the game's exact six regiment groups — infantry, combat support, mobile, mobile combat support, armor, and armor combat support — instead of collapsing the three combat-support groups into broader buckets and relying on a later browser repair pass.

The audited 1.19.3 `allowed_battalion_groups` source values are unchanged. This is a planner runtime-mapping correction, not a source-data rewrite, and it does not change any Oracle evidence classification or combat formula.

## 0.17.2 release focus

0.17.2 is a deep Division Designer support-company correction on the HOI4 1.19.3 baseline. It audits the complete support-category surface, separates the 14 Regimental Support entries from divisional support, excludes 11 Army-HQ-only companies from ordinary divisions, and exposes the resulting 43 regular divisional support choices in role-sorted groups.

The update also enforces source `same_support_type` conflicts, restores player-facing support names/abbreviations and specialist support records, preserves support-specific source metadata such as `battalion_mult`, recon, entrenchment, initiative, reliability, supply/fuel modifiers and casualty/experience effects, and retains Army-HQ eligibility when importing custom data packs.

Source-defined support mechanics that the planner does not yet execute completely remain explicitly bounded rather than being presented as executable parity.

## 0.17.1 release focus

0.17.1 is a focused Division Designer maintenance release on the certified HOI4 1.19.3 baseline. It fixes regimental-support selection, replaces the hardcoded line-battalion picker subset with the hydrated source-backed battalion catalog, exposes armored combat-support battalions such as tank destroyers, SP artillery and SP anti-air, and groups divisional support companies by battlefield role for faster navigation.

The underlying 1.19.3 game-data baseline and evidence classifications are unchanged by this patch.

## 0.17.0 release focus

0.17.0 migrates the certified source-data layer from HOI4 1.19.2 to **1.19.3.0.c01a (checksum 5632)** using the supplied 1.19.3 `common` and English-localisation files as the authoritative source. The migration updates changed land units, equipment, tank modules, technologies, doctrines and MIO organizations while retaining source-identical 1.19.2 records only where the 1.19.3 source audit found no relevant change.

The public tools remain:

**Research assumptions → Equipment design → Division design → Combat performance → Division Gauntlet → IC/supply tradeoffs**

## Division Gauntlet

Quick Gauntlet generates about **500** plausible opponent divisions. Full Gauntlet generates **10,000** deterministic opponent designs and screens the tested division across eight terrain types while attacking and defending: **160,000 terrain/role matchups**.

Opponent families include infantry walls, artillery infantry, cheap holders, motorized/mechanized formations, light/medium/heavy armor, breakthrough tanks, high-hardness formations, AT/AA counters, space-marine-style hybrids, high-ORG infantry, low-cost spam and elite divisions. Widths, support companies, equipment quality, doctrine assumptions, armor/piercing, IC cost and supply burden vary procedurally.

The report separates **Raw Combat Grade** from **Practical Division Grade** and exposes offense, defense, terrain, matchup classes, IC efficiency, supply efficiency, consistency, counter resilience, best/worst matchups and percentile. Full-pool screening uses expected combat math; extreme cases receive a second-stage seeded stochastic check.

Gauntlet opponent generation and grading are **planner analytical**. The underlying bounded combat formulas remain **executable inferred from 1.19.2** until the 1.19.3 Oracle black-box suite is rerun; they are not promoted to 1.19.3 executable validation merely because the game-file constants are unchanged.

## Accuracy policy

The project distinguishes:

1. **`game-file exact`** — values/relationships directly retained from the supplied HOI4 1.19.3 files.
2. **`executable inferred`** — behavior constrained by source evidence but not provable without engine internals. Existing combat/production executable inference is explicitly carried forward from 1.19.2 pending 1.19.3 Oracle validation.
3. **`planner analytical`** — War Planner abstractions, scenario inputs, scoring and generated comparison systems.
4. **`oracle-validated` / `oracle-divergent` / `unvalidated`** — black-box executable evidence states used by the Oracle laboratory.

Exact tactic/counter selection, per-division reinforcement/coordination, direct CAS allocation/damage, commander/weather/experience interactions, some modifier ordering and other executable-only details remain outside parity claims.

## Core tools

- HOI-style 5×5 Division Lab with divisional and regimental supports
- Tank Designer and aircraft Air Lab using source-backed 1.19.3 catalogs
- Technology, doctrine and MIO modeling with theorycraft-first prerequisite handling
- Stochastic battle simulation, uncertainty bands and terrain comparison
- Industry/resource planning and equipment replacement estimates
- Division Gauntlet Quick and Full modes
- Local scenario persistence, named matchup saves and compact matchup links
- Custom game-data pack import while retaining a bundled vanilla baseline

Research, DLC and Special Project requirements are informational unless they define structural compatibility. The planner is a theorycrafting tool, not an in-game progression gate simulator.

## 1.19.3 source migration

The retained 1.19.3 source census contains **158 sub-unit declarations, 308 equipment declarations, 313 equipment modules, 552 technologies, 121 doctrines and 552 MIO organization declarations**. The runtime intentionally uses a planner-scope subset for some domains, so source-declaration counts and compact runtime counts are not interchangeable.

Planner-consumed Defines were re-audited against the supplied 1.19.3 `common/defines` corpus. The **36 consumed values are numerically unchanged from 1.19.2**, but their 1.19.3 provenance is recorded separately.

The migration follows the files over release-note prose if they disagree. For example, the supplied 1.19.3 `common/units/hq_support.txt` still contains armored-HQ supply values of **0.26 / 0.28 / 0.34** for light/medium/heavy HQ battalions, so the planner retains those source values.

## Privacy, resilience and advertising

The planner works without an account and stores planner state locally in the browser. Privacy, analytics, recovery and advertising integration are kept separate from the game-model evidence classes.

The public build includes browser-side recovery for failed module/runtime startup, no-JavaScript fallback content, local-state reset recovery, structured GitHub bug/feature reporting, and GA4 page-view instrumentation.

## Development and deployment

No package install is required.

```bash
npm test
npm run build
```

`npm test` includes mechanics/data certification, UI regressions, scenario persistence/sharing, monetization-readiness checks, Gauntlet tests, runtime-recovery checks and a full 10,000-opponent/160,000-matchup smoke. `npm run build` creates a dependency-free static site in `dist/` and materializes the certified 1.19.3 runtime pack.

Production deployment occurs only from `main` through GitHub Pages. Audit/release-candidate branches are validation-only and do not deploy.

See `RELEASE_NOTES.md`, `DATA_AUDIT_1.19.3.md`, the retained 1.19.2 formula audits, and the Oracle laboratory files for the current evidence boundary.
