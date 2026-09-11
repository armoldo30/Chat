# HOI4 1.19.2 Oracle Validation

Status: **ACTIVE — differential-validation foundation**

Baseline: `audit-1.19.2` certified head `3dec6033bcc743d041e37fef13e329081554774a`.

## Objective

Move the War Planner beyond bounded executable inference by comparing controlled planner simulations against observations produced by an actual Hearts of Iron IV 1.19.2 installation.

This phase does **not** replace the completed source audit. Game-file-exact claims remain tied to retained 1.19.2 source files. Oracle evidence is a separate empirical layer.

## Evidence classes

- `game-file exact` — directly established by retained 1.19.2 source files.
- `executable inferred` — source constrains the behavior but exact executable implementation is unavailable.
- `oracle-validated` — planner behavior matches controlled HOI4 observations within a declared tolerance and test population.
- `oracle-divergent` — controlled HOI4 observations and planner output differ beyond the declared tolerance.
- `planner analytical` — deliberate planner abstraction rather than a claim about exact executable behavior.

`oracle-validated` must never be relabeled `game-file exact` merely because a test passes.

## Harness foundation

`src/oracle.js` defines schema version 1 and the first differential comparator. An oracle capture must identify:

- exact game version;
- checksum;
- unique scenario ID;
- strictly increasing observed combat hours;
- attacker organization percentage;
- defender organization percentage;
- attacker strength percentage;
- defender strength percentage.

The comparator aligns observations by combat hour, records absolute metric error, reports the first divergence, reports battle-duration error, and returns an explicit evidence classification.

Default initial tolerances are intentionally strict but not claims of hidden executable precision:

- organization: 0.25 percentage points;
- strength: 0.10 percentage points;
- battle duration: 1 hour.

They may be tightened only after we understand the precision and update cadence of the HOI4 observation method.

## Black-box boundary

The intended method is controlled experimentation using normal game/mod/debug/logging facilities and exported observations. This repository does not assume access to Paradox source code and does not require decompiling the executable.

## Validation sequence

### O0 — Harness and provenance

- capture schema;
- differential comparator;
- permanent comparator tests;
- version/checksum/scenario provenance;
- immutable raw oracle fixtures once real captures begin.

### O1 — Minimal land-combat baselines

Hold every optional variable constant and test the smallest useful combat cases first:

- infantry vs infantry on plains;
- no leaders, doctrines, air, forts, rivers, weather, planning or supply penalties;
- controlled equipment/strength/org;
- one division vs one division;
- repeated runs sufficient to characterize stochastic damage.

Primary questions:

- attack-to-hit resolution;
- defended versus undefended hit behavior;
- hourly organization damage distribution;
- hourly strength damage distribution;
- minimum combat duration and battle termination.

### O2 — Armor, piercing and hardness

Vary one dimension at a time:

- soft/hard attack mixture;
- hardness;
- armor;
- piercing thresholds;
- armored organization dice behavior.

### O3 — Width, targeting, reserves and reinforcement

Measure behavior that retained files do not fully specify:

- per-division target selection;
- coordination;
- shared versus per-target defense consumption;
- reserve entry and reinforcement timing;
- overwidth and stacking interaction order;
- multi-direction attacks.

### O4 — Modifier ordering

Controlled factorial tests for:

- terrain;
- rivers;
- forts;
- entrenchment;
- planning;
- night;
- supply;
- commander and experience modifiers;
- country modifiers;
- intelligence;
- weather.

The goal is not only to recover individual percentages but to determine additive/multiplicative grouping, clamping and ordering.

### O5 — Tactics

Measure:

- selection eligibility;
- weighting;
- counter selection;
- tactic duration/change timing;
- tactic-specific combat effects.

### O6 — Air interaction

Measure land-combat-facing executable behavior:

- enemy air-superiority penalties;
- divisional AA mitigation;
- Ground Support interaction;
- direct CAS damage;
- aircraft allocation to battles;
- damage timing and target selection.

### O7 — Statistical parity suite

Every behavior corrected from oracle evidence becomes a permanent regression fixture. The final parity suite should contain both isolated unit tests and integrated battle scenarios across materially different combat states.

## Acceptance standard

A behavior may be promoted from `executable inferred` to `oracle-validated` only when:

1. the HOI4 version/checksum is recorded;
2. the scenario is reproducible;
3. raw observations are retained;
4. the sample size is appropriate for the stochastic behavior being measured;
5. planner and game results are compared by permanent automated tests;
6. tolerances and uncertainty are explicit;
7. known counterexamples are absent from the tested domain.

A statistically matching mean is insufficient when the underlying distribution or timing materially differs.

## Literal executable parity

The practical target is **empirically validated HOI4 1.19.2 parity for planner-relevant observable behavior**.

Literal bit-for-bit `hoi4.exe` replication is not claimed. Exact RNG state, hidden internal state, unrelated global RNG consumption and implementation details that are not externally observable may prevent proof of literal executable identity even when planner-visible outcomes match extremely closely.
