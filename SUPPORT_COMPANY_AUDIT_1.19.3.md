# HOI4 War Planner — Support Company Audit 1.19.3

Date: 2026-09-19  
Target: Hearts of Iron IV 1.19.3.0.c01a / base checksum 5632  
Production baseline at audit start: 0.17.1 / `d4385fd8ebca77e1689ebc18d4310647a121a11a`

## Evidence boundary

The structural catalog and the changed 1.19.3 land-unit fields below are **game-file exact** from the certified bundled source material.

Certified source archive hashes retained by the project:

- common archive SHA-256: `0161171c32b58bb50e6fbf4d34deb3d0b00526f23bc4be4f91a8bb740ee3a8ae`
- English localization archive SHA-256: `5d63fe3a04f31992c1ebf8da56afe6a58b94a089055e0267fc14beb3c9ee5ede`

The original full source archives are not retained in GitHub and were not recoverable from File Library during this audit. The compact certified runtime pack retains the fields used for the existing combat/stat model, but its original parser omitted several support-company utility fields. Those omitted effects are **not** silently reconstructed from general knowledge.

## Structural result

The 1.19.3 source catalog separates support units into three distinct sets:

- **43 normal divisional support companies/units** for the Division Designer support rail;
- **14 regimental support companies** for the per-regiment support row;
- **11 Army-HQ-only staff/support records** that reuse the divisional-support category internally but must not appear as normal division support choices.

Production 0.17.1 incorrectly built the normal support list by taking every hydrated support that was not regimental. That leaked the 11 HQ-only records into the Division Designer. The audit replaces that negative filter with a positive source-category catalog and an explicit HQ exclusion.

### 43 normal divisional support records

`airborne_light_armor`  
`anti_air`  
`anti_tank`  
`armored_car_recon`  
`armored_engineer`  
`armored_maintenance`  
`armored_signal`  
`artillery`  
`assault_engineer`  
`blackshirt_assault_battalion`  
`elephantry`  
`engineer`  
`field_hospital`  
`heavy_flame_tank`  
`helicopter_brigade`  
`helicopter_field_hospital`  
`helicopter_recon`  
`helicopter_transport`  
`jungle_pioneers_support`  
`land_cruiser`  
`light_flame_tank`  
`light_tank_recon`  
`logistics_company`  
`long_range_patrol_support`  
`maintenance_company`  
`medium_flame_tank`  
`military_police`  
`mot_recon`  
`motorized_military_police`  
`northern_territory_recon_support`  
`pioneer_support`  
`rangers_support`  
`recon`  
`rocket_artillery`  
`self_propelled_super_heavy_artillery`  
`signal_company`  
`sturmtruppe_battalion`  
`super_heavy_armor`  
`super_heavy_artillery`  
`super_heavy_sp_anti_air_brigade`  
`super_heavy_sp_artillery_brigade`  
`super_heavy_tank_destroyer_brigade`  
`winter_logistics_support`

The runtime aliases the ordinary source IDs `artillery`, `anti_tank`, `anti_air`, `logistics_company`, `maintenance_company`, and `signal_company` to the planner's existing IDs `support_artillery`, `support_at`, `support_aa`, `logistics`, `maintenance`, and `signal`.

### 14 regimental support records

`anti_air_battery` — Anti-Air Battery  
`anti_tank_battery` — Anti-Tank Battery  
`field_guns` — Infantry Guns  
`fire_support` — Heavy Weapons Company  
`heavy_sp_anti_air_support` — Heavy SP Anti-Air Support  
`heavy_tank_destroyer_support` — Heavy Tank Destroyer Support  
`light_sp_anti_air_support` — Light SP Anti-Air Support  
`light_tank_destroyer_support` — Light Tank Destroyer Support  
`medium_sp_anti_air_support` — Medium SP Anti-Air Support  
`medium_tank_destroyer_support` — Medium Tank Destroyer Support  
`modern_sp_anti_air_support` — Modern SP Anti-Air Support  
`modern_tank_destroyer_support` — Modern Tank Destroyer Support  
`mot_fire_support` — Motorized Heavy Weapons Company  
`rocket_battery` — Regimental Rocket Battery

The existing 1.19.3 structural compatibility matrix is retained. The audit found no evidence that the identities themselves were wrong; the deeper problems were runtime catalog leakage, stale placeholder routing, and incomplete support-effect retention.

### 11 HQ-only support records excluded from normal divisions

