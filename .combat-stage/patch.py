from pathlib import Path


def read(path): return Path(path).read_text()
def write(path,text): Path(path).write_text(text)
def replace_once(text,old,new,label):
    if old not in text: raise SystemExit(f"missing replacement: {label}")
    if text.count(old)!=1: raise SystemExit(f"non-unique replacement {label}: {text.count(old)}")
    return text.replace(old,new,1)
def replace_between(text,start,end,new,label):
    a=text.find(start)
    if a<0: raise SystemExit(f"missing start {label}")
    b=text.find(end,a+len(start))
    if b<0: raise SystemExit(f"missing end {label}")
    return text[:a]+new+text[b:]

# Promote exact combat Defines from the retained 1.19.2 source.
p='src/builtin1192/defines-certification-1192.js'; s=read(p)
s=replace_once(s,"    PEN_VS_AVERAGE:0.40\n","""    PEN_VS_AVERAGE:0.40,
    PIERCING_THRESHOLDS:[1.00,0.75,0.50,0.00],
    PIERCING_THRESHOLD_DAMAGE_VALUES:[1.00,0.80,0.65,0.50],
    LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE:2,
    ENEMY_AIR_SUPERIORITY_DEFENSE:0.75,
    ENEMY_AIR_SUPERIORITY_DEFENSE_STEEPNESS:625,
    AIR_SUPPORT_BASE:0.25,
    PLANNING_MAX:0.3,
    COMBAT_SUPPLY_LACK_ATTACKER_ATTACK:-0.25,
    COMBAT_SUPPLY_LACK_ATTACKER_DEFEND:-0.65,
    COMBAT_SUPPLY_LACK_DEFENDER_ATTACK:-0.35,
    COMBAT_SUPPLY_LACK_DEFENDER_DEFEND:-0.15,
    RIVER_CROSSING_PENALTY:-0.3,
    RIVER_CROSSING_PENALTY_LARGE:-0.6
""",'combat defines')
s=s.replace('plannerConsumedSourceDefineValues:23','plannerConsumedSourceDefineValues:36')
old="""  formulaDeferred:[
    'piercingDamageFactor thresholds and partial-piercing damage factors',
    'supplyModifier interpolation',
    'planning multiplier/cap',
    'CAS land-combat multiplier',
    '168-hour simulation safety horizon',
    'exact define interaction/order inside combat formulas'
  ]"""
new="""  formulaDeferred:[
    'exact define interaction/order inside combat formulas'
  ],
  combatResolvedBy:'Combat formulas audit'"""
s=replace_once(s,old,new,'defines formula deferred')
write(p,s)

# Bind source and bounded executable constants.
p='src/data.js'; s=read(p)
s=replace_once(s,"import { PRODUCTION_SOURCE_1192, PRODUCTION_EXECUTABLE_1192 } from './builtin1192/production-formulas-certification-1192.js';\n","import { PRODUCTION_SOURCE_1192, PRODUCTION_EXECUTABLE_1192 } from './builtin1192/production-formulas-certification-1192.js';\nimport { COMBAT_EXECUTABLE_1192, COMBAT_ANALYTICAL_1192 } from './builtin1192/combat-formulas-certification-1192.js';\n",'data combat import')
s=replace_once(s,"  piercingWeights: { max: D1192_MIL.PEN_VS_AVERAGE, average: 1-D1192_MIL.PEN_VS_AVERAGE }\n};","""  piercingWeights: { max: D1192_MIL.PEN_VS_AVERAGE, average: 1-D1192_MIL.PEN_VS_AVERAGE },
  piercingThresholds: D1192_MIL.PIERCING_THRESHOLDS,
  piercingDamageValues: D1192_MIL.PIERCING_THRESHOLD_DAMAGE_VALUES,
  armoredStrengthDice: D1192_MIL.LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE,
  airSuperiorityAaMaxMitigation: D1192_MIL.ENEMY_AIR_SUPERIORITY_DEFENSE,
  airSuperiorityAaSteepness: D1192_MIL.ENEMY_AIR_SUPERIORITY_DEFENSE_STEEPNESS,
  airSupportBase: D1192_MIL.AIR_SUPPORT_BASE,
  basePlanningMax: D1192_MIL.PLANNING_MAX,
  supplyLackAttackerAttack: D1192_MIL.COMBAT_SUPPLY_LACK_ATTACKER_ATTACK,
  supplyLackAttackerDefend: D1192_MIL.COMBAT_SUPPLY_LACK_ATTACKER_DEFEND,
  supplyLackDefenderAttack: D1192_MIL.COMBAT_SUPPLY_LACK_DEFENDER_ATTACK,
  supplyLackDefenderDefend: D1192_MIL.COMBAT_SUPPLY_LACK_DEFENDER_DEFEND,
  riverCrossingPenalty: Math.abs(D1192_MIL.RIVER_CROSSING_PENALTY),
  riverCrossingPenaltyLarge: Math.abs(D1192_MIL.RIVER_CROSSING_PENALTY_LARGE),
  combatPointScale: COMBAT_EXECUTABLE_1192.combatPointScale,
  simulationSafetyHours: COMBAT_ANALYTICAL_1192.simulationSafetyHours
};""",'combat constants')
write(p,s)

