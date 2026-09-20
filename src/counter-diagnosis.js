const num=value=>Number.isFinite(Number(value))?Number(value):0;
const round=value=>Math.round(num(value)*10)/10;
const normalizeSide=side=>side==='defender'?'defender':'attacker';

export function effectiveAttack(stats,target){
  const hardness=Math.max(0,Math.min(1,num(target?.hardness)));
  return num(stats?.soft)*(1-hardness)+num(stats?.hard)*hardness;
}

export function matchupPriorityScore(base,candidate,target,{side='attacker',battlefield={}}={}){
  side=normalizeSide(side);
  const pressureGain=effectiveAttack(candidate,target)-effectiveAttack(base,target),survivalKey=side==='defender'?'def':'breakthrough',survivalGain=num(candidate?.[survivalKey])-num(base?.[survivalKey]),orgGain=num(candidate?.org)-num(base?.org),airGain=num(candidate?.airAttack)-num(base?.airAttack);
  let score=pressureGain*.12+survivalGain*.035+orgGain*.08;
  if(num(base?.piercing)<num(target?.armor)&&num(candidate?.piercing)>=num(target?.armor))score+=120;
  else if(num(base?.piercing)<num(target?.armor))score+=(num(candidate?.piercing)-num(base?.piercing))*.8;
  if(num(base?.armor)<=num(target?.piercing)&&num(candidate?.armor)>num(target?.piercing))score+=90;
  if(num(base?.armor)>num(target?.piercing)&&num(candidate?.armor)<=num(target?.piercing))score-=75;
  const air=num(battlefield?.air),enemyAirSuperiority=side==='attacker'?air< -1e-9:air>1e-9;
  if(enemyAirSuperiority)score+=airGain*.35;
  score-=Math.max(0,num(candidate?.supply)-num(base?.supply))*.6;
  return score;
}

export function diagnoseMatchup(yours,target,{side='attacker',battlefield={}}={}){
  side=normalizeSide(side);
  const yourPiercing=num(yours?.piercing),targetArmor=num(target?.armor),targetPiercing=num(target?.piercing),yourArmor=num(yours?.armor),hardness=Math.max(0,Math.min(1,num(target?.hardness))),notes=[],priorities=[];
  if(targetArmor>0&&yourPiercing<targetArmor){notes.push({tone:'stop',title:'Cross the armor threshold',detail:`Your ${round(yourPiercing)} piercing is below ${round(targetArmor)} target armor. Piercing-focused changes can create an outsized matchup swing.`});priorities.push('piercing');}
  else if(targetArmor>0)notes.push({tone:'good',title:'Armor threshold already cleared',detail:`Your ${round(yourPiercing)} piercing already clears ${round(targetArmor)} target armor. Extra piercing is only useful when it brings other value too.`});
  if(yourArmor>0&&targetPiercing<yourArmor)notes.push({tone:'good',title:'Preserve your armor advantage',detail:`Target piercing (${round(targetPiercing)}) is below your armor (${round(yourArmor)}). A cheaper counter can still be a bad trade if it gives this threshold away.`});
  else if(yourArmor>0){notes.push({tone:'warn',title:'Your armor is already pierced',detail:`Target piercing (${round(targetPiercing)}) reaches your armor (${round(yourArmor)}). More armor only matters if a change moves back above the threshold.`});priorities.push('armor');}
  if(hardness>=.6){notes.push({tone:'warn',title:'Hard attack is high-value here',detail:`The target is ${Math.round(hardness*100)}% hard, so hard attack contributes heavily to damage against it.`});priorities.push('hard-attack');}
  else if(hardness<=.35){notes.push({tone:'warn',title:'Soft attack is high-value here',detail:`The target is only ${Math.round(hardness*100)}% hard, so soft attack is the more efficient damage stat against it.`});priorities.push('soft-attack');}
  else {notes.push({tone:'warn',title:'Use a mixed damage profile',detail:`The target is ${Math.round(hardness*100)}% hard, so both soft and hard attack contribute materially.`});priorities.push('mixed-attack');}
  const survivalKey=side==='defender'?'def':'breakthrough',survival=num(yours?.[survivalKey]),incoming=effectiveAttack(target,yours);
  if(incoming>survival*1.05){const label=side==='defender'?'defense':'breakthrough';notes.push({tone:'warn',title:`More ${label} can matter`,detail:`Target effective attack is about ${round(incoming)} against ${round(survival)} ${label}. Counter search will value edits that improve staying power as well as damage.`});priorities.push(label);}
  const air=num(battlefield?.air),enemyAirSuperiority=side==='attacker'?air< -1e-9:air>1e-9;
  if(enemyAirSuperiority){notes.push({tone:'warn',title:'Enemy air superiority makes AA relevant',detail:'The selected side is suffering the modeled enemy-air-superiority penalty, so Counter search gives air-attack improvements additional priority.'});priorities.push('air-attack');}
  const enemyCas=side==='defender'&&num(battlefield?.cas)>1e-9;
  if(enemyCas)notes.push({tone:'warn',title:'Enemy CAS support is active',detail:'CAS boosts the attacker in this resolver, but direct AA-versus-CAS damage or mitigation is not executed here. Counter does not prioritize AA from CAS alone.'});
  return {yourPierces:yourPiercing>=targetArmor,targetPierces:targetPiercing>=yourArmor,hardness,yourPressure:effectiveAttack(yours,target),targetPressure:effectiveAttack(target,yours),priorities:[...new Set(priorities)],notes:notes.slice(0,6)};
}
