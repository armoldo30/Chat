import { filledInRegiment } from './designer.js';
import { counterTemplateKey } from './counter-candidates.js';
import { counterDivision } from './counter-state-model.js';
import { effectiveAttack } from './counter-diagnosis.js';
import {
  TANK_FAMILIES,TANK_ROLE_LABELS,TANK_GUNS,TANK_TURRETS,TANK_ARMOR_TYPES,TANK_SPECIALS,
  tankRolesForFamily,tankVariantTargets,tankFamilyLabel,tankDesignOptions,normalizeTankDesign,buildTankDesign
} from './tank.js';

const TECH_TIERS={
  infantryEquipment:{label:'Infantry equipment',matches:id=>['infantry','motorized','mechanized','cavalry','mountaineer','marine','paratrooper'].includes(id)},
  artillery:{label:'Artillery equipment',matches:id=>id==='artillery'||id==='support_artillery'||id==='regimental_infantry_guns'||String(id).includes('rocket_artillery')},
  antiTank:{label:'Anti-Tank equipment',matches:id=>id==='anti_tank'||id==='support_at'||id==='regimental_at'},
  antiAir:{label:'Anti-Air equipment',matches:id=>id==='anti_air'||id==='support_aa'||id==='regimental_aa'}
};

const moduleName=(map,id)=>map?.[id]?.name||String(id||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const variantLabel=(family,role)=>`${tankFamilyLabel(family)} ${TANK_ROLE_LABELS[role]||'Tank'}`;
const changeLabel=changes=>changes.join(' + ');

function activeUnitIds(state,grid,supportKeys){
  const ids=new Set((grid||[]).flat().filter(Boolean));
  for(const id of supportKeys||[])if(id)ids.add(id);
  for(let column=0;column<(state.attackerRegimentalSupports||[]).length;column++){
    const id=state.attackerRegimentalSupports[column];if(id&&filledInRegiment(grid,column)>=3)ids.add(id);
  }
  return ids;
}
function withTankVariant(state,family,role,design){
  const attacker={...(state.tankVariants?.attacker||{})},familyMap={...(attacker[family]||{})};familyMap[role]=design;attacker[family]=familyMap;
  return {...state,tankVariants:{...(state.tankVariants||{}),attacker}};
}
function withTechTier(state,field,value){return {...state,attackerTech:{...(state.attackerTech||{}),[field]:value}};}
function tierFingerprint(state){return Object.keys(TECH_TIERS).map(field=>Number(state.attackerTech?.[field])||0);}
export function counterForceKey(grid,supportKeys,state){return JSON.stringify([counterTemplateKey(grid,supportKeys),state.tankVariants?.attacker||{},tierFingerprint(state)]);}

function previewScore(snapshot,state,grid,supportKeys){
  const next=counterDivision(state,'attacker',grid,supportKeys),base=snapshot.attacker,target=snapshot.defender;
  const pressureGain=effectiveAttack(next,target)-effectiveAttack(base,target);
  let score=pressureGain*.12+(next.breakthrough-base.breakthrough)*.04+(next.org-base.org)*.08+(next.def-base.def)*.01;
  if(base.piercing<target.armor&&next.piercing>=target.armor)score+=150;
  else if(base.piercing<target.armor)score+=(next.piercing-base.piercing)*.8;
  if(base.armor<=target.piercing&&next.armor>target.piercing)score+=100;
  if(base.armor>target.piercing&&next.armor<=target.piercing)score-=90;
  return {score,stats:next};
}

function designMutationCandidates(snapshot,state,grid,supportKeys,priorChanges,priorKinds){
  const ids=activeUnitIds(state,grid,supportKeys),out=[];
  for(const family of TANK_FAMILIES)for(const role of tankRolesForFamily(family)){
    const target=tankVariantTargets(family,role);if(!target?.units?.some(unit=>ids.has(unit.id)))continue;
    const raw=state.tankVariants?.attacker?.[family]?.[role];if(!raw||family==='land_cruiser')continue;
    const before=buildTankDesign(raw),options=tankDesignOptions(raw),name=variantLabel(family,role),mutations=[];
    const push=(nextRaw,description,component)=>{
      const normalized=normalizeTankDesign(nextRaw,family,role);if(JSON.stringify(normalized)===JSON.stringify(raw))return;
      const after=buildTankDesign(normalized),nextState=withTankVariant(state,family,role,normalized),preview=previewScore(snapshot,nextState,grid,supportKeys);
      mutations.push({state:nextState,grid,supportKeys,changes:[...priorChanges,description],changeKinds:[...priorKinds,'tank-design'],label:changeLabel([...priorChanges,description]),kind:'tank-design',changeCount:priorChanges.length+1,designChange:{family,role,variant:name,component,before,after},previewScore:preview.score,key:counterForceKey(grid,supportKeys,nextState)});
    };
    for(const id of options.guns||[])if(id!==raw.gun)push({...raw,gun:id},`${name}: gun ${moduleName(TANK_GUNS,raw.gun)} → ${moduleName(TANK_GUNS,id)}`,'gun');
    for(const id of options.turrets||[])if(id!==raw.turret)push({...raw,turret:id},`${name}: turret ${moduleName(TANK_TURRETS,raw.turret)} → ${moduleName(TANK_TURRETS,id)}`,'turret');
    for(const id of options.armorTypes||[])if(id!==raw.armorType)push({...raw,armorType:id},`${name}: armor ${moduleName(TANK_ARMOR_TYPES,raw.armorType)} → ${moduleName(TANK_ARMOR_TYPES,id)}`,'armor type');
    for(let slot=0;slot<(options.specials||[]).length;slot++)for(const id of options.specials[slot]||[])if(id!==(raw.specials?.[slot]||'none')){
      const specials=[...(raw.specials||[])];while(specials.length<(options.specials||[]).length)specials.push('none');specials[slot]=id;
      push({...raw,specials},`${name}: special ${slot+1} ${moduleName(TANK_SPECIALS,raw.specials?.[slot]||'none')} → ${moduleName(TANK_SPECIALS,id)}`,'special module');
    }
    for(const level of [...new Set([Number(raw.armorUpgrades||0)-2,Number(raw.armorUpgrades||0)-1,Number(raw.armorUpgrades||0)+1,Number(raw.armorUpgrades||0)+2,Number(raw.armorUpgrades||0)+4])].filter(x=>x>=0&&x<=20))if(level!==Number(raw.armorUpgrades||0))push({...raw,armorUpgrades:level},`${name}: armor upgrades ${raw.armorUpgrades||0} → ${level}`,'armor upgrades');
    mutations.sort((a,b)=>b.previewScore-a.previewScore||a.designChange.after.buildCost-b.designChange.after.buildCost);out.push(...mutations.slice(0,12));
  }
  return out;
}

function techTierCandidates(snapshot,state,grid,supportKeys,priorChanges,priorKinds){
  const ids=activeUnitIds(state,grid,supportKeys),out=[];
  for(const [field,rule] of Object.entries(TECH_TIERS)){
    if(![...ids].some(rule.matches))continue;const current=Math.max(0,Math.min(3,Number(state.attackerTech?.[field])||0));if(current>=3)continue;
    const next=current+1,nextState=withTechTier(state,field,next),description=`Upgrade ${rule.label} tier ${current} → ${next}`,preview=previewScore(snapshot,nextState,grid,supportKeys);
    out.push({state:nextState,grid,supportKeys,changes:[...priorChanges,description],changeKinds:[...priorKinds,'equipment-tech'],label:changeLabel([...priorChanges,description]),kind:'equipment-tech',changeCount:priorChanges.length+1,techChange:{field,label:rule.label,before:current,after:next},previewScore:preview.score,key:counterForceKey(grid,supportKeys,nextState)});
  }
  return out;
}

export function buildForceDesignCandidates(snapshot,{state=snapshot.state,grid=state.attackerGrid,supportKeys=state.attackerSupports,priorChanges=[],priorKinds=[],limit=18}={}){
  const candidates=[...designMutationCandidates(snapshot,state,grid,supportKeys,priorChanges,priorKinds),...techTierCandidates(snapshot,state,grid,supportKeys,priorChanges,priorKinds)];
  const seen=new Set(),unique=[];for(const candidate of candidates.sort((a,b)=>b.previewScore-a.previewScore)){if(seen.has(candidate.key))continue;seen.add(candidate.key);unique.push(candidate);}
  return unique.slice(0,Math.max(0,limit));
}
