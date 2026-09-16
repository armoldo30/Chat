from pathlib import Path

p=Path('src/main.js')
s=p.read_text()
anchor="function scenarioShareUrl(){\n  if(!state.dataPack?.meta?.bundled)throw new Error('Share links currently support the bundled vanilla 1.19.2 baseline only. Export JSON for custom data-pack scenarios.');\n  const token=encodeScenarioShare(serializableState(),defaults,{gameVersion:MODEL_META.gameVersion});"
if anchor not in s:
    raise SystemExit('scenarioShareUrl anchor missing')
replacement=r'''function scenarioShareBaseline(){
  const base=structuredClone(defaults);
  for(const side of ['attacker','defender']){
    base[side+'Grid']=countsToGrid(base[side],Object.keys(battalions));
    base[side+'Tech']=normalizeTechProfile(base[side+'Tech']);
  }
  base.tankVariants={attacker:{},defender:{}};
  for(const side of ['attacker','defender']){
    for(const family of TANK_FAMILIES){
      base.tankVariants[side][family]={};
      for(const role of tankRolesForFamily(family)){
        const legacy=role==='armor'&&['light','medium','heavy'].includes(family)?base.tankDesigns[side][family]:null;
        const raw=legacy||defaultTankDesign(family,role);
        base.tankVariants[side][family][role]=normalizeTankDesign({...raw,class:family,role},family,role);
      }
      if(['light','medium','heavy'].includes(family))base.tankDesigns[side][family]=structuredClone(base.tankVariants[side][family].armor);
    }
  }
  base.airLab={...base.airLab,a:normalizeAirDesign(base.airLab.a,'small'),b:normalizeAirDesign(base.airLab.b,'small')};
  for(const side of ['attacker','defender']){
    base.mioSelections[side]=base.mioSelections[side]||{};
    for(const family of Object.keys(MIO_FAMILIES))base.mioSelections[side][family]=normalizeMioSelection(base.mioSelections[side][family]||DEFAULT_MIO_SELECTION);
  }
  return base;
}
function scenarioShareUrl(){
  if(!state.dataPack?.meta?.bundled)throw new Error('Share links currently support the bundled vanilla 1.19.2 baseline only. Export JSON for custom data-pack scenarios.');
  const token=encodeScenarioShare(serializableState(),scenarioShareBaseline(),{gameVersion:MODEL_META.gameVersion});'''
s=s.replace(anchor,replacement,1)
p.write_text(s)
print('normalized scenario share baseline applied')
