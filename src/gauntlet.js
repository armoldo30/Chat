import { COMBAT_CONSTANTS } from './data.js';
import { calcDivision, battleContext, damageDiceProfile, piercingDamageFactor, divisionEquipmentIC, simulateBattle, clamp } from './engine.js';

export const GAUNTLET_TERRAINS=['plains','forest','hills','mountain','jungle','marsh','desert','urban'];

export const GAUNTLET_ARCHETYPES=[
  {id:'infantry_wall',name:'Infantry Wall',category:'infantry',mix:[['infantry',10]],widths:[18,20,21,24,27,30,35,40],supports:['engineer','support_artillery','support_aa']},
  {id:'artillery_infantry',name:'Artillery Infantry',category:'infantry',mix:[['infantry',7],['artillery',2]],widths:[18,20,21,24,27,30,35,40],supports:['engineer','support_artillery','recon']},
  {id:'cheap_holding',name:'Cheap Holding Division',category:'infantry',mix:[['infantry',10]],widths:[10,12,15,18,20,21],supports:['engineer']},
  {id:'motorized',name:'Motorized Division',category:'mobile',mix:[['motorized',10]],widths:[18,20,21,24,27,30,35,40],supports:['engineer','recon','support_artillery','logistics']},
  {id:'mechanized',name:'Mechanized Division',category:'mobile',mix:[['mechanized',10]],widths:[18,20,21,24,27,30,35,40],supports:['engineer','recon','support_artillery','logistics']},
  {id:'light_armor',name:'Light Armor',category:'armor',mix:[['light_armor',6],['motorized',4]],widths:[20,24,25,27,30,35,36,40],supports:['engineer','recon','support_artillery','logistics','signal']},
  {id:'medium_armor',name:'Medium Armor',category:'armor',mix:[['medium_armor',6],['mechanized',4]],widths:[20,24,25,27,30,35,36,40,42],supports:['engineer','recon','support_artillery','logistics','signal']},
  {id:'heavy_armor',name:'Heavy Armor',category:'armor',mix:[['heavy_armor',6],['mechanized',4]],widths:[24,25,27,30,35,36,40,42],supports:['engineer','support_aa','logistics','signal']},
  {id:'breakthrough_tank',name:'Breakthrough Tanks',category:'armor',mix:[['medium_armor',8],['mechanized',2]],widths:[24,25,27,30,35,36,40,42],supports:['engineer','recon','logistics','signal','support_aa']},
  {id:'high_hardness',name:'High-Hardness Formation',category:'armor',mix:[['medium_armor',5],['mechanized',5]],widths:[24,25,27,30,35,36,40],supports:['engineer','logistics','signal','support_aa']},
  {id:'at_counter',name:'AT-Heavy Counter',category:'counter',mix:[['infantry',7],['anti_tank',2]],widths:[18,20,21,24,27,30,35,40],supports:['engineer','support_at','support_artillery']},
  {id:'aa_heavy',name:'AA-Heavy Formation',category:'counter',mix:[['infantry',7],['anti_air',2]],widths:[18,20,21,24,27,30,35,40],supports:['engineer','support_aa','support_artillery']},
  {id:'space_marine',name:'Space-Marine Style',category:'hybrid',mix:[['infantry',8],['medium_armor',1]],widths:[18,20,21,24,27,30,35,40],supports:['engineer','support_artillery','support_aa','logistics']},
  {id:'high_org',name:'High-ORG Infantry',category:'infantry',mix:[['infantry',9],['artillery',1]],widths:[18,20,21,24,27,30,35,40],supports:['engineer','support_artillery','signal']},
  {id:'low_cost_spam',name:'Low-Cost Spam',category:'infantry',mix:[['infantry',10]],widths:[8,10,12,15,18,20],supports:[]},
  {id:'elite',name:'Expensive Elite Formation',category:'elite',mix:[['mechanized',5],['medium_armor',4],['artillery',1]],widths:[24,25,27,30,35,36,40,42],supports:['engineer','recon','support_artillery','logistics','signal']}
];

