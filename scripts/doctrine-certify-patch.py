from pathlib import Path


def replace_once(text, old, new, label):
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f"missing patch anchor: {label}")


# Restore the exact independently-censused doctrine inventory.
p = Path("src/builtin1192.js")
text = p.read_text()
text = replace_once(
    text,
    "import technologySource1192 from './builtin1192/technology-source-manifest-1192.js';",
    "import technologySource1192 from './builtin1192/technology-source-manifest-1192.js';\nimport doctrineSource1192 from './builtin1192/doctrine-source-manifest-1192.js';\nimport doctrineSourceSupplement1192 from './builtin1192/doctrine-source-supplement-1192.js';",
    "builtin doctrine imports",
)
anchor = "BUILTIN_1192.doctrineMetadata={...(BUILTIN_1192.doctrineMetadata||{}),...bundledDoctrineMetadata};\n"
insert = anchor + "BUILTIN_1192.doctrines={...(BUILTIN_1192.doctrines||{}),...doctrineSourceSupplement1192};\nconst expectedDoctrineIds=Object.values(doctrineSource1192.files||{}).flatMap(source=>source.ids||[]).sort();\nconst actualDoctrineIds=Object.keys(BUILTIN_1192.doctrines||{}).sort();\nif(expectedDoctrineIds.length!==doctrineSource1192.recordCount||actualDoctrineIds.length!==expectedDoctrineIds.length||actualDoctrineIds.some((id,i)=>id!==expectedDoctrineIds[i]))throw new Error(`HOI4 1.19.2 doctrine inventory mismatch: expected ${expectedDoctrineIds.length}, got ${actualDoctrineIds.length}`);\n"
text = replace_once(text, anchor, insert, "builtin doctrine inventory")
old = "BUILTIN_1192.meta={...(BUILTIN_1192.meta||{}),doctrineCount:Object.keys(BUILTIN_1192.doctrines||{}).length,doctrineMetadataCount:Object.keys(BUILTIN_1192.doctrineMetadata||{}).length,doctrineNodeCatalogSeparated:true};"
new = "BUILTIN_1192.meta={...(BUILTIN_1192.meta||{}),doctrineCount:actualDoctrineIds.length,doctrineMetadataCount:Object.keys(BUILTIN_1192.doctrineMetadata||{}).length,doctrineNodeCatalogSeparated:true,doctrineSourceFileCount:doctrineSource1192.fileCount,doctrineSourceRecordCount:doctrineSource1192.recordCount,doctrineSourceInventoryCertified:true};"
text = replace_once(text, old, new, "builtin doctrine metadata")
p.write_text(text)


