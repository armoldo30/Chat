const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export const AIRFRAMES={
  small_basic:{name:'Basic Small Airframe',size:'small',year:1936,cost:12,weight:8,thrustNeed:8,speed:330,agility:55,defense:4,range:550,reliability:.80,fuel:0.18,resources:{aluminum:2,rubber:1}},
  small_improved:{name:'Improved Small Airframe',size:'small',year:1940,cost:14,weight:9,thrustNeed:9,speed:380,agility:62,defense:5,range:650,reliability:.82,fuel:0.20,resources:{aluminum:2,rubber:1}},
  small_advanced:{name:'Advanced Small Airframe',size:'small',year:1944,cost:16,weight:10,thrustNeed:10,speed:430,agility:70,defense:6,range:750,reliability:.84,fuel:0.22,resources:{aluminum:3,rubber:1}},
  medium_basic:{name:'Basic Medium Airframe',size:'medium',year:1936,cost:20,weight:18,thrustNeed:18,speed:300,agility:32,defense:8,range:1000,reliability:.78,fuel:0.38,resources:{aluminum:3,rubber:1}},
  medium_improved:{name:'Improved Medium Airframe',size:'medium',year:1940,cost:23,weight:20,thrustNeed:20,speed:340,agility:36,defense:10,range:1200,reliability:.80,fuel:0.42,resources:{aluminum:4,rubber:1}},
  medium_advanced:{name:'Advanced Medium Airframe',size:'medium',year:1944,cost:27,weight:22,thrustNeed:22,speed:380,agility:40,defense:12,range:1400,reliability:.82,fuel:0.46,resources:{aluminum:4,rubber:2}}
};

export const AIR_ENGINES={
  engine_1:{name:'Engine I',thrust:11,speed:0,reliability:0,cost:4,weight:2,fuel:.03},
  engine_2:{name:'Engine II',thrust:14,speed:30,reliability:.01,cost:5,weight:2.2,fuel:.04},
  engine_3:{name:'Engine III',thrust:17,speed:55,reliability:.02,cost:6.2,weight:2.5,fuel:.05},
  engine_4:{name:'Engine IV',thrust:20,speed:80,reliability:.03,cost:7.5,weight:2.8,fuel:.06}
};

export const AIR_WEAPONS={
  none:{name:'Empty',airAttack:0,groundAttack:0,navalAttack:0,cost:0,weight:0,agility:0},
  light_mg:{name:'2× Light Machine Guns',airAttack:5,groundAttack:0,cost:1,weight:.5,agility:0},
  heavy_mg:{name:'4× Heavy Machine Guns',airAttack:10,groundAttack:1,cost:2.3,weight:1.1,agility:-1},
  cannon_1:{name:'Cannon I',airAttack:14,groundAttack:2,cost:3.5,weight:1.8,agility:-2},
  cannon_2:{name:'Cannon II',airAttack:18,groundAttack:3,cost:4.5,weight:2.2,agility:-3},
  bomb_locks:{name:'Bomb Locks',airAttack:0,groundAttack:8,cost:1.5,weight:1.5,agility:-3},
  small_bomb_bay:{name:'Small Bomb Bay',airAttack:0,groundAttack:12,cost:3,weight:2.8,agility:-5},
  torpedo_mount:{name:'Torpedo Mounting',airAttack:0,groundAttack:1,navalAttack:12,cost:3.5,weight:3.0,agility:-6}
};

export const AIR_DEFENSE_MODULES={
  none:{name:'No Defense Module',defense:0,reliability:0,cost:0,weight:0,range:0},
  self_sealing:{name:'Self-Sealing Fuel Tanks',defense:3,reliability:.04,cost:2,weight:1,range:-30,resources:{rubber:1}},
  armor_plates:{name:'Armor Plates',defense:5,reliability:-.02,cost:2.5,weight:2,range:-50},
  defensive_turret:{name:'Defensive Turret',defense:2,airAttack:6,reliability:-.02,cost:3,weight:2.5,range:-40}
};

