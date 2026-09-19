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

### O1-base neutral-tactic smoke — PASS

The first tactic-controlled O1-base build was exercised twice from the same 11:00 daylight save with `random_seed` before each attack. Both runs produced complete h0..h6 captures with the expected metadata:

- `scenario=o1-base-neutral-tactics-v1`
- `tacticMode=neutral-basic-only`
- `gameVersion=1.19.3.0.c01a`
- `checksum=5632`

The two traces were distinct, confirming that combat RNG remains decorrelated under the tactic-control build.

Run 1 h0→h6 losses:

- GER organization: 1.9665 percentage points
- GER strength: 0.4765 percentage points
- POL organization: 0.7575 percentage points
- POL strength: 0.2025 percentage points

Run 2 h0→h6 losses:

- GER organization: 1.2405 percentage points
- GER strength: 0.2695 percentage points
- POL organization: 0.0795 percentage points
- POL strength: 0.0425 percentage points

The mod package replaces all 55 tactic IDs, leaves only Basic Attack and Basic Defend selectable, and neutralizes their normal combat modifiers/counter relationship. The WPO1 log itself does not expose selected tactic identity, so runtime tactic suppression is not independently observed in the capture. For that reason this smoke remains `unvalidated` rather than being promoted on metadata alone.

Next collection target: eight additional O1-base runs from the same 11:00 clean save, using `random_seed` immediately before each attack, for a 10-run preliminary base-formula distribution.

### O1-base 10-run preliminary distribution — COMPLETE

The neutral-tactic O1-base harness now has ten accepted, unique 11:00→17:00 traces. All runs used the same clean daylight save, `random_seed` immediately before the attack, and `tacticMode=neutral-basic-only`.

Aggregate h0→h6 losses:

- GER organization: mean 1.4918 pp, SD 0.3553, 95% mean interval 1.2716–1.7120
- GER strength: mean 0.3059 pp, SD 0.0813, 95% mean interval 0.2555–0.3563
- POL organization: mean 0.5270 pp, SD 0.3142, 95% mean interval 0.3322–0.7217
- POL strength: mean 0.1029 pp, SD 0.0634, 95% mean interval 0.0636–0.1421

One accepted run produced zero measurable defender damage over the six-hour window; this is retained as legitimate stochastic evidence, not discarded.

The batch is stored in `oracle-lab/captures/o1-base-neutral-tactics-batch-10-summary.json`.

Preliminary contrast with the vanilla-tactics 10-run envelope:

| h0→h6 loss metric | Vanilla tactics mean | Neutral tactics mean | Relative change |
| --- | ---: | ---: | ---: |
| GER organization | 1.6776 pp | 1.4918 pp | -11.1% |
| GER strength | 0.3169 pp | 0.3059 pp | -3.5% |
| POL organization | 0.9106 pp | 0.5270 pp | -42.1% |
| POL strength | 0.1599 pp | 0.1029 pp | -35.7% |

With only ten trials per condition this is descriptive, not a final significance claim. It nevertheless confirms that tactic state is not a safe nuisance to ignore in O1 planner-parity work; the neutral-tactic split was necessary.

Evidence remains `unvalidated`. Ten trials are sufficient for the first planner-distribution comparison and variance diagnosis, but not sufficient by themselves for final Oracle promotion.

The next Oracle step is to compare this executable distribution against the planner's tactic-free base hit/damage resolver using the controlled O1 inputs. The historical O1 notes specify a 9-infantry, no-support, 18-width setup with 100% supply, 0 planning, 0 entrenchment, no commanders, Plains, and matched +25% experience. Where the executable UI provides effective combat stats, those values should be preferred over reconstructing hidden modifier ordering.

### Exact baseline save extraction

The controlled pre-battle save `perfect baseline ready.hoi4` was inspected directly.

Save provenance:

- SHA-256: `bb26ede3a83c8fd25e1d108f074444424dff92e82f58bfa3581ce1f545c09711`
- binary encoding: `HOI4bin`
- save format version: 33
- version string: `Operation Postern v1.19.3.0.c01a (5387)`
- player: GER
- Oracle mod present: `HOI4 War Planner Oracle 1.19.3`

