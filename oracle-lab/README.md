# HOI4 1.19.2 Oracle Laboratory

Active laboratory branch for empirical validation against a real Hearts of Iron IV 1.19.2 executable.

## Verified reference installation

- Game: Hearts of Iron IV
- Build label: Operation Postern
- Version: `v1.19.2.0.a729`
- Checksum: `d245`
- Debug launch: confirmed by the in-game `NUDGE!` developer control
- Baseline save supplied by tester: `Oracle_Baseline_1936.hoi4`
- Baseline start: 1936 single-player
- Verified: 2026-09-11

These facts establish provenance only. They do not by themselves validate any combat behavior.

## O1 objective

O1 is the smallest useful land-combat experiment: one attacker division versus one defender division, with optional mechanics suppressed as far as practical. The first measurements are organization percentage, strength percentage, and battle duration over time.

The O1 tooling is intentionally split into two layers:

1. **Instrumentation probe** — proves that the exact 1.19.2 executable accepts the scripted sampler and emits parseable values.
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

Enable **HOI4 War Planner Oracle 1.19.2** in the Paradox launcher. Keep `-debug` in the Steam launch options during Oracle work.

## First executable probe

Load a COPY of the supplied baseline save, open the console, and run:

`d_oracle_o1_probe`

Then exit to desktop and provide `Documents/Paradox Interactive/Hearts of Iron IV/logs/game.log`.

The probe does not destroy units, move divisions, declare war, or alter combat. It only writes `[WPO1]` measurement lines. It is expected to see many GER/POL divisions in an ordinary 1936 save; that is useful for verifying instrumentation but is not yet a valid 1v1 Oracle capture.

## Controlled sampler commands

After a controlled 1v1 scenario exists:

- `d_oracle_o1_arm` — begins an hourly trace and takes the hour-0 sample.
- `d_oracle_o1_stop` — stops sampling and writes a terminal marker.

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
