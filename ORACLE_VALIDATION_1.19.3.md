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

### Combat-use rejection

This specific trace is **not accepted into the O1 combat distribution**. The game log shows h0 at 17:00 and h6 at 23:00, so the intended daylight control was not satisfied. The screenshot also shows attack values around 37/36, roughly half the old daylight reference 75/73, which is consistent with night contamination.

Keep this run permanently as a scheduler/instrumentation smoke, but do not mix it into the stochastic combat sample.

A replacement daylight smoke was collected at 10:00→16:00 and passed the scenario controls. It is stored as `oracle-lab/captures/o1-1193-daylight-001.json`.

Screenshot/log controls for the accepted daylight run:

- Plains
- 1 GER vs 1 POL
- 18 width each
- no commanders
- zero reserves
- displayed attack values 75 / 73
- h0 at 10:00 and h6 at 16:00

This run is eligible for the preliminary O1 stochastic batch and counts as **trial 1 of 10**.

## Historical 1.19.2 trace

The older `o1-baseline-candidate-001` capture remains historical evidence only. It is useful for regression context, but it does not certify 1.19.3 and should not be directly interpreted as a patch effect from one trace because combat is stochastic and the observed named divisions/date differ.

## Preliminary stochastic batch

Next collection target: **9 more clean daylight six-hour trials** from the same controlled pre-battle save, bringing the preliminary sample to 10 accepted trials.

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

## Reload-repeat diagnostic

The first attempted nine-run repeat batch contained exactly nine complete trial6 captures, all with h0..h6 and exactly one attacker/defender. However, runs 2 through 9 were exact trace duplicates at every sampled hour.

This batch is recorded in `oracle-lab/captures/o1-1193-reload-batch-001-summary.json` and is **not** counted as nine independent stochastic samples. The result strongly indicates that reloading the same clean save restores the relevant RNG state closely enough to replay the same combat sequence.

The batch analyzer now reports `uniqueTraceCount`, duplicate trace groups, and an independence warning.

### Post-battle RNG-burn diagnostic

Two diagnostic runs were collected with `rngBurn=64` and `rngBurn=128` after the attack was already issued. They were exact trace duplicates at every sampled hour, ending with the same h6 values:

- GER: 98.073 org / 99.587 strength
- POL: 99.074 org / 99.8985 strength

This result is **inconclusive about RNG-stream sharing** because the battle may already have been seeded when combat was created. The next diagnostic moves the burn before the attack order.

### RNG-burn diagnostic

The Oracle mod now includes controlled pre-battle diagnostic commands that consume scripted random draws before the attack is created:

- `d_oracle_o1_preburn64`
- `d_oracle_o1_preburn128`
- `d_oracle_o1_preburn256`

Workflow: load the same clean daylight save, run the preburn command while still paused and **before** issuing the attack, issue the attack, then run `d_oracle_o1_trial6` and unpause. BEGIN records `preBurn=<count>`.

The next executable check is two runs using preburn64 and preburn128. If the traces differ, the final preliminary sample can use spaced pre-battle burn counts while preserving the visible scenario controls.

### Pre-battle scripted RNG burn result — FAILED

The follow-up pre-battle test used `preBurn=64` and `preBurn=128` before the O1 capture. Both runs were exact trace duplicates at every sampled hour, ending at the same h6 values:

- GER: 98.073 org / 99.587 strength
- POL: 99.074 org / 99.8985 strength

This rules out scripted `random_list` consumption as a practical method for decorrelating the O1 combat RNG in this scenario.

### Built-in random_seed diagnostic

HOI4 exposes a built-in console command `random_seed` that randomizes the current game seed. The next executable check uses that command directly instead of scripted random draws.

Procedure for each of two runs:

1. reload the same clean daylight pre-battle save;
2. remain paused;
3. run `random_seed`;
4. issue the same GER attack;
5. run `d_oracle_o1_trial6`;
6. unpause through h6.

If the two traces differ, the preliminary O1 sample can use one `random_seed` call immediately before each attack while keeping all visible scenario controls fixed.

### Built-in random_seed result — PASS

Two runs from the same clean 11:00 daylight save used the built-in `random_seed` command immediately before issuing the attack. They produced different combat traces while preserving the same visible scenario and sample hours 0..6.

Run 1 h0→h6 losses:

- GER organization: 1.6735 percentage points
- GER strength: 0.3005 percentage points
- POL organization: 1.5325 percentage points
- POL strength: 0.2265 percentage points

Run 2 h0→h6 losses:

- GER organization: 1.7590 percentage points
- GER strength: 0.3545 percentage points
- POL organization: 0.9535 percentage points
- POL strength: 0.1105 percentage points

This establishes `random_seed` as the practical decorrelation method for repeated O1 trials.

For strict batch consistency, these two runs are trials **1 and 2** of a new standardized 10-run batch using this exact 11:00 save. The earlier accepted 10:00 daylight smoke remains valid scenario/instrumentation evidence but is kept outside the standardized statistical batch because its start hour differs.

Next collection target: **8 additional runs**. For every run, reload the same 11:00 clean save, run `random_seed` while paused, issue the attack, run `d_oracle_o1_trial6`, then unpause through h6.

### 10-run vanilla stochastic envelope — COMPLETE

Using `random_seed` immediately before each attack, ten unique 11:00→17:00 O1 traces were collected from the same visible scenario. Aggregate h0→h6 losses:

- GER organization: mean 1.6776 pp, SD 0.4455
- GER strength: mean 0.3169 pp, SD 0.0839
- POL organization: mean 0.9106 pp, SD 0.3618
- POL strength: mean 0.1599 pp, SD 0.0573

This is valid evidence for the executable's **vanilla stochastic envelope**, but it is **not yet a planner-parity sample** because combat tactics were not controlled or logged. The current planner preserves tactic source records but deliberately does not execute exact tactic selection, counters, phase transitions, or tactic effect ordering.

Therefore the next Oracle phase splits O1 into two layers:

1. **O1-base** — tactic-controlled executable test for base damage/organization/strength formulas.
2. **O1-tactics** — separate validation of vanilla tactic selection/effects, after which the full stochastic envelope can be compared end-to-end.

The ten-run envelope is retained in `oracle-lab/captures/o1-1193-random-seed-batch-10-summary.json` and must not be used to promote the current tactic-free planner to `oracle-validated`.

### O1-base neutral-tactic harness

A dedicated executable harness now removes tactic selection as a confounder for base combat-formula validation.

The Oracle mod overrides `common/combat_tactics.txt` for this test only:

- all 55 vanilla tactic IDs remain defined so technology/doctrine references still resolve;
- every non-basic tactic is ineligible (`trigger = { always = no }`, inactive, zero weight);
- `tactic_basic_attack` and `tactic_basic_defend` are the only selectable tactics;
- their normal +5% damage modifiers are removed;
- the Basic Attack counter relationship is removed;
- no tactic-driven phase transition can occur.

Captures from this harness use:

- scenario: `o1-base-neutral-tactics-v1`
- tactic mode: `neutral-basic-only`

The first executable check is two `random_seed` trials from the same clean 11:00 daylight save. If both runs complete and differ stochastically, collect the standardized O1-base batch with the same harness.

## Promotion rule

O1 may move from `unvalidated` only after:

1. repeated clean executable trials establish a stable distribution;
2. the same controlled scenario is represented in the current 1.19.3 planner;
3. planner Monte Carlo output is compared at the distribution level;
4. uncertainty/tolerances are declared before promotion;
5. counterexample testing does not expose a material mismatch.

A passing result becomes `oracle-validated`; a reproducible material mismatch becomes `oracle-divergent`.