Checksum provenance is now explicit: `5387` is the checksum embedded in this Oracle-modded save, while `5632` is the clean 1.19.3 base-game reference checksum. Existing WPO1 captures that say `checksum=5632` are therefore interpreted as **base-game reference checksum**, not the modded runtime checksum. Future Oracle BEGIN markers include `checksumScope=base-game-reference`.

Exact saved templates:

- GER `Infanterie-Division` / `GER_Inf_01`: 9 infantry battalions, no support companies
- POL `Dywizja Piechoty` / `POL_INF_01`: 9 infantry battalions, no support companies

Using the supplied 1.19.3 infantry unit source, both templates are source-exact at the static composition boundary:

- width: 18
- HP: 225
- manpower: 9,000
- raw infantry battalion organization: 60
- supply use: 0.54
- infantry equipment requirement: 900

The extracted save facts are stored in `oracle-lab/captures/o1-baseline-save-1193-summary.json`. Dynamic combat stats and modifier ordering are not inferred merely from template composition.

#### Dynamic-state narrowing from existing evidence

Existing O1 setup evidence establishes two important controls that were not carried into the original save-summary JSON:

- both test divisions were normalized to the same underlying base Soft Attack of **54.0**;
- both were brought to the same experience level, producing **Experience +25%**.

A diagnostic inspection of the binary save also located distinct GER and POL technology blocks. The relevant normal-infantry starting technology set is shared between the two test countries: both contain `infantry_weapons`, `infantry_weapons1`, `tech_support`, `tech_engineers`, and `tech_recon`. Germany also contains motorized/armored-car entries that are not used by the exact 9-infantry/no-support O1 templates.

This narrows the source of the GER/POL combat-panel asymmetry: it should not be attributed to different O1 template composition, different controlled experience level, or an obvious mismatch in the directly relevant starting infantry technology set.

The binary save also exposes identifiers for active country ideas/dynamic modifiers, including Germany's `GER_army_modifier` and Poland's starting political spirits. Raw fixed-point probing of the German serialized military variables is useful diagnostically, but a structurally complete HOI4 save-v33 decode is not yet available in the project runtime. Those raw variable interpretations are therefore **not** promoted to `game-file exact`, and final organization/country-modifier ordering remains unresolved.

Evidence boundary:

- exact template/static totals: `game-file exact`
- controlled base Soft Attack / matched experience: `executable inferred` (controlled setup observation)
- raw binary dynamic-variable probing: `executable inferred` diagnostic only
- final effective attack/defense/breakthrough/org and modifier ordering: `unvalidated`

### O1 combat-entry timing — ORACLE-VALIDATED at the controlled boundary

Across all currently usable O1 captures, **35 of 35** controlled runs show exactly zero organization and strength change from h0 to h1:

- 25 runs with vanilla tactic behavior
- 10 runs with neutralized Basic Attack / Basic Defend behavior

Damage is observed in the following interval in the large majority of runs. This is a deterministic structural pattern across both tactic modes, not a stochastic mean effect.

The pre-Oracle planner applied a fire/damage round immediately in its first simulated hour, so its h0→h6 window contained six firing opportunities. The executable evidence shows the controlled O1 h0→h6 window has a one-hour startup interval with no damage, leaving five firing opportunities.

The narrow timing conclusion is classified **`oracle-validated`**:

`initialFireDelayHours = 1`

This classification applies only to the controlled O1 combat-entry timing boundary. Hit probability, combat-point scaling, organization/strength dice, modifier ordering, and broader combat scenarios remain `unvalidated`.

The Oracle validation branch now sources this value from `src/builtin1193/oracle-combat-certification-1193.js` and the planner simulator skips damage during the initial hour. Production `main` is unchanged.

### Bounded O1-base strength comparison after the timing correction

The O1 comparator is now deliberately a **bounded sensitivity comparison**, not a single-point parity test.

Controlled O1 facts preserved separately from the UI-derived inputs:

- exact saved composition: 9 infantry, no support
- width 18, HP 225, manpower 9,000
- shared underlying base Soft Attack: **54.0**
- matched experience modifier: **+25%**
- full supply, zero planning, zero entrenchment
- Plains, daylight, no commanders, no air/CAS
- Oracle-validated one-hour initial fire delay

