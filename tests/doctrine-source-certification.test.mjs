import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import builtin1192 from '../src/builtin1192.js';
import doctrineSource1192 from '../src/builtin1192/doctrine-source-manifest-1192.js';
import doctrineRecordHashes1192 from '../src/builtin1192/doctrine-record-hashes-1192.js';

const canonical=value=>{
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
};
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

assert.equal(doctrineSource1192.version,'1.19.2');
assert.equal(doctrineSource1192.fileCount,21,'1.19.2 doctrine source inventory contains 21 grand/track/subdoctrine files');
assert.equal(doctrineSource1192.recordCount,121,'1.19.2 doctrine source inventory contains 121 doctrine nodes');
assert.deepEqual(doctrineSource1192.kindCounts,{grand:12,track:14,subdoctrine:95});

const expectedIds=Object.values(doctrineSource1192.files).flatMap(source=>source.ids).sort();
assert.equal(new Set(expectedIds).size,121,'doctrine source IDs must be unique');
assert.deepEqual(Object.keys(doctrineRecordHashes1192).sort(),expectedIds,'every source doctrine record must have an independent raw-data fingerprint');
const actualIds=Object.keys(builtin1192.doctrines||{}).sort();
assert.deepEqual(actualIds,expectedIds,'bundled 1.19.2 doctrine node inventory must exactly match supplied game files');

const mismatches=[];
for(const id of expectedIds){
  const actual=hash(builtin1192.doctrines[id]?.raw);
  if(actual!==doctrineRecordHashes1192[id])mismatches.push({id,expected:doctrineRecordHashes1192[id],actual});
}
assert.deepEqual(mismatches,[],'every bundled doctrine raw record must match the supplied 1.19.2 source fingerprint');

assert.equal(builtin1192.meta?.doctrineSourceInventoryCertified,true);
assert.equal(builtin1192.meta?.doctrineSourceFileCount,21);
assert.equal(builtin1192.meta?.doctrineSourceRecordCount,121);
assert.equal(builtin1192.meta?.doctrineMetadataCount,36);

// Representative source-value anchors across all doctrine domains.
assert.equal(builtin1192.doctrines.new_mobile_warfare.raw.planning_speed,0.20);
assert.equal(builtin1192.doctrines.mass_assault.raw.no_supply_grace,48);
assert.equal(builtin1192.doctrines.new_battlefield_support.raw.air_cas_efficiency,0.20);
assert.equal(builtin1192.doctrines.special_forces_quality.raw.folder,'special_forces');
assert.equal(builtin1192.doctrines.new_fleet_in_being.raw.navy_capital_ship_defence_factor,0.10);
assert.equal(builtin1192.doctrines.new_convoy_raiding.raw.convoy_raiding_efficiency_factor,0.15);
assert.equal(builtin1192.doctrines.new_base_strike.raw.port_strike,0.40);
assert.equal(builtin1192.doctrines.line_of_battle.raw.navy_fuel_consumption_factor,-0.05);
assert.equal(builtin1192.doctrines.naval_gunfire_support.requirements.visible.has_dlc,'No Compromise, No Surrender');

console.log('Doctrine source certification passed: 21 files / 121 exact records.');
