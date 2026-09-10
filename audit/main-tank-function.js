function tank(c){
  ensureTankState();
  const side=state.tankDesigner.side,cls=state.tankDesigner.class,role=state.tankDesigner.role,raw=tankCurrent(),choices=tankDesignOptions(raw),d=adjustedTankDesign(side,cls,role),target=tankVariantTargets(cls,role),other=side==='attacker'?'defender':'attacker',data=techData(side),eqMap=equipmentForSide(side);
  const linked=(target?.units||[]).map(t=>({t,record:(t.kind==='support'?data.supports:data.battalions)?.[t.id]})).filter(x=>x.record),primary=linked[0]?.record||null,eq=target?.equipmentKey?eqMap[target.equipmentKey]:null,mioFamily=tankMioFamily(cls);
  const resourceText=Object.entries(d.resources||{}).map(([k,v])=>`<span class="resource-chip">${k.toUpperCase()} ${fmt(v,0)}/MIC</span>`).join('')||'<span class="resource-chip">No strategic resource</span>';
  const familyTabs=TANK_FAMILIES.map(k=>{const firstRole=tankRolesForFamily(k)[0],design=state.tankVariants?.[side]?.[k]?.[firstRole];return `<button data-tank-class="${k}" class="${cls===k?'active':''}">${esc(tankFamilyLabel(k).toUpperCase())}<small>${esc(design?.name||tankFamilyLabel(k))}</small></button>`;}).join('');
  const roleTabs=tankRolesForFamily(cls).map(r=>`<button data-tank-role="${r}" class="${role===r?'active':''}">${esc((TANK_ROLE_LABELS[r]||r).toUpperCase())}<small>${esc(state.tankVariants[side][cls][r].name)}</small></button>`).join('');
  const standardModules=`
        <label class="fixed-slot weapon"><span>MAIN ARMAMENT</span><select id="tank-gun">${optionList(TANK_GUNS,raw.gun,(v,k)=>choices.guns.has(k))}</select></label>
        <label><span>TURRET</span><select id="tank-turret">${optionList(TANK_TURRETS,raw.turret,(v,k)=>choices.turrets.has(k))}</select></label>
        <label><span>SUSPENSION</span><select id="tank-suspension">${optionList(TANK_SUSPENSIONS,raw.suspension,(v,k)=>choices.suspensions.has(k))}</select></label>
        <label><span>ARMOR TYPE</span><select id="tank-armorType">${optionList(TANK_ARMOR_TYPES,raw.armorType,(v,k)=>choices.armorTypes.has(k))}</select></label>
        <label><span>ENGINE</span><select id="tank-engine">${optionList(TANK_ENGINES,raw.engine,(v,k)=>choices.engines.has(k))}</select></label>
        ${(raw.specials||[]).map((v,i)=>`<label><span>SPECIAL ${i+1}</span><select id="tank-special-${i}">${optionList(TANK_SPECIALS,v,(m,k)=>choices.specials[i]?.has(k))}</select></label>`).join('')}`;
  const genericModules=choices.genericSlots?Object.entries(choices.genericSlots).map(([slot,set])=>`<label class="${slot==='lc_main_armament_slot'?'fixed-slot weapon':''}"><span>${esc(slot.replace(/^lc_/,'').replaceAll('_',' ').toUpperCase())}</span><select id="tank-slot-${slot}">${optionList(TANK_SLOT_MODULES,raw.slotModules?.[slot]||'none',(m,k)=>set.has(k))}</select></label>`).join(''):'';
  const capacityNotice=d.maxWeight>0?(d.overloaded?`<p class="notice stop"><b>Chassis overloaded:</b> ${fmt(d.overload,1)} weight above the ${fmt(d.maxWeight,0)} baseline capacity. Speed/reliability penalties are active.</p>`:`<p class="notice good"><b>Weight within chassis capacity.</b> ${fmt(d.weight,1)} / ${fmt(d.maxWeight,0)}.</p>`):`<p class="notice"><b>Source-slot validation active.</b> No executable weight-cap rule is asserted for this 1.19.2 designer chassis.</p>`;
  const mioBlock=mioFamily?inlineMioPicker(side,mioFamily,'tank-active'):`<p class="muted">MIO effects are not inferred for ${esc(tankFamilyLabel(cls))}; source chassis/module behavior remains active.</p>`;
  const linkedNames=linked.map(x=>x.record.name).join(', ');
  const needQty=Number(primary?.need?.[target?.equipmentKey]||0),industrial=eq&&primary?`<div class="variant-link-card"><span>PRODUCTION EQUIPMENT</span><h3>${esc(eq.name)}</h3><strong class="big-ic">${fmt(eq.cost,2)} IC / vehicle</strong><p>${esc(primary.name)} requires ${fmt(needQty,0)} vehicles, so this unit carries roughly <b>${fmt(needQty*eq.cost,0)} IC</b> of designed equipment before losses.</p><a class="btn" href="#production">Test force production →</a></div>`:`<p class="notice">No production alias is available for this role target.</p>`;
  const integration=primary?`<div class="variant-link-card"><span>${side.toUpperCase()} · ${esc((TANK_ROLE_LABELS[role]||role).toUpperCase())}</span><h3>${esc(primary.name)}</h3><div class="hq-stat-pair"><div><span>Soft attack</span><b>${fmt(primary.soft,1)}</b></div><div><span>Hard attack</span><b>${fmt(primary.hard,1)}</b></div><div><span>Armor</span><b>${fmt(primary.armor,1)}</b></div><div><span>Breakthrough</span><b>${fmt(primary.breakthrough,1)}</b></div></div><p>This design is active for ${linked.length} linked source unit${linked.length===1?'':'s'}${linkedNames?`: ${esc(linkedNames)}`:''}.</p><a class="btn" href="#battle">Open Division Lab →</a></div>`:`<p class="notice stop">No hydrated 1.19.2 unit target was found for this family/role.</p>`;
  c.innerHTML=`<section class="tool-head hoi-tool-head"><div><p class="eyebrow">ARMORED FORCES · EQUIPMENT DESIGN</p><h1>Tank Designer</h1><p>Build source-valid tank, TD, SPG, SPAA, flame, amphibious and special-project variants. Prerequisites stay informational; structural role and slot rules are enforced.</p></div>${badge('Source-linked','good')}</section>
  <div class="designer-tabs tank-tabs"><button class="${side==='attacker'?'active':''}" data-tank-side="attacker"><span>ATTACKER</span><b>${esc(state.attackerName)}</b></button><button class="${side==='defender'?'active':''}" data-tank-side="defender"><span>DEFENDER</span><b>${esc(state.defenderName)}</b></button><button class="swap-tab" id="copyTank">COPY → ${other.toUpperCase()}</button></div>
  <div class="tank-class-tabs">${familyTabs}</div>
  <div class="tank-class-tabs tank-role-tabs">${roleTabs}</div>
  <section class="tank-designer-shell">
    <div class="tank-blueprint panel"><div class="tank-nameplate"><div><span class="eyebrow">${esc(tankFamilyLabel(cls).toUpperCase())} · ${esc((TANK_ROLE_LABELS[role]||role).toUpperCase())}</span><input id="tank-name" value="${esc(raw.name)}" aria-label="Tank design name"></div><div class="tank-silhouette"><span>▰</span><b>${fmt(d.armor,0)}</b><small>ARMOR</small></div></div>
      <div class="tank-module-grid">
        <label class="fixed-slot"><span>CHASSIS</span><select id="tank-chassis">${optionList(TANK_CHASSIS,raw.chassis,v=>v.class===cls)}</select></label>
        ${choices.genericSlots?genericModules:standardModules}
      </div>
      <div class="tank-upgrades"><label>Engine upgrades <input id="tank-engineUpgrades" type="range" min="0" max="20" value="${raw.engineUpgrades}"><b>${raw.engineUpgrades}</b></label><label>Armor upgrades <input id="tank-armorUpgrades" type="range" min="0" max="20" value="${raw.armorUpgrades}"><b>${raw.armorUpgrades}</b></label></div>
      ${capacityNotice}
    </div>
    <aside class="panel tank-performance"><div class="panel-head"><h2>Variant statistics</h2></div>${tankStatsGrid(d)}<div class="advisor-resources">${resourceText}</div>${mioBlock}<p class="muted">Bundled 1.19.2 chassis, duplicate-role hardness, module compatibility, role restrictions and NSB upgrades are active. Module aggregation order that is not explicit in data files remains labeled analytical.</p></aside>
  </section>
  <div class="grid two">${panel('Division Lab integration',integration)}${panel('Industrial burden',industrial)}</div>`;
  document.querySelectorAll('[data-tank-side]').forEach(el=>el.onclick=()=>{state.tankDesigner.side=el.dataset.tankSide;save();shell();});
  document.querySelectorAll('[data-tank-class]').forEach(el=>el.onclick=()=>{state.tankDesigner.class=el.dataset.tankClass;const roles=tankRolesForFamily(state.tankDesigner.class);if(!roles.includes(state.tankDesigner.role))state.tankDesigner.role=roles[0];save();shell();});
  document.querySelectorAll('[data-tank-role]').forEach(el=>el.onclick=()=>{state.tankDesigner.role=el.dataset.tankRole;save();shell();});
  $('copyTank').onclick=()=>{state.tankVariants[other][cls][role]=structuredClone(state.tankVariants[side][cls][role]);state.tankVariants[other][cls][role].name=`Copy of ${state.tankVariants[side][cls][role].name}`;save();shell();};
  const set=(k,v)=>{const design=state.tankVariants[side][cls][role];design[k]=v;state.tankVariants[side][cls][role]=normalizeTankDesign(design,cls,role);if(role==='armor'&&['light','medium','heavy'].includes(cls))state.tankDesigns[side][cls]=structuredClone(state.tankVariants[side][cls][role]);save();shell();};
  $('tank-name').onchange=()=>set('name',$('tank-name').value.trim()||`${tankFamilyLabel(cls)} ${TANK_ROLE_LABELS[role]||'Tank'}`);
  $('tank-chassis').onchange=()=>set('chassis',$('tank-chassis').value);
  if(choices.genericSlots){for(const slot of Object.keys(choices.genericSlots)){const el=$('tank-slot-'+slot);if(el)el.onchange=()=>set('slotModules',{...(state.tankVariants[side][cls][role].slotModules||{}),[slot]:el.value});}}
  else{
    for(const k of ['gun','turret','suspension','armorType','engine']){const el=$('tank-'+k);if(el)el.onchange=()=>set(k,el.value);}
    (raw.specials||[]).forEach((_,i)=>{const el=$('tank-special-'+i);if(el)el.onchange=()=>{const next=[...state.tankVariants[side][cls][role].specials];next[i]=el.value;set('specials',next);};});
  }
  for(const k of ['engineUpgrades','armorUpgrades'])$('tank-'+k).onchange=()=>set(k,+$('tank-'+k).value);
  if(mioFamily)bindInlineMio(side,mioFamily,'tank-active');
}