# Activate exact sub-unit terrain blocks in the built-in pack.
p='src/builtin1192.js'; s=read(p)
s=replace_once(s,"import terrainTacticsModifiersCertification1192 from './builtin1192/terrain-tactics-modifiers-certification-1192.js';\n","import terrainTacticsModifiersCertification1192 from './builtin1192/terrain-tactics-modifiers-certification-1192.js';\nimport { SUBUNIT_TERRAIN_1192, SUBUNIT_TERRAIN_SOURCE_1192 } from './builtin1192/subunit-terrain-1192.js';\n",'builtin terrain import')
s=replace_once(s,"export const BUILTIN_1192=JSON.parse(text);\n","""export const BUILTIN_1192=JSON.parse(text);
for(const [id,mods] of Object.entries(SUBUNIT_TERRAIN_1192))if(BUILTIN_1192.subUnits?.[id])BUILTIN_1192.subUnits[id].terrainModifiers=JSON.parse(JSON.stringify(mods));
""",'builtin terrain overlay')
s=s.replace("plannerConsumedDefineCount:23,plannerAnalyticalDefineCount:1","plannerConsumedDefineCount:36,plannerAnalyticalDefineCount:0")
s=replace_once(s,"definesSourceSha256:'405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4'};","definesSourceSha256:'405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4',subUnitTerrainCertification:'game-file-exact',subUnitTerrainRecordCount:SUBUNIT_TERRAIN_SOURCE_1192.recordCount,subUnitTerrainBlockCount:SUBUNIT_TERRAIN_SOURCE_1192.terrainBlockCount,subUnitTerrainSha256:SUBUNIT_TERRAIN_SOURCE_1192.canonicalSha256};",'builtin meta')
write(p,s)

# Replace audited engine formula sections.
p='src/engine.js'; s=read(p)
s=replace_between(s,'export function calcDivision','export function aggregateDivision',read('.combat-stage/calc-division.txt'),'calcDivision')
s=replace_between(s,'function effectiveAttack','function hashSeed',read('.combat-stage/helpers.txt'),'combat helpers')
s=replace_between(s,'function sampleHits','function rollDamage',read('.combat-stage/sample-hits.txt'),'sample hits')
s=replace_between(s,'export function battleContext','export function simulateOnce',read('.combat-stage/battle-context.txt'),'battleContext')
s=replace_between(s,'export function simulateOnce','function wilsonInterval',read('.combat-stage/simulate-once.txt'),'simulateOnce')
write(p,s)

# Land-combat Ground Support now consumes source air_cas_present_factor.
p='src/doctrine.js'; s=read(p)
s=replace_once(s,"      else if(key==='ground_attack_factor')variant.groundAttack=(variant.groundAttack||0)+v;\n","      else if(key==='ground_attack_factor')variant.groundAttack=(variant.groundAttack||0)+v;\n      else if(key==='air_cas_present_factor')ctx.groundSupport=(ctx.groundSupport||0)+v;\n",'air cas doctrine')
s=replace_once(s,"  return {state,variant,mission,detection:0,source:'game-pack',used};\n","  return {state,variant,mission,detection:0,groundSupport:ctx.groundSupport||0,source:'game-pack',used};\n",'air imported return')
s=replace_once(s,"  return {state,variant,mission,detection};\n","  return {state,variant,mission,detection,groundSupport:0};\n",'air fallback return')
write(p,s)

