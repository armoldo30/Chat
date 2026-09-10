function airDesignStats(d){
  const rows=[['Air Attack',d.airAttack,1],['Air Defense',d.airDefense,1],['Agility',d.agility,1],['Max Speed',d.maxSpeed,0,' km/h'],['Range',d.range,0,' km'],['Ground Attack',d.groundAttack,1],['Naval Attack',d.navalAttack,1],['Reliability',d.reliability*100,1,'%'],['IC Cost',d.buildCost,2],['Weight',d.weight,1],['Thrust',d.thrust,1]];
  return `<div class="air-stat-grid">${rows.map(([k,v,n,suf=''])=>`<div><span>${k}</span><b>${fmt(v,n)}${suf}</b></div>`).join('')}</div>`;
}
function airDesignPanel(key,label){
  const raw=state.airLab[key],side=key==='a'?'attacker':'defender',d=adjustedAirDesign(side,raw),prefix=`air-${key}`,choices=airDesignOptions(raw),sourceSlots=Object.keys(choices.slots||{});
  const sourceSlotHtml=sourceSlots.map(slot=>{const current=raw.slotModules?.[slot]||'none',frame=AIRFRAMES[raw.airframe],required=!!frame?._equipment?.moduleSlots?.[slot]?.required;return `<label class="${required?'fixed-slot':''}"><span>${esc(airSlotLabel(slot))}${required?' · REQUIRED':''}</span><select id="${prefix}-slot-${slot}">${optionList(AIR_SLOT_MODULES,current,(v,id)=>choices.slots[slot].has(id))}</select></label>`;}).join('');
  const legacyHtml=`<label class="wide"><span>ENGINE</span><select id="${prefix}-engine">${optionList(AIR_ENGINES,raw.engine)}</select></label>${raw.weapons.map((v,i)=>`<label><span>WEAPON ${i+1}</span><select id="${prefix}-weapon-${i}">${optionList(AIR_WEAPONS,v)}</select></label>`).join('')}<label><span>DEFENSE</span><select id="${prefix}-defense">${optionList(AIR_DEFENSE_MODULES,raw.defense)}</select></label>${raw.specials.map((v,i)=>`<label><span>SPECIAL ${i+1}</span><select id="${prefix}-special-${i}">${optionList(AIR_SPECIALS,v)}</select></label>`).join('')}`;
  const missionNote=d.source==='game-pack'?`<p class="muted"><b>1.19.2 source-slot mode.</b> Structural compatibility, base module stats, IC, resources, weight and thrust use bundled game data. Aircraft mission-specific repeated stat blocks are not yet source-complete in the bundled import, so CAS/naval/strategic mission attack remains explicitly uncertified.</p>`:'';
  return `<section class="panel aircraft-designer ${key==='a'?'friendly':'enemy'}"><div class="aircraft-head"><div><span class="eyebrow">${label}</span><input id="${prefix}-name" value="${esc(raw.name)}"></div><div class="aircraft-role">${d.roles.map(x=>`<span>${x.replaceAll('_',' ').toUpperCase()}</span>`).join('')||'<span>NO MISSION TYPE</span>'}${d.carrier?'<span>CARRIER</span>':''}</div></div>
    <div class="air-module-grid"><label class="wide"><span>AIRFRAME</span><select id="${prefix}-airframe">${optionList(AIRFRAMES,raw.airframe)}</select></label>${sourceSlots.length?sourceSlotHtml:legacyHtml}</div>
    ${d.overweight?`<p class="notice stop"><b>Insufficient thrust.</b> ${fmt(d.thrust,1)} available / ${fmt(d.requiredThrust,1)} required.${d.source==='game-pack'?' The design remains selectable for theorycrafting; no invented performance penalty is applied.':' Agility, speed and reliability are penalized by the fallback analytical model.'}</p>`:`<p class="notice good"><b>Thrust margin:</b> ${fmt(d.thrust-d.requiredThrust,1)}.</p>`}
    ${airDesignStats(d)}<div class="advisor-resources">${Object.entries(d.resources||{}).map(([r,q])=>`<span class="resource-chip">${r.toUpperCase()} ${fmt(q,0)}/MIC</span>`).join('')}</div>${inlineMioPicker(side,d.size==='large'?'large_airframe':d.size==='medium'?'medium_airframe':'small_airframe',`${prefix}-active`)}${missionNote}${renderAirDoctrine(side,prefix)}</section>`;
}
function bindAirDesign(key){
  const prefix=`air-${key}`,set=(k,v)=>{state.airLab[key][k]=v;state.airLab[key]=normalizeAirDesign(state.airLab[key],AIRFRAMES[state.airLab[key].airframe]?.size||'small');save();shell();};
  $(`${prefix}-name`).onchange=()=>set('name',$(`${prefix}-name`).value.trim()||'Aircraft');
  $(`${prefix}-airframe`).onchange=()=>set('airframe',$(`${prefix}-airframe`).value);
  const choices=airDesignOptions(state.airLab[key]),sourceSlots=Object.keys(choices.slots||{});
  if(sourceSlots.length){
    for(const slot of sourceSlots){const el=$(`${prefix}-slot-${slot}`);if(el)el.onchange=()=>set('slotModules',{...(state.airLab[key].slotModules||{}),[slot]:el.value});}
  }else{
    for(const k of ['engine','defense'])$(`${prefix}-${k}`).onchange=()=>set(k,$(`${prefix}-${k}`).value);
    state.airLab[key].weapons.forEach((_,i)=>{$(`${prefix}-weapon-${i}`).onchange=()=>{const x=[...state.airLab[key].weapons];x[i]=$(`${prefix}-weapon-${i}`).value;set('weapons',x);};});
    state.airLab[key].specials.forEach((_,i)=>{$(`${prefix}-special-${i}`).onchange=()=>{const x=[...state.airLab[key].specials];x[i]=$(`${prefix}-special-${i}`).value;set('specials',x);};});
  }
  const side=key==='a'?'attacker':'defender',built=adjustedAirDesign(side,state.airLab[key]);bindInlineMio(side,built.size==='large'?'large_airframe':built.size==='medium'?'medium_airframe':'small_airframe',`${prefix}-active`);bindAirDoctrine(side,prefix);
}
