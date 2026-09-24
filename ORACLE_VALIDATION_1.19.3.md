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

#### Combat-panel capture timing correction

HOI4 does not expose the combat panel while the attack order is still only pending under pause. The battle must first instantiate after unpausing. Therefore the correct Oracle panel-capture sequence is:

1. prepare the scenario and run `random_seed` while paused;
2. issue the attack while paused;
3. start the Oracle trial while still paused, recording h0;
4. unpause only until the battle instantiates;
5. pause immediately when the combat panel becomes available, no later than h1;
6. capture the combat panel;
7. resume through h6.

This does not weaken the controlled stat observation because h0 and h1 are separately Oracle-validated as unchanged. The panel may therefore be captured as soon as combat exists, including at the h1 boundary, provided the game is paused before advancing into the h1→h2 firing interval. Historical O2/O3 screenshots collected this way remain usable; wording that required a panel screenshot before the sampler started was procedurally impossible and is superseded by this correction.

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

The expected purpose is to raise GER effective attack to roughly three times the neutral O1 level while keeping it below POL defense. Exact executable effective values are **not assumed** from modifier arithmetic: the battle UI must be captured immediately after combat instantiates, after combat instantiates, no later than h1 and before the h1→h2 firing interval, and those directly observed values become the O2 planner inputs.

The originally considered 12-hour version was rejected before executable use because the exact 11:00 baseline would run into night. O2 therefore retains the established **11:00→17:00 six-hour window**, preserving the O1 daylight control while obtaining approximately three times as many defended attack points per firing hour.

#### O2 run acceptance controls

An O2 trace is accepted only if all of the following hold:

1. exact clean 11:00 baseline save;
2. neutral tactic Oracle build active;
3. `d_oracle_o2_prepare` executed before combat creation;
4. built-in `random_seed` executed before the attack for independent repeated trials;
5. the GER attack is issued while paused, then `d_oracle_o2_trial6` is started while still paused; after unpausing just long enough for combat to instantiate, the game is paused again no later than h1 and the combat panel is captured before advancing into the h1→h2 firing interval;
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

An O3 run is accepted only when the existing controlled O1/O2 conditions remain intact and the combat panel, captured after the trial has started and combat has instantiated, no later than h1 and before the h1→h2 firing interval, shows:

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


### O4 low-attack undefended incidence probe — PREDECLARED / NOT YET EXECUTABLE-RUN

O3 established that a conservatively sub-10 displayed GER Soft Attack can transmit measurable POL damage, contradicting the simple floor(SoftAttack/10) zero-transmission model at that controlled boundary. O4 now targets a different competing integerization behavior: **does any positive sub-10 attack effectively receive a minimum one full attack point every firing hour, or does transmission frequency continue to scale fractionally with attack magnitude as in the current planner?**

Scenario:

`o4-sub10-undefended-incidence-v1`

The O4 harness creates a one-way diagnostic regime by:

- attenuating GER infantry attack to target displayed Soft Attack **2**;
- suppressing POL infantry defense to target displayed Defense **0**;
- leaving GER Breakthrough, POL Soft Attack, organization, HP, supply, planning, entrenchment, tactics, and damage modifiers otherwise untouched.

Exact executable panel values remain authoritative. Modifier arithmetic is not treated as evidence.

Target dynamic modifiers:

- GER: `army_infantry_attack_factor = -0.97`
- POL: `army_infantry_defence_factor = -1.04`

#### O4 acceptance boundary

An O4 run is accepted only when all of the existing O1/O2/O3 controls remain intact and the combat panel, captured after the trial has started and combat has instantiated, no later than h1 and before the h1→h2 firing interval, shows:

- GER displayed Soft Attack exactly **2**;
- POL displayed Defense exactly **0**;
- GER Soft Attack > POL Defense, so every generated GER attack point is in the undefended hit regime;
- one GER division vs one POL division;
- width 18 each;
- Plains;
- no commanders;
- zero reserves;
- full starting supply;
- zero planning;
- zero POL entrenchment;
- neutral tactic harness active;
- exact 11:00→17:00 window;
- `random_seed` executed before the attack;
- WPO4 samples exactly h0..h6;
- h0→h1 shows no measurable damage;
- both temporary O4 modifiers are removed successfully at h6.

If the screenshot does not show exactly GER Soft Attack 2 and POL Defense 0, the smoke is rejected for O4 and no statistical batch is collected until the modifiers are retuned.

#### O4 primary metric

The primary metric is the number of **post-startup firing intervals with any measurable POL defender damage** across the accepted batch.

There are five firing intervals per six-hour run:

- h1→h2
- h2→h3
- h3→h4
- h4→h5
- h5→h6

An interval counts positive when either organization or strength shows strict raw-bound separation:

- current defender orgHigh < previous defender orgLow, or
- current defender strengthHigh < previous defender strengthLow.

Using either organization or strength makes the hit-incidence detector robust to small strength-display changes while remaining conservative against bisection overlap.

#### O4 competing hypotheses

Current planner hypothesis:

- combat-point scale 0.1;
- attack points are stochastically rounded before hit resolution;
- undefended hit chance is 40% from `game-file exact` 1.19.3 defines;
- displayed Soft Attack 2 is treated with the same conservative ±1 uncertainty used elsewhere.

Across true Soft Attack 1–3, the planner predicts per-firing-hour POL damage incidence of approximately:

- attack 1: **4%**
- attack 2: **8%**
- attack 3: **12%**

Competing minimum-one-point hypothesis:

- any positive sub-10 attack produces one full attack point every firing hour;
- with POL Defense 0, that point uses the 40% undefended hit chance;
- predicted per-firing-hour damage incidence: **40%**.

This O4 test is intentionally about incidence frequency, not damage magnitude.

#### O4 fixed sample and predeclared decision rule

Collect exactly:

**4 unique accepted O4 runs**

That yields **20 post-startup firing intervals**.

Let K be the number of intervals with measurable POL defender damage.

Predeclared interpretation:

- **K ≤ 3:** create a narrow mismatch candidate against the minimum-one-point hypothesis. Under p=0.40, P(K≤3 | n=20) ≈ **1.60%**. Under the current planner sensitivity p=0.04–0.12, the same outcome remains common; even at p=0.12, P(K≤3) ≈ **78.73%**.
- **K = 4 or 5:** O4 is inconclusive between these hypotheses; stop at four runs and design a different experiment rather than extending the batch after seeing the result.
- **K ≥ 6:** create a narrow mismatch candidate against the current stochastic-rounding planner hypothesis. At the most damage-favoring planner sensitivity p=0.12, P(K≥6 | n=20) ≈ **2.60%**.
- No O4 outcome alone promotes the broad resolver to `oracle-validated`.
- Any mismatch candidate remains `unvalidated` until every external scenario control is reviewed.

The first O4 run is a smoke and may count as run 1 only if all controls pass. If it passes, collect exactly three more accepted runs; do not change the four-run target after observing the smoke result.

#### O4 tuning smoke 001 — REJECTED / RETUNE ONLY

The first O4 executable smoke successfully hit the GER attack target but did **not** reach the predeclared undefended-defense target:

- GER Soft Attack: **2**
- GER Hard Attack: **0**
- GER Breakthrough: **35**
- POL Soft Attack: **69**
- POL Hard Attack: **11**
- POL Defense: **8**
- one division per side, width 18 each, no commanders, zero reserves

The WPO4 trace itself was structurally clean: exact h0..h6 sampling, h0→h1 no-damage, successful completion, both modifiers removed, and `cleanupFailure=no`. POL took no measurable damage across the five firing intervals.

This trace is **rejected from the O4 statistical batch** because POL Defense was 8 rather than the predeclared 0. The observed zero damage is therefore not used in the O4 decision statistic.

Tuning action only:

- previous POL suppressor: `army_infantry_defence_factor = -1.00`
- baseline POL Defense: 255
- residual displayed Defense: 8 (about 3.14% of baseline)
- next POL suppressor: `army_infantry_defence_factor = -1.04`

This retune does not alter the predeclared O4 scenario, primary metric, four-run sample size, or K thresholds. A new tuning smoke must again show exactly GER Soft Attack 2 and POL Defense 0 before any run is accepted.

Persisted rejected evidence:

- `oracle-lab/captures/o4-tuning-smoke-001-wpo4.log.txt`
- `oracle-lab/captures/o4-tuning-smoke-001-summary.json`


### O4 v1 zero-defense design — RETIRED BEFORE ANY ACCEPTED RUN

The dynamic-defense suppression path cannot reach literal zero Defense in the controlled baseline. During O4 tuning, the executable UI exposed:

- underlying/base POL Defense: **198**
- Experience modifier: **+25%**
- country modifier after the O4 suppressor: approximately **-100.7%**
- final modifier shown as **1.00%**
- resulting effective Defense: approximately **1.98** (tooltip about **1.9**, combat panel rounded to **1**)

The exact numerical relationship `198 × 1.00% = 1.98` strongly indicates a minimum **1% final-stat modifier floor** on this modifier path. This is retained as an `executable inferred` tuning observation, not promoted to `oracle-validated` from one UI observation.

Consequences:

- the original O4 requirement `POL Defense = 0` is not reachable through additional negative `army_infantry_defence_factor`;
- the earlier O4 tuning traces remain rejected and contribute no statistical O4 result;
- no accepted O4 v1 run exists;
- further defense-factor retuning is stopped.

Because retaining Defense ~1.98 would introduce a second integerization unknown for defense points, O4 v1 is superseded rather than reinterpreted.

### O4 v2 guaranteed-hit sub-10 probe — PREDECLARED / NOT YET EXECUTABLE-RUN

Scenario:

`o4-guaranteed-hit-sub10-v2`

O4 v2 isolates attack-point integerization by eliminating defended-hit RNG while restoring POL to its normal high Defense.

Oracle-only diagnostic define intervention:

`NDefines.NMilitary.BASE_CHANCE_TO_AVOID_HIT = 0`

This changes the source-defined defended hit chance from 10% to **100%** for the O4 v2 diagnostic package only. The intervention is deliberate and is not a claim about vanilla balance. It must be removed after O4 v2 before any ordinary Oracle scenario is run.

The executable application of this override is not assumed merely because the file loads. O4 v2 therefore contains a separate control run before the low-attack probe.

#### O4 v2 control run

The control uses:

- normal high POL Defense;
- GER displayed Soft Attack accepted only in the range **10–19**;
- five post-startup firing intervals;
- neutral tactics and all established baseline controls.

At Soft Attack 10–19, all candidate integerization mechanisms under examination produce at least one attack point per firing hour. With the O4 v2 defended-hit override active, every firing interval must therefore show measurable POL damage.

Control acceptance requires:

**5 of 5 positive defender-damage intervals**

If the control is not 5/5, O4 v2 is invalid and the low-attack probe is not interpreted.