The retained pre-neutralization combat-panel observations remain approximately:

- GER Soft Attack: 75
- POL Soft Attack: 73
- GER Breakthrough: 35
- POL Defense: 255

The comparator no longer treats those displayed integers as exact neutral-harness state. It applies a deliberately conservative ±1 sensitivity band around each retained UI value. For Soft Attack, it then removes the known vanilla Basic Attack / Basic Defend +5% tactic-side modifier before running the neutral O1-base planner model.

Current neutral Soft Attack sensitivity ranges are therefore approximately:

- GER: **70.4762–72.3810**
- POL: **68.5714–70.4762**
- GER Breakthrough sensitivity: **34–36**
- POL Defense sensitivity: **254–256**

Relative to the controlled 54 × 1.25 = 67.5 Soft Attack after experience, the remaining effective multiplier represented by those bounded UI observations is approximately:

- GER: **1.0441–1.0723**
- POL: **1.0159–1.0441**

These residuals are descriptive only; they are **not** promoted as exact country/doctrine modifier ordering.

Across the complete sensitivity envelope, the hit-regime classification does not change:

- GER attack remains below POL defense, so all German attack points remain in the defended regime;
- POL attack remains above GER breakthrough, so Polish attack retains an undefended excess.

This threshold statement is `planner analytical`. It does not validate `combatPointScale`, stochastic rounding, hit probability, or damage dice.

The updated comparator now reports, for each side:

- mean and sample SD;
- minimum / maximum;
- 5th, 25th, 50th, 75th, and 95th percentiles;
- zero-strength-loss probability;
- low / midpoint / high UI-input sensitivity cases;
- the historical no-startup-delay midpoint for comparison.

The executable input remains the **10-run** tactic-neutralized sample. Its means remain:

- GER strength loss: **0.3059 pp**
- POL strength loss: **0.10285 pp**

Earlier point estimates showed that correcting the startup delay materially reduced the planner's over-prediction. That result remains useful diagnostic evidence, but the previous “planner mean falls inside the executable mean CI” framing is retired as a validation criterion.

**No CI overlap or sensitivity-envelope overlap in this report is an Oracle pass/fail criterion.**

The remaining base hit/damage formulas stay `unvalidated`. Organization comparison also remains deferred until final executable organization/doctrine state is established.

### 100k bounded planner diagnostic — residual point-mean gap

A full planner Monte Carlo diagnostic was run in CI at **100,000 trials per sensitivity point** using the bounded O1-base inputs above. The compact result is persisted in:

`oracle-lab/captures/o1-base-planner-100k-bounded-summary.json`

Planner strength-loss mean sensitivity:

- GER/attacker loss: **0.33237–0.35952 pp**, midpoint **0.34578 pp**
- POL/defender loss: **0.14091–0.14440 pp**, midpoint **0.14263 pp**

Executable 10-run point means:

- GER/attacker loss: **0.30590 pp**
- POL/defender loss: **0.10285 pp**

Therefore both executable point means are below the entire current planner input-sensitivity envelope.

At the midpoint:

- GER planner minus executable: **+0.03988 pp** (**+13.0%** relative to the executable point mean)
- POL planner minus executable: **+0.03978 pp** (**+38.7%** relative to the executable point mean)

At the most damage-reducing edge of the current UI-input envelope, the planner is still above the executable point mean by:

- GER: **+0.02647 pp**
- POL: **+0.03806 pp**

This is a meaningful diagnostic signal, but **not** an `oracle-divergent` classification. The executable distribution is still only n=10, and its exploratory mean intervals remain wide enough to overlap the current planner means.

The important methodological conclusion is narrower: **the existing ±1 displayed-stat uncertainty cannot by itself explain the current point-mean gap, especially for POL strength loss.** The next high-value work is to isolate the base resolver rather than spend another cycle refining only tooltip rounding.

The current source/model chain for ordinary soft strength damage is:

- attack / 10 combat-point scaling: `executable inferred` carried from 1.19.2
- defended hit chance: 10% from `game-file exact` defines
- undefended hit chance: 40% from `game-file exact` defines
- strength die size: 2 from `game-file exact` defines
- strength damage modifier: 0.060 from `game-file exact` defines
- exact stochastic rounding / hit / damage ordering: `unvalidated`

