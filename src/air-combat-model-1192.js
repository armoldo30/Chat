const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// Airframe/module inputs are game-file exact elsewhere in the 1.19.2 pack. The
// dogfight formula below is executable-inferred: it follows the post-1.13
// documented Air combat equation and values that remain externally corroborated,
// but the retained compact 1.19.2 Defines slice does not contain the NAir block.
// Do not promote these constants to game-file exact until the authoritative
// 1.19.2 NAir source is recovered or the executable is Oracle-validated.
export const AIR_COMBAT_MODEL_1192=Object.freeze({
  evidenceClass:'executable-inferred',
  model:'post-1.13-dogfight-equation',
  baseDamageFactor:0.20,
  damageScale:0.01,
  agilityDamageReduction:0.45,
  agilityRatioCap:4.0,
  relativeSpeedBonus:0.65,
  speedRatioCap:3.5,
  absoluteSpeedBonus:0.025,
  absoluteSpeedCap:800,
  multiPlaneCap:3.0,
  carrierDamageFactor:5.0,
  // The Air Lab's Sorties control is retained as an analytical exposure horizon.
  // 1000 = one reference combat-exposure unit; this scale is NOT source-exact.
  referenceSorties:1000,
  horizonEvidenceClass:'planner-analytical'
});

const safe=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;

export function airCombatEngagement(attackerCount,defenderCount,{missionEfficiency=1,detection=1}={}){
  const attackers=Math.max(0,safe(attackerCount)),defenders=Math.max(0,safe(defenderCount));
  // Mission efficiency affects how much of the wing can participate. Values over
  // 100% cannot create aircraft; they are retained separately as operationalTempo.
  const mission=Math.max(0,clamp(safe(missionEfficiency,1),0,1.25));
  const participation=Math.min(1,mission),operationalTempo=Math.max(1,mission);
  const detectionFraction=clamp(safe(detection,1),0,1);
  const detectedTargets=defenders*detectionFraction;
  const availableAttackers=attackers*participation;
  const engagementCap=detectedTargets*AIR_COMBAT_MODEL_1192.multiPlaneCap;
  const engagedAttackers=Math.min(availableAttackers,engagementCap);
  return {attackers,defenders,missionEfficiency:mission,participation,operationalTempo,detectionFraction,detectedTargets,availableAttackers,engagementCap,engagedAttackers};
}

export function airDogfightDamage(attacker,defender,engagedAttackers,{carrierCombat=false}={}){
  const n=Math.max(0,safe(engagedAttackers));
  const attack=Math.max(0,safe(attacker?.airAttack));
  const defense=Math.max(1,safe(defender?.airDefense,1));
  const attackerAgility=Math.max(0.001,safe(attacker?.agility,0.001));
  const defenderAgility=Math.max(0.001,safe(defender?.agility,0.001));
  const attackerSpeed=Math.max(0.001,safe(attacker?.maxSpeed,0.001));
  const defenderSpeed=Math.max(0.001,safe(defender?.maxSpeed,0.001));

  const baseDamage=n*attack*AIR_COMBAT_MODEL_1192.baseDamageFactor;

  let agilityMitigation=0,agilityRatio=1;
  if(defenderAgility>attackerAgility){
    agilityRatio=Math.min(defenderAgility/attackerAgility,AIR_COMBAT_MODEL_1192.agilityRatioCap);
    agilityMitigation=baseDamage*AIR_COMBAT_MODEL_1192.agilityDamageReduction*(agilityRatio-1);
  }

  let relativeSpeedBonus=0,absoluteSpeedBonus=0,speedRatio=1;
  if(attackerSpeed>defenderSpeed){
    speedRatio=Math.min(attackerSpeed/defenderSpeed,AIR_COMBAT_MODEL_1192.speedRatioCap);
    relativeSpeedBonus=baseDamage*AIR_COMBAT_MODEL_1192.relativeSpeedBonus*(speedRatio-1);
    absoluteSpeedBonus=baseDamage*AIR_COMBAT_MODEL_1192.absoluteSpeedBonus*Math.min(attackerSpeed/100,AIR_COMBAT_MODEL_1192.absoluteSpeedCap/100);
  }

  const preDefenseDamage=Math.max(0,baseDamage-agilityMitigation+relativeSpeedBonus+absoluteSpeedBonus);
  const carrierFactor=carrierCombat?AIR_COMBAT_MODEL_1192.carrierDamageFactor:1;
  const expectedKills=preDefenseDamage*carrierFactor*AIR_COMBAT_MODEL_1192.damageScale/defense;
  return {expectedKills,baseDamage,agilityMitigation,relativeSpeedBonus,absoluteSpeedBonus,preDefenseDamage,airDefense: defense,agilityRatio,speedRatio,carrierFactor};
}

export function airCombatExposure(sorties){
  return Math.max(0,safe(sorties,AIR_COMBAT_MODEL_1192.referenceSorties))/AIR_COMBAT_MODEL_1192.referenceSorties;
}