As a diagnostic cross-check, without the 100% hit override even two defended attack points at the vanilla 10% hit chance would yield at most a 19% interval-hit probability; five positive intervals would then have probability only about **0.025%**. Thus a clean 5/5 control is strong executable evidence that the diagnostic intervention is active.

#### O4 v2 probe run

After reloading the clean baseline, the probe uses:

- normal high POL Defense;
- GER displayed Soft Attack exactly **2**;
- five post-startup firing intervals;
- the same 100% defended-hit diagnostic define;
- the same neutral tactics, timing, terrain, supply, planning, commander, reserve, and `random_seed` controls.

The panel is captured only after the trial has started and combat has instantiated, no later than h1 and before advancing into h1→h2.

Primary probe metric:

**K = number of the five firing intervals with any measurable POL organization or strength damage**

An interval is positive only with strict raw-bound separation between consecutive bisection samples.

#### O4 v2 competing hypotheses and fixed decision rule

Current planner hypothesis:

- combat-point scale = 0.1;
- attack points are stochastically rounded;
- with displayed Soft Attack 2 and the existing ±1 display sensitivity, true Soft Attack is bounded 1–3;
- because defended hit chance is forced to 100%, predicted positive-interval probability is therefore **10%–30%**.

Competing minimum-one / ceiling-style sub-10 hypothesis:

- any positive sub-10 Soft Attack produces at least one attack point every firing hour;
- with defended hit chance forced to 100%, predicted positive-interval probability is **100%**.

Predeclared interpretation, conditional on a valid 5/5 control:

- **Probe K ≤ 4:** the minimum-one/ceiling-style hypothesis is contradicted at this controlled boundary. O4 remains `unvalidated`; this does not by itself validate the planner's exact stochastic-rounding implementation.
- **Probe K = 5:** create a narrow mismatch candidate against the current stochastic-rounding planner hypothesis. Even at the most damage-favoring sensitivity edge p=0.30, `P(K=5)=0.30^5=0.243%`.
- No adaptive extension is permitted after seeing the probe. One valid control plus one valid probe completes O4 v2.
- No O4 v2 outcome alone promotes the broad resolver to `oracle-validated`.

This revised O4 protocol is declared after the zero-defense tuning failure but before any accepted O4 statistical result.


#### O4 v2 control 001 — PASS

The guaranteed-hit control run satisfied the predeclared executable conditions.

Observed live combat-panel values (reported during the run; no screenshot retained):

- GER Soft Attack: **11**
- POL Defense: **255**

The WPO4V2 trace is structurally clean:

- exact h0..h6 samples;
- h0→h1 unchanged;
- `defineOverride=BASE_CHANCE_TO_AVOID_HIT:0`;
- successful completion at h6;
- attack modifier removed;
- `cleanupFailure=no`.

All five post-startup firing intervals show strict measurable POL defender damage:

- h1→h2: positive
- h2→h3: positive
- h3→h4: positive
- h4→h5: positive
- h5→h6: positive

Therefore the control result is **5/5 positive intervals**, satisfying the predeclared O4 v2 control gate.

This is strong executable evidence that the O4 v2 defended-hit intervention is active in the controlled scenario. The lack of a retained screenshot does not block the control decision because the reported panel values are inside the predeclared acceptance region and the 5/5 interval behavior independently provides a strong intervention cross-check. The panel values are retained as user-reported executable observations rather than screenshot-verified observations.

Next step: collect exactly **one** O4 v2 probe run at displayed GER Soft Attack **2**, with normal/high POL Defense. No additional control runs are required.

Persisted evidence:

- `oracle-lab/captures/o4v2-control-001-wpo4v2.log.txt`
- `oracle-lab/captures/o4v2-control-001-summary.json`


#### O4 v2 probe 001 — COMPLETE / MINIMUM-ONE HYPOTHESIS CONTRADICTED

The single predeclared O4 v2 probe run hit the target panel exactly:

- GER Soft Attack: **2**
- GER Hard Attack: **0**
- GER Breakthrough: **35**
- POL Soft Attack: **69**
- POL Hard Attack: **11**
- POL Defense: **255**

The WPO4V2 trace is structurally clean:

- exact h0..h6 samples;
- h0→h1 unchanged;
- `defineOverride=BASE_CHANCE_TO_AVOID_HIT:0`;
- successful completion at h6;
- attack modifier removed;
- `cleanupFailure=no`.

Post-startup POL defender-damage incidence:

- h1→h2: **no**
- h2→h3: **no**
- h3→h4: **yes**
- h4→h5: **no**
- h5→h6: **no**

Therefore the probe statistic is:

**K = 1 positive interval out of 5**

The predeclared O4 v2 control had already produced **5/5 positive intervals** at GER Soft Attack 11 / POL Defense 255 under the same diagnostic define override. That control established that the intervention is active strongly enough for the probe interpretation.

Machine action:

`minimum-one-hypothesis-contradicted`

A minimum-one / ceiling-style mechanism in which any positive sub-10 attack always receives at least one full attack point per firing hour predicts 5/5 positive intervals when defended hit chance is forced to 100%. The executable probe instead produced four zero-damage intervals, so that hypothesis is contradicted at the controlled O4 v2 boundary.

The current planner's stochastic-rounding hypothesis remains `unvalidated`. With displayed Soft Attack 2 and the retained ±1 displayed-stat uncertainty, the planner predicts a positive-interval probability of approximately 10%–30%; K=1/5 is compatible with that range, but compatibility is not a validation criterion.

