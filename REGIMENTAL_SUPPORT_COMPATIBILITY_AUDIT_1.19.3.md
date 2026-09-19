# HOI4 War Planner — Regimental Support Compatibility Audit 1.19.3

Date: 2026-09-19  
Target: Hearts of Iron IV 1.19.3.0.c01a  
Clean checksum reference: 5632  
Production baseline: 0.17.2  
Branch: `fix/regimental-support-compatibility-0173`

## Trigger

Live testing reported that Regimental Support selection now persists, but the surrounding division/regiment choices are still wrong.

This audit separates two structural questions:

1. Which Regimental Support companies may attach to each source regiment group?
2. Which line battalions are structurally legal in an ordinary division in the first place?

## Regimental Support compatibility result

The 14 Regimental Support records and their supplied 1.19.3 `allowed_battalion_groups` values were rechecked. They were already correct and are not changed by this fix.

### Infantry / Mobile / Combat Support regiments

Allowed:

- Heavy Weapons Company
- Motorized Heavy Weapons Company
- Infantry Guns
- Regimental Rocket Battery
- Anti-Air Battery
- Anti-Tank Battery

### Armor / Mobile Combat Support / Armor Combat Support regiments

Allowed:

- Motorized Heavy Weapons Company
- Light / Medium / Heavy / Modern Tank Destroyer Support
- Light / Medium / Heavy / Modern SP Anti-Air Support

The apparently unusual Motorized Heavy Weapons Company availability across all six regiment groups is source-defined. Likewise TD/SPAA Regimental Support is source-valid for `mobile_combat_support`, not only `armor`.

These compatibility records remain `game-file exact` at the supplied-source structural boundary.

## Root cause found

The compact runtime retained several Army-HQ line battalions but had dropped their source eligibility fields:

- `allow_in_army_hq = yes`
- `allow_in_non_army_hq = no`

Affected source IDs:

- hq_infantry
- hq_motorized
- hq_armored_car
- hq_paratrooper
- hq_light_armor
- hq_medium_armor
- hq_heavy_armor

0.17.1 broadened the ordinary Division Designer from a tiny hard-coded battalion subset to the hydrated source-backed catalog. Because the compact HQ line records no longer carried `allow_in_non_army_hq = no`, the ordinary designer could expose HQ-only battalions as normal division choices.

That is a structural bug. An invalid HQ-only line battalion can create a regiment group that then drives otherwise-correct Regimental Support filtering.

## Evidence boundary for the recovered HQ fields

The missing HQ eligibility fields are recovered by a bounded cross-check against:

- repository: `prisle123/hoi4-archive`
- commit: `228560dc3508a43c1eaef0774f1c0dcc3c954ada`
- source file: `common/units/hq_support.txt`

The recovery is deliberately labeled `unvalidated`, not `game-file exact`, because these specific omitted fields were not retained in the compact certified runtime record.

The recovery is lower-precedence than retained source data. It only fills an undefined eligibility field and does not overwrite a retained value.

## Runtime correction

Ordinary Division Designer battalion choices now require:

`allowInNonArmyHq !== false`

This restriction applies consistently to:

- picker options;
- initial template normalization;
- saved templates;
- imported templates;
- copied templates after normalization;
- battle/stat aggregation;
- exported normal-division battalion counts.

Army-HQ-only line battalions therefore cannot survive inside an ordinary division and cannot drive Regimental Support compatibility.

Locked-regiment picker filtering also uses the same source regiment-group resolver used by Regimental Support rather than relying on a simplified display group.

## Theorycraft boundary

This fix does **not** turn research, DLC, focus, Special Project, or national unlock prerequisites into hard locks.

Theorycraft-first behavior remains unchanged. The new exclusion is structural: Army-HQ-only versus ordinary-division eligibility.

## Regression coverage

A dedicated 1.19.3 regression now locks:

- all HQ-only line battalions present in the runtime out of ordinary divisions;
- the six source regiment groups;
- representative infantry, mobile, artillery, motorized-artillery, armor, and armored-combat-support classifications;
- all 14 Regimental Support choices against all six regiment groups;
- the distinction between mirror-backed HQ eligibility recovery and supplied-source-exact Regimental Support compatibility.

## Oracle boundary

No Oracle evidence is changed.

This is a source-structure / planner-runtime correction only. It does not validate or alter combat formulas, Regimental Support `battalion_mult` ordering, or broad resolver parity.
