# HOI4 War Planner — Oracle Validation 1.19.3

Target executable: Hearts of Iron IV Operation Postern `1.19.3.0.c01a`  
Checksum: `5632`  
Planner baseline: `0.17.0` / HOI4 1.19.3 source-certified production model  
Evidence boundary: observable executable behavior only; no claim of bit-for-bit parity with `hoi4.exe`.

## Evidence classes

Use these labels exactly:

- `game-file exact`
- `executable inferred`
- `planner analytical`
- `oracle-validated`
- `oracle-divergent`
- `unvalidated`

A successful mod load or one matching stochastic trace is not sufficient for `oracle-validated`.

## O1 objective

O1 is the minimal controlled land-combat experiment. The current instrumentation records organization and strength percentages for exactly one German attacker and one Polish defender at hourly intervals.

The six-hour helper queues all delayed events up front to avoid the same-tick recursive scheduling behavior observed on 1.19.2.

Command:

`d_oracle_o1_trial6`

Expected samples: h0, h1, h2, h3, h4, h5, h6, followed by automatic `END hour=6 reason=trial6-complete`.

## 1.19.3 executable smoke — PASS

Capture: `oracle-lab/captures/o1-1193-smoke-001.json`

The first 1.19.3 executable run produced:

- `BEGIN` with `gameVersion=1.19.3.0.c01a`, `checksum=5632`, and `runMode=trial6`
- sample hours 0 through 6 in strict order
- exactly one attacker and one defender at every sample
- automatic `END hour=6 reason=trial6-complete`

Screenshot-observed battle controls:

- Plains
- 1 German division vs 1 Polish division
- 18 displayed width on each side
- no commanders
- zero reserves
- German division shown as `12. Infanterie-Division`
- Polish division shown as `15 Wielkopolska Dywizja`

The screenshot alone is not used to infer hidden template identity or executable formulas.

### Smoke trace

| Hour | GER org | GER strength | POL org | POL strength |
|---:|---:|---:|---:|---:|
| 0 | 99.9965 | 99.9965 | 99.9965 | 99.9965 |
| 1 | 99.9965 | 99.9965 | 99.9965 | 99.9965 |
| 2 | 99.9965 | 99.9965 | 99.9965 | 99.9965 |
| 3 | 99.9965 | 99.9965 | 99.9965 | 99.9965 |
| 4 | 99.9965 | 99.9965 | 99.8130 | 99.9410 |
| 5 | 99.9965 | 99.9965 | 99.8130 | 99.9410 |
| 6 | 99.6780 | 99.9720 | 99.4400 | 99.8860 |

h0→h6 losses:

- GER organization: 0.3185 percentage points
- GER strength: 0.0245 percentage points
- POL organization: 0.5565 percentage points
- POL strength: 0.1105 percentage points

Current evidence classification: `unvalidated`.

This run validates the 1.19.3 instrumentation and delayed-event scheduler behavior. It does **not** establish combat parity.

## Historical 1.19.2 trace

The older `o1-baseline-candidate-001` capture remains historical evidence only. It is useful for regression context, but it does not certify 1.19.3 and should not be directly interpreted as a patch effect from one trace because combat is stochastic and the observed named divisions/date differ.

## Preliminary stochastic batch

Next collection target: 10 clean six-hour trials.

For every trial:

1. reload the same clean pre-battle save;
2. pause;
3. issue the same German attack;
4. run `d_oracle_o1_trial6`;
5. unpause until the helper auto-stops after h6;
6. reload the clean save and repeat.

All ten runs may remain in one `game.log`.

Batch analyzer:

`node scripts/oracle-trial6-batch.mjs path/to/game.log output.json`

The analyzer:

- identifies `runMode=trial6` runs;
- rejects incomplete or malformed runs;
- requires exact sample hours 0..6;
- records per-trial h6 organization/strength loss;
- counts intervals in which each side takes measurable damage;
- reports zero-damage interval frequency;
- reports mean, sample SD, min/max, and preliminary 95% normal-approximation intervals.

Ten trials are a preliminary variance estimate, not the final validation sample size. The observed variance will determine whether O1 needs a larger N before comparison with planner Monte Carlo output.

## Promotion rule

O1 may move from `unvalidated` only after:

1. repeated clean executable trials establish a stable distribution;
2. the same controlled scenario is represented in the current 1.19.3 planner;
3. planner Monte Carlo output is compared at the distribution level;
4. uncertainty/tolerances are declared before promotion;
5. counterexample testing does not expose a material mismatch.

A passing result becomes `oracle-validated`; a reproducible material mismatch becomes `oracle-divergent`.
