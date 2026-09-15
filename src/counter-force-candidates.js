import { filledInRegiment } from './designer.js';
import { counterTemplateKey } from './counter-candidates.js';
import {
  TANK_FAMILIES,TANK_ROLE_LABELS,TANK_GUNS,TANK_TURRETS,TANK_ARMOR_TYPES,TANK_SPECIALS,
  tankRolesForFamily,tankVariantTargets,tankFamilyLabel,tankDesignOptions,normalizeTankDesign,buildTankDesign
} from './tank.js';

const TECH_FIELDS=['infantryEquipment','artillery','antiTank','antiAir'];
const moduleName=(map,id)=>map?.[id]?.name||String(id||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const variantLabel=(family,role)=>`${tankFamilyLabel(family)} ${TANK_ROLE_LABELS[role]||'Tank'}`;
const changeLabel=changes=>changes.join(' + ');
const otherSide=side=>side==='defender'?'attacker':'defender';

function activeUnitIds(state,side,grid,supportKeys){
  const ids=new Set((grid||[]).flat().filter(Boolean));
  for(const id of supportKeys||[])if(id)ids.add(id);
  for(let column=0;column<(state[side+'RegimentalSupports']||[]).length;column++){
    const id=state[side+'RegimentalSupports'][column];
    if(id&&filledInRegiment(grid,column)>=3)ids.add(id);
  }
  return ids;
}
function withTankVariant(state,side,family,role,design){
  const sideVariants={...(state.tankVariants?.[side]||{})},familyMap={...(sideVariants[family]||{})};familyMap[role]=design;sideVariants[family]=familyMap;
  return {...state,tankVariants:{...(state.tankVariants||{}),[side]:sideVariants}};
}
function tierFingerprint(state,side){return TECH_FIELDS.map(field=>Number(state[side+'Tech']?.[field])||0);}
export function counterForceKey(grid,supportKeys,state,side='attacker'){return JSON.stringify([side,counterTemplateKey(grid,supportKeys),state.tankVariants?.[side]||{},tierFingerprint(state,side)]);}

function quickDesignScore(snapshot,before,after,side){
  const target=snapshot[otherSide(side)],hardness=Math.max(0,Math.min(1,Number(target?.hardness)||0));
  const attack=(after.softAttack-before.softAttack)*(1-hardness)+(after.hardAttack-before.hardAttack)*hardness;
  const piercingGain=after.piercing-before.piercing,armorGain=after.armor-before.armor;
  const survivability=side==='defender'?after.defense-before.defense:after.breakthrough-before.breakthrough;
  let score=attack+survivability*.25+piercingGain*.12+armorGain*.08;
  score-=Math.max(0,after.buildCost-before.buildCost)*.2;
  if(Number(snapshot[side]?.piercing||0)<Number(target?.armor||0)&&piercingGain>0)score+=piercingGain*.18;
  if(Number(snapshot[side]?.armor||0)<=Number(target?.piercing||0)&&armorGain>0)score+=armorGain*.1;
  return score;
}

function designMutationCandidates(snapshot,side,state,grid,supportKeys,priorChanges,priorKinds){
  const ids=activeUnitIds(state,side,grid,supportKeys),out=[];
  for(const family of TANK_FAMILIES)for(const role of tankRolesForFamily(family)){
    const target=tankVariantTargets(family,role);if(!target?.units?.some(unit=>ids.has(unit.id)))continue;
    const raw=state.tankVariants?.[side]?.[family]?.[role];if(!raw||family==='land_cruiser')continue;
    const before=buildTankDesign(raw),options=tankDesignOptions(raw),name=variantLabel(family,role),mutations=[];
    const push=(nextRaw,description,component)=>{
      const normalized=normalizeTankDesign(nextRaw,family,role);if(JSON.stringify(normalized)===JSON.stringify(raw))return;
      const forcedGunChange=component==='turret'&&normalized.gun!==raw.gun,finalDescription=forcedGunChange?`${description}; gun ${moduleName(TANK_GUNS,raw.gun)} → ${moduleName(TANK_GUNS,normalized.gun)}`:description,finalComponent=forcedGunChange?'turret/gun package':component;
      const after=buildTankDesign(normalized),nextState=withTankVariant(state,side,family,role,normalized),changes=[...priorChanges,finalDescription];
      mutations.push({side,state:nextState,grid,supportKeys,changes,changeKinds:[...priorKinds,'tank-design'],label:changeLabel(changes),kind:'tank-design',changeCount:priorChanges.length+1,designChange:{family,role,variant:name,component:finalComponent,before,after,forcedGunChange},previewScore:quickDesignScore(snapshot,before,after,side),key:counterForceKey(grid,supportKeys,nextState,side)});
    };
    for(const id of options.guns||[])if(id!==raw.gun)push({...raw,gun:id},`${name}: gun ${moduleName(TANK_GUNS,raw.gun)} → ${moduleName(TANK_GUNS,id)}`,'gun');
    for(const id of options.turrets||[])if(id!==raw.turret)push({...raw,turret:id},`${name}: turret ${moduleName(TANK_TURRETS,raw.turret)} → ${moduleName(TANK_TURRETS,id)}`,'turret');
    for(const id of options.armorTypes||[])if(id!==raw.armorType)push({...raw,armorType:id},`${name}: armor ${moduleName(TANK_ARMOR_TYPES,raw.armorType)} → ${moduleName(TANK_ARMOR_TYPES,id)}`,'armor type');
    for(let slot=0;slot<(options.specials||[]).length;slot++)for(const id of options.specials[slot]||[])if(id!==(raw.specials?.[slot]||'none')){
      const specials=[...(raw.specials||[])];while(specials.length<(options.specials||[]).length)specials.push('none');specials[slot]=id;
      push({...raw,specials},`${name}: special ${slot+1} ${moduleName(TANK_SPECIALS,raw.specials?.[slot]||'none')} → ${moduleName(TANK_SPECIALS,id)}`,'special module');
    }
    for(const level of [...new Set([Number(raw.armorUpgrades||0)-1,Number(raw.armorUpgrades||0)+1,Number(raw.armorUpgrades||0)+2])].filter(x=>x>=0&&x<=20))if(level!==Number(raw.armorUpgrades||0))push({...raw,armorUpgrades:level},`${name}: armor upgrades ${raw.armorUpgrades||0} → ${level}`,'armor upgrades');
    mutations.sort((a,b)=>b.previewScore-a.previewScore||a.designChange.after.buildCost-b.designChange.after.buildCost);out.push(...mutations.slice(0,6));
  }
  return out;
}

export function buildForceDesignCandidates(snapshot,{side='attacker',state=snapshot.state,grid=state[side+'Grid'],supportKeys=state[side+'Supports'],priorChanges=[],priorKinds=[],limit=10}={}){
  // Technology, doctrine and MIO choices are fixed matchup context here. Candidate construction
  // stays local to the selected division and uses a cheap tank-design preview before battle simulation.
  const candidates=designMutationCandidates(snapshot,side,state,grid,supportKeys,priorChanges,priorKinds);
  const seen=new Set(),unique=[];for(const candidate of candidates.sort((a,b)=>b.previewScore-a.previewScore)){if(seen.has(candidate.key))continue;seen.add(candidate.key);unique.push(candidate);}
  return unique.slice(0,Math.max(0,limit));
}
