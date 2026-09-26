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


### O8 defense-point integerization probe — COMPLETE / CANDIDATE REJECTED

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
- POL `army_infantry_defence_factor = -0.9923784016` (retuned from the live 17.8 Defense tuning observation; tuning run only).

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


#### O8 run 001 — PASS CONTROLS / INDEPENDENT WIDE-DEFENSE CANDIDATE REJECTED

The retuned O8 run met the accepted live-panel controls:

- GER displayed Soft Attack: **20**
- GER tooltip/effective Soft Attack: **20.0**
- POL displayed Defense: **10**
- POL tooltip/effective Defense: **10.0**

The WPO8 trace is structurally clean:

- exact h0..h81 sampling;
- h0→h1 unchanged;
- exactly **80 firing intervals**;
- attacker and defender strength unchanged throughout;
- O8 hit-gate/fixed-damage define bundle active;
- successful modifier cleanup at h81.

Observed defender organization-loss multiplicities:

- 0x: **25**
- 1x: **49**
- 2x: **6**
- 3x: **0**
- ≥4x: **0**

The predeclared independent wider defense-point candidate expected:

- 0x: **25**
- 1x: **30**
- 2x: **20**
- 3x: **5**

Pearson chi-square = **26.8333**, above the predeclared 1% critical value **11.34487** with 3 degrees of freedom. The required 3x tail was also absent.

Machine action:

`wide-defense-candidate-mismatch`

Classification:

- the hypothesis that attack and defense points are independently generated by the same wider random-rounding law and then simply subtracted is **oracle-divergent** at the controlled O8 boundary;
- the exact defense / defended-vs-undefended resolver remains **unvalidated**;
- O8 does **not** validate the planner's old Bernoulli defense-point sampler.

The narrower observed distribution suggests the executable is doing something other than independent attack-point and defense-point randomization before subtraction. Plausible families for the next discriminating experiment include direct integerization of defended/undefended attack pools, correlated/shared rounding, or a different ordering of the split.

Persisted evidence:

- `oracle-lab/captures/o8-defense-wide-rounding-001-summary.json`
- `oracle-lab/captures/o8-defense-wide-rounding-001-assessment.json`

O8 therefore closes the naive symmetry hypothesis. The next Oracle experiment should target the **defended-vs-undefended split itself**, not simply retry another defense-rounding law.


### O9 all-hit transport control — COMPLETE / TRANSPORT SUPPORTED

O8 strongly rejected the hypothesis that the executable independently wider-rounds attack and defense points and then simply subtracts them. Before probing a more complicated defended-vs-undefended split, O9 checks a necessary transport control:

**Does the O7 attack-point distribution still appear in the exact accepted O8 20-attack / 10-defense scenario when every attack point is forced to hit?**

Scenario:

`o9-o8-all-hit-transport-v1`

O9 keeps the exact accepted O8 live-panel targets:

- GER Soft Attack exactly **20.0**;
- POL Defense exactly **10.0**;
- GER attack modifier `army_infantry_attack_factor = -0.721`;
- POL defense modifier `army_infantry_defence_factor = -0.9923784016`.

The diagnostic define bundle changes only the hit gates needed for this control:

- `BASE_CHANCE_TO_AVOID_HIT = 0`;
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 0`;
- organization dice fixed at 1;
- strength damage fixed at 0;
- night attack penalty fixed at 0;
- neutral tactics.

Because defended and undefended points both have 100% hit chance, Defense no longer changes defender organization loss. The observed multiplicity therefore measures the **total attack-point distribution** in the exact low-defense O8 scenario.

#### O9 fixed prediction and decision rule

If the O7 attack-point law transports cleanly, the 60 accepted firing intervals should again follow:

- 1x: **25%**
- 2x: **50%**
- 3x: **25%**

with no 0x or ≥4x intervals.

Decision rule:

1. One accepted h0..h61 trace only.
2. Any 0x or ≥4x interval => `o7-attack-law-does-not-transport`.
3. Otherwise Pearson chi-square against 25% / 50% / 25%.
4. Degrees of freedom = 2; significance level = **1%**; critical value = **9.21034**.
5. If chi-square ≤ 9.21034 and both 1x and 3x are observed => `o7-attack-law-transports`.
6. Otherwise => `o7-attack-law-does-not-transport`.
7. No adaptive extension.

If O9 supports transport, the O8 discrepancy is localized downstream of attack-point generation to the **defended-vs-undefended split or hit-resolution ordering**. If O9 fails, the attack-point law itself is context-sensitive across these diagnostic hit-gate states and must be investigated before any more specific defense model is proposed.


#### O9 run 001 — PASS / O7 ATTACK LAW TRANSPORTS

The accepted O9 run again hit the exact live-panel controls:

- GER Soft Attack: **20.0**
- POL Defense: **10.0**

The WPO9 trace is structurally clean:

- exact h0..h61 samples;
- h0→h1 unchanged;
- exactly **60 firing intervals**;
- attacker and defender strength unchanged throughout;
- both defended and undefended avoid chances forced to zero;
- successful modifier cleanup at h61.

Observed defender organization-loss multiplicities:

- 0x: **0**
- 1x: **16**
- 2x: **32**
- 3x: **12**
- ≥4x: **0**

The transported O7 prediction was **15 / 30 / 15** for 1x / 2x / 3x. Pearson chi-square = **0.8**, below the predeclared 1% critical value **9.21034** with 2 degrees of freedom, and both outer tails were observed.

Machine action:

`o7-attack-law-transports`

Classification:

- O7's wider total attack-point law is **oracle-validated** at the controlled O9 all-hit transport boundary;
- O8's mismatch is now localized **downstream of total attack-point generation**;
- the exact defended-vs-undefended split / hit-resolution ordering remains **unvalidated**.

Persisted evidence:

- `oracle-lab/captures/o9-o8-all-hit-transport-001-summary.json`
- `oracle-lab/captures/o9-o8-all-hit-transport-001-assessment.json`

The next experiment should keep the O8 hit-gate bundle but remove defense entirely. That control can distinguish a genuine defense-split effect from any hidden coupling caused merely by setting `BASE_CHANCE_TO_AVOID_HIT = 100`.


### O10 zero-defense O8-hit-gate control — ABANDONED BEFORE EVIDENCE / EXECUTABLE 1% STAT FLOOR

O9 established that the O7 total attack-point law still appears in the exact 20-attack / 10-defense matchup when both defended and undefended points are forced to hit. O10 now checks whether O8's unusual result was caused by the **presence of defense itself** or by some hidden coupling from the O8 diagnostic setting `BASE_CHANCE_TO_AVOID_HIT = 100`.

Scenario:

`o10-zero-defense-hit-gate-control-v1`

O10 keeps:

- GER Soft Attack target exactly **20.0**;
- O8's hit gates: defended points forced to miss, undefended points forced to hit;
- fixed organization die = 1;
- strength damage = 0;
- night penalty = 0;
- neutral tactics.

POL Defense is driven to exactly **0.0** with:

`army_infantry_defence_factor = -1.0423836429`

The first O10 tuning attempt at `-1.0328836429` produced live POL Defense **1.9** and is tuning-only evidence. The retuned value uses that live observation plus the prior O8 calibration. Exact executable panel values remain authoritative; if the panel is not 20.0 / 0.0, the run is tuning only and must not be interpreted.

With Defense exactly zero, every generated GER attack point must take the undefended branch. Therefore, if the O8 hit-gate bundle itself does not distort total attack-point generation, the 60 firing intervals should again follow the O7/O9 distribution:

- 1x: **25%**
- 2x: **50%**
- 3x: **25%**

with no 0x or ≥4x intervals.

#### O10 fixed decision rule

1. One accepted h0..h61 trace only.
2. Any 0x or ≥4x interval => `o8-hit-gate-bundle-alters-attack-transport`.
3. Otherwise Pearson chi-square against 25% / 50% / 25%.
4. Degrees of freedom = 2; significance level = **1%**; critical value = **9.21034**.
5. If chi-square ≤ 9.21034 and both 1x and 3x are observed => `zero-defense-control-supported`.
6. Otherwise => `o8-hit-gate-bundle-alters-attack-transport`.
7. No adaptive extension.

O10 could not reach its acceptance panel. The first live tuning attempt bottomed out at **POL Defense 1.9** even after pushing the country defense modifier below -100%. The combat tooltip exposed why: base Defense **198** was shown as **modified to 1.00%**, with experience +25% and country -100.94%. A further-more-negative retune left Defense at 1.9.

Therefore the zero-defense acceptance state is not reachable through this modifier path because the executable applies a **1% minimum final stat multiplier** at this boundary. The zero-defense O10 protocol is abandoned before any evidence run; no O10 result is interpreted.

This floor observation is itself a useful executable constraint. The replacement experiment is O10v2, which treats the **1.9 minimum Defense** as the controlled variable and asks whether that minimum nonzero defense measurably changes the O7/O9 attack-point distribution under O8's asymmetric hit gates.


### O10v2 minimum-defense response probe — COMPLETE / EFFECT DETECTED

Scenario:

`o10v2-minimum-defense-response-v1`

O10v2 keeps the exact O8 asymmetric hit-gate diagnostic:

- defended points forced to miss: `BASE_CHANCE_TO_AVOID_HIT = 100`;
- undefended points forced to hit: `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 0`;
- organization dice fixed at 1;
- strength damage fixed at 0;
- night penalty fixed at 0;
- neutral tactics.

It also keeps GER Soft Attack at exactly **20.0** and intentionally uses the executable's observed minimum reachable POL Defense:

- POL base Defense: **198** in the accepted baseline;
- final displayed/tooltip Defense: **1.9**;
- country-defense modifier: `army_infantry_defence_factor = -1.0328836429`;
- tooltip final-stat floor: **1.00%**.

This is **not** treated as zero Defense.

#### O10v2 question

Does the executable's minimum nonzero Defense of 1.9 measurably alter the O7/O9 1x/2x/3x total-attack distribution when O8's defended/undefended gates are active?

The no-detect reference is the already Oracle-supported O7/O9 attack law at Soft Attack 20.0:

- 1x: **25%**
- 2x: **50%**
- 3x: **25%**
- 0x / ≥4x: **0%**

O10v2 does **not** assume any particular defense-point integerization law. It is a response-curve point only.

#### O10v2 fixed decision rule

Collect exactly one accepted h0..h61 trace, giving **60 firing intervals**.

Acceptance panel:

- GER Soft Attack displayed/tooltip exactly **20.0**;
- POL Defense displayed/tooltip exactly **1.9**;
- one division per side;
- no commanders, zero reserves;
- h0→h1 unchanged;
- strength invariant;
- clean modifier removal.

Decision:

1. Any 0x or ≥4x interval => `minimum-defense-effect-detected`.
2. Otherwise compute Pearson chi-square against **25% / 50% / 25%** for 1x/2x/3x.
3. Degrees of freedom = 2; significance level = **1%**; critical value = **9.21034**.
4. If chi-square ≤ 9.21034 and both 1x and 3x occur => `minimum-defense-effect-not-detected`.
5. Otherwise => `minimum-defense-effect-detected`.
6. No adaptive extension.

Neither outcome identifies the exact split algorithm. A detected effect means the defense response is already visible at the executable's 1% stat floor; a non-detected effect brackets the response between Defense 1.9 and the clearly divergent Defense 10 O8 point.


#### O10v2 run 001 — PASS / MINIMUM-DEFENSE EFFECT DETECTED

The accepted O10v2 panel remained at the intentionally minimum reachable values:

- GER Soft Attack: **20.0**
- POL Defense: **1.9**
- POL base Defense: **198**
- final-stat floor: **1.00%**

The WPO10V2 trace is structurally clean:

- exact h0..h61 sampling;
- h0→h1 unchanged;
- exactly **60 firing intervals**;
- attacker and defender strength unchanged;
- O8 asymmetric hit gates active;
- successful cleanup at h61.

Observed defender organization-loss multiplicities:

- 0x: **1**
- 1x: **18**
- 2x: **37**
- 3x: **4**
- ≥4x: **0**

Reference O7/O9 no-defense-effect shape at Soft Attack 20:

- 1x: **15**
- 2x: **30**
- 3x: **15**
- 0x / ≥4x: **0**

The O10v2 run triggers the predeclared effect rule twice:

1. a **0x** interval appears, outside the no-effect reference support;
2. ignoring that support violation, Pearson chi-square over 1x/2x/3x is **10.3**, above the predeclared 1% critical value **9.21034**.

Machine action:

`minimum-defense-effect-detected`

Classification:

- the existence of a defense-present effect at the executable minimum Defense 1.9 is **oracle-validated** at this controlled asymmetric-hit-gate boundary;
- the exact defended-vs-undefended partition, integerization placement, and RNG correlation remain **unvalidated**.

This result is especially useful because it rules out the idea that Defense must reach roughly one full /10 combat point before it affects the split. A measurable response is already present at the 1% final-stat floor.

Persisted evidence:

- `oracle-lab/captures/o10v2-minimum-defense-001-summary.json`
- `oracle-lab/captures/o10v2-minimum-defense-001-assessment.json`

### O11 defended-only partition probe — COMPLETE / PARTITION-MEAN COMPATIBLE

O8 measured the **undefended** portion at Soft Attack 20 / Defense 10 by forcing defended attacks to miss and undefended attacks to hit. O9 measured the **total** attack-point distribution at the same 20 / 10 panel by forcing both branches to hit.

O11 measures the complementary quantity at the same panel:

**the defended portion only.**

Scenario:

`o11-defended-only-partition-v1`

Exact panel targets:

- GER Soft Attack displayed/tooltip exactly **20.0**;
- POL Defense displayed/tooltip exactly **10.0**;
- GER modifier `army_infantry_attack_factor = -0.721`;
- POL modifier `army_infantry_defence_factor = -0.9923784016`.

Diagnostic defines:

- `BASE_CHANCE_TO_AVOID_HIT = 0` → defended attacks always hit;
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 100` → undefended attacks always miss;
- organization dice fixed at 1;
- strength damage fixed at 0;
- night attack penalty fixed at 0;
- neutral tactics.

