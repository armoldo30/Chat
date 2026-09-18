# HOI4 1.19.3 Oracle Laboratory

Active laboratory branch for empirical validation against a real Hearts of Iron IV 1.19.3 executable.

## Verified reference installation

- Game: Hearts of Iron IV
- Build label: Operation Postern
- Version: `v1.19.3.0.c01a`
- Checksum: `5632`
- Debug launch: confirmed by the in-game `NUDGE!` developer control
- Baseline save supplied by tester: `Oracle_Baseline_1936.hoi4`
- Baseline start: 1936 single-player
- 1.19.3 executable validation status: O1 six-hour instrumentation/scheduler smoke passed on 2026-09-18; stochastic combat parity remains unvalidated

These facts establish provenance only. They do not by themselves validate any combat behavior.

## O1 objective

O1 is the smallest useful land-combat experiment: one attacker division versus one defender division, with optional mechanics suppressed as far as practical. The first measurements are organization percentage, strength percentage, and battle duration over time.

The O1 tooling is intentionally split into two layers:

1. **Instrumentation/helper smoke test** — proves that the exact 1.19.3 executable accepts the scripted sampler, honors the delayed-event queue, and emits parseable values.
2. **Controlled battle capture** — once the probe is clean, captures an hourly trace from a deliberately prepared 1v1 battle.

Do not promote any result to `oracle-validated` merely because the mod loads. A combat behavior is promoted only after a reproducible capture is compared against the planner and passes the declared statistical/tolerance standard.

## Why the first package is capture-first

The sampler itself can be made generic and non-destructive. Exact battle construction is more dangerous to automate before the real executable confirms the scripting surface: province choice, unit placement, templates, supply, leaders, weather, country modifiers, doctrines, and war state can all contaminate a supposedly minimal test. The first executable pass therefore validates measurement before we automate scenario construction.

## Installation package

The mod source is under `oracle-lab/hoi4-mod/`.

Copy both of these items into the user's Hearts of Iron IV `mod` directory:

- `hoi4_war_planner_oracle.mod`
- `hoi4_war_planner_oracle/`

The normal Windows user-mod directory is usually:

`Documents/Paradox Interactive/Hearts of Iron IV/mod/`

Enable **HOI4 War Planner Oracle 1.19.3** in the Paradox launcher. Keep `-debug` in the Steam launch options during Oracle work.

## First 1.19.3 executable smoke test

Use the clean controlled O1 pre-battle save, issue the same GER attack while paused, open the console, and run:

`d_oracle_o1_trial6`

Then unpause. The helper captures hour 0 immediately, queues hours 1 through 6 up front, and ends automatically after the hour-6 sample. Exit to desktop and provide `Documents/Paradox Interactive/Hearts of Iron IV/logs/game.log`.

For this first 1.19.3 pass, the goal is to validate the sampler and scheduler on the new executable before collecting the 10-run distribution sample. A clean smoke run should contain one `BEGIN` with `runMode=trial6`, samples 0 through 6 in order, exactly one GER attacker and one POL defender at each sample, and `END hour=6 reason=trial6-complete`.

The older `d_oracle_o1_probe` remains available as a non-destructive instrumentation fallback if the six-hour helper fails to load or execute.

## 1.19.3 smoke result

The first `d_oracle_o1_trial6` executable run on 1.19.3.0.c01a / checksum 5632 passed the instrumentation and scheduler smoke check:

- one BEGIN marker with `runMode=trial6`
- samples 0 through 6 in strict order
- exactly one GER attacker and one POL defender at every sample
- automatic `END hour=6 reason=trial6-complete`

The capture is stored as `oracle-lab/captures/o1-1193-smoke-001.json`. It remains `unvalidated` for combat parity. The run began at 17:00 and ended at 23:00, so it is retained only as an instrumentation/scheduler smoke and is rejected from the combat distribution because the daylight control was not satisfied.

## Daylight replacement smoke

The daylight replacement smoke passed at 10:00→16:00 with the intended 1v1 Plains controls and displayed attack values 75/73. It is stored as `oracle-lab/captures/o1-1193-daylight-001.json` and counts as accepted preliminary trial 1 of 10.

## Preliminary 10-run batch

Collect 9 more trials from the same clean daylight pre-battle save. Reload that save before every trial. For each trial: pause, issue the same GER attack, run `d_oracle_o1_trial6`, unpause through hour 6, then reload the clean save. Ten complete trials may remain in one `game.log`.

Analyze the combined log with:

`node scripts/oracle-trial6-batch.mjs path/to/game.log output.json`

The analyzer rejects incomplete/malformed trial6 runs and reports per-trial h6 losses, damage-interval counts, aggregate mean/SD/min/max/95% interval estimates, and zero-damage interval frequency.

## Controlled sampler commands

After the six-hour helper is validated on 1.19.3:

- `d_oracle_o1_trial6` — preferred repeated O1 trial command; captures h0 through h6 and auto-stops.
- `d_oracle_o1_arm` — begins the longer hourly trace and takes the hour-0 sample.
- `d_oracle_o1_stop` — stops the long sampler and writes a terminal marker.

The sampler has a 96-hour safety horizon. Reload the baseline between experimental runs so no delayed event from an older run can contaminate a later one.

## Measurement method

HOI4 exposes division `unit_organization` and `unit_strength` as 0–1 comparison triggers rather than direct numeric getters. The mod therefore bounds each value by 14 binary-search comparisons in division scope. The parser converts the final low/high bounds to their midpoint.

Fourteen bisections give a maximum interval width of `1 / 16384`, or about `0.006104` percentage points after conversion to 0–100 percent. The midpoint's maximum quantization error is about `0.003052` percentage points, comfortably below the current Oracle comparator tolerances. This is measurement resolution, not a claim that the executable's internal combat values have that precision.

## Log protocol

Oracle instrumentation lines begin with `[WPO1]` so normal HOI4 log traffic can be ignored.

A run contains:

- `BEGIN` — schema, scenario, game version, checksum, method
- `SAMPLE` — combat/sample hour
- one or more `ATTACKER` division measurements
- one or more `DEFENDER` division measurements
- `END` — manual stop or 96-hour safety stop

For a valid O1 combat capture, each sampled hour must contain exactly one attacker and exactly one defender division. The parser rejects ambiguous captures rather than silently choosing a division.

## Parser

Convert a captured `game.log` with:

`node scripts/oracle-log-to-capture.mjs path/to/game.log output.json`

The parser selects the latest `[WPO1]` run, validates its structure, computes midpoint percentages, and emits Oracle schema v1 JSON suitable for `src/oracle.js`.

## Evidence boundary

This laboratory uses normal HOI4 mod/debug/log facilities. It does not decompile `hoi4.exe` and does not claim literal bit-for-bit executable identity. The practical target remains empirically validated parity for planner-relevant observable behavior.
