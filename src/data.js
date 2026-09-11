import { DEFINE_VALUES_1192 } from './builtin1192/defines-certification-1192.js';
import { PRODUCTION_SOURCE_1192, PRODUCTION_EXECUTABLE_1192 } from './builtin1192/production-formulas-certification-1192.js';
import { COMBAT_EXECUTABLE_1192, COMBAT_ANALYTICAL_1192 } from './builtin1192/combat-formulas-certification-1192.js';

export const MODEL_META = {
  appVersion: '0.16.0',
  gameVersion: '1.19.2',
  label: 'Vanilla 1.19.2 bundled game-data baseline',
  confidence: 'Authoritative 1.19.2 game-file data with explicitly analytical executable-only behavior',
  updated: '2026-09-11'
};

export const RESOURCES = ['steel','aluminum','rubber','tungsten','chromium'];
const D1192_MIL=DEFINE_VALUES_1192.NMilitary;
const D1192_PROD=DEFINE_VALUES_1192.NProduction;
export const COMBAT_CONSTANTS = {
  defendedHitChance: 1-D1192_MIL.BASE_CHANCE_TO_AVOID_HIT/100,
  undefendedHitChance: 1-D1192_MIL.CHANCE_TO_AVOID_HIT_AT_NO_DEF/100,
  overWidthPenaltyCap: Math.abs(D1192_MIL.COMBAT_OVER_WIDTH_PENALTY_MAX),
  overWidthPenaltyMultiplier: Math.abs(D1192_MIL.COMBAT_OVER_WIDTH_PENALTY),
  stackingLimitBase: D1192_MIL.COMBAT_STACKING_START,
  stackingLimitPerDirection: D1192_MIL.COMBAT_STACKING_EXTRA,
  stackingPenaltyPerDivision: Math.abs(D1192_MIL.COMBAT_STACKING_PENALTY),
  fortPenaltyPerLevel: Math.abs(D1192_MIL.BASE_FORT_PENALTY),
  entrenchmentPerPoint: Math.abs(D1192_MIL.DIG_IN_FACTOR),
  maxAirSuperiorityPenalty: Math.abs(D1192_MIL.ENEMY_AIR_SUPERIORITY_IMPACT),
  nightAttackPenalty: Math.abs(D1192_MIL.BASE_NIGHT_ATTACK_PENALTY),
  orgDamageModifier: D1192_MIL.LAND_COMBAT_ORG_DAMAGE_MODIFIER,
  strengthDamageModifier: D1192_MIL.LAND_COMBAT_STR_DAMAGE_MODIFIER,
  orgDice: D1192_MIL.LAND_COMBAT_ORG_DICE_SIZE,
  armoredOrgDice: D1192_MIL.LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE,
  strengthDice: D1192_MIL.LAND_COMBAT_STR_DICE_SIZE,
  combatMinimumHours: D1192_MIL.COMBAT_MINIMUM_TIME,
  equipmentCombatLossFactor: D1192_MIL.EQUIPMENT_COMBAT_LOSS_FACTOR,
  armorWeights: { max: D1192_MIL.ARMOR_VS_AVERAGE, average: 1-D1192_MIL.ARMOR_VS_AVERAGE },
  piercingWeights: { max: D1192_MIL.PEN_VS_AVERAGE, average: 1-D1192_MIL.PEN_VS_AVERAGE },
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
};

const P1192=PRODUCTION_SOURCE_1192.defines;
export const PRODUCTION_CONSTANTS = {
  baseFactoryOutput: P1192.BASE_FACTORY_SPEED_MIL,
  poweredFactoryOutput: P1192.POWERED_FACTORY_SPEED_MIL,
  baseStartEfficiency: P1192.BASE_FACTORY_START_EFFICIENCY_FACTOR,
  baseMaxEfficiency: P1192.BASE_FACTORY_MAX_EFFICIENCY_FACTOR,
  efficiencyBaseGain: P1192.BASE_FACTORY_EFFICIENCY_GAIN*PRODUCTION_EXECUTABLE_1192.efficiencyGainScale,
  resourceLackPenaltyPerUnit: Math.abs(D1192_PROD.PRODUCTION_RESOURCE_LACK_PENALTY),
  maxLineResourcePenalty: PRODUCTION_EXECUTABLE_1192.resourceShortagePenaltyCap,
  maxMilitaryFactoriesPerLine: D1192_PROD.MAX_MIL_FACTORIES_PER_LINE
};