Therefore each defender organization-loss multiplicity measures the number of **defended attack points** in that firing interval.

#### O11 predeclared partition check

Historical accepted samples are frozen before O11:

O8 undefended-only sample:

- n = **80**
- counts 0/1/2/3 = **25 / 49 / 6 / 0**
- mean undefended multiplicity = **0.7625**
- sample variance = **0.3352848101**

O9 all-hit total sample:

- n = **60**
- counts 1/2/3 = **16 / 32 / 12**
- mean total multiplicity = **1.9333333333**
- sample variance = **0.4700564972**

If the defended and undefended branches are a partition of the same stable total attack process, their expectations must satisfy:

`E[total] = E[defended] + E[undefended]`

Using the frozen O8/O9 means, the implied defended mean is:

**1.1708333333**

Collect exactly one accepted O11 h0..h81 trace, giving **80 defended-only firing intervals**.

Decision rule:

1. Any ≥4x defended-only interval => `partition-mean-mismatch`.
2. Compute O11 defended multiplicity mean and unbiased sample variance.
3. Compute:
   `delta = meanTotal(O9) - meanUndefended(O8) - meanDefended(O11)`
4. Compute independent-sample standard error:
   `SE = sqrt(varO9/60 + varO8/80 + varO11/80)`
5. Predeclared two-sided significance level = **1%**, normal critical value **2.575829**.
6. If `abs(delta) <= 2.575829 * SE`, action = `partition-mean-compatible`.
7. Otherwise action = `partition-mean-mismatch`.
8. No adaptive extension.

A compatible result would establish a strong necessary structural property: the O8 and O11 branches behave, in expectation, like complementary partitions of the O9 total attack process. It would **not** identify their joint per-interval RNG or exact integerization formula. A mismatch would imply that changing the branch hit gates alters more than merely which pre-existing attack points deal damage.


#### O11 run 001 — PASS / DEFENDED-ONLY STREAM COLLAPSES TO EXACTLY 1x

The accepted O11 trace completed h0..h81 with unchanged strength and clean modifier removal. Across all **80 firing intervals**, the defended-only multiplicity was:

- 0x: **0**
- 1x: **80**
- 2x: **0**
- 3x: **0**
- ≥4x: **0**

So at Soft Attack 20 / Defense 10, with defended attacks forced to hit and undefended attacks forced to miss, the defended branch is empirically **deterministic at exactly one multiplicity** over the accepted sample.

The predeclared partition-mean check used the frozen O8 and O9 samples:

- O8 undefended mean = **0.7625**
- O9 total mean = **1.9333333333**
- implied defended mean = **1.1708333333**
- observed O11 defended mean = **1.0000**
- delta = **0.1708333333**
- SE = **0.1096600888**
- z = **1.5578442**
- 1% two-sided critical z = **2.575829**

Machine action:

`partition-mean-compatible`

Classification:

- the O11 defended-only multiplicity distribution at Defense 10 is **oracle-validated** at this controlled boundary;
- the frozen O8/O11 branch means are compatible with partitioning the O9 total process **in expectation**;
- this does **not** establish the exact per-interval joint split, RNG correlation, or the defense mapping away from Defense 10.

Persisted evidence:

- `oracle-lab/captures/o11-defended-only-001-summary.json`
- `oracle-lab/captures/o11-defended-only-001-assessment.json`

### O12 defended-only fractional-defense probe — COMPLETE / SINGLE-BERNOULLI-BOUNDED SUPPORTED

O11 established that Defense 10 produces exactly one defended multiplicity in every accepted interval. O12 moves the same defended-only diagnostic to a **non-integer defense/10 point** so competing integerization families separate.

Scenario:

`o12-defended-only-defense12-v1`

Targets:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **12.0**
- same 1v1 baseline, neutral tactics, no commanders, zero reserves
- defended attacks forced to hit: `BASE_CHANCE_TO_AVOID_HIT = 0`
- undefended attacks forced to miss: `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 100`
- org die = 1, strength damage = 0, night penalty = 0

Precomputed POL modifier:

`army_infantry_defence_factor = -0.9842773534`

The executable panel is authoritative. Any result other than exactly 12.0 Defense is tuning-only.

O12 does **not** preselect a winning defense law. It discriminates these families at Defense 12:

- deterministic floor / nearest-like center behavior → defended stream remains concentrated at 1x;
- single-Bernoulli stochastic rounding of 1.2, bounded by total attack → approximately 85% 1x / 15% 2x under the frozen O7 attack law;
- wider independent rounding of 1.2 before bounding → predicts a visible 0x tail plus materially more 2x mass;
- deterministic ceiling-like behavior → far more 2x mass.

Collect exactly one h0..h81 trace = **80 firing intervals**. The primary result is the observed defended-only multiplicity distribution itself; no post-hoc extension is permitted. O12 will be used to choose the smallest candidate family still compatible with O11 and O12 jointly.


#### O12 run 001 — PASS / SINGLE-BERNOULLI-BOUNDED FAMILY SUPPORTED

The accepted O12 trace used the exact 20.0 Soft Attack / 12.0 Defense target and completed h0..h81 with unchanged strength and clean modifier removal.

Observed defended-only multiplicities across **80 firing intervals**:

- 0x: **0**
- 1x: **71**
- 2x: **9**
- 3x: **0**
- ≥4x: **0**

Predeclared candidate comparisons:

- deterministic one-point defense: incompatible because 2x was observed;
- single-Bernoulli stochastic rounding of Defense/10, bounded by total attack points:
  - expected 1x / 2x = **68 / 12**
  - chi-square = **0.88235**
  - compatible at the predeclared 1% threshold;
- wider independent defense rounding:
  - chi-square = **31.11246**
  - incompatible;
- deterministic ceiling-like defense:
  - chi-square = **173.4**
  - incompatible.

Machine action:

`candidate-family-set-resolved`

Compatible family:

`singleBernoulliBounded`

This is the first executable evidence that directly supports the planner's existing defense-side structure:

`defensePoints = stochasticRound(Defense / 10)`

followed by:

`defendedPoints = min(totalAttackPoints, defensePoints)`

The result is **oracle-validated only at the controlled O11/O12 defended-only boundaries**. It does not yet establish broad transport across arbitrary Defense values or normal hit probabilities.

Persisted evidence:

- `oracle-lab/captures/o12-defended-only-defense12-001-summary.json`
- `oracle-lab/captures/o12-defended-only-defense12-001-assessment.json`

### O13 defended-only high-fraction confirmation — COMPLETE / TRANSPORT SUPPORTED

O13 is the confirmation point for the O12-supported defense integerization family. It moves Defense/10 from **1.2** to **1.8**, where the single-Bernoulli and wider-rounding families predict materially different defended-only distributions.

Scenario:

`o13-defended-only-defense18-v1`

Targets:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **18.0**
- same 1v1 baseline, neutral tactics, no commanders, zero reserves
- defended attacks forced to hit: `BASE_CHANCE_TO_AVOID_HIT = 0`
- undefended attacks forced to miss: `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 100`
- org die = 1
- strength damage = 0
- night penalty = 0

Precomputed POL modifier:

`army_infantry_defence_factor = -0.9599742088`

The executable panel remains authoritative. Anything other than exactly 18.0 Defense is tuning-only.

Under the O12-supported single-Bernoulli-bounded family:

- total attack points retain the O7 law: A=1/2/3 with 25% / 50% / 25%;
- Defense 18 gives D=1 with 20% and D=2 with 80%;
- defended multiplicity = min(A,D);
- predicted defended-only distribution:
  - 1x: **40%**
  - 2x: **60%**
  - 0x / 3x / ≥4x: **0%**

Collect one accepted h0..h81 trace = **80 firing intervals**.

#### O13 fixed decision rule

1. Any 0x, 3x, or ≥4x interval => `single-Bernoulli-bounded-does-not-transport`.
2. Otherwise Pearson chi-square against expected counts **32 / 48** for 1x / 2x.
3. Degrees of freedom = 1; significance level = **1%**; critical value = **6.634897**.
4. If chi-square ≤ 6.634897 and both 1x and 2x are observed => `single-Bernoulli-bounded-transports`.
5. Otherwise => `single-Bernoulli-bounded-does-not-transport`.
6. No adaptive extension.

A passing O13 result will justify treating the current planner defense-point sampler and defended-count bounding as narrowly **oracle-validated across two fractional Defense points plus the integer-center O11 control**. The next Oracle work should then leave point partitioning and move to normal hit probabilities / damage generation.


#### O13 run 001 — PASS / DEFENSE SAMPLER TRANSPORTS

The accepted O13 trace completed h0..h81 with unchanged strength and clean modifier removal.

Observed defended-only multiplicities across **80 firing intervals**:

- 0x: **0**
- 1x: **36**
- 2x: **44**
- 3x: **0**
- ≥4x: **0**

The predeclared O12-supported family predicted **32 / 48** for 1x / 2x. Pearson chi-square = **0.83333**, below the predeclared 1% critical value **6.634897** with 1 degree of freedom.

Machine action:

`single-Bernoulli-bounded-transports`

Classification:

- `stochasticRound(Defense / 10)` followed by `min(totalAttackPoints, defensePoints)` is now narrowly **oracle-validated** across:
  - O11: Defense 10 integer center;
  - O12: Defense 12 low fractional point;
  - O13: Defense 18 high fractional point.
- This does **not** establish arbitrary-range source identity.
- Point partitioning is sufficiently constrained for the next Oracle stage; subsequent experiments should target normal hit probabilities and damage generation instead of further attack/defense-point rounding.

Persisted evidence:

- `oracle-lab/captures/o13-defended-only-defense18-001-summary.json`
- `oracle-lab/captures/o13-defended-only-defense18-001-assessment.json`

### O14 normal defended-hit probability probe — COMPLETE / 10% DEFENDED HIT SUPPORTED

O14 leaves the now-constrained point partition in place and restores the vanilla **defended** hit gate while suppressing the undefended branch.

Scenario:

`o14-normal-defended-hit-v1`

Exact panel targets:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **10.0**
- one GER vs one POL baseline division
- no commanders, zero reserves
- neutral tactics

Diagnostic defines:

- `BASE_CHANCE_TO_AVOID_HIT = 90` → vanilla defended hit probability **10%**
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 100` → undefended points always miss
- `LAND_COMBAT_ORG_DICE_SIZE = 1`
- `LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE = 1`
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0`
- `BASE_NIGHT_ATTACK_PENALTY = 0`

O11 established that this 20 / 10 panel produces exactly **one defended attack point per firing interval** under the controlled defended-only boundary. Therefore O14 converts each firing interval into one executable defended-hit Bernoulli trial while keeping organization damage per successful hit fixed.

Collect exactly one accepted h0..h81 trace = **80 firing intervals**.

#### O14 fixed decision rule

Classify each firing interval:

- 0x = no measurable defender organization loss;
- 1x = positive organization loss below **0.13 percentage points**;
- ≥2x = loss at or above **0.13 percentage points**.

Under the game-file exact `BASE_CHANCE_TO_AVOID_HIT = 90` interpretation, the number of 1x intervals is Binomial(**n=80, p=0.10**).

Predeclared exact central 99% acceptance region:

- **2 through 16** successful 1x intervals inclusive.

Decision:

1. Any ≥2x interval => `defended-hit-semantics-mismatch`.
2. If 1x count is between 2 and 16 inclusive => `defended-hit-10pct-supported`.
3. Otherwise => `defended-hit-semantics-mismatch`.
4. No adaptive extension.

This test validates executable use of the vanilla defended avoid-chance define only at the controlled O14 boundary. It does not validate the undefended 40% hit gate or normal damage dice.


#### O14 run 001 — PASS / VANILLA DEFENDED HIT GATE SUPPORTED

The accepted O14 trace completed h0..h81 with unchanged strength and clean modifier removal.

Observed defender fixed-damage outcomes across **80 firing intervals**:

- 0x: **71**
- 1x: **9**
- ≥2x: **0**

At the O11-controlled 20 Soft Attack / 10 Defense boundary there is exactly one defended attack point per firing interval. Therefore these 80 intervals are direct Bernoulli trials for the defended hit gate.

The game-file exact define `BASE_CHANCE_TO_AVOID_HIT = 90` implies a defended hit probability of **10%**. The predeclared exact central 99% acceptance region for Binomial(80, 0.10) was **2 through 16 hits** inclusive.

Observed successful hits: **9**

Machine action:

`defended-hit-10pct-supported`

Classification:

- executable use of the vanilla defended 90% avoid / 10% hit gate is narrowly **oracle-validated** at the controlled O14 boundary;
- the undefended 40% hit gate remains a separate target;
- normal organization and strength damage dice remain unvalidated.

Persisted evidence:

- `oracle-lab/captures/o14-normal-defended-hit-001-summary.json`
- `oracle-lab/captures/o14-normal-defended-hit-001-assessment.json`

### O15 normal undefended-hit probability probe — COMPLETE / 40% UNDEFENDED HIT SUPPORTED

O15 validates the complementary vanilla undefended hit gate after O14 validated the defended 10% gate.

Scenario:

`o15-normal-undefended-hit-v1`

Exact panel targets:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **10.0**
- same 1v1 baseline, no commanders, zero reserves, neutral tactics

Diagnostic defines:

- `BASE_CHANCE_TO_AVOID_HIT = 100` → defended points always miss
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 60` → vanilla undefended hit probability **40%**
- `LAND_COMBAT_ORG_DICE_SIZE = 1`
- `LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE = 1`
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0`
- `BASE_NIGHT_ATTACK_PENALTY = 0`

The O7/O11/O12/O13 point model at 20 / 10 gives:

- total attack points A = 1 / 2 / 3 with probabilities 25% / 50% / 25%;
- defense points D = 1 exactly at Defense 10;
- undefended points U = max(A-D, 0) = 0 / 1 / 2 with probabilities 25% / 50% / 25%.

Applying an independent 40% hit gate to each undefended point gives the predeclared hit-count distribution:

- 0x: **64%**
- 1x: **32%**
- 2x: **4%**
- ≥3x: **0%**

O15 collects exactly one h0..h161 trace = **160 firing intervals**, giving expected counts:

- 0x: **102.4**
- 1x: **51.2**
- 2x: **6.4**

#### O15 fixed decision rule

1. Any ≥3x interval => `undefended-hit-semantics-mismatch`.
2. Otherwise Pearson chi-square against probabilities **0.64 / 0.32 / 0.04**.
3. Degrees of freedom = 2; significance level = **1%**; critical value = **9.21034**.
4. If chi-square ≤ 9.21034 and at least one 2x interval is observed => `undefended-hit-40pct-supported`.
5. Otherwise => `undefended-hit-semantics-mismatch`.
6. No adaptive extension.

A passing O15 result will complete the fixed-damage validation of both vanilla hit gates at the controlled 20 / 10 boundary. The next Oracle stage should then restore normal organization damage dice while keeping strength damage suppressed.


#### O15 run 001 — PASS / VANILLA UNDEFENDED HIT GATE SUPPORTED

The accepted O15 trace completed h0..h161 with unchanged strength and clean modifier removal.

Observed defender fixed-damage hit counts across **160 firing intervals**:

- 0x: **102**
- 1x: **55**
- 2x: **3**
- ≥3x: **0**

The predeclared point model plus a 40% independent undefended hit gate predicted:

- 0x: **64%** → 102.4 expected
- 1x: **32%** → 51.2 expected
- 2x: **4%** → 6.4 expected

Pearson chi-square = **2.08984**, below the predeclared 1% critical value **9.21034** with 2 degrees of freedom, and the required 2x tail was observed.

Machine action:

`undefended-hit-40pct-supported`

Classification:

- executable use of `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 60` as a **40% undefended hit probability** is narrowly **oracle-validated** at the controlled O15 boundary;
- together O14 + O15 complete fixed-damage validation of both vanilla hit gates at the 20/10 panel;
- point generation, defense partitioning, and both hit probabilities are now sufficiently constrained for the next stage;
- normal organization and strength damage dice remain unvalidated.

Persisted evidence:

- `oracle-lab/captures/o15-normal-undefended-hit-001-summary.json`
- `oracle-lab/captures/o15-normal-undefended-hit-001-assessment.json`

### O16 normal organization-die probe — COMPLETE / UNIFORM 1-THROUGH-4 SUPPORTED

O16 moves from hit-count validation to the first real damage-die validation while preserving the clean O11 one-defended-point boundary.

Scenario:

`o16-normal-org-die-v1`

Exact panel targets:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **10.0**
- same 1v1 baseline, no commanders, zero reserves, neutral tactics

Diagnostic defines:

- `BASE_CHANCE_TO_AVOID_HIT = 0` → the single defended point always hits
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 100` → undefended points always miss
- `LAND_COMBAT_ORG_DICE_SIZE = 4` → vanilla organization die
- `LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE = 6` → vanilla armored-soft organization die, retained but irrelevant for the baseline unarmored infantry
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0` → suppress strength damage
- `BASE_NIGHT_ATTACK_PENALTY = 0`

O11 established that the same 20 / 10 panel produces exactly one defended attack point per firing interval. Therefore O16 gives exactly one guaranteed organization-damage roll per defender interval.

Under the planner/game-file candidate:

`damage = UniformInteger(1, LAND_COMBAT_ORG_DICE_SIZE) * LAND_COMBAT_ORG_DAMAGE_MODIFIER`

the unarmored organization die is Uniform{1,2,3,4}. The earlier fixed-die controls place one damage unit near **0.088 percentage points of organization** on this baseline, so O16 classifies defender interval losses using the frozen boundaries:

- die 1: positive loss < **0.13 pp**
- die 2: **0.13 ≤ loss < 0.225 pp**
- die 3: **0.225 ≤ loss < 0.315 pp**
- die 4: **0.315 ≤ loss < 0.405 pp**
- anything else: support violation

Collect exactly one accepted h0..h81 trace = **80 firing intervals**.

#### O16 fixed decision rule

1. Any 0x or out-of-range (>4) damage interval => `org-die-semantics-mismatch`.
2. Otherwise Pearson chi-square against uniform probabilities **0.25 / 0.25 / 0.25 / 0.25**.
3. Expected count = **20** in each die bin.
4. Degrees of freedom = 3; significance level = **1%**; critical value = **11.34487**.
5. If chi-square ≤ 11.34487 and all four die outcomes occur => `org-die-uniform-1-through-4-supported`.
6. Otherwise => `org-die-semantics-mismatch`.
7. No adaptive extension.