const QUALITY_TIERS=[
  {id:'budget',name:'Budget equipment',combat:.90,armor:.90,org:.98,cost:.82},
  {id:'standard',name:'Standard equipment',combat:1,armor:1,org:1,cost:1},
  {id:'improved',name:'Improved equipment',combat:1.08,armor:1.10,org:1.02,cost:1.15},
  {id:'elite',name:'Elite equipment',combat:1.15,armor:1.18,org:1.05,cost:1.32}
];
const DOCTRINE_PROFILES=[
  {id:'balanced',name:'Balanced doctrine',soft:1,hard:1,def:1,brk:1,org:1},
  {id:'offensive',name:'Offensive doctrine',soft:1.06,hard:1.06,def:.98,brk:1.08,org:1.02},
  {id:'defensive',name:'Defensive doctrine',soft:1.01,hard:1.01,def:1.10,brk:.98,org:1.05},
  {id:'mobile',name:'Mobile doctrine',soft:1.03,hard:1.04,def:1,brk:1.07,org:1.06},
  {id:'mass',name:'Mass doctrine',soft:1.03,hard:1,def:1.03,brk:.98,org:1.09}
];

const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const std=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)));};
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),i=Math.floor(s.length/2);return s.length%2?s[i]:(s[i-1]+s[i])/2;};
const quantile=(a,q)=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),p=(s.length-1)*clamp(q,0,1),lo=Math.floor(p),hi=Math.ceil(p);return lo===hi?s[lo]:s[lo]+(s[hi]-s[lo])*(p-lo);};
function yieldControl(){return new Promise(resolve=>setTimeout(resolve,0));}

export function gauntletGrade(score){
  const s=Number(score)||0;
  if(s>=95)return 'S';if(s>=90)return 'A+';if(s>=85)return 'A';if(s>=80)return 'A-';
  if(s>=75)return 'B+';if(s>=70)return 'B';if(s>=65)return 'B-';if(s>=60)return 'C+';
  if(s>=55)return 'C';if(s>=50)return 'C-';if(s>=40)return 'D';return 'F';
}

function allocateMix(targetWidth,mix,battalions){
  const valid=mix.filter(([id])=>battalions[id]&&Number(battalions[id].width)>0);if(!valid.length)return [];
  const weightTotal=valid.reduce((s,[,w])=>s+w,0),avgWidth=valid.reduce((s,[id,w])=>s+(Number(battalions[id].width)||2)*w,0)/weightTotal;
  let total=clamp(Math.round(targetWidth/Math.max(1,avgWidth)),1,25);
  const rows=valid.map(([id,w])=>({id,exact:total*w/weightTotal,count:Math.floor(total*w/weightTotal)}));
  let assigned=rows.reduce((s,r)=>s+r.count,0);rows.sort((a,b)=>(b.exact-b.count)-(a.exact-a.count));for(let i=0;assigned<total;i=(i+1)%rows.length){rows[i].count++;assigned++;}
  const width=()=>rows.reduce((s,r)=>s+r.count*(Number(battalions[r.id].width)||0),0);
  let guard=0;while(Math.abs(width()-targetWidth)>2&&guard++<30){
    const current=width(),adding=current<targetWidth;let best=null;
    for(const r of rows){const w=Number(battalions[r.id].width)||0;if(!adding&&r.count<=1)continue;const next=current+(adding?w:-w),delta=Math.abs(next-targetWidth);if(!best||delta<best.delta)best={r,delta};}
    if(!best||best.delta>=Math.abs(current-targetWidth))break;best.r.count+=adding?1:-1;
  }
  return rows.filter(r=>r.count>0).map(r=>({type:r.id,count:r.count}));
}