// Current 1.19-era combat widths. Attack modifiers are a public-data baseline and remain replaceable by imported game files.
export const terrain = {
  plains:   {name:'Plains',   width:70, reinforceWidth:35, attack: 0.00},
  desert:   {name:'Desert',   width:70, reinforceWidth:35, attack: 0.00},
  forest:   {name:'Forest',   width:60, reinforceWidth:30, attack:-0.15},
  jungle:   {name:'Jungle',   width:60, reinforceWidth:30, attack:-0.30},
  hills:    {name:'Hills',    width:70, reinforceWidth:35, attack:-0.25},
  mountain: {name:'Mountain', width:50, reinforceWidth:25, attack:-0.50},
  marsh:    {name:'Marsh',    width:50, reinforceWidth:25, attack:-0.40},
  urban:    {name:'Urban',    width:80, reinforceWidth:40, attack:-0.30}
};

// IC costs/resources are representative vanilla baselines. Tank/aircraft stats are intentionally editable/replaceable later because designers make them player-specific.
export const equipment = {
  infantry_equipment:{name:'Infantry Equipment',cost:.50,resources:{steel:2}},
  artillery:{name:'Artillery',cost:3.50,resources:{steel:2,tungsten:1}},
  support_equipment:{name:'Support Equipment',cost:4.00,resources:{steel:2}},
  motorized:{name:'Motorized',cost:2.50,resources:{steel:1,rubber:1}},
  mechanized:{name:'Mechanized',cost:8.00,resources:{steel:2,rubber:2}},
  light_tank:{name:'Light Tank',cost:5.50,resources:{steel:2}},
  medium_tank:{name:'Medium Tank',cost:10.0,resources:{steel:3,tungsten:1}},
  heavy_tank:{name:'Heavy Tank',cost:14.0,resources:{steel:4,chromium:1}},
  fighter:{name:'Fighter',cost:24.0,resources:{aluminum:3,rubber:1}},
  cas:{name:'CAS',cost:26.0,resources:{aluminum:3,rubber:1}},
  tactical_bomber:{name:'Tactical Bomber',cost:38.0,resources:{aluminum:4,rubber:2}},
  anti_tank:{name:'Anti-Tank',cost:3.50,resources:{steel:2,tungsten:1}},
  anti_air:{name:'Anti-Air',cost:3.50,resources:{steel:2}}
};

export const armyTemplates = {
  infantry:{name:'9 Infantry + support',equipment:{infantry_equipment:900,support_equipment:30},manpower:9000},
  infantry_artillery:{name:'9 Infantry / 1 Artillery',equipment:{infantry_equipment:900,artillery:36,support_equipment:30},manpower:9500},
  motorized:{name:'9 Motorized',equipment:{infantry_equipment:900,motorized:450,support_equipment:30},manpower:10800},
  medium:{name:'Representative medium armor division',equipment:{medium_tank:250,motorized:250,support_equipment:30},manpower:9000}
};

export const battalions = {
  infantry:{name:'Infantry',group:'infantry',width:2,manpower:1000,org:60,hp:25,supply:.07,soft:6,hard:1,def:22,breakthrough:3,hardness:0,armor:0,piercing:4,airAttack:0,need:{infantry_equipment:100},terrain:{}},
  motorized:{name:'Motorized Infantry',group:'mobile',width:2,manpower:1200,org:60,hp:25,supply:.11,soft:6,hard:1,def:22,breakthrough:3,hardness:0,armor:0,piercing:4,airAttack:0,need:{infantry_equipment:100,motorized:50},terrain:{forest:-.10,jungle:-.20,marsh:-.10,mountain:-.05,urban:-.10}},
  mechanized:{name:'Mechanized Infantry',group:'mobile',width:2,manpower:1200,org:60,hp:30,supply:.18,soft:6.1,hard:5,def:22,breakthrough:8,hardness:.20,armor:12,piercing:8,airAttack:0,need:{infantry_equipment:100,mechanized:50},terrain:{forest:-.10,jungle:-.20,marsh:-.10,mountain:-.05,urban:-.10}},
  artillery:{name:'Line Artillery',group:'infantry',width:3,manpower:500,org:20,hp:5,supply:.16,soft:34,hard:16,def:12,breakthrough:5,hardness:0,armor:0,piercing:24,airAttack:0,need:{artillery:36},terrain:{}},
  anti_tank:{name:'Line Anti-Tank',group:'infantry',width:1,manpower:500,org:20,hp:5,supply:.16,soft:5,hard:18,def:10,breakthrough:4,hardness:0,armor:0,piercing:60,airAttack:0,need:{anti_tank:36},terrain:{}},
  anti_air:{name:'Line Anti-Air',group:'infantry',width:1,manpower:500,org:20,hp:5,supply:.16,soft:8,hard:5,def:10,breakthrough:4,hardness:0,armor:0,piercing:20,airAttack:22,need:{anti_air:36},terrain:{}},
  cavalry:{name:'Cavalry',group:'mobile',width:2,manpower:1000,org:60,hp:25,supply:.08,soft:6,hard:1,def:20,breakthrough:2,hardness:0,armor:0,piercing:4,airAttack:0,need:{infantry_equipment:100},terrain:{}},
  light_armor:{name:'Light Armor (reference)',group:'armor',width:2,manpower:500,org:20,hp:3,supply:.20,soft:18,hard:10,def:8,breakthrough:32,hardness:.80,armor:35,piercing:30,airAttack:0,need:{light_tank:50},terrain:{forest:-.15,jungle:-.25,marsh:-.15,mountain:-.20,urban:-.15}},
  medium_armor:{name:'Medium Armor (reference)',group:'armor',width:2,manpower:500,org:20,hp:3,supply:.22,soft:26,hard:18,def:10,breakthrough:48,hardness:.90,armor:60,piercing:55,airAttack:0,need:{medium_tank:50},terrain:{forest:-.20,jungle:-.30,marsh:-.20,mountain:-.25,urban:-.20}},
  heavy_armor:{name:'Heavy Armor (reference)',group:'armor',width:2,manpower:500,org:20,hp:4,supply:.30,soft:32,hard:28,def:12,breakthrough:58,hardness:.95,armor:90,piercing:75,airAttack:0,need:{heavy_tank:40},terrain:{forest:-.25,jungle:-.35,marsh:-.25,mountain:-.30,urban:-.25}}
};