export const AIR_SPECIALS={
  none:{name:'Empty',cost:0,weight:0},
  drop_tanks:{name:'Drop Tanks',range:250,cost:1.5,weight:.5,agility:-1},
  extra_fuel:{name:'Extra Fuel Tanks',range:350,defense:-1,cost:1.8,weight:1.5,agility:-2},
  radio_navigation:{name:'Radio Navigation',missionEfficiency:.05,cost:1,weight:.2},
  non_strategic_materials:{name:'Non-Strategic Materials',costMult:-.08,reliability:-.03,weight:.2}
};

export function defaultAirDesign(size='small'){
  const s=size==='medium'?'medium':'small';
  return {name:s==='small'?'Fighter Design':'Heavy Fighter Design',airframe:s==='small'?'small_improved':'medium_improved',engine:'engine_2',weapons:s==='small'?['heavy_mg','heavy_mg','none']:['heavy_mg','cannon_1','none'],defense:'self_sealing',specials:['drop_tanks','none']};
}

export function normalizeAirDesign(raw,size='small'){
  const base=defaultAirDesign(size),out={...base,...(raw||{})};
  if(!AIRFRAMES[out.airframe])out.airframe=base.airframe;
  if(!AIR_ENGINES[out.engine])out.engine='engine_2';
  out.weapons=Array.from({length:3},(_,i)=>AIR_WEAPONS[out.weapons?.[i]]?out.weapons[i]:'none');
  if(!AIR_DEFENSE_MODULES[out.defense])out.defense='none';
  out.specials=Array.from({length:2},(_,i)=>AIR_SPECIALS[out.specials?.[i]]?out.specials[i]:'none');
  out.name=String(out.name||AIRFRAMES[out.airframe].name).slice(0,80);
  return out;
}

function mergeResources(...sources){const out={};for(const src of sources)for(const [k,v] of Object.entries(src||{}))out[k]=(out[k]||0)+(Number(v)||0);return out;}

export function buildAirDesign(raw){
  const d=normalizeAirDesign(raw),f=AIRFRAMES[d.airframe],e=AIR_ENGINES[d.engine],weapons=d.weapons.map(k=>AIR_WEAPONS[k]),def=AIR_DEFENSE_MODULES[d.defense],specials=d.specials.map(k=>AIR_SPECIALS[k]);
  let airAttack=def.airAttack||0,groundAttack=0,navalAttack=0,defense=f.defense+(def.defense||0),agility=f.agility,speed=f.speed+e.speed,range=f.range+(def.range||0),reliability=f.reliability+(e.reliability||0)+(def.reliability||0),cost=f.cost+e.cost+(def.cost||0),weight=f.weight+e.weight+(def.weight||0),missionEfficiency=1,costMult=1,fuel=f.fuel+(e.fuel||0);
  for(const w of weapons){airAttack+=w.airAttack||0;groundAttack+=w.groundAttack||0;navalAttack+=w.navalAttack||0;agility+=w.agility||0;cost+=w.cost||0;weight+=w.weight||0;}
  for(const m of specials){airAttack+=m.airAttack||0;groundAttack+=m.groundAttack||0;navalAttack+=m.navalAttack||0;defense+=m.defense||0;agility+=m.agility||0;speed+=m.speed||0;range+=m.range||0;reliability+=m.reliability||0;cost+=m.cost||0;weight+=m.weight||0;missionEfficiency+=m.missionEfficiency||0;costMult+=m.costMult||0;}
  cost*=costMult;
  const thrust=e.thrust,required=f.thrustNeed+Math.max(0,weight-f.weight)*.75,thrustRatio=thrust/Math.max(.1,required),overweight=thrustRatio<1;
  if(overweight){agility*=clamp(thrustRatio,.35,1);speed*=clamp(.65+.35*thrustRatio,.45,1);reliability-=Math.max(0,1-thrustRatio)*.15;}
  agility=Math.max(1,agility);speed=Math.max(100,speed);range=Math.max(100,range);reliability=clamp(reliability,.10,1);cost=Math.max(1,cost);defense=Math.max(1,defense);
  const resources=mergeResources(f.resources,def.resources);
  const roles=[];if(airAttack>0)roles.push('fighter');if(groundAttack>=6)roles.push('cas');if(navalAttack>=6)roles.push('naval_bomber');
  return {...d,size:f.size,year:f.year,airAttack,airDefense:defense,groundAttack,navalAttack,agility,maxSpeed:speed,range,reliability,buildCost:cost,weight,thrust,requiredThrust:required,thrustRatio,overweight,missionEfficiency,fuelConsumption:fuel,resources,roles};
}

