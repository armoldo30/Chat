from pathlib import Path

def rw(path,old,new):
    p=Path(path);s=p.read_text()
    if old not in s: raise SystemExit(f'missing replacement in {path}: {old[:80]}')
    p.write_text(s.replace(old,new,1))

rw('src/gameData.js',"terrainRuntimeClassification:'formula-deferred'","terrainRuntimeClassification:Object.keys(terrainModifiers).length?'combat-formulas-audited':'no-source-terrain-block'")

p=Path('tests/terrain-runtime-certification.test.mjs');s=p.read_text()
s=s.replace("// Source-backed units must not silently inherit the hand-written packless terrain guesses.\nassert.deepEqual(battalions.motorized.terrain,{});\nassert.equal(battalions.motorized.terrainSource,'source-terrain-not-retained');\nassert.equal(battalions.motorized.terrainRuntimeClassification,'formula-deferred');\nassert.deepEqual(supports.engineer.terrain,{});\nassert.equal(supports.engineer.terrainSource,'source-terrain-not-retained');", "// Exact 1.19.2 sub-unit terrain blocks are retained; hand-written legacy terrain guesses remain disabled.\nassert.deepEqual(battalions.motorized.terrain,{});\nassert.equal(battalions.motorized.terrainSource,'game-pack-source');\nassert.equal(battalions.motorized.terrainRuntimeClassification,'combat-formulas-audited');\nassert.equal(battalions.motorized.terrainModifiers.forest.attack,-.1);\nassert.deepEqual(supports.engineer.terrain,{});\nassert.equal(supports.engineer.terrainSource,'game-pack-source');\nassert.equal(supports.engineer.terrainRuntimeClassification,'combat-formulas-audited');\nassert.ok(Object.keys(supports.engineer.terrainModifiers).length>0);")
s=s.replace("console.log('Terrain runtime certification passed: exact recovered widths/inherent penalties consumed; unit-terrain aggregation remains formula-deferred.');","console.log('Terrain runtime certification passed: exact widths, inherent penalties, and retained unit-terrain blocks are consumed by the Combat-audited aggregation.');")
p.write_text(s)
print('terrain certification boundary updated')
