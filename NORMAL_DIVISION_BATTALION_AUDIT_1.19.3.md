# HOI4 War Planner — Normal-Division Battalion Eligibility Audit 1.19.3

Date: 2026-09-19  
Target: Hearts of Iron IV 1.19.3.0.c01a  
Tracking issue: #48

## Trigger

After the 0.17.3 Regimental Support mapping fix, the remaining structural audit found Army-HQ-only line battalions could still leak into ordinary Division Designer templates.

## Confirmed structural defect

The 1.19.3 source file `common/units/hq_support.txt` defines seven Army-HQ-only line battalions with `allow_in_non_army_hq = no`:

1. `hq_infantry`
2. `hq_motorized`
3. `hq_armored_car`
4. `hq_paratrooper`
5. `hq_light_armor`
6. `hq_medium_armor`
7. `hq_heavy_armor`

The compact runtime currently contains six of these; `hq_armored_car` is outside the current compact line-battalion subset.

## 0.17.4 correction

The ordinary Division Designer excludes any battalion with `allowInNonArmyHq === false`.

A single ordinary-division battalion allowlist is used when:

- constructing and normalizing designer grids;
- converting battalion counts to/from grids;
- rendering battalion picker choices;
- filling regiments;
- calculating line-battalion division stats;
- importing and exporting division templates.

This prevents hidden HQ-only battalions from persisting through saved/imported state even when they are not visible in the picker.

## Evidence boundary

Retained supplied/certified fields remain preferred authority.

The compact runtime omitted these HQ-eligibility flags, and the File Library search did not recover the original supplied `hq_support.txt` source record directly. Missing flags are therefore recovered only from the bounded public 1.19.3 mirror:

- repository: `prisle123/hoi4-archive`
- commit: `228560dc3508a43c1eaef0774f1c0dcc3c954ada`

This recovery remains **unvalidated**. It is not promoted to `game-file exact`.

No Oracle claim, combat formula, or executable-validation classification changes in this release.
