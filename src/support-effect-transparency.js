import { SUPPORT_EFFECT_RUNTIME_1193 } from './builtin1193/support-effects-certification-1193.js';

const humanize=value=>String(value||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const signed=value=>{const n=Number(value);return `${n>0?'+':''}${n}`;};
const percent=value=>{const n=Number(value)*100;return `${n>0?'+':''}${Number.isInteger(n)?n:n.toFixed(1)}%`;};
const row=(field,label,value,runtime,display=value)=>Object.freeze({
  field,label,value,display:String(display),runtimeEvidence:runtime.runtimeEvidence,state:runtime.state
});

export function supportSourceEffects(record={}){
  const out=[];
  const combat=SUPPORT_EFFECT_RUNTIME_1193.combat,loss=SUPPORT_EFFECT_RUNTIME_1193.logisticsAndLosses,special=SUPPORT_EFFECT_RUNTIME_1193.specialist;

  if(finite(record.recon)&&Number(record.recon)!==0)out.push(row('recon','Recon',Number(record.recon),combat.recon,signed(record.recon)));
  if(finite(record.entrenchment)&&Number(record.entrenchment)!==0)out.push(row('entrenchment','Entrenchment',Number(record.entrenchment),combat.entrenchment,signed(record.entrenchment)));
  if(finite(record.initiative)&&Number(record.initiative)!==0)out.push(row('initiative','Initiative',Number(record.initiative),combat.initiative,percent(record.initiative)));
  if(finite(record.recovery)&&Number(record.recovery)!==0)out.push(row('recovery','Recovery',Number(record.recovery),combat.recovery,percent(record.recovery)));

  const factorFields=[
    ['reliabilityFactor','Reliability factor',loss.reliabilityFactor],
    ['equipmentCaptureFactor','Equipment capture',loss.equipmentCaptureFactor],
    ['supplyConsumptionFactor','Supply consumption',loss.supplyConsumptionFactor],
    ['fuelConsumptionFactor','Fuel consumption',loss.fuelConsumptionFactor],
    ['casualtyTrickleback','Casualty trickleback',loss.casualtyTrickleback],
    ['experienceLossFactor','Experience loss',loss.experienceLossFactor],
    ['suppressionFactor','Suppression factor',loss.suppressionFactor]
  ];
  for(const [field,label,runtime] of factorFields){
    if(finite(record[field])&&Number(record[field])!==0)out.push(row(field,label,Number(record[field]),runtime,percent(record[field])));
  }
  if(finite(record.suppression)&&Number(record.suppression)!==0)out.push(row('suppression','Suppression',Number(record.suppression),loss.suppression,signed(record.suppression)));
  if(finite(record.maximumSpeed)&&Number(record.maximumSpeed)!==0)out.push(row('maximumSpeed','Maximum speed field',Number(record.maximumSpeed),loss.maximumSpeed,signed(record.maximumSpeed)));

  for(const block of Array.isArray(record.battalionMult)?record.battalionMult:[]){
    if(!block||typeof block!=='object')continue;
    const category=String(block.category||'unspecified category');
    const effects=Object.entries(block).filter(([key])=>!['category','add'].includes(key)).map(([key,value])=>{
      const shown=finite(value)&&Math.abs(Number(value))<=2?percent(value):String(value);
      return `${humanize(key)} ${shown}`;
    });
    out.push(row('battalionMult',`Battalion effect · ${humanize(category)}`,block,combat.battalionMult,effects.join(' · ')||'source block retained'));
  }

  if(record.deployedLeaderModifiers&&typeof record.deployedLeaderModifiers==='object'){
    for(const [key,value] of Object.entries(record.deployedLeaderModifiers)){
      const shown=finite(value)&&Math.abs(Number(value))<=2?percent(value):String(value);
      out.push(row('deployedLeaderModifiers',`Leader modifier · ${humanize(key)}`,value,special.deployedLeaderModifiers,shown));
    }
  }

  for(const ability of Array.isArray(record.enableAbility)?record.enableAbility:[]){
    out.push(row('enableAbility','Enabled ability',ability,special.enableAbility,humanize(ability)));
  }

  return out;
}

export function supportEffectSummary(records=[]){
  const rows=[];
  for(const entry of records||[]){
    const id=entry?.id||entry?.gameId||'',name=entry?.name||id||'Support company';
    const effects=supportSourceEffects(entry);
    if(effects.length)rows.push(Object.freeze({id,name,effects}));
  }
  return rows;
}
