# HOI4 1.19.2 Combat Formulas Audit

Status: **PASS — bounded source/runtime certification**

This phase audits the planner's land-combat formula layer against the authoritative HOI4 1.19.2 `common/` corpus retained in the project handoff. Game-file constants are labeled exact only where the retained files prove them. Behavior that lives in `hoi4.exe` is labeled executable-inferred, and planner-only abstractions remain analytical.

## Source-exact inputs

The combat runtime now consumes 33 exact `NMilitary` values (36 planner-consumed Defines values including the three Production values). Newly bound combat values include the four piercing thresholds and damage fractions, armored soft-hit dice, four out-of-supply endpoints, the 25% Ground Support base, the 30% base planning maximum, small/large river penalties, and the divisional-AA diminishing-return constants.

The exact retained sub-unit terrain corpus is also active at runtime: **72 unit records / 514 terrain blocks / 24 source files**, canonical SHA-256 `f7b34f3bcf1f1587ac501baeba9bb5a5a31e5423f028befe03127db0335409c2`.

## Corrections

- Hourly attack and defense points are resolved at **stat / 10** before defended/undefended hit chances. This is executable-inferred behavior; the source Defines supply the 10%/40% hit probabilities but not the executable conversion.
- Supply no longer uses one synthetic 75% penalty. The normalized supply inputs interpolate to the exact 1.19.2 endpoints: attacker attack -25%, attacker defend/breakthrough -65%, defender attack -35%, defender defend -15%.
- Planning now modifies attacker attack **and breakthrough**. The source baseline maximum is 30%; the UI input is treated as an already-effective planning bonus so doctrine/country increases are not incorrectly hard-capped.
- Ground Support now starts from the exact **25%** `AIR_SUPPORT_BASE`, applies to attacker attack and breakthrough, and consumes selected air-doctrine `air_cas_present_factor` instead of hardcoding 35%.
- `land_night_attack` is treated as an additive offset to the exact 50% night attack penalty instead of reducing the penalty multiplicatively.
- Exact line/support terrain attack and defense blocks are aggregated separately. Attacker terrain attack modifiers affect attack/breakthrough; defender terrain defense modifiers affect attack/defense. Exact `river` and `fort` unit modifiers are retained and consumed.
- Divisional AA now mitigates the enemy-air defense/breakthrough penalty with the source-described `a * xp/(xp+b)` curve, where `xp = anti_air ^ 1.5`, `a = 0.75`, and `b = 625`.
- The invented 10% minimum-strength combat-stat floor is removed.
- Armored 6-sided organization damage dice are used only for **soft hits** when armor exceeds enemy piercing; hard hits stay on the normal organization die.
- The hidden 168-hour cutoff is retired. The aggregate simulator uses an explicit planner-analytical 720-hour safety horizon, overrideable internally for tests.

## Certification boundary

This is not a claim of bit-for-bit `hoi4.exe` parity. The planner still aggregates identical committed divisions into an engaged firepower pool plus reserve organization/HP depth. It does not yet reproduce per-division reinforcement timing, target selection/coordination, combat-tactic selection/counters, direct CAS bombing damage and plane allocation, weather, commander skill, experience, intel, country modifiers, or every internal modifier-ordering edge case.

Those omissions are explicit analytical/bounded behavior rather than silent approximations.

## Permanent checks

`tests/combat-formulas-certification.test.mjs` locks the source values and runtime invariants for attack-point scaling, piercing, armored soft dice, supply endpoints, planning, Ground Support, night attack, terrain attack/defense aggregation, divisional-AA mitigation, strength scaling, the retained terrain corpus, and the explicit simulation horizon.