function supportSet(archetype,variant,supports){
  const available=archetype.supports.filter(id=>supports[id]);if(!available.length)return [];
  const desired=Math.min(available.length,variant%6);if(!desired)return [];
  const offset=(Math.floor(variant/6)*3)%available.length;return Array.from({length:desired},(_,i)=>available[(offset+i)%available.length]).filter((v,i,a)=>a.indexOf(v)===i).slice(0,5);
}

function scaleDivision(stats,quality,doctrine){
  const q=quality,d=doctrine;
  return {...stats,
    soft:stats.soft*q.combat*d.soft,hard:stats.hard*q.combat*d.hard,def:stats.def*q.combat*d.def,breakthrough:stats.breakthrough*q.combat*d.brk,
    armor:stats.armor*q.armor,piercing:stats.piercing*q.armor,airAttack:stats.airAttack*q.combat,org:stats.org*q.org*d.org,hp:stats.hp*(.98+.02*q.combat)
  };
}

export function generateOpponentPool(count,{battalions,supports,equipment}={}){
  const n=Math.max(1,Math.floor(Number(count)||1)),pool=[];
  for(let i=0;i<n;i++){
    const familyIndex=i%GAUNTLET_ARCHETYPES.length,archetype=GAUNTLET_ARCHETYPES[familyIndex],variant=Math.floor(i/GAUNTLET_ARCHETYPES.length);
    const targetWidth=archetype.widths[(variant*3+familyIndex)%archetype.widths.length],lines=allocateMix(targetWidth,archetype.mix,battalions),supportKeys=supportSet(archetype,variant,supports);
    const base=calcDivision(lines,battalions,supportKeys,supports),quality=QUALITY_TIERS[(variant+familyIndex)%QUALITY_TIERS.length],doctrine=DOCTRINE_PROFILES[(variant*2+familyIndex)%DOCTRINE_PROFILES.length],stats=scaleDivision(base,quality,doctrine);
    const baseCost=divisionEquipmentIC(base.need||{},equipment||{}),cost=baseCost*quality.cost;
    pool.push({id:`${archetype.id}-${i+1}`,archetype:archetype.id,family:archetype.name,category:archetype.category,targetWidth,lines,supports:supportKeys,quality:quality.id,qualityName:quality.name,doctrine:doctrine.id,doctrineName:doctrine.name,stats,cost,supply:stats.supply,name:`${archetype.name} · ${Math.round(stats.width)}w · ${quality.name.replace(' equipment','')}`});
  }
  return pool;
}

function expectedSideDamage(hits,softAttack,hardAttack,attacker,target){
  const total=Math.max(0,softAttack)+Math.max(0,hardAttack),softShare=total?Math.max(0,softAttack)/total:1;
  const dice=damageDiceProfile(attacker.armor,target.piercing),pierce=piercingDamageFactor(attacker.piercing,target.armor);
  const orgDice=softShare*(dice.softOrgDice+1)/2+(1-softShare)*(dice.hardOrgDice+1)/2;
  const strDice=softShare*(dice.softStrengthDice+1)/2+(1-softShare)*(dice.hardStrengthDice+1)/2;
  return {org:Math.max(1e-6,hits*orgDice*COMBAT_CONSTANTS.orgDamageModifier*pierce),strength:Math.max(1e-6,hits*strDice*COMBAT_CONSTANTS.strengthDamageModifier*pierce)};
}

export function screenBattle(attacker,defender,opts){
  const c=battleContext(attacker,defender,opts),ad=expectedSideDamage(c.aHits,c.aSoftAttack,c.aHardAttack,c.ae.side,c.de.side),dd=expectedSideDamage(c.dHits,c.dSoftAttack,c.dHardAttack,c.de.side,c.ae.side);
  const enemyTime=Math.min(Math.max(1,c.de.side.org)/ad.org,Math.max(1,c.de.side.hp)/ad.strength),attackerTime=Math.min(Math.max(1,c.ae.side.org)/dd.org,Math.max(1,c.ae.side.hp)/dd.strength);
  const logRatio=Math.log((attackerTime+1e-6)/(enemyTime+1e-6));
  const attackerScore=100/(1+Math.exp(-1.65*logRatio));
  return {attackerScore:clamp(attackerScore,0,100),defenderScore:clamp(100-attackerScore,0,100),enemyTime,attackerTime,context:c};
}