function combatModifier(attacker,defender,opts={}){
  const agilityRatio=attacker.agility/Math.max(1,defender.agility),speedRatio=attacker.maxSpeed/Math.max(1,defender.maxSpeed);
  const agility=clamp(Math.pow(agilityRatio,.35),.65,1.35),speed=clamp(Math.pow(speedRatio,.20),.80,1.20);
  const reliability=.75+.25*attacker.reliability,mission=clamp((opts.missionEfficiency??1)*attacker.missionEfficiency,.2,1.25),detection=clamp(opts.detection??1,.1,1);
  return agility*speed*reliability*mission*detection;
}

export function compareBuiltAirDesigns(a,b,opts={}){
  const countA=Math.max(1,Number(opts.countA)||100),countB=Math.max(1,Number(opts.countB)||100),sorties=Math.max(1,Number(opts.sorties)||1000);
  // Analytical exchange model. It intentionally exposes its approximation rather than claiming executable parity.
  const lethality=.018;
  const attackA=(a.airAttack/Math.max(1,b.airDefense))*combatModifier(a,b,{missionEfficiency:opts.missionEfficiencyA,detection:opts.detectionA});
  const attackB=(b.airAttack/Math.max(1,a.airDefense))*combatModifier(b,a,{missionEfficiency:opts.missionEfficiencyB,detection:opts.detectionB});
  const exposureA=Math.min(1,countB/countA),exposureB=Math.min(1,countA/countB);
  const lossB=Math.min(countB,sorties/1000*countA*lethality*attackA*exposureB);
  const lossA=Math.min(countA,sorties/1000*countB*lethality*attackB*exposureA);
  const icLostA=lossA*a.buildCost,icLostB=lossB*b.buildCost;
  const exchangeA=icLostA>0?icLostB/icLostA:(icLostB>0?Infinity:1),killRatioA=lossA>0?lossB/lossA:(lossB>0?Infinity:1);
  const airPowerA=countA*a.airAttack*(.5+.5*a.agility/Math.max(1,a.agility+b.agility));
  const airPowerB=countB*b.airAttack*(.5+.5*b.agility/Math.max(1,a.agility+b.agility));
  return {a,b,countA,countB,sorties,lossA,lossB,icLostA,icLostB,exchangeA,killRatioA,airPowerShareA:airPowerA/(airPowerA+airPowerB||1)*100};
}

export function compareAirDesigns(rawA,rawB,opts={}){return compareBuiltAirDesigns(buildAirDesign(rawA),buildAirDesign(rawB),opts);}

export function airMissionEfficiencyBuilt(d,mission='air_superiority'){
  if(mission==='cas')return {score:d.groundAttack/d.buildCost*100,primary:d.groundAttack,label:'Ground attack / IC'};
  if(mission==='naval_strike')return {score:d.navalAttack/d.buildCost*100,primary:d.navalAttack,label:'Naval attack / IC'};
  return {score:(d.airAttack*Math.sqrt(d.agility)*Math.sqrt(d.maxSpeed/300))/Math.max(1,d.buildCost),primary:d.airAttack,label:'Air combat value / IC'};
}
export function airMissionEfficiency(raw,mission='air_superiority'){return airMissionEfficiencyBuilt(buildAirDesign(raw),mission);}

