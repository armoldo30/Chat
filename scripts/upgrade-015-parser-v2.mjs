import fs from 'node:fs';
const path='src/parser.js';
let s=fs.readFileSync(path,'utf8'),changes=0;

if(!s.includes('Modern HOI4 defines are primarily nested')){
  const start=s.indexOf('export function parseDefinesLua(text){');
  const end=s.indexOf('\n}\n\nfunction obj',start);
  if(start<0||end<0)throw new Error('parseDefinesLua block not found');
  const replacement=`export function parseDefinesLua(text){
  const out={};
  // Modern HOI4 defines are primarily nested: NDefines = { NMilitary = { KEY = 1 } }.
  // Some override files still use NDefines.NMilitary.KEY = 1, so support both forms.
  const dotted=/(?:NDefines\\.)?(N[A-Za-z_][A-Za-z0-9_]*)\\.([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*([-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][-+]?\\d+)?|true|false)/g;
  let m;
  while((m=dotted.exec(text))){
    const group=out[m[1]]||(out[m[1]]={});
    group[m[2]]=m[3]==='true'?true:m[3]==='false'?false:Number(m[3]);
  }
  let depth=0,inside=false,group=null;
  for(const original of String(text||'').split(/\\r?\\n/)){
    const line=original.replace(/--.*$/,'').trim();
    if(!line)continue;
    if(!inside){
      if(/^NDefines\\s*=\\s*\\{/.test(line)){inside=true;depth+=(line.match(/\\{/g)||[]).length-(line.match(/\\}/g)||[]).length;}
      continue;
    }
    if(depth===1){
      const gm=line.match(/^(N[A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*\\{/);
      if(gm)group=gm[1];
    }
    if(group&&depth===2){
      const kv=line.match(/^([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*([-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][-+]?\\d+)?|true|false)\\s*,?/);
      if(kv){const target=out[group]||(out[group]={});target[kv[1]]=kv[2]==='true'?true:kv[2]==='false'?false:Number(kv[2]);}
    }
    depth+=(line.match(/\\{/g)||[]).length-(line.match(/\\}/g)||[]).length;
    if(depth<2)group=null;
    if(depth<=0){inside=false;depth=0;group=null;}
  }
  return out;
}`;
  s=s.slice(0,start)+replacement+s.slice(end+2);changes++;
}

if(!s.includes('speed:num(last(raw.maximum_speed))')){
  const from=`      reliability:num(last(raw.reliability)),def:num(last(raw.defense)),breakthrough:num(last(raw.breakthrough)),hardness:num(last(raw.hardness)),armor:num(last(raw.armor_value)),\n      soft:num(last(raw.soft_attack)),hard:num(last(raw.hard_attack)),piercing:num(last(raw.ap_attack)),airAttack:num(last(raw.air_attack)),resources:plainNeed(raw.resources),moduleSlots:plainMap(raw.module_slots)`;
  const to=`      reliability:num(last(raw.reliability)),def:num(last(raw.defense)),breakthrough:num(last(raw.breakthrough)),hardness:num(last(raw.hardness)),armor:num(last(raw.armor_value)),\n      soft:num(last(raw.soft_attack)),hard:num(last(raw.hard_attack)),piercing:num(last(raw.ap_attack)),airAttack:num(last(raw.air_attack)),\n      speed:num(last(raw.maximum_speed)),fuel:num(last(raw.fuel_consumption)),weight:num(last(raw.weight)),thrust:num(last(raw.thrust)),\n      airDefense:num(last(raw.air_defence)),airAgility:num(last(raw.air_agility)),airRange:num(last(raw.air_range)),groundAttack:num(last(raw.air_ground_attack)),navalAttack:num(last(raw.naval_strike_attack)),\n      resources:plainNeed(raw.resources),moduleSlots:plainMap(raw.module_slots),types:items(last(raw.type)),upgrades:items(last(raw.upgrades)),raw:plainMap(raw)`;
  if(!s.includes(from))throw new Error('equipment designer stat pattern not found');
  s=s.replace(from,to);changes++;
}

if(!s.includes('guiCategory:last(raw.gui_category)')){
  const from=`    out[id]={id,category:last(raw.category),parent:last(raw.parent),addStats:plainNeed(raw.add_stats),multiplyStats:plainNeed(raw.multiply_stats),addAverageStats:plainNeed(raw.add_average_stats),resources:plainNeed(raw.build_cost_resources),allowEquipmentType:items(last(raw.allow_equipment_type)),forbidEquipmentType:items(last(raw.forbid_equipment_type)),xpCost:num(last(raw.xp_cost))};`;
  const to=`    out[id]={id,category:last(raw.category),guiCategory:last(raw.gui_category),parent:last(raw.parent),addStats:plainNeed(raw.add_stats),multiplyStats:plainNeed(raw.multiply_stats),addAverageStats:plainNeed(raw.add_average_stats),resources:plainNeed(raw.build_cost_resources),allowEquipmentType:items(last(raw.allow_equipment_type)),forbidEquipmentType:items(last(raw.forbid_equipment_type)),addEquipmentType:items(last(raw.add_equipment_type)),xpCost:num(last(raw.xp_cost)),raw:plainMap(raw)};`;
  if(!s.includes(from))throw new Error('equipment module metadata pattern not found');
  s=s.replace(from,to);changes++;
}

if(changes){fs.writeFileSync(path,s);console.log(`Applied ${changes} parser v2 migrations.`);}else console.log('Parser v2 migration already applied.');