function scenarioOpts(baseOpts,terrain,overrides={}){
  return {...baseOpts,terrain,terrainData:baseOpts.terrainData,asupply:1,dsupply:1,air:0,cas:0,night:0,fort:0,river:0,directions:0,entrench:10,planning:Math.min(.30,Math.max(0,Number(baseOpts.planning)||.15)),attackerNightAttackBonus:0,defenderNightAttackBonus:0,attackerGroundSupportBonus:0,...overrides};
}
function keepExtreme(list,record,limit,worst=false){list.push(record);list.sort((a,b)=>worst?a.score-b.score:b.score-a.score);if(list.length>limit)list.length=limit;}
function addAcc(map,key,value){const r=map[key]||(map[key]={sum:0,n:0});r.sum+=value;r.n++;}
function avgMap(map){return Object.fromEntries(Object.entries(map).map(([k,v])=>[k,v.n?v.sum/v.n:0]));}

function buildStressTests(candidate,pool,baseOpts){
  const sample=pool.filter((_,i)=>i%Math.max(1,Math.floor(pool.length/32))===0).slice(0,32),terrain='plains';
  const defs=[
    ['Low-supply offense',{asupply:.65},'attack'],['River crossing offense',{river:.30},'attack'],['Level-3 fort assault',{fort:3},'attack'],['Low-supply defense',{dsupply:.65},'defend']
  ];
  return defs.map(([name,overrides,role])=>{
    const scores=sample.map(o=>role==='attack'?screenBattle(candidate,o.stats,scenarioOpts(baseOpts,terrain,overrides)).attackerScore:screenBattle(o.stats,candidate,scenarioOpts(baseOpts,terrain,overrides)).defenderScore);
    const score=mean(scores);return {name,score,grade:gauntletGrade(score)};
  });
}

async function stochasticCheck(candidate,records,baseOpts,runs,onProgress){
  if(!runs||!records.length)return {runs:0,samples:0,meanScreen:0,meanStochastic:0,meanDelta:0,records:[]};
  const checked=[];let done=0;
  for(const r of records){
    const opts=scenarioOpts(baseOpts,r.terrain);opts.seed=`gauntlet:${r.opponent.id}:${r.terrain}:${r.role}`;
    const sim=r.role==='attack'?simulateBattle(candidate,r.opponent.stats,opts,runs):simulateBattle(r.opponent.stats,candidate,opts,runs);
    const score=r.role==='attack'?sim.attackerWinRate+sim.drawRate*.5:sim.defenderWinRate+sim.drawRate*.5;
    checked.push({...r,stochasticScore:score,delta:score-r.score});done++;if(onProgress)onProgress({phase:'validation',done,total:records.length,percent:96+4*done/records.length});if(done%3===0)await yieldControl();
  }
  return {runs,samples:checked.length,meanScreen:mean(checked.map(x=>x.score)),meanStochastic:mean(checked.map(x=>x.stochasticScore)),meanDelta:mean(checked.map(x=>Math.abs(x.delta))),records:checked};
}