A passing O16 result will narrowly validate the vanilla unarmored organization damage die and its 1-through-N support at the controlled one-hit boundary. The next stage should isolate the strength die separately before a combined normal-damage validation.


#### O16 run 001 — PASS / VANILLA UNARMORED ORG DIE SUPPORTED

The accepted O16 trace completed h0..h81 with unchanged strength and clean modifier removal.

Observed organization-damage die classes across **80 firing intervals**:

- die 1: **19**
- die 2: **19**
- die 3: **23**
- die 4: **19**
- zero: **0**
- out of range: **0**

Against the predeclared Uniform{1,2,3,4} model, Pearson chi-square = **0.6**, below the 1% critical value **11.34487** with 3 degrees of freedom.

Machine action:

`org-die-uniform-1-through-4-supported`

Classification:

- the vanilla unarmored organization damage die is narrowly **oracle-validated** as a uniform integer draw from 1 through 4 at the controlled O16 one-hit boundary;
- the game-file exact `LAND_COMBAT_ORG_DAMAGE_MODIFIER = 0.053` remains the multiplier used by the validated planner path;
- strength damage remains the next isolated executable target.

Persisted evidence:

- `oracle-lab/captures/o16-normal-org-die-001-summary.json`
- `oracle-lab/captures/o16-normal-org-die-001-assessment.json`

### O17 fixed strength-damage unit calibration — COMPLETE / NAIVE SCALE REJECTED

O17 isolates one guaranteed defended hit per firing interval and fixes the strength die to **1** so the executable's single strength-damage unit can be measured directly before testing the normal two-sided strength die.

Scenario:

`o17-fixed-strength-unit-v1`

Exact panel targets at combat start:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **10.0**
- same 1v1 baseline, no commanders, zero reserves, neutral tactics

Game-file exact baseline static HP is **225** for the 9-infantry tested division.

Diagnostic defines:

- `BASE_CHANCE_TO_AVOID_HIT = 0` → defended point always hits
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 100` → undefended points always miss
- `LAND_COMBAT_ORG_DAMAGE_MODIFIER = 0` → organization cannot end the battle
- `LAND_COMBAT_ORG_DICE_SIZE = 1`
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0.060` → vanilla strength multiplier
- `LAND_COMBAT_STR_DICE_SIZE = 1` → fixed strength die
- `LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE = 1`
- `BASE_NIGHT_ATTACK_PENALTY = 0`

At full strength, O11 established exactly one defended point at the 20 / 10 panel. With one guaranteed hit and a fixed strength die of 1, the game-file candidate predicts a defender strength decrement of:

`0.060 / 225 * 100 = 0.0266667 percentage points`

per firing interval.

The bisection14 measurement width is about **0.0061035 percentage points**, so O17 predeclares a per-interval accepted measurement band of:

**0.0195 pp through 0.0340 pp inclusive.**

Collect exactly one accepted h0..h21 trace = **20 firing intervals**. The short horizon intentionally limits strength-feedback drift in attack/defense stats.

#### O17 fixed decision rule

1. h0→h1 must be unchanged.
2. Defender organization must remain unchanged for the entire trace.
3. Every one of the 20 firing intervals must show a strict defender strength loss.
4. Every measured defender strength loss must fall inside **0.0195–0.0340 pp**.
5. If all controls pass, action = `fixed-strength-unit-supported`.
6. Otherwise action = `fixed-strength-unit-mismatch-or-feedback`.
7. No adaptive extension.

A passing O17 result will establish the executable scale of one vanilla unarmored strength-damage unit on the exact HP-225 baseline. O18 can then restore `LAND_COMBAT_STR_DICE_SIZE = 2` and predeclare the 1x/2x strength-loss classifier from the O17 measurement rather than choosing a threshold after seeing O18.


#### O17 run 001 — PREDECLARED RULE FAIL / HIDDEN SCALE CANDIDATE EXPOSED

The accepted O17 trace completed h0..h21 with organization invariant and clean modifier removal. All **20 firing intervals** produced a strict defender strength loss.

Observed defender strength-loss midpoints:

- mean: **0.024125 pp**
- minimum: **0.0185 pp**
- maximum: **0.0250 pp**
- cumulative h1→h21 loss: **0.4825 pp**

The predeclared naive HP-only candidate was:

`0.060 / 225 * 100 = 0.0266667 pp per hit`

or **0.533333 pp** cumulatively across 20 one-hit intervals.

O17's fixed rule fails because one interval midpoint (**0.0185 pp**) falls just below the frozen **0.0195 pp** lower bound. More importantly, the aggregate strength loss is materially below the naive HP-only prediction.

Machine action:

`fixed-strength-unit-mismatch-or-feedback`

Narrow classification:

- naive `strength damage = die * 0.060 / HP` is **oracle-divergent** at the controlled O17 boundary;
- the observed cumulative result is extremely close to an additional **0.9 scalar**:
  - candidate per-hit loss = **0.0240 pp**
  - candidate cumulative 20-hit loss = **0.4800 pp**
  - observed minus candidate = **+0.0025 pp**
- the 0.9 scalar is a **post-result candidate only** and is not validated by O17.

### O17v2 all-hit strength-scale confirmation — COMPLETE / 0.9 SCALE SUPPORTED

O17v2 tests the newly exposed 0.9 candidate without relying on Defense rounding. Both defended and undefended attack points are forced to hit, organization damage is disabled, and the strength die remains fixed at 1.

Scenario:

`o17v2-all-hit-strength-scale-v1`

Exact combat-start target:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **10.0**
- same baseline divisions and neutral tactics
- POL attack is suppressed to the ordinary executable 1% final-stat floor during the diagnostic to minimize counterfire strength feedback into GER; this does not alter the defender strength-loss stream being measured

Diagnostic defines:

- `BASE_CHANCE_TO_AVOID_HIT = 0`
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 0`
- `LAND_COMBAT_ORG_DAMAGE_MODIFIER = 0`
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0.060`
- `LAND_COMBAT_STR_DICE_SIZE = 1`
- `LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE = 1`
- night penalty = 0

The O7/O9 attack law at Soft Attack 20 gives total attack-point multiplicity **1 / 2 / 3**. With every point hitting and the strength die fixed at 1, O17v2 classifies each defender strength-loss interval into 1x / 2x / 3x using broad predeclared support bands that separate the candidate clusters under either the naive or 0.9-scaled model:

- 1x: **0.014–0.037 pp**
- 2x: **0.037–0.064 pp**
- 3x: **0.064–0.091 pp**
- anything else: support violation

Collect exactly one h0..h61 trace = **60 firing intervals**.

For each accepted interval, divide measured loss by its classified multiplicity to estimate one executable strength-damage unit. Let the mean normalized unit be `u`.

Predeclared candidate centers:

- naive HP-only: **0.0266667 pp**
- additional 0.9 scalar: **0.0240000 pp**

#### O17v2 fixed decision rule

1. Any zero-loss or out-of-support interval => `strength-scale-family-mismatch`.
2. All three multiplicity classes 1x / 2x / 3x must occur.
3. Compute the mean normalized unit `u` over all 60 intervals.
4. If **0.0230 ≤ u ≤ 0.0250 pp**, action = `point-nine-strength-scale-supported`.
5. If **0.0257 ≤ u ≤ 0.0277 pp**, action = `naive-hp-strength-scale-supported`.
6. Otherwise action = `strength-scale-family-mismatch`.
7. No adaptive extension.

A passing 0.9 result would justify correcting the planner strength-damage scale before moving to the normal two-sided strength die.


#### O17v2 run 001 — PASS / 0.9 STRENGTH SCALE CONFIRMED

The accepted O17v2 trace completed h0..h61 with organization invariant and clean modifier removal.

Across the **60 firing intervals**, the all-hit fixed-strength-die multiplicities were:

- 1x: **13**
- 2x: **36**
- 3x: **11**
- out of support: **0**

After dividing each measured strength loss by its classified attack multiplicity, the normalized one-unit strength loss was:

- mean: **0.0242056 pp**
- minimum: **0.0190 pp**
- maximum: **0.0300 pp**

The predeclared candidate bands were:

- additional 0.9 scalar: **0.0230–0.0250 pp**
- naive HP-only scale: **0.0257–0.0277 pp**

Machine action:

`point-nine-strength-scale-supported`

Classification:

- the additional **0.9 strength-damage scalar** is narrowly **oracle-validated** at the controlled O17v2 baseline;
- the prior naive planner scale is superseded on the Oracle branch;
- the planner Oracle branch now applies an effective unarmored strength modifier of `0.060 × 0.9 = 0.054`;
- the normal strength die itself remains to be validated separately.

Persisted evidence:

- `oracle-lab/captures/o17v2-all-hit-strength-scale-001-summary.json`
- `oracle-lab/captures/o17v2-all-hit-strength-scale-001-assessment.json`

### O18 normal strength-die probe — COMPLETE / UNIFORM 1-THROUGH-2 SUPPORTED

O18 keeps the validated 20 / 10 one-defended-point control, keeps organization damage disabled, and restores the vanilla **two-sided strength die**.

Scenario:

`o18-normal-strength-die-v1`

Exact combat-start targets:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **10.0**
- same baseline divisions and neutral tactics
- POL attack suppressed to the ordinary executable 1% final-stat floor to minimize counterfire strength feedback into GER

Diagnostic defines:

- `BASE_CHANCE_TO_AVOID_HIT = 0` → defended point always hits
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 100` → undefended points always miss
- `LAND_COMBAT_ORG_DAMAGE_MODIFIER = 0`
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0.060`
- `LAND_COMBAT_STR_DICE_SIZE = 2`
- `LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE = 2`
- night penalty = 0

O17v2 fixed the executable one-unit scale near **0.024 pp**. O18 therefore freezes the following one-hit strength-loss classes before the run:

- die 1: **0.014 ≤ loss < 0.037 pp**
- die 2: **0.037 ≤ loss < 0.064 pp**
- zero loss: control-feedback contamination
- any loss ≥ 0.064 pp: support violation

Collect exactly one h0..h21 trace = **20 firing intervals**. The short horizon limits defender-strength feedback into the 10 Defense control.

#### O18 fixed decision rule

1. h0→h1 must be unchanged.
2. Defender organization must remain invariant.
3. Any zero-loss interval => `one-defended-point-control-broke-under-strength-feedback`.
4. Any out-of-support interval => `strength-die-semantics-mismatch`.
5. Otherwise classify all 20 intervals as die 1 or die 2.
6. Under UniformInteger(1,2), let K be the number of die-2 intervals. The exact two-sided 1% Binomial(20, 0.5) acceptance region is **K = 4 through 16 inclusive**.
7. If K is in 4..16 and both outcomes occur => `strength-die-uniform-1-through-2-supported`.
8. Otherwise => `strength-die-semantics-mismatch`.
9. No adaptive extension.

A passing O18 result will complete the isolated validation of ordinary unarmored organization and strength damage dice. The remaining Oracle work can then move to combined normal-damage and transport/end-to-end validation.


#### O18 run 001 — PASS / VANILLA UNARMORED STRENGTH DIE SUPPORTED

The accepted O18 trace completed h0..h21 with defender organization invariant and clean modifier removal.

Observed one-hit strength-die classes across **20 firing intervals**:

- die 1: **8**
- die 2: **12**
- zero: **0**
- out of support: **0**

For a UniformInteger(1,2) strength die, the predeclared exact two-sided 1% Binomial(20, 0.5) acceptance region for the die-2 count was **4 through 16 inclusive**. The observed die-2 count was **12**.

Machine action:

`strength-die-uniform-1-through-2-supported`

Classification:

- the ordinary unarmored strength damage die is narrowly **oracle-validated** as UniformInteger(1,2) at the controlled O18 one-hit boundary;
- together O16 + O17v2 + O18 now establish the ordinary unarmored ORG die, strength scale, and strength die separately;
- combined normal-damage behavior remains the next target.

Persisted evidence:

- `oracle-lab/captures/o18-normal-strength-die-001-summary.json`
- `oracle-lab/captures/o18-normal-strength-die-001-assessment.json`

### O19 combined normal-damage coherence probe — COMPLETE / COHERENT

O19 restores the ordinary defended hit gate and both ordinary unarmored damage dice simultaneously while retaining the clean 20 / 10 one-defended-point boundary.

Scenario:

`o19-combined-normal-damage-v1`

Exact combat-start targets:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **10.0**
- same baseline divisions and neutral tactics
- POL attack suppressed to the executable 1% final-stat floor to minimize counterfire feedback

Diagnostic / near-normal defines:

- `BASE_CHANCE_TO_AVOID_HIT = 90` → ordinary defended hit probability **10%**
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 100` → suppress undefended-point damage so the one-defended-point control remains isolated
- `LAND_COMBAT_ORG_DAMAGE_MODIFIER = 0.053`
- `LAND_COMBAT_ORG_DICE_SIZE = 4`
- `LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE = 6`
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0.060`
- `LAND_COMBAT_STR_DICE_SIZE = 2`
- `LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE = 2`
- night penalty = 0

Collect exactly one h0..h161 trace = **160 firing intervals**.

At this boundary, O11 established one defended point per interval at full strength, O14 validated its 10% hit gate, O16 validated the 1–4 ORG die, O17v2 validated the additional 0.9 strength scale, and O18 validated the 1–2 strength die.

Each firing interval is therefore classified as:

- **miss**: neither defender ORG nor strength shows a strict loss;
- **hit**: both ORG and strength show a strict loss and each loss falls into its previously frozen damage-die support band;
- **mixed-channel**: exactly one of ORG / strength changes;
- **support violation**: both change but either channel falls outside its prior validated support.

Frozen ORG bands from O16:

- die 1: positive loss < **0.13 pp**
- die 2: **0.13 ≤ loss < 0.225 pp**
- die 3: **0.225 ≤ loss < 0.315 pp**
- die 4: **0.315 ≤ loss < 0.405 pp**

Frozen strength bands from O17v2/O18:

- die 1: **0.014 ≤ loss < 0.037 pp**
- die 2: **0.037 ≤ loss < 0.064 pp**

For 160 independent 10% defended-hit opportunities, the predeclared central 99% Binomial(160, 0.10) acceptance region is **7 through 26 hits inclusive**.

#### O19 fixed decision rule

1. h0→h1 must be unchanged.
2. No mixed-channel interval is permitted.
3. No ORG or strength support violation is permitted.
4. Let H be the number of coherent hit intervals.
5. If **7 ≤ H ≤ 26**, action = `combined-normal-damage-coherent`.
6. Otherwise action = `combined-normal-damage-mismatch`.
7. No adaptive extension.

A passing O19 result will validate that the already isolated hit gate, ORG die, strength scale, and strength die compose coherently in a single executable damage event. The remaining Oracle work can then move to a broader transport/end-to-end battle test.


#### O19 run 001 — PASS / COMBINED NORMAL DAMAGE COHERENT

The accepted O19 trace completed h0..h161 with clean modifier removal.

Across **160 firing intervals**:

- coherent misses: **143**
- coherent hits: **17**
- mixed-channel intervals: **0**
- support violations: **0**

On the 17 coherent hits, the previously validated damage supports remained intact:

- ORG die classes 1/2/3/4: **3 / 3 / 4 / 7**
- strength die classes 1/2: **5 / 12**

The predeclared central 99% Binomial(160, 0.10) acceptance region for coherent defended hits was **7 through 26**. Observed H = **17**.

Machine action:

`combined-normal-damage-coherent`

Classification:

- the ordinary defended hit gate, ordinary unarmored ORG die, validated 0.9 strength scale, and ordinary unarmored strength die compose coherently at the controlled 20 / 10 boundary;
- no mixed-channel executable behavior appeared;
- broader transport of the complete point-partition + both hit-gate family remains the final core unarmored resolver target.

Persisted evidence:

- `oracle-lab/captures/o19-combined-normal-damage-001-summary.json`
- `oracle-lab/captures/o19-combined-normal-damage-001-assessment.json`

### O20 normal hit-transport at Defense 18 — PREDECLARED / NOT YET EXECUTABLE-RUN

O20 moves the now-validated attack/defense partition and both normal hit gates to the independently validated **Defense 18** boundary while returning to fixed organization damage for direct hit-multiplicity observation.

Scenario:

`o20-normal-hit-transport-defense18-v1`

Exact combat-start targets:

- GER Soft Attack exactly **20.0**
- POL Defense exactly **18.0**
- same 1v1 baseline and neutral tactics
- POL attack suppressed to the executable 1% final-stat floor

Diagnostic defines:

- `BASE_CHANCE_TO_AVOID_HIT = 90` → defended hit probability **10%**
- `CHANCE_TO_AVOID_HIT_AT_NO_DEF = 60` → undefended hit probability **40%**
- `LAND_COMBAT_ORG_DICE_SIZE = 1`
- `LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE = 1`
- `LAND_COMBAT_STR_DAMAGE_MODIFIER = 0`
- night penalty = 0

Validated point-model inputs at 20 / 18:

- total attack points A = 1 / 2 / 3 with probabilities **0.25 / 0.50 / 0.25**
- defense points D = 1 / 2 with probabilities **0.20 / 0.80**
- bounded defended/undefended point pairs:
  - (1,0): **0.25**
  - (1,1): **0.10**
  - (2,0): **0.40**
  - (1,2): **0.05**
  - (2,1): **0.20**

Applying the validated 10% defended and 40% undefended hit gates gives the predeclared total hit-multiplicity distribution:

- 0 hits: **0.7164**
- 1 hit: **0.2488**
- 2 hits: **0.0332**
- 3 hits: **0.0016**
- 4+ hits: impossible under the candidate family

For the fixed statistical test, 2-hit and 3-hit outcomes are combined into **2+ hits = 0.0348**.

Collect exactly one h0..h161 trace = **160 firing intervals**.

Expected grouped counts:

- 0 hits: **114.624**
- 1 hit: **39.808**
- 2+ hits: **5.568**

#### O20 fixed decision rule

1. h0→h1 must be unchanged and both sides' strength must remain invariant.
2. Any 4+ fixed-damage interval => `normal-hit-transport-mismatch`.
3. Group 2-hit and 3-hit intervals into 2+.
4. Pearson chi-square against probabilities **0.7164 / 0.2488 / 0.0348**.
5. Degrees of freedom = 2; significance level = **1%**; critical value = **9.21034**.
6. If chi-square ≤ 9.21034 and at least one 2+ interval occurs => `normal-hit-transport-defense18-supported`.
7. Otherwise => `normal-hit-transport-mismatch`.
8. No adaptive extension.

A passing O20 result will complete the final broad unarmored hit-resolution transport check. After that, only optional special-case Oracle work such as armor/piercing would remain before the core ordinary 1v1 land-combat resolver can be treated as complete.


## Promotion rule

O1 may move from `unvalidated` only after:

1. repeated clean executable trials establish a stable distribution;
2. the same controlled scenario is represented in the current 1.19.3 planner;
3. planner Monte Carlo output is compared at the distribution level;
4. uncertainty/tolerances are declared before promotion;
5. counterexample testing does not expose a material mismatch.

A passing result becomes `oracle-validated`; a reproducible material mismatch becomes `oracle-divergent`.