`hq_air_liaison`  
`hq_engineer`  
`hq_field_hospital`  
`hq_logistics`  
`hq_maintenance`  
`hq_military_police`  
`hq_naval_liaison`  
`hq_recon`  
`hq_signal`  
`hq_specops`  
`hq_support_company`

These records remain in the hydrated source data because Army HQ templates need them. They are simply not valid choices for the normal division support rail.

## 1.19.3 regimental balance certification

The compact 1.19.3 source overlay and the official 1.19.3 patch agree on the changed regimental-support values covered by this audit:

- Heavy Weapons Company and Motorized Heavy Weapons Company: organization 30 and max strength 0.6.
- Infantry Guns and Regimental Rocket Battery: six pieces of equipment and -75% Soft Attack / Hard Attack / Defense / Breakthrough equipment-stat scaling.
- Anti-Air Battery: 16 AA pieces, 180 manpower, and -60% Soft Attack / Hard Attack / Defense / Breakthrough scaling.
- Anti-Tank Battery: 180 manpower and -60% Soft Attack scaling; its retained AT modifiers remain source-backed.
- Light/medium/heavy/modern TD regimental supports: 15 vehicles, -66% armor and soft attack, -50% defense and hard attack, with chassis-specific breakthrough retained from source.
- Light/medium/heavy/modern SPAA regimental supports: 15 vehicles, -66% armor/soft/hard attack, -50% defense, -25% air attack, with chassis-specific breakthrough retained from source.

The official 1.19.3 notes also state that TD-RS/SPAA-RS fuel consumption was changed and that their technology scaling is intentionally separate from line TD/SPAA. Fuel is currently outside the planner's retained sub-unit field set and is therefore not claimed as modeled by this audit.

## Runtime defects found

### 1. HQ records leaked into normal Division Support

**Status: fixed on audit branch.**

The normal support list now comes from a positive 1.19.3 divisional-support catalog and explicitly excludes HQ staff.

Saved 0.17.1 support selections are also normalized against the audited catalog so an HQ-only record cannot remain selected after upgrade.

### 2. Stale pre-1.19 placeholder regimental IDs remained in MIO routing

**Status: fixed on audit branch.**

Runtime MIO routing still referenced:

- `regimental_infantry_guns`
- `regimental_at`
- `regimental_aa`

Those are not the current source records. The mappings now target:

- Heavy Weapons / Motorized Heavy Weapons via infantry-equipment MIO effects;
- `field_guns` via artillery equipment;
- `anti_tank_battery` via anti-tank equipment;
- `anti_air_battery` via anti-air equipment;
- armored TD/SPAA regimental supports continue through the tank-variant target path.

### 3. Regimental picker evidence copy was stale

**Status: fixed on audit branch.**

The UI previously described bundled compatibility as a fallback awaiting recertification. The bundled 1.19.3 matrix is already source-certified, so the picker now says it uses the certified 1.19.3 game-file compatibility matrix.

## Remaining support-effect gap

The support-company catalog can be made structurally exact from the retained source pack, but the current compact sub-unit parser does not retain every utility field that makes support companies distinct.

Examples of field families not presently preserved end-to-end include:

- reconnaissance;
- entrenchment;
- reliability / reliability factor;
- equipment capture;
- casualty trickleback;
- experience-loss reduction;
- some recovery/utility modifiers;
- division-wide supply-consumption modifiers;
- some fuel-related support behavior.

This means a support company may now be present in the correct list with correct structural/equipment/combat fields while still not delivering every game-file utility effect in planner calculations.

This is the next support-company accuracy task. It should be done from the original 1.19.3 source files or another source-exact extraction, not by filling values from memory, wiki prose, or old planner fallbacks.

Until those omitted fields are re-ingested and their aggregation is audited:

- catalog membership and retained source fields: **game-file exact**;
- omitted support utility effects: **unvalidated / not modeled**;
- broad division-result parity: not claimed.

## Regression gates

Permanent tests enforce:

- exactly 43 normal divisional support records;
- exactly 14 regimental support records;
- exactly 11 HQ-only support records;
- no overlap among those catalogs;
- all HQ-only records excluded from normal Division Designer choices;
- representative special supports including Elephantry remain available;
- every regimental support uses the 1.19.3 source-backed name and compatibility matrix;
- changed 1.19.3 regimental balance fields remain locked;
- stale placeholder regimental IDs cannot re-enter runtime MIO routing.