# Bound doctrine runtime to fields whose semantics and downstream consumption are certified.
p = Path("src/doctrine.js")
text = p.read_text()
old = "const IMPORTED_LAND_STAT_MAP={soft_attack:['soft','mult'],hard_attack:['hard','mult'],defense:['def','mult'],breakthrough:['breakthrough','mult'],ap_attack:['piercing','mult'],air_attack:['airAttack','mult'],maximum_speed:['speed','mult'],max_organisation:['org','flat'],max_strength:['hp','flat'],combat_width:['width','flat'],supply_consumption:['supply','flat']};"
new = "const IMPORTED_LAND_STAT_MAP={soft_attack:['soft','mult'],hard_attack:['hard','mult'],defense:['def','mult'],breakthrough:['breakthrough','mult'],ap_attack:['piercing','mult'],air_attack:['airAttack','mult'],max_organisation:['org','flat'],max_strength:['hp','flat'],combat_width:['width','flat'],supply_consumption:['supply','flat']};"
text = replace_once(text, old, new, "land speed classification")
old = "const IMPORTED_GLOBAL_MAP={land_night_attack:'nightAttack',max_dig_in_factor:'entrenchment',planning_speed:'planningSpeed',max_planning:'maxPlanning',army_speed_factor:'armySpeed',supply_consumption_factor:'supply'};"
new = "// Only modifiers with audited planner consumption are mapped. Planning accumulation, maximum entrenchment, movement speed and similar fields remain source-exact metadata until their formula audits.\nconst IMPORTED_GLOBAL_MAP={land_night_attack:'nightAttack',supply_consumption_factor:'supply'};"
text = replace_once(text, old, new, "land global bounded map")
old = "  applyCollectedImportedUnitMods(mods);return {battalions:b,supports:s,state,global,source:'game-pack',used};"
new = "  applyCollectedImportedUnitMods(mods);\n  // Global supply factor applies after flat sub-unit supply changes.\n  if(Number.isFinite(Number(global.supply))&&global.supply!==0)for(const unit of [...Object.values(b),...Object.values(s)])if(Number.isFinite(Number(unit?.supply)))unit.supply=Math.max(0,Number(unit.supply)*(1+global.supply));\n  return {battalions:b,supports:s,state,global,source:'game-pack',used};"
text = replace_once(text, old, new, "land global supply propagation")
old = "function importedAirScopeMatches(scope,design){const roles=design?.roles||[],size=design?.size;return scope==='category_all_aircraft'||(scope==='category_fighter'&&roles.includes('fighter'))||(scope==='category_cas'&&roles.includes('cas'))||(scope==='category_naval_bomber'&&roles.includes('naval_bomber'))||(scope==='category_heavy_fighter'&&size==='medium'&&roles.includes('fighter'))||(scope==='tac_bomber'&&size==='medium')||(scope==='strat_bomber'&&size==='large');}"
new = """function importedAirScopeMatches(scope,design){
  const roles=new Set(design?.roles||[]),types=new Set(design?.equipmentTypes||[]),size=design?.size,carrier=!!design?.carrier,typed=types.size>0;
  if(scope==='category_all_aircraft')return true;
  if(scope==='category_fighter')return types.has('fighter')||(!typed&&roles.has('fighter')&&size==='small');
  if(scope==='category_carrier_fighter')return carrier&&(types.has('fighter')||(!typed&&roles.has('fighter')));
  if(scope==='category_heavy_fighter')return types.has('heavy_fighter')||(!typed&&roles.has('fighter')&&size==='medium');
  if(scope==='category_cas')return types.has('cas')||(!typed&&roles.has('cas'));
  if(scope==='category_carrier_cas')return carrier&&(types.has('cas')||(!typed&&roles.has('cas')));
  if(scope==='category_nav_bomber')return types.has('naval_bomber')||(!typed&&roles.has('naval_bomber'));
  if(scope==='category_carrier_nav_bomber')return carrier&&(types.has('naval_bomber')||(!typed&&roles.has('naval_bomber')));
  if(scope==='category_maritime_patrol_bomber')return types.has('maritime_patrol_plane')||(!typed&&roles.has('naval_bomber')&&size!=='small');
  if(scope==='category_tac_bomber')return types.has('tactical_bomber')||(!typed&&roles.has('tactical_bomber'));
  if(scope==='category_strat_bomber')return types.has('strategic_bomber')||(!typed&&roles.has('strategic_bomber'));
  if(scope==='category_scout_plane')return types.has('scout_plane')||(!typed&&roles.has('recon'));
  return false;
}"""
text = replace_once(text, old, new, "air exact category matching")
start = text.index("function applyImportedAirNode(node,design,variant,mission,ctx){")
end = text.index("\nfunction importedAirDoctrineEffects(", start)
replacement = """function applyImportedAirNode(node,design,variant,mission,ctx){
  if(!node||typeof node!=='object'||Array.isArray(node))return;
  for(const [key,value] of Object.entries(node)){
    if(DOCTRINE_META_KEYS.has(key))continue;
    if(Number.isFinite(Number(value))){
      const v=Number(value);
      if(key==='air_superiority_efficiency')mission.air_superiority=(mission.air_superiority||0)+v;
      else if(key==='air_cas_efficiency')mission.cas=(mission.cas||0)+v;
      else if(key==='air_nav_efficiency')mission.naval_strike=(mission.naval_strike||0)+v;
      else if(key==='air_mission_efficiency'){for(const missionId of ['air_superiority','cas','naval_strike'])mission[missionId]=(mission[missionId]||0)+v;}
      else if(key==='ground_attack_factor')variant.groundAttack=(variant.groundAttack||0)+v;
      else if(key==='air_range_factor')variant.range=(variant.range||0)+v;
      else if(key==='air_fuel_consumption_factor')variant.fuelConsumption=(variant.fuelConsumption||0)+v;
      else if(key==='air_strategic_bomber_defence_factor'&&((design?.equipmentTypes||[]).includes('strategic_bomber')||(design?.roles||[]).includes('strategic_bomber')))variant.airDefense=(variant.airDefense||0)+v;
      // Detection modifiers are mission-specific and air_cas_present_factor belongs to land-combat CAS resolution. They remain source-exact metadata until those formula paths are modeled.
      continue;
    }
    if(!value||typeof value!=='object'||Array.isArray(value)||!importedAirScopeMatches(key,design))continue;
    for(const [src,dst] of Object.entries(IMPORTED_AIR_STAT_MAP)){const v=Number(value[src]);if(Number.isFinite(v)&&v!==0)variant[dst]=(variant[dst]||0)+v;}
  }
}"""
text = text[:start] + replacement + text[end:]
old = "  const state=normalizeAirDoctrine(raw),variant={},mission={},ctx={detection:0},used=[];const grandId=importedGrandId(state,'air',pack),grand=grandId?pack.doctrines[grandId]:null;"
new = "  const state=normalizeAirDoctrine(raw),variant={},mission={},ctx={},used=[];const grandId=importedGrandId(state,'air',pack),grand=grandId?pack.doctrines[grandId]:null;"
text = replace_once(text, old, new, "air context")
old = "  const relevant=[];if(design?.size==='large')relevant.push('heavy_aircraft');else if(design?.size==='medium')relevant.push('medium_aircraft');else relevant.push('fighter_aircraft');if(design?.roles?.some(x=>['cas','naval_bomber'].includes(x)))relevant.push('strike_aircraft');\n  for(const track of [...new Set(relevant)]){const t=state.tracks[track],id=importedSubDoctrineId(t.choice,'air',pack),doc=id?pack.doctrines[id]:null;if(!doc?.raw)continue;used.push(id);applyImportedAirNode(doc.raw,design,variant,mission,ctx);const rewards=Object.values(doc.raw.rewards||{});for(let i=0;i<Math.min(t.mastery,rewards.length);i++)applyImportedAirNode(rewards[i],design,variant,mission,ctx);if(t.mastery>=5&&grand?.raw){const order=Array.isArray(grand.tracks)&&grand.tracks.length?grand.tracks:Array.isArray(grand.raw.tracks)?grand.raw.tracks:[];const idx=order.indexOf(track),milestones=Array.isArray(grand.raw.milestones)?grand.raw.milestones:[];if(idx>=0&&milestones[idx])applyImportedAirNode(milestones[idx],design,variant,mission,ctx);}}\n  return {state,variant,mission,detection:ctx.detection,source:'game-pack',used};"
new = "  // All selected tracks can contain global modifiers. Category blocks filter themselves against this aircraft.\n  for(const [track,t] of Object.entries(state.tracks)){const id=importedSubDoctrineId(t.choice,'air',pack),doc=id?pack.doctrines[id]:null;if(!doc?.raw)continue;used.push(id);applyImportedAirNode(doc.raw,design,variant,mission,ctx);const rewards=Object.values(doc.raw.rewards||{});for(let i=0;i<Math.min(t.mastery,rewards.length);i++)applyImportedAirNode(rewards[i],design,variant,mission,ctx);if(t.mastery>=5&&grand?.raw){const order=Array.isArray(grand.tracks)&&grand.tracks.length?grand.tracks:Array.isArray(grand.raw.tracks)?grand.raw.tracks:[];const idx=order.indexOf(track),milestones=Array.isArray(grand.raw.milestones)?grand.raw.milestones:[];if(idx>=0&&milestones[idx])applyImportedAirNode(milestones[idx],design,variant,mission,ctx);}}\n  return {state,variant,mission,detection:0,source:'game-pack',used};"
text = replace_once(text, old, new, "air all-track bounded runtime")
p.write_text(text)


