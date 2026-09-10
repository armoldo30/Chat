from pathlib import Path
import json


def replace_once(path, old, new):
    p=Path(path); s=p.read_text()
    if new in s: return False
    if old not in s: raise RuntimeError(f'expected pattern missing: {path}')
    p.write_text(s.replace(old,new,1)); return True

# Preserve list-valued module-slot compatibility without changing generic repeated-key semantics.
p=Path('src/parser.js'); s=p.read_text()
marker="function blockRoots(v){return (Array.isArray(v)?v:[v]).map(obj).filter(root=>Object.keys(root).length);}\n"
helper="""function plainModuleSlots(v){
  const out={};
  for(const [slotId,slot0] of Object.entries(obj(last(v)))){
    if(slotId==='__items')continue;
    const slot=obj(last(slot0)),record={};
    if(Object.prototype.hasOwnProperty.call(slot,'required'))record.required=last(slot.required);
    if(Object.prototype.hasOwnProperty.call(slot,'allowed_module_categories'))record.allowed_module_categories=items(slot.allowed_module_categories);
    if(Object.prototype.hasOwnProperty.call(slot,'gfx'))record.gfx=last(slot.gfx);
    out[slotId]=record;
  }
  return out;
}

"""
if helper not in s:
    if marker not in s: raise RuntimeError('blockRoots marker missing')
    s=s.replace(marker,marker+'\n'+helper,1)
old="resources:plainNeed(raw.resources),moduleSlots:plainMap(raw.module_slots),types:items(raw.type),upgrades:items(raw.upgrades),raw:plainMap(raw)"
new="resources:plainNeed(raw.resources),moduleSlots:plainModuleSlots(raw.module_slots),types:items(raw.type),upgrades:items(raw.upgrades),raw:{...plainMap(raw),module_slots:plainModuleSlots(raw.module_slots)}"
if new not in s:
    if old not in s: raise RuntimeError('equipment moduleSlots pattern missing')
    s=s.replace(old,new,1)
p.write_text(s)

# When explicit 1.19.2 categories exist, they are authoritative for regimental-support classification.
replace_once('src/gameData.js',
"""export function classifySubUnit(u){
  const text=words(u),group=String(u?.group||'').toLowerCase();
  const support=u?.width===undefined||u?.width===0||group==='support'||/category_(?:all_)?support|\\bsupport\\b/.test(text);
  const regimental=support&&(/regiment|regimental|infantry_gun|heavy_weapon|rocket_battery|anti_air_battery|anti_tank_battery|tank_destroyer.*support|spaa.*support/.test(text));
  let regimentGroup=null;
""",
"""export function classifySubUnit(u){
  const text=words(u),group=String(u?.group||'').toLowerCase(),categories=Array.isArray(u?.categories)?u.categories.map(x=>String(x).toLowerCase()):[];
  const support=u?.width===undefined||u?.width===0||group==='support'||/category_(?:all_)?support|\\bsupport\\b/.test(text);
  const hasExplicitCategories=categories.length>0;
  const regimental=support&&(hasExplicitCategories?categories.includes('category_regimental_support_battalions'):/regiment|regimental|infantry_gun|heavy_weapon|rocket_battery|anti_air_battery|anti_tank_battery|tank_destroyer.*support|spaa.*support/.test(text));
  let regimentGroup=null;
""")

# Restore all source-derived multi-category slot lists in the committed built-in 1.19.2 pack.
p=Path('src/builtin1192.js'); s=p.read_text()
imp="import moduleSlotCategories1192 from './builtin1192/module-slot-categories-1192.js';\n"
anchor="import tankModuleRequirements from './builtin1192/tank-module-requirements.js';\n"
if imp not in s:
    if anchor not in s: raise RuntimeError('builtin import anchor missing')
    s=s.replace(anchor,anchor+imp,1)
merge="""for(const [id,slots] of Object.entries(moduleSlotCategories1192)){
  const equipment=BUILTIN_1192.equipment?.[id];
  if(!equipment)continue;
  for(const [slotId,categories] of Object.entries(slots)){
    const current=equipment.moduleSlots?.[slotId]||{};
    equipment.moduleSlots={...(equipment.moduleSlots||{}),[slotId]:{...current,allowed_module_categories:categories}};
    const rawSlots=equipment.raw?.module_slots||{};
    const rawCurrent=rawSlots?.[slotId]||{};
    equipment.raw={...(equipment.raw||{}),module_slots:{...rawSlots,[slotId]:{...rawCurrent,allowed_module_categories:categories}}};
  }
}
"""
anchor2="BUILTIN_1192.modules={...(BUILTIN_1192.modules||{}),...tankModulesA,...tankModulesB};\n"
if merge not in s:
    if anchor2 not in s: raise RuntimeError('builtin merge anchor missing')
    s=s.replace(anchor2,anchor2+merge,1)
s=s.replace('repeatedBlockParserFix:true};','repeatedBlockParserFix:true,moduleSlotListsCertified:true};')
p.write_text(s)

