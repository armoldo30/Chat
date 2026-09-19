# HOI4 War Planner — Support Company Audit 1.19.3

Date: 2026-09-19  
Target: Hearts of Iron IV 1.19.3.0.c01a  
Clean checksum reference: 5632  
Branch: `fix/support-company-audit-0172`

## Scope

This audit was opened after live 0.17.1 testing found that Regimental Support selection worked mechanically but the available support-company surface did not represent the complete 1.19.3 source catalog.

The audit covers:

- ordinary divisional support companies;
- regimental support companies;
- source category membership;
- Army-HQ-only support restrictions;
- source display names and abbreviations;
- `same_support_type` structural conflicts;
- source special-effect metadata retained by the planner;
- the current runtime/formula boundary for support-specific mechanics.

## Evidence boundary

The existing production source certification records the user-supplied 1.19.3 common archive digest and a complete source census of 158 sub-units. The production runtime, however, intentionally bundled only a planner-scope subset of those records.

To recover the omitted support surface without asking the user to re-upload files, this audit cross-checked the bundled certified records and 1.19.3 release deltas against the public 1.19.3 source mirror `prisle123/hoi4-archive`, commit `228560dc3508a43c1eaef0774f1c0dcc3c954ada` (commit message `1.19.3`).

Therefore:

- retained user-supplied/certified 1.19.3 values remain `game-file exact`;
- newly reconstructed omitted support records on this branch are source-mirror cross-checks and are **not silently promoted to `game-file exact`** merely because the mirror matches the current game version;
- executable interpretation of support-only mechanics remains bounded separately.

## Source census

The audited support-category surface contains **68 unique support sub-units**:

- **14 Regimental Support** entries;
- **54** entries carrying `category_divisional_support_battalions`.

Of the 54 divisional-category entries, **11 are Army-HQ-only** because source specifies:

- `allow_in_army_hq = yes`
- `allow_in_non_army_hq = no`

Those 11 must not appear in the ordinary Division Designer support picker.

Therefore the ordinary Division Designer support catalog is:

**43 normal divisional support companies**

plus the separate:

**14 Regimental Support companies**

### Army-HQ-only entries excluded from normal divisions

- hq_support_company
- hq_engineer
- hq_recon
- hq_military_police
- hq_maintenance
- hq_field_hospital
- hq_logistics
- hq_signal
- hq_naval_liaison
- hq_air_liaison
- hq_specops

## Regimental Support census

The 14 source entries are:

1. Heavy Weapons Company (`fire_support`, source abbreviation `FSC`)
2. Motorized Heavy Weapons Company (`mot_fire_support`, `FSC`)
3. Infantry Guns (`field_guns`, `IFG`)
4. Regimental Rocket Battery (`rocket_battery`, `RBC`)
5. Anti-Air Battery (`anti_air_battery`, `RAA`)
6. Anti-Tank Battery (`anti_tank_battery`, `RAT`)
7. Light Tank Destroyer Support
8. Medium Tank Destroyer Support
9. Heavy Tank Destroyer Support
10. Modern Tank Destroyer Support
11. Light SP Anti-Air Support
12. Medium SP Anti-Air Support
13. Heavy SP Anti-Air Support
14. Modern SP Anti-Air Support

The direct combat/equipment fields already bundled for these 14 records matched the audited 1.19.3 source cross-check. The principal production defects were catalog completeness, omitted structural metadata, UI abbreviations, and incomplete downstream support-mechanic handling rather than a wholesale wrong 14-record stat table.

## Important structural correction: same_support_type

The previous planner prevented exact duplicate support IDs but did not enforce source `same_support_type` relationships.

Examples now treated as mutually exclusive include:

- Recon / Motorized Recon / Armored Car Recon / Light Tank Recon / specialist recon variants;
- Engineer / Pioneer / Jungle Pioneer / Assault Engineer / Armored Engineer;
- Logistics Company / Helicopter Transport;
- Signal Company / Armored Signal;
- Maintenance Company / Armored Maintenance;
- Field Hospital / Helicopter Field Hospital;
- Military Police / Motorized Military Police;
- Light / Medium / Heavy Flame Tank Companies;
- paired super-heavy artillery support variants where source shares a support type.

The helicopter brigade's source support-type list also conflicts with the appropriate helicopter recon/transport/hospital families.

## Previously omitted examples now recovered

The source-backed audit surface adds or restores entries including:

- Armored Engineer Company
- Assault Engineer Company
- Armored Maintenance Company
- Armored Signal Company
- Helicopter Recon
- Helicopter Transport
- Helicopter Field Hospital
- Motorized Military Police
- Winter Logistics Support
- Long Range Patrol Support
- Super-Heavy Tank Destroyer support
- Super-Heavy SP Artillery support
- Super-Heavy SP Anti-Air support
- specialist/national support units present in the 1.19.3 source category

The planner remains theorycraft-first: source-valid support units stay selectable even when their technology, DLC, Special Project, focus, or national unlock is not currently satisfied. Those requirements are informational rather than hard locks. Structural restrictions such as support type and HQ-only status are enforced.

## Support-specific source mechanics

The source contains mechanics beyond the old planner's basic attack/defense/equipment representation, including:

- `battalion_mult`
- `same_support_type`
- recon
- initiative
- entrenchment
- reliability factor
- equipment capture factor
- supply-consumption factor
- fuel-consumption factor
- casualty trickleback
- experience-loss factor
- suppression factor
- deployed leader modifiers
- HQ eligibility
- enabled abilities

The audit overlay now preserves these fields rather than dropping them.

### Runtime boundary

Preserving a source field does not automatically establish its executable aggregation/order.

Current planner execution already consumes ordinary unit combat/equipment fields and initiative. Some support-only mechanics remain preserved/displayed but are not yet fully applied by the battle resolver.

In particular, `battalion_mult` is source-preserved but its complete executable aggregation/order is not claimed by this audit. Where the UI surfaces these effects, it explicitly identifies them as source-defined support effects whose downstream formula coverage may be partial.

That boundary is intentional: catalog/source correction should not create unsupported executable-parity claims.

## Regression locks

The new support audit regression requires:

- 68 unique support-category source records;
- 14 Regimental Support entries;
- 54 divisional-category entries;
- exactly 11 Army-HQ-only entries;
- 43 normal Division Designer support entries;
- complete English display labels;
- source abbreviations for key regimental support entries;
- exact Regimental Support structural compatibility;
- preservation of newly recovered specialist support entries;
- enforcement of `same_support_type` conflicts;
- exclusion of HQ-only support from ordinary divisions.

## Release status

This audit is isolated from production on `fix/support-company-audit-0172`.

This branch is the **0.17.2 release candidate**. Production remains 0.17.1 until the exact 0.17.2 head passes the full release-candidate gate and is deliberately promoted.