# Source-bound defaults and selected air-doctrine Ground Support.
p='src/main.js'; s=read(p)
s=replace_once(s,"air:0,cas:0,planning:.30,night:0,runs:500,seed:1944","air:0,cas:0,planning:COMBAT_CONSTANTS.basePlanningMax,night:0,runs:500,seed:1944",'planning default')
old="function battleOpts(){const ag=techData('attacker').doctrineGlobal||{},dg=techData('defender').doctrineGlobal||{};return {...state.battlefield,entrench:(Number(state.battlefield.entrench)||0)*(1+(dg.entrenchment||0)),attackerNightAttackBonus:ag.nightAttack||0,defenderNightAttackBonus:dg.nightAttack||0,terrainData:terrain};}"
new="function battleOpts(){const ag=techData('attacker').doctrineGlobal||{},dg=techData('defender').doctrineGlobal||{},airDoctrine=airDoctrineEffects(ensureTechState('attacker').airDoctrine,null,state.dataPack);return {...state.battlefield,entrench:(Number(state.battlefield.entrench)||0)*(1+(dg.entrenchment||0)),attackerNightAttackBonus:ag.nightAttack||0,defenderNightAttackBonus:dg.nightAttack||0,attackerGroundSupportBonus:airDoctrine.groundSupport||0,terrainData:terrain};}"
s=replace_once(s,old,new,'battleOpts')
s=replace_once(s,'<option value="0.3" ${+state.battlefield.river===.3?\'selected\':\'\'}>Small</option><option value="0.6" ${+state.battlefield.river===.6?\'selected\':\'\'}>Large</option>','<option value="${COMBAT_CONSTANTS.riverCrossingPenalty}" ${+state.battlefield.river===COMBAT_CONSTANTS.riverCrossingPenalty?\'selected\':\'\'}>Small</option><option value="${COMBAT_CONSTANTS.riverCrossingPenaltyLarge}" ${+state.battlefield.river===COMBAT_CONSTANTS.riverCrossingPenaltyLarge?\'selected\':\'\'}>Large</option>','river UI source values')
write(p,s)

# Expand Defines regression counts.
p='tests/defines-audit-coverage.test.mjs'; s=read(p)
s=s.replace("assert.equal(military.length,20,'20 planner-consumed NMilitary source defines are exact');","assert.equal(military.length,33,'33 planner-consumed NMilitary source defines are exact after Combat formulas audit');")
s=s.replace("assert.equal(military.length+production.length,23,'all source-backed planner-consumed define values are classified');","assert.equal(military.length+production.length,36,'all source-backed planner-consumed define values are classified');")
s=s.replace("plannerConsumedSourceDefineValues,23","plannerConsumedSourceDefineValues,36")
s=s.replace("sourceExact:23","sourceExact:36")
s=s.replace("assert.ok(DEFINES_CERTIFICATION_1192.formulaDeferred.includes('exact define interaction/order inside combat formulas'));","assert.equal(DEFINES_CERTIFICATION_1192.combatResolvedBy,'Combat formulas audit');\nassert.deepEqual(DEFINES_CERTIFICATION_1192.formulaDeferred,['exact define interaction/order inside combat formulas']);")
write(p,s)

p='tests/defines-runtime-certification.test.mjs'; s=read(p)
s=s.replace("assert.equal(BUILTIN_1192.meta.plannerConsumedDefineCount,23);","assert.equal(BUILTIN_1192.meta.plannerConsumedDefineCount,36);\nassert.equal(BUILTIN_1192.meta.plannerAnalyticalDefineCount,0);")
write(p,s)

# Register permanent Combat test.
p='package.json'; s=read(p)
s=replace_once(s,"node tests/production-formulas-certification.test.mjs && node tests/air-doctrine.test.mjs","node tests/production-formulas-certification.test.mjs && node tests/combat-formulas-certification.test.mjs && node tests/air-doctrine.test.mjs",'package combat test')
write(p,s)

# High-level matrix.
p='DATA_AUDIT_1.19.2.md'; s=read(p)
s=s.replace("| Production formulas | Not started | Not started | Not started | Pending |","| Production formulas | **PASS — retained source boundary** | **PASS — source constants + bounded executable formula** | **PASS for current Production Lab model** | **Certified bounded runtime** |")
s=s.replace("| Combat formulas | Not started | Not started | Not started | Pending |","| Combat formulas | **PASS — retained Defines + 72-unit terrain corpus** | **PASS for consumed source values** | **PASS for audited aggregate land-combat model; executable-only systems bounded** | **Certified bounded runtime** |")
if '## Combat formulas audit — 1.19.2' not in s:
    s += "\n\n## Combat formulas audit — 1.19.2\n\nStatus: **PASS candidate — final clean CI required.** See `COMBAT_FORMULAS_AUDIT_1.19.2.md` for the exact source boundary, runtime corrections, permanent regression coverage, and explicitly analytical systems.\n"
write(p,s)
print('combat patch staged')