For the GER→POL fully defended path, these assumptions analytically reproduce the planner Monte Carlo mean near 0.143 pp. The executable pilot mean near 0.103 pp therefore points directly at either finite-sample noise or one/more of the executable-inferred/hardcoded ordering assumptions.

No resolver constant is changed on this evidence alone.


### O2 defended-path amplified probe — PREDECLARED / NOT YET EXECUTABLE-RUN

The O1 100k result makes another large batch of the same low-damage scenario a poor next experiment. O2 is designed to amplify only the already-fully-defended GER→POL path while preserving the established daylight baseline and neutral tactic control.

O2 scenario:

`o2-defended-amplified-v1`

Oracle commands:

- `d_oracle_o2_prepare`
- `d_oracle_o2_trial6`
- emergency/manual cleanup: `d_oracle_o2_clear`

O2 uses a temporary dynamic modifier on GER:

`army_infantry_attack_factor = 2.0`

This is **+200% infantry attack only**. The O2 modifier does not intentionally alter defense, breakthrough, organization, HP, supply, planning, entrenchment, or damage modifiers. The helper force-updates the dynamic modifier, and the hour-6 event removes it automatically.

The expected purpose is to raise GER effective attack to roughly three times the neutral O1 level while keeping it below POL defense. Exact executable effective values are **not assumed** from modifier arithmetic: the paused battle UI must be captured and those directly observed values become the O2 planner inputs.

The originally considered 12-hour version was rejected before executable use because the exact 11:00 baseline would run into night. O2 therefore retains the established **11:00→17:00 six-hour window**, preserving the O1 daylight control while obtaining approximately three times as many defended attack points per firing hour.

#### O2 run acceptance controls

An O2 trace is accepted only if all of the following hold:

1. exact clean 11:00 baseline save;
2. neutral tactic Oracle build active;
3. `d_oracle_o2_prepare` executed before combat creation;
4. built-in `random_seed` executed before the attack for independent repeated trials;
5. the GER attack is issued while paused, then the paused combat panel is captured **before** starting the O2 sampler;
6. same one-GER-vs-one-POL, 18-width, Plains battle;
7. no commanders, no reserves, full starting supply, zero planning, zero POL entrenchment;
8. paused combat-panel capture records GER Soft Attack, GER Breakthrough, POL Soft Attack, and POL Defense under O2;
9. displayed GER Soft Attack is materially amplified and remains at least 10 points below displayed POL Defense;
10. WPO2 samples are exactly hours 0..6 with one attacker and one defender each;
11. h0 is effectively 100% organization/strength within the existing bisection measurement bound;
12. h0→h1 shows no measurable organization or strength change on either side, preserving the Oracle-validated one-hour startup-delay control used by the planner reference;
13. END is exactly `hour=6 reason=trial6-complete amplifierRemoved=yes`;
14. start/end remain 11:00→17:00.

The O2 prepare helper now verifies the dynamic modifier is actually present before setting the prepared flag. The trial helper requires both that flag and live modifier presence, so `prepared=yes amplifierPresent=yes` is only emitted after an executable-side presence check. At hour 6, cleanup removes the modifier and then re-checks it; `amplifierRemoved=yes cleanupFailure=no` is emitted only when the modifier is actually absent.

The O2 parser treats every WPO2 `BEGIN` as a candidate and machine-enforces the schema/version, base-checksum scope, bisection method, scenario, run mode, tactic mode, amplifier identity, `prepared=yes`, one-attacker/one-defender cardinality, exact 0..6 sample sequence, fresh h0 bounds, no measurable h0→h1 damage, exact END hour/reason, duplicate-trace detection, and confirmed amplifier cleanup. Malformed WPO2 runs therefore become explicit rejections instead of disappearing from the candidate set.

Parser acceptance is **necessary but not sufficient** for scenario acceptance. The combat-panel values, exact 11:00→17:00 daylight timing, Plains terrain, supply/planning/entrenchment state, commanders/reserves, and actual use of `random_seed` remain external controls that must be checked from the executable evidence.