# Coverage classifications must describe only effects the planner actually consumes.
p = Path("tests/doctrine-effect-coverage.test.mjs")
text = p.read_text()
text = replace_once(
    text,
    "const LAND_UNIT_FIELDS=new Set(['soft_attack','hard_attack','defense','breakthrough','ap_attack','air_attack','maximum_speed','max_organisation','max_strength','combat_width','supply_consumption']);",
    "const LAND_UNIT_FIELDS=new Set(['soft_attack','hard_attack','defense','breakthrough','ap_attack','air_attack','max_organisation','max_strength','combat_width','supply_consumption']);",
    "coverage land speed",
)
text = replace_once(
    text,
    "const LAND_GLOBAL_FIELDS=new Set(['land_night_attack','max_dig_in_factor','planning_speed','max_planning','army_speed_factor','supply_consumption_factor']);",
    "const LAND_GLOBAL_FIELDS=new Set(['land_night_attack','supply_consumption_factor']);",
    "coverage land globals",
)
text = replace_once(
    text,
    "const AIR_GLOBAL_FIELDS=new Set(['air_superiority_efficiency','air_cas_efficiency','air_cas_present_factor','air_nav_efficiency','air_superiority_detect_factor','air_interception_detect_factor']);",
    "const AIR_GLOBAL_FIELDS=new Set(['air_superiority_efficiency','air_cas_efficiency','air_nav_efficiency','air_mission_efficiency','ground_attack_factor','air_range_factor','air_fuel_consumption_factor','air_strategic_bomber_defence_factor']);",
    "coverage air globals",
)
p.write_text(text)