export async function runGauntlet({candidate,data,equipment,baseOpts,count=500,terrainKeys=GAUNTLET_TERRAINS,stochasticRuns=50,onProgress=null}){
  const pool=generateOpponentPool(count,{battalions:data.battalions,supports:data.supports,equipment}),terrains=terrainKeys.filter(k=>baseOpts.terrainData?.[k]);
  const terrainAcc={},familyAcc={},categoryAcc={},offense=[],defense=[],all=[],opponentScores=[],costs=[],supplies=[],best=[],worst=[];
  let outperformed=0;
  for(let i=0;i<pool.length;i++){
    const o=pool[i],os=[];costs.push(o.cost);supplies.push(o.supply);
    for(const terrain of terrains){
      const opts=scenarioOpts(baseOpts,terrain),atk=screenBattle(candidate,o.stats,opts).attackerScore,def=screenBattle(o.stats,candidate,opts).defenderScore;
      offense.push(atk);defense.push(def);all.push(atk,def);os.push(atk,def);addAcc(terrainAcc,terrain,atk);addAcc(terrainAcc,terrain,def);addAcc(familyAcc,o.family,atk);addAcc(familyAcc,o.family,def);addAcc(categoryAcc,o.category,atk);addAcc(categoryAcc,o.category,def);
      keepExtreme(best,{score:atk,terrain,role:'attack',opponent:o},12,false);keepExtreme(best,{score:def,terrain,role:'defend',opponent:o},12,false);keepExtreme(worst,{score:atk,terrain,role:'attack',opponent:o},12,true);keepExtreme(worst,{score:def,terrain,role:'defend',opponent:o},12,true);
    }
    const oa=mean(os);opponentScores.push(oa);if(oa>50)outperformed++;
    if(onProgress&&(i%Math.max(10,Math.floor(pool.length/100))===0||i===pool.length-1))onProgress({phase:'screening',done:i+1,total:pool.length,percent:95*(i+1)/pool.length});
    if(i%100===99)await yieldControl();
  }
  const raw=mean(all),terrainScores=avgMap(terrainAcc),familyScores=avgMap(familyAcc),categoryScores=avgMap(categoryAcc),terrainValues=Object.values(terrainScores),candidateCost=divisionEquipmentIC(candidate.need||{},equipment||{}),medianCost=Math.max(1,median(costs)),medianSupply=Math.max(.01,median(supplies));
  const icEfficiency=clamp(raw*Math.sqrt(medianCost/Math.max(1,candidateCost)),0,100),supplyEfficiency=clamp(raw*Math.sqrt(medianSupply/Math.max(.01,candidate.supply||.01)),0,100),terrainVersatility=clamp(mean(terrainValues)-std(terrainValues)*.70,0,100),consistency=clamp(100-std(all)*2,0,100),counterResilience=clamp(quantile(all,.10),0,100);
  const practical=clamp(raw*.50+icEfficiency*.18+terrainVersatility*.12+supplyEfficiency*.08+consistency*.07+counterResilience*.05,0,100),critical=[...worst.slice(0,8),...best.slice(0,4)],validation=await stochasticCheck(candidate,critical,baseOpts,stochasticRuns,onProgress),stress=buildStressTests(candidate,pool,baseOpts);
  const sortedFamilies=Object.entries(familyScores).map(([name,score])=>({name,score,grade:gauntletGrade(score)})).sort((a,b)=>b.score-a.score);
  return {
    mode:count>=10000?'full':'quick',opponents:pool.length,terrainCount:terrains.length,matchups:pool.length*terrains.length*2,rawScore:raw,rawGrade:gauntletGrade(raw),practicalScore:practical,practicalGrade:gauntletGrade(practical),offense:mean(offense),defense:mean(defense),terrainScores,terrainGrades:Object.fromEntries(Object.entries(terrainScores).map(([k,v])=>[k,gauntletGrade(v)])),familyScores,categoryScores,icEfficiency,supplyEfficiency,terrainVersatility,consistency,counterResilience,percentile:pool.length?outperformed/pool.length*100:0,candidateCost,medianOpponentCost:medianCost,candidateSupply:candidate.supply||0,medianOpponentSupply:medianSupply,bestMatchups:sortedFamilies.slice(0,5),worstMatchups:[...sortedFamilies].reverse().slice(0,5),stress,validation,distribution:{p10:quantile(opponentScores,.10),median:quantile(opponentScores,.50),p90:quantile(opponentScores,.90)},evidence:'planner-analytical-opponent-generation + certified-bounded-combat-engine'
  };
}