If GER attack approaches/crosses the defended threshold, the trace is rejected for this O2 purpose rather than reinterpreted after the fact.

#### O2 primary metric

Primary metric:

**POL defender h0→h6 strength loss**

GER loss is retained as diagnostic context but is not the primary O2 resolver test because POL→GER remains a mixed defended/undefended path.

The planner reference script is:

`scripts/oracle-o2-planner-reference.mjs`

The predeclared assessment command is:

`scripts/oracle-o2-assess.mjs`

After an executable batch exists, this command takes the WPO2 log plus the four directly observed O2 combat-panel values, runs the exact parser/reference, and mechanically applies the staged decision rule. It refuses to treat duplicate/rejected traces as a valid independent batch, requires the ≥10-point defended margin, and keeps `evidenceStatus='unvalidated'` even when an interval is missed or included. A 12-run miss is reported only as a `confirmatory-mismatch-candidate` until the external scenario controls are reviewed.

It takes the directly observed O2 combat-panel values:

`<GER Soft Attack> <GER Breakthrough> <POL Soft Attack> <POL Defense>`

and runs the current planner over the same six-hour / one-hour-startup-delay scenario. The ±1 display sensitivity is evaluated at the midpoint **and all 16 corners** of the four-input uncertainty box rather than only along one low/high diagonal.

Evidence classes:

- observed executable combat-panel inputs: `executable inferred`
- planner O2 distribution/reference: `planner analytical`
- O2 resolver status before executable collection: `unvalidated`

#### O2 predeclared sample plan

The first valid O2 run is a harness/executable smoke. It may also be retained as statistical trial 1 if every acceptance control above passes, but it cannot establish a formula result by itself.

Preliminary target:

**6 unique O2 traces**

Confirmatory target, only when needed:

**12 unique O2 traces total**

The planner reference precomputes conservative **empirical** sample-mean intervals for the primary metric: **95% at the six-run preliminary stage** and **99% at the 12-run confirmatory stage**. At each stage it bootstraps sample means directly from the planner Monte Carlo distribution for all 17 sensitivity points (midpoint plus all 16 corners) and takes the union across the full input box. This replaces the earlier small-n normal approximation before any O2 executable result is observed.

The comparison interval is then widened for the known bisection14 measurement uncertainty. One organization/strength midpoint has maximum error about **±0.0030518 percentage points**; an h0→h6 loss formed from two midpoints therefore has a conservative maximum midpoint error of **±0.0061035 percentage points**. The predeclared O2 decision bounds include that full loss-delta allowance and do not shrink it with sample size.

Predeclared interpretation:

- If the six-run executable mean falls **outside** the measurement-adjusted conservative empirical planner 95% sample-mean interval, collect six more independent O2 runs before any divergence classification.
- If the 12-run executable mean remains outside the measurement-adjusted conservative empirical planner 99% sample-mean interval, treat that as confirmatory evidence of a material O2 resolver mismatch, subject to final scenario-control review before assigning a narrow `oracle-divergent` classification.
- If the executable mean falls inside the planner interval, O2 remains `unvalidated`; interval inclusion is **not** an `oracle-validated` criterion.

This stopping rule and its machine assessment implementation are declared before seeing any O2 executable loss result.

#### O2 preliminary six-run result

The first accepted O2 smoke plus five additional independent runs produced **6 unique accepted traces**, with no parser rejections and no exact duplicate traces. Every run retained the one-hour no-damage startup control and confirmed amplifier cleanup.

The executable combat-panel state was stable across the screenshots:

- GER Soft Attack **215**
- GER Breakthrough **35**
- POL Soft Attack **69**
- POL Defense **255**
- defended margin: **40 points**

The six-run primary metric, POL/defender strength loss over h0→h6, was:

- mean: **0.4035 percentage points**
- sample SD: **0.0553245**
- minimum: **0.3185**
- maximum: **0.4585**

The predeclared planner assessment used 100,000 Monte Carlo runs at each of the 17 input-sensitivity points and 50,000 bootstrap sample-mean replicates per point. The resulting preliminary **95% measurement-adjusted interval** was:

- **0.3183409–0.5483257 percentage points**

