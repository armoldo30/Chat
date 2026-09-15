# HOI4 War Planner — Air Combat Audit 1.19.2

**Status: improved executable-inferred Air-to-Air model; aircraft source data remains game-file exact; exact `hoi4.exe` parity is not claimed.**

## Source-backed foundation

Air Lab continues to use the already-certified HOI4 1.19.2 aircraft corpus:

- 21/21 concrete airframes source-certified.
- 94/94 slot-compatible aircraft modules source-certified.
- frame scalar values, slot topology, module effects/resources, and mission-stat blocks are fingerprinted against the user-supplied 1.19.2 source.
- 43 mission-stat blocks across 33 modules are retained and applied by mission.
- Air Doctrine effects consumed by the current runtime retain their existing bounded source/runtime certification.

Those aircraft inputs remain **game-file exact** at their audited boundary.

## Why the old exchange model was replaced

The previous Air Lab dogfight comparator was deliberately analytical. It used:

- a fixed `0.018` lethality constant,
- arbitrary power-law agility and speed multipliers,
- reliability as a direct combat-damage multiplier,
- direct multiplication by mission efficiency and detection,
- a simple count-ratio exposure term.

That was useful for rough ranking, but its structure did not closely match the documented post-By-Blood-Alone air-to-air calculation.

## Current executable-inferred model

`src/air-combat-model-1192.js` now uses the documented post-1.13 dogfight structure:

1. attacking aircraft contribute base damage from engaged aircraft × Air Attack;
2. superior defender Agility reduces incoming damage rather than giving both sides a generic agility power multiplier;
3. an attacker Speed advantage adds relative-speed and absolute-speed bonuses;
4. Air Defense divides expected aircraft losses;
5. numerical advantage is limited by a 3:1 attackers-per-detected-target engagement cap;
6. carrier-vs-carrier air combat uses the documented carrier damage factor;
7. mission efficiency limits participating aircraft below 100%, while values above 100% are represented as operational tempo rather than inventing extra aircraft;
8. detection limits the number of enemy aircraft that can be brought into the engagement;
9. mission-specific module stat blocks are applied before dogfight resolution.

Reliability was removed from direct dogfight damage. Reliability remains a real aircraft stat, but its principal Air-combat relevance is through accidents/attrition; no unsupported accident model is folded into dogfight kills.

## Evidence classification

### Game-file exact

- Aircraft frame/module data already certified by the Air Designer audit.
- Mission-specific module stat blocks already certified by the Air mission runtime tests.
- Air Doctrine effects already supported by the bounded doctrine runtime.

### Executable inferred

The dogfight equation and constants in `AIR_COMBAT_MODEL_1192` are **executable inferred**, not game-file exact. The accessible compact repository proves the authoritative 1.19.2 Defines corpus fingerprint, but only the Defines values consumed by the completed land/production audits were retained in compact form. The exact 1.19.2 `NAir` block is not currently available in the repository/File Library.

The adopted formula is based on the post-1.13 documented Air combat equation that was publicly quoted from the HOI4 wiki in 2024, after the 1.13 air rebalance increased the effect of Agility and Speed. Public 1.19-era evidence continues to corroborate the 45% better-agility damage-reduction value. The reviewed 1.17 and 1.19.2 patch notes identify Air-to-Ground and AI aircraft changes but no subsequent replacement of the Air-to-Air dogfight equation.

This is stronger evidence than the former arbitrary heuristic, but it is still not equivalent to an authoritative 1.19.2 `NAir` source extraction or a black-box executable validation.

### Planner analytical

The Air Lab `Sorties` control remains an analytical exposure horizon. `1000` sorties equals one reference exposure unit so the UI retains continuity, but that conversion is not asserted to be an exact HOI4 combat-cycle mapping. Therefore absolute aircraft-loss counts remain less certain than relative design ranking and exchange direction.

## Explicitly unresolved

The following are not represented as exact executable behavior:

- exact 1.19.2 `NAir` constant extraction until the authoritative source block is recovered;
- exact detection-efficiency construction from radar, occupation, aircraft count, weather, night, mission type, and intelligence;
- escort/bomber targeting and disruption resolution;
- Ace effects and pilot/wing experience;
- weather/night operational scheduling;
- accident losses and reliability-driven attrition;
- exact sortie timing / `HOURS_DELAY_AFTER_EACH_COMBAT` scheduling;
- exact carrier sortie scheduling outside the dogfight carrier damage factor;
- Air-to-Ground, strategic bombing, and naval strike target-damage formulas beyond the already source-backed aircraft mission stats;
- exact executable rounding, randomization, wing selection, and modifier ordering.

## Regression boundary

`tests/air-combat-model.test.mjs` permanently checks:

- symmetric equal-design exchange;
- linear Air Attack response;
- inverse Air Defense response;
- asymmetric Agility mitigation;
- Speed-advantage bonuses only for the faster attacker;
- no direct Reliability-to-dogfight damage leakage;
- mission efficiency participation;
- detection-limited engagement;
- 3:1 numerical engagement cap;
- carrier damage factor;
- side-swap symmetry and bounded finite losses.

## Confidence after this pass

The intended confidence boundary is:

- aircraft/module stats: very high / source certified;
- mission-specific aircraft stat application: high / source certified at the current runtime boundary;
- relative Air-to-Air design ranking under controlled conditions: materially stronger than the previous model;
- exact aircraft losses over a stated sortie horizon: still analytical until the exposure/timing layer is source/executable validated;
- bit-for-bit `hoi4.exe` parity: **not claimed**.

The next meaningful accuracy jump requires either recovering the authoritative 1.19.2 `NAir` values from the original source archive or building an Air Oracle capture against the real 1.19.2 executable.