Combined with O3:

- O3 contradicted simple `floor(SoftAttack/10)` zero transmission below 10;
- O4 v2 contradicted minimum-one / ceiling-style guaranteed transmission below 10.

The surviving mechanism class is therefore narrower: sub-10 attack transmission is **fractional/stochastic rather than deterministic zero or deterministic one-per-hour**. Exact stochastic-rounding placement and downstream ordering remain unresolved.

Persisted evidence:

- `oracle-lab/captures/o4v2-probe-001-wpo4v2.log.txt`
- `oracle-lab/captures/o4v2-probe-001-summary.json`
- `oracle-lab/captures/o4v2-complete-assessment.json`


### O5 fixed-damage discrete-multiplicity probe — PREDECLARED / NOT YET EXECUTABLE-RUN

O3 and O4 v2 narrow sub-10 transmission to a fractional/stochastic mechanism, but they do not establish where the discreteness occurs. O5 removes the remaining source-defined hit/damage randomness so the number of effective attack points can be observed through fixed organization-damage increments.

Scenario:

`o5-fixed-damage-integerization-v1`

O5 is an Oracle-only diagnostic package. It intentionally overrides:

- `NDefines.NMilitary.BASE_CHANCE_TO_AVOID_HIT = 0` — defended hit chance 100%;
- `NDefines.NMilitary.LAND_COMBAT_ORG_DICE_SIZE = 1`;
- `NDefines.NMilitary.LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE = 1`;
- `NDefines.NMilitary.LAND_COMBAT_STR_DAMAGE_MODIFIER = 0` — removes strength feedback;
- `NDefines.NMilitary.BASE_NIGHT_ATTACK_PENALTY = 0` — preserves the same attack regime after sunset.

These interventions are diagnostic only and must not be used for ordinary O1/O2/O3/O4 scenarios.

#### O5 panel and trace target

GER infantry attack is attenuated with:

`army_infantry_attack_factor = -0.79`

The executable panel is authoritative. An O5 run is accepted only if, after combat instantiates and no later than h1:

- displayed GER Soft Attack is **14–16 inclusive**;
- POL Defense remains high, at least **200**;
- GER attack remains fully defended;
- one GER division vs one POL division;
- width 18 each;
- no commanders and zero reserves;
- neutral tactics remain active.

O5 starts at the same 11:00 baseline. It records h0..h11, yielding the Oracle-validated h0→h1 startup interval plus exactly **10 firing intervals**. The night-penalty diagnostic override allows this single run to continue past sunset without changing the intended attack regime.

#### O5 acceptance checks

The run is machine-acceptable only when:

1. exact h0..h11 samples are present;
2. h0→h1 organization and strength are unchanged on both sides;
3. attacker and defender strength remain unchanged for the entire trace, verifying the zero-strength-damage intervention and eliminating strength-based combat-stat feedback;
4. cleanup completes successfully;
5. all 10 post-startup intervals show measurable POL organization loss.

If strength changes or any firing interval has zero POL organization loss, the expected diagnostic boundary has failed and the damage-multiplicity result is not interpreted automatically.

#### O5 current-planner prediction

With displayed GER Soft Attack 14–16 and the retained ±1 displayed-stat uncertainty, true effective Soft Attack is conservatively bounded **13–17**.

Under the current planner:

- combat-point scale = 0.1;
- expected attack points per hour = **1.3–1.7**;
- stochastic integerization therefore yields exactly **1 or 2 attack points** each firing hour;
- with defended hit chance forced to 100%, all generated points hit;
- with organization die fixed at 1, each hit contributes the same organization-damage increment.

Therefore the 10 interval losses should form two discrete magnitude clusters:

- low cluster = one-hit damage;
- high cluster = two-hit damage;
- high/low mean ratio approximately **2:1**.

Across the full 13–17 Soft Attack sensitivity, the per-hour probability of the high/two-hit cluster lies between **30% and 70%**. The worst-case probability that all 10 intervals nevertheless fall into only one cluster is:

`0.7^10 + 0.3^10 ≈ 2.83%`

#### O5 predeclared interpretation

For the 10 accepted firing intervals:

- **Two stable clusters with a high/low mean ratio of 1.8–2.2:** classify this as strong executable evidence for **stochastic discrete damage multiplicity** at the controlled O5 boundary. This narrows the remaining resolver substantially but does not yet assert the exact internal code location of the stochastic integerization.
- **All 10 intervals at one fixed magnitude:** create a narrow mismatch candidate against the current stochastic 1-or-2 point hypothesis; the predeclared worst-case probability of missing one cluster is about 2.83%.
- **More than two unstable levels, a ratio outside 1.8–2.2, strength movement, or zero-damage intervals:** treat O5 as an unexpected-pattern/control-review result rather than forcing a model classification.

No adaptive extension is permitted after seeing the O5 trace. One valid h0..h11 run completes this experiment.

If the two-level prediction is observed cleanly, the next stage may test the **probability law / exact combat-point scale** separately. O5 by itself is not a broad `oracle-validated` result for the whole hit/damage resolver.


#### O5 fixed-damage run 001 — PASS / STOCHASTIC DISCRETE MULTIPLICITY SUPPORTED

The single predeclared O5 run hit the target panel:

- GER Soft Attack: **15**
- POL Defense: **255**

The WPO5 trace is structurally clean:

- exact h0..h11 samples;
- h0→h1 unchanged;
- `BASE_CHANCE_TO_AVOID_HIT=0`;
- organization dice fixed at 1;
- strength damage fixed at 0;
- night attack penalty fixed at 0;
- attacker and defender strength unchanged for the full trace;
- successful cleanup at h11.

All ten firing intervals produced measurable POL organization loss.

Observed defender organization-loss magnitudes (percentage points):

`0.1715, 0.1770, 0.1770, 0.0920, 0.1770, 0.1770, 0.1770, 0.1710, 0.1770, 0.1770`

The losses form two stable magnitude levels:

- low cluster: **1 interval**, mean **0.0920 pp**
- high cluster: **9 intervals**, mean approximately **0.17572 pp**
- high/low mean ratio: approximately **1.91**

This satisfies the predeclared O5 two-level acceptance criterion of a high/low mean ratio between 1.8 and 2.2.

Machine action:

`stochastic-discrete-multiplicity-supported`

The controlled executable therefore shows discrete stochastic damage multiplicity rather than a single continuous/fixed hourly damage amount. This substantially narrows the plausible resolver class.

The observed 9/10 high-cluster frequency is **not** itself used as an O5 validation criterion. Under the retained displayed-stat uncertainty, the current planner's high-cluster probability is roughly 0.4–0.6. O6 should test that probability law explicitly with a larger, predeclared sample rather than retrofitting a conclusion from this one short trace.

O5 remains `unvalidated` for exact internal placement. The result supports stochastic discrete multiplicity but does not yet certify the exact `attack / 10` scale or the planner's precise stochastic-rounding probability law.

Persisted evidence:

- `oracle-lab/captures/o5-fixed-damage-001-wpo5.log.txt`
- `oracle-lab/captures/o5-fixed-damage-001-summary.json`
- `oracle-lab/captures/o5-fixed-damage-001-assessment.json`


### O6 two-point stochastic-probability probe — PREDECLARED / NOT YET EXECUTABLE-RUN

O5 established two discrete fixed-damage multiplicities consistent with one-hit and two-hit outcomes. O6 now tests whether the **frequency** of those two multiplicities changes with displayed Soft Attack in the way expected from the current `attack / 10` stochastic-rounding model.

Scenario:

`o6-two-point-probability-law-v1`

O6 retains the O5 diagnostic defines:

- defended hit chance forced to 100%;
- organization dice fixed at 1;
- strength damage fixed at 0;
- night attack penalty fixed at 0.

The O5 observed loss clusters are used only to predeclare the multiplicity classifier:

- one-hit/low loss: approximately **0.092 pp**
- two-hit/high loss: approximately **0.171–0.177 pp**
- O6 classification threshold: **0.13 pp defender organization loss per firing interval**

Any interval outside the expected one-hit/two-hit pattern or any strength movement triggers control review rather than automatic probability-law interpretation.

#### O6 low-attack mode

Target panel:

- GER displayed Soft Attack exactly **12**
- POL Defense at least **200**

Target modifier:

`army_infantry_attack_factor = -0.83`

With the retained ±1 displayed-stat uncertainty, true effective Soft Attack is conservatively 11–13. Under the current planner's `attack / 10` stochastic-rounding hypothesis, the probability of a two-hit/high-loss interval is therefore **0.10–0.30**.

Collect exactly **40 firing intervals** from one h0..h41 run.

Let `K_low` be the number of high-loss intervals.

#### O6 high-attack mode

Target panel:

- GER displayed Soft Attack exactly **18**
- POL Defense at least **200**

Target modifier:

`army_infantry_attack_factor = -0.748`

With ±1 displayed-stat uncertainty, true effective Soft Attack is conservatively 17–19. Under the same current planner hypothesis, the probability of a two-hit/high-loss interval is **0.70–0.90**.

Collect exactly **40 firing intervals** from one separate h0..h41 run.

Let `K_high` be the number of high-loss intervals.

#### O6 fixed decision rule

Both runs must pass all diagnostic controls:

- exact h0..h41 sample sequence;
- h0→h1 no-damage startup;
- strength unchanged throughout both traces;
- all 40 post-startup intervals show measurable POL organization loss;
- only the expected low/high fixed-damage multiplicities are observed;
- clean automatic modifier removal.

Predeclared mismatch triggers against the current `attack / 10` stochastic probability law:

- **K_low ≥ 21**: at the most high-favoring low-mode sensitivity edge p=0.30, `P(K≥21 | n=40) ≈ 0.242%`;
- **K_high ≤ 19**: at the most low-favoring high-mode sensitivity edge p=0.70, `P(K≤19 | n=40) ≈ 0.242%`;
- **K_high − K_low ≤ 4**: under the least-separated allowed current-model edge p_low=0.30 / p_high=0.70, this occurs with probability approximately **0.325%**.

If none of those mismatch triggers fire and the observed rates increase strongly from the low to high mode, classify O6 as **probability-gradient consistent with the current /10 stochastic-rounding hypothesis**, not as broad resolver validation.

No adaptive extension is permitted. O6 is exactly **two runs**, one low and one high, each with 40 firing intervals.

If O6 is consistent, the remaining useful Oracle work should shift away from attack-point integerization toward downstream damage magnitude/ordering rather than continuing to multiply attack-rounding experiments.


#### O6 low run 001 — UNEXPECTED 0/1/2 MULTIPLICITY / ORIGINAL O6 ACCEPTANCE FAILED

The predeclared O6 low-mode panel target was hit exactly:

- GER Soft Attack: **12**
- POL Defense: **255**

The WPO6 trace is structurally clean:

- exact h0..h41 sampling;
- h0→h1 unchanged;
- attacker and defender strength remain unchanged throughout;
- O6 diagnostic define bundle declared active;
- successful modifier cleanup at h41.

However, the original O6 acceptance condition required all 40 post-startup intervals to show measurable POL organization loss. That condition **failed**.

Observed interval classification using the predeclared O5/O6 fixed-damage threshold:

- zero-damage intervals: **9**
- one-hit-like low cluster: **20**
- two-hit-like high cluster: **11**

The nonzero clusters remain extremely stable:

- low-cluster mean: approximately **0.08843 pp**
- high-cluster mean: approximately **0.17609 pp**
- high/low ratio: approximately **1.991**

Thus the trace exhibits a clear **0 / 1x / 2x** organization-damage multiplicity pattern.

This is important because the current planner's exact implementation uses `stochasticRound(attack * 0.1)`. At displayed Soft Attack 12, even allowing the retained ±1 uncertainty, that implementation yields either 1 or 2 attack points every firing hour and cannot yield zero attack points. Therefore the nine zero-damage intervals are a **structural mismatch candidate** against the planner's current integerization placement, subject to diagnostic-control review.

Per the predeclared O6 rule, this low run is **not** fed into the original probability-gradient pass/fail assessment because its all-positive-interval acceptance boundary failed.

The second O6 high-mode run was already predeclared before this result existed. It may still be collected as the planned second half of O6, but its role is now diagnostic completion of the unexpected multiplicity pattern rather than an automatic application of the original O6 probability-law acceptance rule.

Persisted summary:

- `oracle-lab/captures/o6-low-001-summary.json`


#### O6 high tuning smoke 001 — REJECTED / RETUNE ONLY

The first O6 high-mode tuning attempt did not meet the predeclared displayed-panel target:

- displayed GER Soft Attack: **17**
- tooltip/effective value: approximately **17.9**
- POL Defense: **255**

No O6 high statistical interpretation is taken from this tuning attempt. The predeclared acceptance target remains displayed Soft Attack **exactly 18** with POL Defense at least 200.

Because the tooltip shows the target is missed by only about 0.1 effective Soft Attack, only the high-mode attack modifier is retuned:

- previous high modifier: `army_infantry_attack_factor = -0.75`
- retuned high modifier: `army_infantry_attack_factor = -0.748`

The low-mode result, O6 sample size, diagnostic define bundle, fixed-damage classifier, and all O6 decision rules remain unchanged. The next high-mode attempt must still display Soft Attack exactly 18 before it is accepted.


#### O6 high run 001 — UNEXPECTED 1/2/3 MULTIPLICITY / ORIGINAL O6 ACCEPTANCE FAILED

The retuned high-mode run hit the predeclared panel target exactly:

- GER Soft Attack: **18**
- POL Defense: **255**

The WPO6 trace is structurally clean:

- exact h0..h41 sampling;
- h0→h1 unchanged;
- attacker and defender strength unchanged for the complete trace;
- fixed-damage diagnostic define bundle declared active;
- all 40 post-startup intervals show measurable POL organization loss;
- successful automatic modifier cleanup at h41.

The defender organization-loss magnitudes separate into **three** stable integer-like levels:

- one-hit-like cluster: **17 intervals**, mean approximately **0.08718 pp**
- two-hit-like cluster: **20 intervals**, mean approximately **0.17713 pp**
- three-hit-like cluster: **3 intervals**, mean approximately **0.26833 pp**

Ratios:

- two/one mean ratio ≈ **2.03**
- three/one mean ratio ≈ **3.08**

The three ~0.268–0.269 pp intervals violate the original O6 acceptance condition that only the expected one-hit/two-hit multiplicities appear. Therefore the high run, like the low run, is **not** fed into the original O6 probability-gradient pass/fail rule.

Persisted summary:

- `oracle-lab/captures/o6-high-001-summary.json`

#### O6 combined conclusion — NARROW INTEGERIZATION DIVERGENCE

The two predeclared O6 modes now provide complementary structural counterexamples to the planner's current exact attack-point integerization:

Current planner implementation:

`stochasticRound(totalAttack * 0.1)`

At displayed Soft Attack 12 with the retained ±1 display sensitivity, that implementation can produce only **1 or 2** attack points per firing hour.

Observed low-mode multiplicities:

- 0x: **9**
- 1x: **20**
- 2x: **11**

At displayed Soft Attack 18 with the retained ±1 display sensitivity, the same implementation can again produce only **1 or 2** attack points.

Observed high-mode multiplicities:

- 1x: **17**
- 2x: **20**
- 3x: **3**

Thus O6 contains both kinds of impossible support under the current planner mechanism:

1. zero multiplicity below the planner's minimum support;
2. three multiplicity above the planner's maximum support.

The fixed-damage diagnostic controls strongly localize this discrepancy:

- defended avoid chance is overridden to zero;
- organization die size is fixed to one;
- strength damage is zero and strength remains unchanged;
- night attack penalty is zero;
- neutral tactics remain active;
- the observed damage magnitudes form clean approximately 1x / 2x / 3x multiples.

Therefore the **specific current planner mechanism `stochasticRound(totalAttack * 0.1)` is classified `oracle-divergent` at the controlled O6 fixed-damage boundary**.

This does **not** imply that the `/10` mean scale is wrong. In fact, the empirical mean multiplicity changes from approximately **1.05** at Soft Attack 12 to **1.65** at Soft Attack 18: a difference of **0.60** for a six-point attack increase, exactly a 0.10 mean-gradient per Soft Attack point. The likely error is therefore the **shape/width of executable random integerization**, not necessarily the mean combat-point scale.