The planner midpoint mean was **0.4301827 pp**; the full ±1 input sensitivity moved the planner mean only from **0.4269989 to 0.4324157 pp**.

The observed executable mean **0.4035 pp is inside the predeclared 95% interval**. Therefore the machine action is:

`no-preliminary-mismatch-trigger`

Under the declared staged rule, **do not collect runs 7–12**. O2 remains `unvalidated`: interval inclusion is not validation and does not promote the remaining hit/damage resolver. It means only that this amplified fully-defended probe did not produce the material mismatch required to escalate to the 12-run confirmatory stage.

Assessment provenance:

- planner/evidence source SHA: `8708283abcdff806de99bd8b7086eea0d72f9536`
- GitHub Actions run: `35407901759` (#223), success
- persisted result: `oracle-lab/captures/o2-defended-amplified-preliminary-6-assessment.json`


O2 does not modify production `main` and does not supersede the O1 timing certification.


### O3 sub-10 defended-incidence probe — PREDECLARED / NOT YET EXECUTABLE-RUN

O2 did not trigger a material mismatch, so O3 changes the question rather than collecting more of the same O2 signal. O3 isolates a narrow gate in the remaining resolver uncertainty: **can a fully defended displayed GER Soft Attack below 10 still transmit any measurable POL strength damage?**

Scenario: o3-sub10-defended-incidence-v1

Oracle commands:

- d_oracle_o3_prepare
- d_oracle_o3_trial6
- emergency/manual cleanup: d_oracle_o3_clear

The temporary GER-only modifier is army_infantry_attack_factor = -0.89.

The modifier intentionally changes infantry attack only. It must not alter defense, breakthrough, organization, HP, supply, planning, entrenchment, or damage modifiers. Exact executable effective values are not inferred from modifier arithmetic: the paused combat panel remains authoritative.

#### O3 acceptance boundary

An O3 run is accepted only when the existing controlled O1/O2 conditions remain intact and the paused combat panel shows:

- displayed GER Soft Attack **7 or 8**;
- displayed GER Soft Attack at least 10 points below displayed POL Defense;
- one GER division vs one POL division;
- width 18 each;
- Plains;
- no commanders;
- no reserves;
- full starting supply;
- zero planning;
- zero POL entrenchment;
- neutral tactic harness active;
- exact 11:00→17:00 window;
- random_seed executed before the attack;
- WPO3 samples exactly h0..h6;
- h0→h1 shows no measurable damage;
- successful automatic attenuator cleanup at h6.

The displayed-stat acceptance of 7–8 preserves the conservative ±1 UI uncertainty entirely below 10: an accepted displayed 7 maps to a 6–8 sensitivity band and an accepted displayed 8 maps to 7–9.

#### O3 primary metric

Primary metric:

**number of accepted runs with any measurable POL defender strength damage after h1**

Damage incidence is detected conservatively from the raw bisection bounds:

h6 defender strengthHigh < h1 defender strengthLow

This is intentionally a binary incidence test rather than a loss-magnitude comparison.

The current planner hypothesis being probed is:

- combat-point scale: 0.1 (executable inferred, carried from 1.19.2);
- attack-point integerization: stochastic rounding before hit resolution (unvalidated);
- defended hit chance: 10% from game-file exact 1.19.3 defines;
- one-hour initial fire delay: oracle-validated.

A simple competing gate model is floor(SoftAttack / 10).

If true Soft Attack stays below 10, that simple floor model yields zero GER attack points and therefore predicts zero POL strength damage throughout O3.

Positive O3 damage therefore has a sharp interpretation: it contradicts that simple floor-zero transmission model at this controlled boundary. It does **not** uniquely establish stochastic rounding, because other non-floor executable mechanisms could also transmit sub-10 attack.

An all-zero O3 result is weaker: zero observed strength damage could arise from attack-point integerization, hit RNG, or downstream executable damage handling. Therefore an all-zero result is interpreted only against the complete current planner hypothesis, not as proof of a particular alternative formula.

#### O3 exact planner incidence reference

For the current planner model, five firing hours remain after the Oracle-validated startup interval. For displayed GER Soft Attack 8 with the same ±1 sensitivity used elsewhere, the exact current-model probability of at least one POL strength-damage event per six-hour run is:

- Soft Attack 7: about **30.43%**
- Soft Attack 8: about **34.09%**
- Soft Attack 9: about **37.60%**

Corresponding all-zero batch probabilities:

- six runs, worst sensitivity edge: about **11.34%**
- ten runs, worst sensitivity edge: about **2.66%**

For an accepted displayed Soft Attack of 7, the lower sensitivity edge is 6; the ten-run all-zero probability remains below 5%.

These values are computed analytically from the current planner's stochastic-rounding + defended-hit process rather than by Monte Carlo.

#### O3 predeclared staged rule

Preliminary stage:

**6 unique accepted runs**

- If **any** accepted run shows measurable POL strength damage, stop. The simple floor-after-/10 zero-transmission hypothesis is contradicted for O3. O3 remains unvalidated; do not promote stochastic rounding or the broad resolver.
- If all six accepted runs show zero POL strength damage, collect exactly **4 more** independent runs.

Confirmatory stage:

**10 unique accepted runs total**

- If any of the ten accepted runs shows measurable POL strength damage, stop with the same narrow floor-zero contradiction; O3 remains unvalidated.
- If all ten accepted runs show zero POL strength damage, create a **narrow mismatch candidate** against the current stochastic-rounding planner hypothesis because the predeclared worst-case all-zero probability across the accepted displayed-stat sensitivity is below 5%.
- A ten-run all-zero result is **not automatically oracle-divergent**. Every external scenario control must be reviewed first, and the result does not by itself identify which downstream executable step differs.

O3 is not a validation criterion for the entire hit/damage resolver. Its purpose is to eliminate or retain one high-value class of integerization/transmission behavior with substantially more information per user-run than repeating O1 or O2.


#### O3 smoke 001 — EARLY POSITIVE INCIDENCE / STOP

The first executable O3 smoke satisfied the intended sub-10 displayed-attack regime:

- GER Soft Attack: **7**
- GER Hard Attack: **1**
- GER Breakthrough: **35**
- POL Soft Attack: **69**
- POL Hard Attack: **11**
- POL Defense: **255**
- one division per side
- width 18 per side
- no commanders
- zero reserves

The WPO3 trace was complete and machine-clean:

- prepared attenuator present;
- exact samples h0..h6;
- h0→h1 unchanged on both sides;
- END at hour 6;
- attenuator removed;
- cleanupFailure=no.

POL defender strength remained unchanged through h5, then showed a strict bound-separated loss at h6:

- h1 defender strength bounds: **0.99993–1.00000**
- h6 defender strength bounds: **0.99975–0.99981**
- strict lower-vs-upper separation: **0.012 percentage points**
- midpoint h0→h6 defender strength loss: **0.0185 pp**

Therefore the predeclared O3 binary incidence metric is positive on run 1.

Machine interpretation:

`stop-floor-zero-hypothesis-contradicted`

This is a high-information result. With displayed GER Soft Attack 7 and the full ±1 display sensitivity remaining below 10, a simple `floor(SoftAttack/10)` gate predicts zero GER combat points and therefore zero POL strength damage. The executable produced measurable POL strength damage, so that simple zero-transmission floor hypothesis is contradicted at the controlled O3 boundary.

Under the predeclared stopping rule, **do not collect O3 runs 2–6 or 7–10**. O3 remains `unvalidated`; this positive result does **not** uniquely establish the planner's stochastic-rounding implementation and does not validate the broad hit/damage resolver.

Persisted evidence:

- `oracle-lab/captures/o3-sub10-smoke-001-wpo3.log.txt`
- `oracle-lab/captures/o3-sub10-smoke-001-summary.json`
- `oracle-lab/captures/o3-sub10-smoke-001-assessment.json`


## Promotion rule

O1 may move from `unvalidated` only after:

1. repeated clean executable trials establish a stable distribution;
2. the same controlled scenario is represented in the current 1.19.3 planner;
3. planner Monte Carlo output is compared at the distribution level;
4. uncertainty/tolerances are declared before promotion;
5. counterexample testing does not expose a material mismatch.

A passing result becomes `oracle-validated`; a reproducible material mismatch becomes `oracle-divergent`.
