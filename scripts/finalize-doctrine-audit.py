from pathlib import Path

p=Path('DATA_AUDIT_1.19.2.md')
text=p.read_text()
old='| Doctrines | Not started | Not started | Not started | Pending |'
new='| Doctrines | **PASS — 21 files / 121 doctrine nodes** | **PASS — 121/121 raw-record fingerprints** | **PASS for current Land/Air planner surfaces; unsupported formula paths explicitly deferred** | **Certified source layer / bounded runtime** |'
if old in text:
    text=text.replace(old,new,1)
elif new not in text:
    raise SystemExit('Doctrine matrix anchor missing')

section='''

## Phase 5 — Doctrines

Status: **PASS — complete 1.19.2 doctrine source layer certified; current Land/Air planner runtime certified within an explicit bounded effect surface**

### D-001 — complete source inventory — PASS

An independent census of the supplied vanilla 1.19.2 `common/doctrines/` tree identifies exactly **21 doctrine source files / 121 doctrine nodes**: **12 grand doctrines, 14 tracks, and 95 subdoctrines**. The audit also preserves **36 doctrine-labelled metadata records** separately: 32 AI strategy/ratio definitions plus the four `land`, `air`, `naval`, and `special_forces` folder descriptors. Those metadata records are no longer mixed into the selectable doctrine-node catalog.

The old compact bundle was missing nine real source nodes. They are now restored from the supplied files: the naval grand doctrines `new_fleet_in_being`, `new_convoy_raiding`, and `new_base_strike`, plus the capital-ship subdoctrines `line_of_battle`, `battlecruiser_supremacy`, `armored_raiders`, `coastal_defence_fleet`, `naval_gunfire_support`, and `battleship_antiair_screen`.

The certified corpus preserves **474 ordered reward nodes** and **44 grand-doctrine milestone nodes**. Every current Land and Air doctrine choice exposed by the planner resolves to a source-pack record.

### D-002 — exact value certification — PASS

`doctrine-source-manifest-1192.js` records the 21 source-file SHA-256 values and exact ID inventory. A separate independent extraction produced a canonical SHA-256 fingerprint for the raw normalized payload of every doctrine record. Permanent CI compares the runtime bundle against those fingerprints: **121 / 121 records match, 0 mismatches**.

This validates source values, reward insertion order, milestone order, track assignment, XP metadata, source gates, DLC visibility metadata, tactics unlocks, category blocks, global modifiers, and the restored naval records without substituting wiki/public approximations.

### D-003 — requirements remain informational — PASS

Doctrine `available`, `visible`, `allowed`, and XOR data are preserved as requirement metadata. AI-only conditions are excluded from player prerequisite summaries, and generic doctrine AI/folder definitions are stored outside the doctrine-node catalog. DLC, technology, country, and similar gates do **not** lock otherwise structurally valid theorycraft selections.

This preserves the project-wide theorycraft-first rule.

### D-004 — Land doctrine runtime — PASS for certified planner-consumed fields

The source-pack path applies doctrine effects directly to the planner's current land-unit stat model. Certified unit fields are soft attack, hard attack, defense, breakthrough, piercing, air attack, organization, HP/strength, combat width, and supply consumption. Flat `supply_consumption` is applied as a flat base-stat change; it is not treated as a percentage. Global `supply_consumption_factor` is then applied after flat supply changes. Source `land_night_attack` feeds the battle runtime.

Permanent real-pack tests cover Superior Firepower category bonuses, Armored Spearhead reward order and organization, mastery-5 milestone selection, Mass Assault flat supply changes, and global supply-factor propagation.

Fields not represented by an audited downstream planner formula are deliberately **not** applied. Examples include doctrine `maximum_speed`, planning accumulation/max-planning modifiers, maximum entrenchment, reinforce rate, organization-loss rules, command-power effects, training rules, design-cost factors, and specialized terrain/equipment/script blocks. Their source values remain preserved and are classified for later movement/combat/production/defines audits rather than silently mapped to unrelated planner fields.

### D-005 — Air doctrine runtime — PASS for certified Air Lab fields

Air doctrine category matching now uses the exact 1.19 category vocabulary and source equipment types, including fighter, carrier fighter, heavy fighter, CAS, carrier CAS, naval bomber, carrier naval bomber, maritime patrol, tactical bomber, strategic bomber, and scout-plane targets. Global effects from every selected Air track are evaluated; category-scoped blocks then self-filter against the aircraft rather than being skipped because the track was considered "irrelevant" by a size heuristic.

The bounded runtime supports source aircraft stat factors used by the Air Lab and the audited mission-efficiency fields for air superiority, CAS, naval strike, and general air mission efficiency. It also supports audited global aircraft factors for ground attack, range, fuel consumption, and strategic-bomber defense where applicable.

`air_cas_present_factor` is **not** treated as Air Lab mission efficiency; it belongs to land-combat CAS resolution. Air-superiority/interception detection modifiers are preserved as exact source data but deliberately deferred until the dedicated detection/combat formula path is audited, preventing cross-mission leakage.

### D-006 — Naval and Special Forces doctrine boundary — SOURCE-CERTIFIED / runtime intentionally not invented

All Naval and Special Forces doctrine records are present and exact in the 121-record source corpus, including their complete rewards and milestones. The current planner does not expose dedicated Naval Doctrine or Special Forces Doctrine runtime surfaces, so these effects are retained as certified source data rather than being forced through Land/Air calculations. This is an explicit product-scope boundary, not a source-data gap.

### Doctrine certification classification

- **Game-file exact:** 21 source files, 121 doctrine records, 36 separated metadata records, 474 rewards, 44 milestones, raw values, track topology, gates and source ordering.
- **Executable inferred / planner-consumed and regression-tested:** current Land and Air stat application described above, including additive-before-factor supply handling and source category targeting.
- **Explicitly deferred:** unsupported movement/planning/entrenchment/reinforcement/training/command/equipment/script effects; mission-specific Air detection and land-combat CAS-presence behavior; Naval/Special Forces runtime; any exact executable ordering or formula behavior assigned to later combat/production/defines audits.

Permanent certification coverage is provided by `doctrine-parser-certification.test.mjs`, `doctrine-source-certification.test.mjs`, `doctrine-audit-coverage.test.mjs`, `doctrine-effect-coverage.test.mjs`, `doctrine-runtime-certification.test.mjs`, and the existing doctrine regression tests.
'''
if '## Phase 5 — Doctrines' not in text:
    text=text.rstrip()+section+'\n'
p.write_text(text)
