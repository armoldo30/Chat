# HOI4 War Planner — Air Oracle Validation 1.19.2

**Status: harness ready; no Air behavior is Oracle-validated yet.**

## Purpose

The Air Lab now has a dedicated differential harness for controlled observations from an actual Hearts of Iron IV 1.19.2 executable. This is the next accuracy path after exhaustive attempts to recover the authoritative raw `NAir` block from the preserved source archive, Git history, File Library and historical Actions artifacts/logs.

The harness does **not** change the live Air combat formula by itself. It creates a reproducible evidence path for deciding whether the existing executable-inferred model agrees with the game and, when it does not, for identifying the first controlled variable that causes divergence.

## Evidence boundary

The existing evidence classes remain unchanged:

- **game-file exact** — directly certified against retained 1.19.2 game files;
- **executable inferred** — behavior constrained by source/documented formula evidence but not empirically matched against `hoi4.exe`;
- **planner analytical** — deliberate planner abstraction, including the current Sorties-to-exposure horizon;
- **oracle-validated** — controlled 1.19.2 observations match the planner inside an explicitly declared policy and tested population;
- **oracle-divergent** — eligible controlled observations exceed the declared tolerance;
- **unvalidated** — capture exists but lacks an explicit policy, sufficient sample count, or another validation prerequisite.

A capture cannot self-promote to `oracle-validated`. `compareAirOracleCapture(...)` returns `pass: null` until both an explicit minimum-trial policy and at least one numeric error threshold are supplied and the minimum trial count is met.

## Capture schema

`src/air-oracle.js` defines `AIR_ORACLE_SCHEMA_VERSION = 1`.

Required provenance:

- `metadata.gameVersion`
- `metadata.checksum`
- `metadata.scenarioId`

Required controlled context:

- `controlled.mission`
- `controlled.countA`
- `controlled.countB`

Each trial records:

- `lossA`
- `lossB`

Optional per-trial observations currently supported:

- `trialId`
- `windowHours`
- `sortiesA`
- `sortiesB`

Additional controlled fields may be retained in the capture object without affecting validation. Real captures should record every variable needed to reproduce the scenario, including aircraft variants/stats, mission efficiency, displayed detection, doctrine, wing experience, aces, air region, range/coverage, weather, day/night state, carrier status, start time and any relevant modifiers.

Example shape:

```json
{
  "schemaVersion": 1,
  "metadata": {
    "gameVersion": "1.19.2",
    "checksum": "<record actual checksum>",
    "scenarioId": "air-fighter-baseline-001"
  },
  "controlled": {
    "mission": "air_superiority",
    "countA": 100,
    "countB": 100,
    "aircraftA": "<exact variant>",
    "aircraftB": "<exact variant>",
    "detectionA": 1.0,
    "detectionB": 1.0,
    "missionEfficiencyA": 1.0,
    "missionEfficiencyB": 1.0
  },
  "trials": [
    {"trialId":"T1","lossA":2,"lossB":4,"windowHours":24}
  ]
}
```

The numbers above are schema illustration only, not empirical HOI4 evidence.

## Comparator

`compareAirOracleCapture(capture, plannerComparison, policy)` compares the planner's expected `lossA` / `lossB` against the observed trial means and reports:

- trial count;
- observed mean, sample standard deviation, minimum and maximum losses for each side;
- predicted losses;
- absolute and relative mean-loss errors;
- observed and predicted loss exchange ratio;
- exchange-ratio relative error;
- policy eligibility;
- explicit failure reasons;
- evidence class through `airOracleEvidenceClass(...)`.

No default acceptance threshold is supplied. A policy may contain:

```json
{
  "minTrials": 20,
  "maxMeanLossAbs": 0.5,
  "maxMeanLossRel": 0.10,
  "maxExchangeRatioRel": 0.10
}
```

Those values are an example of policy syntax, **not** certified or recommended tolerances. Appropriate thresholds must be chosen for the observation precision and experiment being run.

## Distribution limitation

The raw capture retains per-trial variance, but the current Air model produces expected losses rather than a stochastic aircraft-loss distribution. Therefore the comparator explicitly returns:

`distributionComparable: false`

A matching mean is not represented as proof that RNG shape, combat timing, target selection, wing selection, sortie scheduling or variance matches the executable.

## CLI

For retained JSON files:

```bash
node scripts/air-oracle-report.mjs capture.json planner-comparison.json policy.json
```

The policy argument is optional. Omitting it intentionally produces `unvalidated` evidence rather than a pass.

## Recommended controlled sequence

Start with symmetric fighter-vs-fighter tests and alter one dimension at a time:

1. identical aircraft / equal numbers baseline;
2. Air Attack only;
3. Air Defense only;
4. Agility only;
5. Speed only;
6. numerical ratio / 3:1 engagement-cap behavior;
7. displayed detection;
8. mission efficiency;
9. Air Superiority doctrine detection;
10. carrier-vs-carrier status;
11. wing experience and aces;
12. weather and night;
13. range / coverage;
14. longer observation windows to resolve combat scheduling/exposure.

The same base scenario should be repeated enough times to characterize observed variance before changing another variable.

## Raw-source recovery status

The authoritative Defines audit proves the original `common/defines/00_defines.lua` was 405,669 bytes with SHA-256:

`405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4`

The raw file is no longer materialized in the current repository or File Library. Historical Git/Actions investigation found only generated certification patches containing the source fingerprint/census and selected consumed values; the raw Lua was never committed or uploaded as a surviving workflow artifact. Public exact-SHA searches also did not recover a byte-identical copy.

Therefore the current Air dogfight constants remain **executable inferred**. This harness is the correct next evidence path rather than assigning guessed `NAir` values.

## Promotion rule

No Air behavior should be called `oracle-validated` until real 1.19.2 captures are retained, provenance is complete, the sample population is appropriate, an explicit tolerance policy is documented, permanent regressions compare the captures against the planner, and no known counterexample exists inside the claimed test domain.
