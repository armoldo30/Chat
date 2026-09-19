# HOI4 War Planner — 0.17.3

A mobile-friendly Hearts of Iron IV analytical planning suite locked to a bundled **vanilla HOI4 1.19.3** game-file baseline. The planner combines source-certified game data with explicitly labeled executable-inferred and planner-analytical behavior rather than claiming `hoi4.exe` parity.

**Live site:** https://hoioracle.com/  
**Report a problem or request an improvement:** https://github.com/armoldo30/Chat/issues/new/choose

## 0.17.3 release focus

0.17.3 fixes an ordinary-Division-Designer eligibility leak discovered during live Regimental Support testing. Army-HQ-only line battalions whose compact runtime records had lost `allow_in_non_army_hq = no` are now excluded from normal division templates, including saved/imported templates, so invalid HQ regiment groups can no longer drive Regimental Support choices.

The 14 Regimental Support `allowed_battalion_groups` records were re-audited and remain unchanged because they already match the supplied 1.19.3 source structure. A new regression locks all 14 choices across the six regiment groups. The omitted HQ eligibility fields are recovered by a bounded public 1.19.3 source-mirror cross-check and remain labeled `unvalidated`, not silently promoted to `game-file exact`.

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