# Strengthen real-pack runtime certification.
p = Path("tests/doctrine-runtime-certification.test.mjs")
text = p.read_text()
text = text.replace("assert.equal(actionable.length,112,'1.19.2 bundled doctrine node catalog is 9 grand + 14 tracks + 89 subdoctrines');", "assert.equal(actionable.length,121,'1.19.2 bundled doctrine node catalog is 12 grand + 14 tracks + 95 subdoctrines');")
text = text.replace("assert.equal(actionable.filter(d=>d.kind==='grand').length,9);", "assert.equal(actionable.filter(d=>d.kind==='grand').length,12);")
text = text.replace("assert.equal(actionable.filter(d=>d.kind==='subdoctrine').length,89);", "assert.equal(actionable.filter(d=>d.kind==='subdoctrine').length,95);")
text = text.replace("close(mw.global.planningSpeed,0.2,'Mobile Warfare source planning-speed grand effect applies');\nclose(mw.global.armySpeed,0.1,'Mobile Warfare source army-speed grand effect applies');", "assert.equal(mw.global.planningSpeed,undefined,'planning-speed source data is preserved but not misrepresented as a battle-runtime modifier');\nassert.equal(mw.global.armySpeed,undefined,'army movement speed is deferred until the movement-formula audit');")
anchor = "close(sf5.global.supply,-0.1,'Superior Firepower infantry mastery-5 milestone applies source -10% supply factor');"
insert = anchor + "\nclose(sf5.battalions.line.supply,0.18,'global supply factor propagates into line-unit supply consumption');\nclose(sf5.supports.support.supply,0.09,'global supply factor propagates into support-unit supply consumption');"
text = replace_once(text, anchor, insert, "land supply runtime assertions")
anchor = "assert.ok(airEffects.used.includes('air_subdoctrine_flying_artillery'));"
extra = """assert.ok(airEffects.used.includes('air_subdoctrine_flying_artillery'));

// air_cas_present_factor belongs to land-combat CAS resolution and must not be misapplied as Air Lab mission efficiency.
const airStateM2=structuredClone(airState);airStateM2.tracks.strike_aircraft.mastery=2;
const airEffectsM2=airDoctrineEffects(airStateM2,design,builtin1192);
close(airEffectsM2.mission.cas,0.1,'CAS-presence modifier does not leak into CAS mission efficiency');

// A general mission-efficiency modifier from another selected track applies globally, independent of aircraft category.
const crossTrack=structuredClone(airState);crossTrack.tracks.strike_aircraft.mastery=0;crossTrack.tracks.medium_aircraft.choice='operational_air_support';
const crossTrackFx=airDoctrineEffects(crossTrack,{...design,roles:['fighter'],equipmentTypes:['fighter']},builtin1192);
close(crossTrackFx.mission.air_superiority,0.15,'general mission efficiency combines with Operational Integrity air-superiority efficiency');
close(crossTrackFx.mission.cas,0.05,'general air_mission_efficiency applies to CAS');
close(crossTrackFx.mission.naval_strike,0.05,'general air_mission_efficiency applies to naval strike');

// Exact 1.19 category IDs must resolve through equipment types.
const tacState=structuredClone(airState);tacState.tracks.strike_aircraft.mastery=0;tacState.tracks.medium_aircraft.choice='tactical_battlefield_support';
const tac={size:'medium',roles:['tactical_bomber'],equipmentTypes:['tactical_bomber'],airDefense:20,agility:30,airAttack:5,maxSpeed:450,range:1000,groundAttack:20,navalAttack:5,reliability:0.8,fuelConsumption:1};
const tacApplied=applyAirDoctrineToVariant(tac,tacState,builtin1192);
close(tacApplied.groundAttack,22,'category_tac_bomber source block applies +10% ground attack');

// Detection is source-exact but deliberately deferred instead of leaking interception/superiority detection into unrelated missions.
const bsState=structuredClone(airState);bsState.grand='battlefield_support';bsState.tracks.strike_aircraft.mastery=0;
const bsFx=airDoctrineEffects(bsState,design,builtin1192);
close(bsFx.detection,0,'mission-specific detection remains deferred until the Air detection formula path is modeled');"""
text = replace_once(text, anchor, extra, "air runtime assertions")
p.write_text(text)

# Source fingerprint test should already be wired; make this idempotent for recovery.
p = Path("package.json")
text = p.read_text()
old = "node tests/doctrine-parser-certification.test.mjs && node tests/doctrine-audit-coverage.test.mjs"
new = "node tests/doctrine-parser-certification.test.mjs && node tests/doctrine-source-certification.test.mjs && node tests/doctrine-audit-coverage.test.mjs"
if new not in text:
    text = replace_once(text, old, new, "package doctrine source test")
p.write_text(text)
