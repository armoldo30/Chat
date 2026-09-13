const num=value=>Number.isFinite(Number(value))?Number(value):0;
const round=value=>Math.round(num(value)*10)/10;

export function effectiveAttack(stats,target){
  const hardness=Math.max(0,Math.min(1,num(target?.hardness)));
  return num(stats?.soft)*(1-hardness)+num(stats?.hard)*hardness;
}

export function diagnoseMatchup(yours,target){
  const yourPiercing=num(yours?.piercing),targetArmor=num(target?.armor);
  const targetPiercing=num(target?.piercing),yourArmor=num(yours?.armor);
  const hardness=Math.max(0,Math.min(1,num(target?.hardness)));
  const notes=[];
  if(targetArmor>0&&yourPiercing<targetArmor)notes.push({tone:'stop',title:'Cross the armor threshold',detail:`Your ${round(yourPiercing)} piercing is below ${round(targetArmor)} target armor. Piercing-focused changes can create an outsized matchup swing.`});
  else if(targetArmor>0)notes.push({tone:'good',title:'Armor threshold already cleared',detail:`Your ${round(yourPiercing)} piercing already clears ${round(targetArmor)} target armor. Extra piercing is only useful when it brings other value too.`});
  if(yourArmor>0&&targetPiercing<yourArmor)notes.push({tone:'good',title:'Preserve your armor advantage',detail:`Target piercing (${round(targetPiercing)}) is below your armor (${round(yourArmor)}). A cheaper counter can still be a bad trade if it gives this threshold away.`});
  else if(yourArmor>0)notes.push({tone:'warn',title:'Your armor is already pierced',detail:`Target piercing (${round(targetPiercing)}) reaches your armor (${round(yourArmor)}). More armor only matters if a change moves back above the threshold.`});
  if(hardness>=.6)notes.push({tone:'warn',title:'Hard attack is high-value here',detail:`The target is ${Math.round(hardness*100)}% hard, so hard attack contributes heavily to damage against it.`});
  else if(hardness<=.35)notes.push({tone:'warn',title:'Soft attack is high-value here',detail:`The target is only ${Math.round(hardness*100)}% hard, so soft attack is the more efficient damage stat against it.`});
  else notes.push({tone:'warn',title:'Use a mixed damage profile',detail:`The target is ${Math.round(hardness*100)}% hard, so both soft and hard attack contribute materially.`});
  return {yourPierces:yourPiercing>=targetArmor,targetPierces:targetPiercing>=yourArmor,hardness,yourPressure:effectiveAttack(yours,target),targetPressure:effectiveAttack(target,yours),notes};
}
