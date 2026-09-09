import fs from 'node:fs';

const path='src/main.js';
let s=fs.readFileSync(path,'utf8');
let changes=0;
const replace=(from,to,label)=>{
  if(s.includes(to)) return;
  if(!s.includes(from)) throw new Error(`0.15 migration pattern not found: ${label}`);
  s=s.replace(from,to);changes++;
};

replace(
"function validRegimentalSupports(side){ensureDesignerState(side);const profile=ensureTechState(side);return state[side+'RegimentalSupports'].filter((key,c)=>key&&filledInRegiment(state[side+'Grid'],c)>=3&&regimentalBaselineCompatible(side,c)&&techAvailable('support',key,profile));}",
"function validRegimentalSupports(side){ensureDesignerState(side);return state[side+'RegimentalSupports'].filter((key,c)=>key&&filledInRegiment(state[side+'Grid'],c)>=3&&regimentalBaselineCompatible(side,c));}",
'regimental research hard lock');

replace(
"function division(side){ensureDesignerState(side);const data=techData(side),profile=ensureTechState(side),line=gridToCounts(state[side+'Grid'],Object.keys(battalions)).filter(x=>techAvailable('battalion',x.type,profile));return calcDivision(line,data.battalions,[...state[side+'Supports'].filter(k=>techAvailable('support',k,profile)),...validRegimentalSupports(side)],data.supports);}",
"function division(side){ensureDesignerState(side);const data=techData(side),line=gridToCounts(state[side+'Grid'],Object.keys(battalions));return calcDivision(line,data.battalions,[...state[side+'Supports'],...validRegimentalSupports(side)],data.supports);}",
'theorycraft calculation hard lock');

replace(
"<div class=\"tech-subhead\"><span>EQUIPMENT / COMPANY UNLOCKS</span><small>Locked units cannot be used in the simulation.</small></div>",
"<div class=\"tech-subhead\"><span>EQUIPMENT / COMPANY PREREQUISITES</span><small>Informational only — theorycrafting never hard-locks a valid unit or module.</small></div>",
'research policy copy');

replace(
"const locked=!techAvailable('support',key,state[side+'Tech']);\n  return `<button class=\"hoi-support-slot filled tone-${battalionTone(key)} ${locked?'tech-locked':''}\" data-sslot=\"${i}\" title=\"${esc(supports[key]?.name||key)}${locked?' · not researched':''}\"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}${locked?' · LOCKED':''}</small></button>`;",
"const unmet=!techAvailable('support',key,state[side+'Tech']);\n  return `<button class=\"hoi-support-slot filled tone-${battalionTone(key)} ${unmet?'tech-locked':''}\" data-sslot=\"${i}\" title=\"${esc(supports[key]?.name||key)}${unmet?' · prerequisite not selected (informational)':''}\"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}${unmet?' · REQ':''}</small></button>`;",
'support prerequisite display');

replace(
"const techLocked=!techAvailable('support',key,state[side+'Tech']);\n  return `<button class=\"regimental-support available filled tone-${battalionTone(key)} ${techLocked?'tech-locked':''}\" data-rslot=\"${c}\" title=\"${esc(supports[key]?.name||key)}${techLocked?' · not researched':''}\"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}${techLocked?' · LOCKED':''}</small></button>`;",
"const unmet=!techAvailable('support',key,state[side+'Tech']);\n  return `<button class=\"regimental-support available filled tone-${battalionTone(key)} ${unmet?'tech-locked':''}\" data-rslot=\"${c}\" title=\"${esc(supports[key]?.name||key)}${unmet?' · prerequisite not selected (informational)':''}\"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}${unmet?' · REQ':''}</small></button>`;",
'regimental prerequisite display');

replace(
"${BASE_DIVISIONAL_SUPPORTS.map(k=>[k,supports[k]]).map(([k,v])=>{const unavailable=!techAvailable('support',k,state[side+'Tech']);return `<button class=\"picker-choice ${unavailable?'tech-locked':''}\" data-choice=\"${k}\" ${(used.has(k)&&k!==current)||unavailable?'disabled':''}><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(v.name)}${unavailable?' · not researched':''}</small>${pickerSupportMeta(side,k)}</button>`;}).join('')}",
"${BASE_DIVISIONAL_SUPPORTS.map(k=>[k,supports[k]]).map(([k,v])=>{const unmet=!techAvailable('support',k,state[side+'Tech']);return `<button class=\"picker-choice ${unmet?'tech-locked':''}\" data-choice=\"${k}\" ${used.has(k)&&k!==current?'disabled':''} title=\"${unmet?'Prerequisite not selected; available for theorycrafting':''}\"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(v.name)}${unmet?' · prerequisite':''}</small>${pickerSupportMeta(side,k)}</button>`;}).join('')}",
'support picker hard lock');