# Permanent audit/regression coverage.
test="""import assert from 'node:assert/strict';
import BUILTIN from '../src/builtin1192.js';
import slotCategories from '../src/builtin1192/module-slot-categories-1192.js';
import { classifySubUnit } from '../src/gameData.js';
import { parseClausewitz, extractEquipment } from '../src/parser.js';

const certifiedSlots=Object.values(slotCategories).reduce((n,slots)=>n+Object.keys(slots).length,0);
assert.equal(certifiedSlots,234,'the 1.19.2 audit identified 234 bundled multi-category module slots');
for(const [id,slots] of Object.entries(slotCategories))for(const [slot,categories] of Object.entries(slots)){
  assert.deepEqual(BUILTIN.equipment[id]?.moduleSlots?.[slot]?.allowed_module_categories,categories,`${id}.${slot} must preserve every source category`);
}
assert.equal(BUILTIN.meta.moduleSlotListsCertified,true);
assert.deepEqual(BUILTIN.equipment.light_tank_chassis.moduleSlots.main_armament_slot.allowed_module_categories,['tank_small_main_armament','tank_flamethrower']);
assert.deepEqual(BUILTIN.equipment.medium_tank_chassis.moduleSlots.turret_type_slot.allowed_module_categories,['tank_light_turret_type','tank_medium_turret_type']);
assert.deepEqual(BUILTIN.equipment.land_cruiser_chassis.moduleSlots.lc_special_features_slot_1.allowed_module_categories,['lc_radio_module','lc_aerial_deployment','lc_external_features','lc_structural_features']);
assert.deepEqual(BUILTIN.equipment.small_plane_airframe.moduleSlots.fixed_main_weapon_slot.allowed_module_categories,['fighter_weapon','cas_weapon','nav_bomber_weapon','kamikaze_bomber_weapon']);

const imported=extractEquipment(parseClausewitz(`equipments={ test_chassis={ module_slots={ test_slot={ required=yes allowed_module_categories={ one two three four } } } } }`));
assert.deepEqual(imported.test_chassis.moduleSlots.test_slot.allowed_module_categories,['one','two','three','four']);
assert.deepEqual(imported.test_chassis.raw.module_slots.test_slot.allowed_module_categories,['one','two','three','four']);

assert.equal(classifySubUnit(BUILTIN.subUnits.super_heavy_tank_destroyer_brigade).regimental,false,'divisional super-heavy TD support is not regimental support');
for(const unit of Object.values(BUILTIN.subUnits)){
  if(!Array.isArray(unit.categories)||!unit.categories.length)continue;
  const expected=unit.categories.includes('category_regimental_support_battalions');
  assert.equal(classifySubUnit(unit).regimental,expected,`${unit.id} regimental classification must follow explicit source category`);
}
console.log('Phase 1 land-data audit invariants passed.');
"""
Path('tests/audit-land-data.test.mjs').write_text(test)

pkg=Path('package.json'); data=json.loads(pkg.read_text()); cmd='node tests/audit-land-data.test.mjs'
parts=data['scripts']['test'].split(' && ')
if cmd not in parts:
    at=parts.index('node tests/game-data.test.mjs')+1
    parts.insert(at,cmd); data['scripts']['test']=' && '.join(parts); pkg.write_text(json.dumps(data,indent=2)+'\n')

# Record newer findings without pretending Phase 1 is complete.
doc=Path('DATA_AUDIT_1.19.2.md'); d=doc.read_text()
addition="""
### Finding L-003 — nested module-slot lists were truncated — FIXED ON AUDIT BRANCH

The first scalar/top-level comparison did not independently decode nested `module_slots`. A second raw-structure audit found **234** multi-category slot definitions whose built-in `allowed_module_categories` had been reduced to only the final category: **34 tank**, **184 aircraft**, and **16 other** slot definitions. Examples included tank gun/turret/special slots and aircraft weapon/engine/special slots.

The audit branch now uses a targeted slot normalizer (the only list-valued slot field in the 1.19.2 inventory is `allowed_module_categories`) and a source-derived built-in supplement. Permanent tests verify all 234 restored lists. This correction is not yet on live `main`.

### Finding L-004 — six selectable dynamic tank roles currently resolve to zero equipment stats — OPEN

The following included sub-units request designer-derived equipment families that do not exist as normal static equipment records in the current built-in selection path:

- `amphibious_light_armor` → `light_tank_amphibious_chassis`
- `amphibious_medium_armor` → `medium_tank_amphibious_chassis`
- `amphibious_heavy_armor` → `heavy_tank_amphibious_chassis`
- `light_flame_tank` → `light_tank_flame_chassis`
- `medium_flame_tank` → `medium_tank_flame_chassis`
- `heavy_flame_tank` → `heavy_tank_flame_chassis`

At present these can hydrate with an empty `sourceEquipment` set and zero equipment-derived combat stats. This requires an explicit designer-role solution; inventing fallback stats would violate the certification standard.

### Finding L-005 — explicit regimental-support category should override name heuristics — FIXED ON AUDIT BRANCH

`super_heavy_tank_destroyer_brigade` was falsely classified as regimental support by a name heuristic even though the source marks it as divisional support. The audit branch now treats `category_regimental_support_battalions` as authoritative whenever explicit categories are present, retaining heuristics only for legacy/category-less data.

### Inheritance/completeness notes

A full-source versus bundled equipment-family selection comparison found only seven selection-ID differences across the 44 equipment families requested by bundled land sub-units at 1936/1940/1945/1950: four Land Cruiser cases and three motorbike cases. `motorbike_equipment_1` carries no distinct combat stats beyond its archetype, so that gap is mainly provenance/completeness. Land Cruiser remains a substantive open case because the bundled archetype alone has no designed armament stats.

"""
if '### Finding L-003' not in d:
    d=d.replace('### Next checks\n',addition+'### Next checks\n')
    doc.write_text(d)
