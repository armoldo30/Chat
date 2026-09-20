# Counter Recommendation Quality Audit — HOI4 1.19.3

Release target: **0.17.7**  
Game baseline: **Hearts of Iron IV 1.19.3.0.c01a (checksum 5632)**  
Scope: Counter Analysis recommendation quality, bounded-search coverage and user-facing explanation.

## Evidence classification

This audit does **not** change the project's evidence classes.

- Underlying hydrated 1.19.3 structural records keep their existing classifications.
- Existing combat resolver formulas keep their existing `executable inferred` / Oracle classifications.
- Counter diagnosis, candidate screening, search diversity, ranking, coverage accounting and recommendation policy are **planner analytical**.
- No result in this audit is promoted to `oracle-validated`.

## Why this audit exists

0.17.6 replaced the obsolete hardcoded Counter battalion/support whitelists with the current source-valid ordinary-division, divisional-support and Regimental Support catalogs. That fixed candidate-universe coverage, but raw catalog reachability was not enough to prove that strategically relevant candidates survived pre-ranking and were actually battle-tested.

0.17.7 therefore adds an executable recommendation-quality matrix that runs representative matchups through the same bounded Counter search used by the planner.

## Scenario matrix

The permanent matrix covers:

1. soft infantry target;
2. infantry against a reachable medium-armor threshold;
3. medium armor against a much harder heavy-armor target;
4. enemy air-superiority pressure;
5. defender-side optimization;
6. a full divisional-support template with an eligible Regimental Support slot.

The matrix uses the hydrated bundled 1.19.3 runtime data path before constructing Counter snapshots. It checks that diagnosed mechanisms are represented in the battle-tested set rather than asserting a universal preferred unit.

Coverage includes:

- line edits;
- divisional-support edits;
- Regimental Support edits;
- active tank-design edits;
- piercing improvement and threshold crossing;
- hard-attack improvement;
- soft-attack improvement;
- air-attack improvement;
- attacker breakthrough or defender defense improvement.

The quality matrix uses a compact 10-first-step + 4-second-step certification budget. The separate Counter smoke test continues to exercise the full live 20 + 10 browser budget.

## Findings

### 1. Saturated win-rate outcomes need a combat-only tie-break

Several controlled fixtures produce 0% or 100% modeled win rates for many candidates. Ranking only by win-rate gain leaves strategically different candidates tied.

0.17.7 retains modeled win-rate gain as the primary Best Raw criterion, then uses modeled strength-loss exchange:

`enemy strength loss % - own strength loss %`

as the next combat-only discriminator.

Enemy casualty rate and own casualty rate are later combat tie-breaks. Change count and IC remain still later deterministic tie-breaks.

The UI exposes the modeled own/enemy strength loss and exchange so this behavior is not hidden.

### 2. Air-threat diagnosis was too broad

The previous heuristic used the absolute magnitude of the battlefield air-superiority input. That could increase AA priority even when air superiority favored the side being optimized.

0.17.7 makes the check side-aware:

- attacker Counter search treats negative air-superiority input as enemy pressure;
- defender Counter search treats positive air-superiority input as enemy pressure.

The current resolver uses division air attack to mitigate the modeled enemy-air-superiority defense/breakthrough penalty.

CAS is separate. The current resolver applies attacker CAS support but does not execute direct AA-versus-CAS damage or mitigation. CAS alone therefore does not create an AA priority, and the diagnosis copy states this boundary.

### 3. Candidate-universe tests were not sufficient by themselves

The 0.17.6 raw candidate-universe test correctly showed that Regimental Support entries could be generated from hydrated support maps.

During the 0.17.7 quality audit, an initial standalone Counter fixture reported zero Regimental Support search coverage. The cause was a test harness blind spot: standalone Counter tests were creating snapshots before hydrating the bundled 1.19.3 runtime data, unlike the live application bootstrap.

The Counter quality matrix and Counter search smoke now explicitly hydrate the bundled 1.19.3 pack and apply the audited Regimental Support compatibility fallback before evaluating search behavior.

The hydrated quality matrix then verified nonzero battle-tested Regimental Support coverage in eligible scenarios.

## Observed bounded-search behavior

The audit intentionally does not require a particular battalion or support company to be the universal winning answer.

Examples from the hydrated scenario matrix:

- reachable armor-threshold scenarios battle-test candidates that actually cross the target armor threshold;
- high-hardness armor scenarios retain hard-attack/piercing-focused heavy-cannon and AT-style attempts even when no one/two-change local answer wins;
- enemy-air-superiority scenarios battle-test candidates with increased air attack;
- eligible support-heavy templates battle-test Regimental Support edits;
- defender-side search preserves defender identity and tests defense improvements.

These are recommendation-quality checks, not executable-game truth claims.

## Current limitations

- Search remains bounded to two changes.
- The live default battle-tests 20 first-step and 10 second-step candidates after broader analytical screening.
- A local two-change counter may not exist even when a larger force redesign would solve the matchup.
- 0%/100% saturation can still compress information; strength-loss exchange improves ordering but does not make the analytical simulator executable parity.
- Direct AA-versus-CAS damage/mitigation is not modeled.
- Production capacity remains secondary context rather than a primary recommendation objective.
- Province-level supply, campaign fuel and future trade/factory reallocation remain outside the recommendation score.

## Release conclusion

0.17.7 improves the reliability and transparency of Counter recommendations without expanding any executable-evidence claim. The core result is a permanent hydrated scenario matrix that verifies that the bounded search actually tests the mechanisms it diagnoses, plus a combat-only secondary ranking signal for saturated outcomes.