// Support-company manpower/HP/organization are representative vanilla baselines.
// They are included in division averages so adding support has the same real tradeoff as in the game: more capability, but often lower organization.
export const supports = {
  engineer:{name:'Engineers',manpower:300,org:20,hp:2,soft:0,hard:0,def:0,breakthrough:0,supply:.05,armor:0,piercing:0,airAttack:0,need:{support_equipment:30},terrain:{forest:.10,jungle:.10,marsh:.10,mountain:.10}},
  support_artillery:{name:'Support Artillery',manpower:300,org:0,hp:.2,soft:17,hard:8,def:6,breakthrough:2.5,supply:.04,armor:0,piercing:12,airAttack:0,need:{artillery:12},terrain:{}},
  recon:{name:'Recon',manpower:500,org:20,hp:2,soft:0,hard:0,def:0,breakthrough:0,supply:.02,armor:0,piercing:0,airAttack:0,need:{infantry_equipment:40,support_equipment:10},terrain:{}},
  support_at:{name:'Support Anti-Tank',manpower:300,org:0,hp:.2,soft:2.5,hard:9,def:5,breakthrough:2,supply:.04,armor:0,piercing:45,airAttack:0,need:{anti_tank:24,support_equipment:10},terrain:{}},
  support_aa:{name:'Support Anti-Air',manpower:300,org:0,hp:.2,soft:4,hard:2.5,def:5,breakthrough:2,supply:.04,armor:0,piercing:15,airAttack:18,need:{anti_air:24,support_equipment:10},terrain:{}},
  // Distinct 1.19 regimental-support baselines. These intentionally do not reuse the divisional
  // support records: in the live game both systems can coexist in one template. Exact values are
  // replaced when the user's game files are imported.
  regimental_infantry_guns:{name:'Infantry Guns (Regimental)',manpower:180,org:0,hp:.15,soft:7,hard:2,def:2,breakthrough:1,supply:.10,armor:0,piercing:8,airAttack:0,need:{artillery:4},terrain:{}},
  regimental_at:{name:'Anti-Tank Guns (Regimental)',manpower:180,org:0,hp:.15,soft:1.5,hard:5,def:2,breakthrough:1,supply:.08,armor:0,piercing:32,airAttack:0,need:{anti_tank:8},terrain:{}},
  regimental_aa:{name:'Anti-Air Guns (Regimental)',manpower:180,org:0,hp:.15,soft:2,hard:1.5,def:2,breakthrough:1,supply:.08,armor:0,piercing:10,airAttack:10,need:{anti_air:8},terrain:{}},
  logistics:{name:'Logistics',manpower:500,org:20,hp:1,soft:0,hard:0,def:0,breakthrough:0,supply:-.02,armor:0,piercing:0,airAttack:0,need:{support_equipment:10,motorized:10},terrain:{}},
  signal:{name:'Signal',manpower:500,org:20,hp:1,soft:0,hard:0,def:0,breakthrough:0,supply:.02,armor:0,piercing:0,airAttack:0,initiative:.20,need:{support_equipment:30,motorized:10},terrain:{}}
};

export const rolePresets = {
  line:{name:'Line holder',targetWidth:20,weights:{def:1.5,org:1.2,soft:.6,breakthrough:.15,supply:-.4}},
  assault:{name:'Assault',targetWidth:35,weights:{breakthrough:1.5,soft:1.2,hard:.5,org:.5,supply:-.25}},
  armor:{name:'Armor spearhead',targetWidth:35,weights:{breakthrough:1.25,armor:1.0,soft:.8,hard:.8,org:.45,supply:-.2}},
  anti_armor:{name:'Anti-armor',targetWidth:25,weights:{piercing:1.5,hard:1.1,def:.7,org:.5,supply:-.25}}
};
