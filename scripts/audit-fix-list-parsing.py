from pathlib import Path
import json


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old in text:
        text = text.replace(old, new, 1)
        p.write_text(text)
        return True
    if new in text:
        return False
    raise RuntimeError(f"expected parser pattern not found in {path}")


replace_once(
    "src/parser.js",
    """function items(v){\n  if(Array.isArray(v))return v.map(String);\n  if(v&&typeof v==='object'&&Array.isArray(v.__items))return v.__items.map(String);\n  if(typeof v==='string')return [v];\n  return [];\n}""",
    """function items(v){\n  if(Array.isArray(v))return v.flatMap(items);\n  if(v&&typeof v==='object'&&Array.isArray(v.__items))return v.__items.flatMap(items);\n  if(typeof v==='string'||typeof v==='number')return [String(v)];\n  return [];\n}""",
)
replace_once("src/parser.js", "types:items(last(raw.type)),categories:items(last(raw.categories))", "types:items(raw.type),categories:items(raw.categories)")
replace_once("src/parser.js", "types:items(last(raw.type)),upgrades:items(last(raw.upgrades))", "types:items(raw.type),upgrades:items(raw.upgrades)")
replace_once("src/parser.js", "allowEquipmentType:items(last(raw.allow_equipment_type)),forbidEquipmentType:items(last(raw.forbid_equipment_type)),addEquipmentType:items(last(raw.add_equipment_type))", "allowEquipmentType:items(raw.allow_equipment_type),forbidEquipmentType:items(raw.forbid_equipment_type),addEquipmentType:items(raw.add_equipment_type)")

replace_once(
    "src/gameDataParser.js",
    "const items=v=>Array.isArray(v)?v.map(String):isObj(v)&&Array.isArray(v.__items)?v.__items.map(String):typeof v==='string'?[v]:[];",
    "const items=v=>Array.isArray(v)?v.flatMap(items):isObj(v)&&Array.isArray(v.__items)?v.__items.flatMap(items):typeof v==='string'||typeof v==='number'?[String(v)]:[];",
)
replace_once("src/gameDataParser.js", "else for(const t of items(last(x)))found.add(t);", "else for(const t of items(x))found.add(t);")
replace_once("src/gameDataParser.js", "categories:[...new Set([...items(last(raw.category)),...items(last(raw.categories))])]", "categories:[...new Set([...items(raw.category),...items(raw.categories)])]")
replace_once("src/gameDataParser.js", "tracks:items(last(raw.tracks))", "tracks:items(raw.tracks)")

test = '''import assert from 'node:assert/strict';
import { parseClausewitz, extractSubUnits, extractEquipment, extractEquipmentModules } from '../src/parser.js';
import { extractTechnologies, extractDoctrines } from '../src/gameDataParser.js';

const units=extractSubUnits(parseClausewitz(`sub_units = {
  amphibious_light_armor = {
    type = { armor amphibious }
    categories = { category_tanks category_front_line category_amphibious_tanks }
  }
}`));
assert.deepEqual(units.amphibious_light_armor.types,['armor','amphibious']);
assert.deepEqual(units.amphibious_light_armor.categories,['category_tanks','category_front_line','category_amphibious_tanks']);

const equipment=extractEquipment(parseClausewitz(`equipments = {
  motorbike_equipment = {
    type = { motorized support }
    upgrades = { reliability engine }
  }
}`));
assert.deepEqual(equipment.motorbike_equipment.types,['motorized','support']);
assert.deepEqual(equipment.motorbike_equipment.upgrades,['reliability','engine']);

const modules=extractEquipmentModules(parseClausewitz(`equipment_modules = {
  test_module = {
    category = test
    allow_equipment_type = { light medium }
    forbid_equipment_type = { heavy super_heavy }
  }
}`));
assert.deepEqual(modules.test_module.allowEquipmentType,['light','medium']);
assert.deepEqual(modules.test_module.forbidEquipmentType,['heavy','super_heavy']);

const technologies=extractTechnologies(parseClausewitz(`technologies = {
  test_tech = { category = { infantry artillery } categories = { support armor } }
}`));
assert.deepEqual(technologies.test_tech.categories,['infantry','artillery','support','armor']);

const doctrines=extractDoctrines(parseClausewitz(`test_doctrine = { tracks = { a b c } }`),'track');
assert.deepEqual(doctrines.test_doctrine.tracks,['a','b','c']);

console.log('Clausewitz multi-value list invariants passed.');
'''
Path("tests/parser-list-values.test.mjs").write_text(test)

p = Path("package.json")
data = json.loads(p.read_text())
cmd = "node tests/parser-list-values.test.mjs"
parts = data["scripts"]["test"].split(" && ")
if cmd not in parts:
    insert_at = parts.index("node tests/parser-repeated-blocks.test.mjs") + 1 if "node tests/parser-repeated-blocks.test.mjs" in parts else 0
    parts.insert(insert_at, cmd)
    data["scripts"]["test"] = " && ".join(parts)
    p.write_text(json.dumps(data, indent=2) + "\n")