replace(
"${BASE_REGIMENTAL_SUPPORTS.map(k=>{const unavailable=!techAvailable('support',k,state[side+'Tech']);return `<button class=\"picker-choice tone-fire ${unavailable?'tech-locked':''}\" data-choice=\"${k}\" ${unavailable?'disabled':''}><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(supports[k]?.name||k)}${unavailable?' · not researched':''}</small>${pickerSupportMeta(side,k)}</button>`;}).join('')}",
"${BASE_REGIMENTAL_SUPPORTS.map(k=>{const unmet=!techAvailable('support',k,state[side+'Tech']);return `<button class=\"picker-choice tone-fire ${unmet?'tech-locked':''}\" data-choice=\"${k}\" title=\"${unmet?'Prerequisite not selected; available for theorycrafting':''}\"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(supports[k]?.name||k)}${unmet?' · prerequisite':''}</small>${pickerSupportMeta(side,k)}</button>`;}).join('')}",
'regimental picker hard lock');

replace(
"${allowed.map(k=>{const unavailable=!techAvailable('battalion',k,state[side+'Tech']);return `<button class=\"picker-choice tone-${battalionTone(k)} ${unavailable?'tech-locked':''}\" data-choice=\"${k}\" ${unavailable?'disabled':''}><b>${BATTALION_CODES[k]||'BAT'}</b><small>${esc(battalions[k].name)}${unavailable?' · not researched':''}</small>${pickerBattalionMeta(side,k)}</button>`;}).join('')}",
"${allowed.map(k=>{const unmet=!techAvailable('battalion',k,state[side+'Tech']);return `<button class=\"picker-choice tone-${battalionTone(k)} ${unmet?'tech-locked':''}\" data-choice=\"${k}\" title=\"${unmet?'Prerequisite not selected; available for theorycrafting':''}\"><b>${BATTALION_CODES[k]||'BAT'}</b><small>${esc(battalions[k].name)}${unmet?' · prerequisite':''}</small>${pickerBattalionMeta(side,k)}</button>`;}).join('')}",
'battalion picker hard lock');

replace(
"<div class=\"combat-command\"><button class=\"primary\" id=\"simulate\" ${techInvalid?'disabled title=\"Resolve research conflicts before simulating\"':''}>► START BATTLE TEST</button><button class=\"btn\" id=\"terrains\">Compare terrain</button><span>${techInvalid?'⚠ Research conflict':'Seeded simulation ready'}</span></div>",
"<div class=\"combat-command\"><button class=\"primary\" id=\"simulate\">► START BATTLE TEST</button><button class=\"btn\" id=\"terrains\">Compare terrain</button><span>${techInvalid?'ⓘ Prerequisites not selected · theorycraft still enabled':'Seeded simulation ready'}</span></div>",
'battle hard lock');

replace(
"function showBattle(compare){\n  const problems=[...techProblems('attacker'),...techProblems('defender')];if(problems.length){alert('Resolve Tech & Doctrine research conflicts before simulating.');return;}\n  const a=aggregate('attacker'),d=aggregate('defender'),o=battleOpts();",
"function showBattle(compare){\n  const a=aggregate('attacker'),d=aggregate('defender'),o=battleOpts();",
'simulation prerequisite blocker');

replace(
"function industryVerdict(band,issues){\n  if(issues.length)return {tone:'stop',code:'INVALID',title:'Fix the Lab template first',copy:'The current attacker uses equipment or support that its selected research profile does not unlock.'};",
"function industryVerdict(band,issues){\n  // Prerequisite issues are informational in 0.15.0: theorycrafted designs remain fully analyzable.",
'industry research hard lock');

if(changes){fs.writeFileSync(path,s);console.log(`Applied ${changes} theorycraft-first 0.15.0 migrations.`);}else console.log('0.15.0 theorycraft-first migration already applied.');