The broad hit/damage resolver remains `unvalidated`. O7 should test a predeclared wider random-rounding candidate before the planner implementation is changed.

Persisted combined assessment:

- `oracle-lab/captures/o6-combined-assessment.json`


### O7 integer-centered wide-rounding probe — COMPLETE / CANDIDATE SUPPORTED

O6 established a narrow `oracle-divergent` result for the planner's current single-Bernoulli attack-point integerization. The observed 0/1/2 pattern at Soft Attack 12 and 1/2/3 pattern at Soft Attack 18 suggest a wider discrete random-rounding law centered near the retained `attack / 10` mean scale.

O7 tests one explicit replacement candidate before any planner code is changed.

Scenario:

`o7-wide-random-rounding-v1`

Candidate executable approximation:

`round( attack / 10 + U[-1, +1] )`

where ties have zero probability and negative results are clamped to zero.

This candidate is **planner analytical / executable inferred**, not game-file exact. It is motivated by the O5/O6 multiplicity structure and is declared before O7 executable data exists.

#### O7 diagnostic controls

O7 retains the fixed-damage Oracle interventions:

- defended avoid chance forced to zero;
- organization dice fixed at 1;
- strength damage fixed at 0;
- night attack penalty fixed at 0;
- neutral tactics.

Target attack modifier:

`army_infantry_attack_factor = -0.721`

Panel acceptance:

- displayed GER Soft Attack exactly **20**;
- tooltip/effective GER Soft Attack between **19.8 and 20.2 inclusive**;
- POL Defense at least **200**;
- one GER division vs one POL division;
- width 18 each;
- no commanders and zero reserves.

The tooltip value is required for O7 because the candidate distribution changes continuously around the integer center.

#### O7 trace

Collect exactly one h0..h61 trace:

- h0→h1 startup;
- exactly **60 firing intervals**;
- exact strength invariance for both sides;
- clean modifier removal at h61.

Using the fixed-damage calibration:

- 1x cluster: defender organization loss < **0.13 pp**
- 2x cluster: **0.13 ≤ loss < 0.225 pp**
- 3x cluster: **0.225 ≤ loss < 0.315 pp**
- zero loss or loss ≥0.315 pp is outside the candidate support and triggers immediate unexpected-pattern review.

#### O7 candidate probabilities

Let `a` be the tooltip/effective Soft Attack and `x = a / 10`.

For accepted `a ∈ [19.8,20.2]`, the candidate predicts only 1x/2x/3x multiplicities with:

- `p1 = (2.5 - x) / 2`
- `p2 = 0.5`
- `p3 = (x - 1.5) / 2`

At exactly Soft Attack 20.0 this is:

**25% / 50% / 25%**

for 1x / 2x / 3x.

The planner's current Bernoulli stochastic-rounding implementation would instead collapse essentially to the 2x level at an exact integer center and, for a stable tooltip value, cannot generate both lower and upper tails in the same run.

#### O7 fixed decision rule

For the 60 accepted firing intervals:

1. If any 0x or ≥4x interval appears, action = `wide-rounding-candidate-mismatch`.
2. Otherwise compute Pearson chi-square against the tooltip-conditioned candidate probabilities above.
3. Degrees of freedom = 2; predeclared significance level = **1%**; critical value = **9.21034**.
4. If chi-square ≤ 9.21034 and both 1x and 3x clusters are observed, action = `wide-rounding-candidate-supported`.
5. If chi-square > 9.21034, action = `wide-rounding-candidate-mismatch`.
6. No adaptive extension is permitted. One accepted 60-interval run completes O7.

A supported O7 result does not claim source-code identity. It would justify replacing the planner's currently divergent one-Bernoulli integerization with this empirically supported wider discrete law on the Oracle branch, followed by planner-only replay/regression against O1/O2/O3/O4/O5/O6 evidence before any production merge.

O7 is intended to be the **final manual attack-point integerization experiment** unless it returns an unexpected pattern. If it supports the candidate, subsequent work should be planner-side integration and regression rather than additional O-number executable runs.


#### O7 run 001 — PASS / WIDE-ROUNDING CANDIDATE SUPPORTED

The single predeclared O7 run met the acceptance panel exactly:

- GER displayed Soft Attack: **20**
- GER tooltip/effective Soft Attack: **20.0**
- POL Defense: **255**

The WPO7 trace is structurally clean:

- exact h0..h61 samples;
- h0→h1 unchanged;
- exactly 60 firing intervals;
- attacker and defender strength unchanged throughout;
- fixed-damage diagnostic define bundle active;
- successful automatic modifier cleanup at h61.

Observed multiplicities:

- 0x: **0**
- 1x: **18**
- 2x: **33**
- 3x: **9**
- ≥4x: **0**

At tooltip Soft Attack 20.0, the predeclared candidate

`round(attack / 10 + U[-1,+1])`

predicts probabilities **25% / 50% / 25%** for 1x / 2x / 3x, or expected counts **15 / 30 / 15** in 60 intervals.

The observed Pearson chi-square statistic is **3.3**, below the predeclared 1% critical value **9.21034** with 2 degrees of freedom. Both required outer tails were observed, and no out-of-support 0x or ≥4x intervals occurred.

Machine action:

`wide-rounding-candidate-supported`

Classification:

- the prior planner mechanism `stochasticRound(totalAttack * 0.1)` remains **oracle-divergent** at the O6 fixed-damage boundary;
- the predeclared wider attack-point distribution is **oracle-validated** at the controlled O7 fixed-damage distribution boundary;
- using that law in the planner remains **executable inferred** rather than a claim of source-code identity.

Persisted evidence:

- `oracle-lab/captures/o7-wide-rounding-001-summary.json`
- `oracle-lab/captures/o7-wide-rounding-001-assessment.json`

Per the predeclared plan, O7 completes the manual **attack-point** integerization sequence. The next step is planner-side integration on the isolated Oracle branch and replay/regression against O1–O7 evidence. Any later Oracle experiment must target a different unresolved mechanism rather than adaptively extending attack-point rounding.


### O8 defense-point integerization probe — PREDECLARED / NOT YET EXECUTABLE-RUN

O7 validated the wider **attack-point** multiplicity distribution at its controlled fixed-damage boundary. The planner still integerizes defense points with the older single-Bernoulli mechanism:

`stochasticRound(defense * 0.1)`

O8 asks a separate question: **does defense-point integerization use the same wider random-rounding law?**

Scenario:

`o8-defense-wide-rounding-v1`

Candidate defense approximation:

`round(defense / 10 + U[-1,+1])`

with negative values clamped to zero.

This candidate is **executable inferred** until tested. O8 does not assume that attack and defense must share an implementation merely because that would be symmetrical.

#### O8 diagnostic controls

O8 retains the fixed-damage controls and changes the hit gates so that the defender's organization loss directly reveals the number of **undefended** attack points:

- `BASE_CHANCE_TO_AVOID_HIT = 100` → defended points never hit;
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 0` → undefended points always hit;
- organization dice fixed at 1;
- strength damage fixed at 0;
- night attack penalty fixed at 0;
- neutral tactics.

Target modifiers:

- GER `army_infantry_attack_factor = -0.721`;
- POL `army_infantry_defence_factor = -0.9607843137`.

Panel acceptance:

- GER displayed Soft Attack exactly **20**;
- GER tooltip/effective Soft Attack exactly **20.0**;
- POL displayed Defense exactly **10**;
- POL tooltip/effective Defense exactly **10.0** if the executable exposes the decimal total;
- one GER division vs one POL division;
- width 18 each;
- no commanders and zero reserves.

If the POL modifier misses the exact Defense target, that run is **tuning only** and must not be interpreted. Only the defense modifier may be retuned; the sample size, attack target, hit-gate defines, classifier and decision rule remain fixed.

#### Why this isolates defense-point integerization

At Soft Attack 20.0, O7's supported wider attack-point law gives:

- 1 attack point: 25%
- 2 attack points: 50%
- 3 attack points: 25%

At Defense 10.0, the current planner's old Bernoulli defense law gives exactly **1 defense point** every interval. With defended points forced to miss and undefended points forced to hit, that old defense law predicts organization-loss multiplicities:

- 0x: 25%
- 1x: 50%
- 2x: 25%
- 3x: 0%

The proposed wider defense law gives defense points 0/1/2 at 25%/50%/25%. Convolving that with the O7 attack-point distribution yields:

- 0x: **31.25%**
- 1x: **37.5%**
- 2x: **25%**
- 3x: **6.25%**

Thus the 3x tail is a direct discriminator at the exact center: it is outside the old defense law's support but required by the wider candidate.

#### O8 trace

Collect exactly one h0..h81 trace:

- h0→h1 startup;
- exactly **80 firing intervals**;
- exact strength invariance for both sides;
- clean modifier removal at h81.

Use the retained fixed-damage classifier:

- 0x: no measurable defender organization loss;
- 1x: positive loss < **0.13 pp**;
- 2x: **0.13 ≤ loss < 0.225 pp**;
- 3x: **0.225 ≤ loss < 0.315 pp**;
- ≥4x: loss ≥ **0.315 pp**.

#### O8 fixed decision rule

For the one accepted 80-interval run:

1. Any ≥4x interval triggers `wide-defense-candidate-mismatch`.
2. Otherwise compute Pearson chi-square against **31.25% / 37.5% / 25% / 6.25%** for 0x/1x/2x/3x.
3. Degrees of freedom = 3; predeclared significance level = **1%**; critical value = **11.34487**.
4. If chi-square ≤ 11.34487 and at least one 3x interval is observed, action = `wide-defense-candidate-supported`.
5. Otherwise action = `wide-defense-candidate-mismatch`.
6. No adaptive extension is permitted. One accepted 80-interval run completes O8.

At the wider candidate's exact-center 3x probability of 6.25%, the chance of observing no 3x interval in 80 trials is about **0.57%**. The 80-interval sample was chosen before executable data to make the outer-tail discriminator useful without creating another large manual batch.

A supported O8 result would justify replacing the planner's defense-point Bernoulli integerization on the isolated Oracle branch and then replaying prior evidence. It would **not** validate defended/undefended hit-roll ordering, normal damage dice, tactic execution, or the complete resolver.


## Promotion rule

O1 may move from `unvalidated` only after:

1. repeated clean executable trials establish a stable distribution;
2. the same controlled scenario is represented in the current 1.19.3 planner;
3. planner Monte Carlo output is compared at the distribution level;
4. uncertainty/tolerances are declared before promotion;
5. counterexample testing does not expose a material mismatch.

A passing result becomes `oracle-validated`; a reproducible material mismatch becomes `oracle-divergent`.
