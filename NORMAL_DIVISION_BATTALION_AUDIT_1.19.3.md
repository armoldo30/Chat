# HOI4 War Planner — Normal-Division Battalion Eligibility Audit 1.19.3

Date: 2026-09-19  
Target: Hearts of Iron IV 1.19.3.0.c01a  
Tracking issue: #48

## Trigger

Live 0.17.2 QA reported that Regimental Support now functions, but the surrounding division/regiment surface is still wrong.

The Regimental Support source matrix itself was rechecked first:

- all 14 Regimental Support records retain the expected 1.19.3 `allowed_battalion_groups`;
- all 53 currently bundled combat battalions resolve to their retained source regiment group with **zero group-mapping mismatches**.

That moved the audit one layer outward to the ordinary Division Designer battalion catalog.

## Confirmed structural defect

The 1.19.3 source file `common/units/hq_support.txt` defines seven Army-HQ-only line battalions with:

- `allow_in_army_hq = yes`
- `allow_in_non_army_hq = no`

Those seven are:

1. `hq_infantry`
2. `hq_motorized`
3. `hq_armored_car`
4. `hq_paratrooper`
5. `hq_light_armor`
6. `hq_medium_armor`
7. `hq_heavy_armor`

The compact planner runtime currently contains six of them; `hq_armored_car` is not in the compact line-battalion subset.

Before this fix, the six retained HQ-only line battalions could appear in the normal Division Designer because the compact records had lost the HQ-eligibility fields.

## Fix boundary

The normal Division Designer now excludes any battalion with:

`allowInNonArmyHq === false`

The same ordinary-division battalion allowlist is used when:

- building a new grid;
- normalizing saved grids;
- converting counts to a grid;
- calculating division line battalions;
- filling a regiment;
- exporting a template;
- importing a template.

This prevents hidden HQ-only battalions from surviving through saved/imported state even if they are no longer visible in the picker.

## Regimental Support compatibility regression

The six source regiment groups are locked explicitly:

- infantry
- combat_support
- mobile
- mobile_combat_support
- armor
- armor_combat_support

For 1.19.3, ordinary infantry/mobile/combat-support regiments accept:

- Heavy Weapons Company
- Motorized Heavy Weapons Company
- Infantry Guns
- Regimental Rocket Battery
- Anti-Air Battery
- Anti-Tank Battery

Mobile-combat-support, armor, and armor-combat-support regiments accept:

- Motorized Heavy Weapons Company
- Light / Medium / Heavy / Modern Tank Destroyer Support
- Light / Medium / Heavy / Modern SP Anti-Air Support

SP Artillery is intentionally **not** a Regimental Support company in the 1.19.3 source catalog.

## Evidence boundary

Retained supplied/certified fields remain preferred authority.

The missing compact HQ-eligibility flags are recovered only from the bounded public 1.19.3 source mirror:

- repository: `prisle123/hoi4-archive`
- commit: `228560dc3508a43c1eaef0774f1c0dcc3c954ada`

This recovery is **not** promoted to `game-file exact`. It remains separately identified as a public-source-mirror cross-check.

No Oracle claim or executable combat-formula claim is changed by this audit.
