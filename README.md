# HOI4 War Planner — 0.17.7

A mobile-friendly Hearts of Iron IV analytical planning suite locked to a bundled **vanilla HOI4 1.19.3** game-file baseline. The planner combines source-certified game data with explicitly labeled executable-inferred and planner-analytical behavior rather than claiming `hoi4.exe` parity.

**Live site:** https://hoioracle.com/  
**Report a problem or request an improvement:** https://github.com/armoldo30/Chat/issues/new/choose

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
