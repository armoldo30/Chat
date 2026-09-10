import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';
import { LAND_DOCTRINE_TRACKS, GRAND_DOCTRINES, AIR_DOCTRINE_TRACKS, AIR_GRAND_DOCTRINES } from '../src/doctrine.js';

const doctrines=builtin1192.doctrines||{},metadata=builtin1192.doctrineMetadata||{};
const kinds={},tracks={},fields={},rewardCounts={},milestoneCounts={},kindIds={};
let rewards=0,milestones=0,withTrack=0,withTracks=0,withXpCost=0,withPrerequisites=0,withRaw=0;
const inc=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
for(const [id,doc] of Object.entries(doctrines)){
  const kind=doc?.kind||'missing';inc(kinds,kind);(kindIds[kind]||(kindIds[kind]=[])).push(id);
  if(doc?.track){withTrack++;inc(tracks,String(doc.track));}
  if(Array.isArray(doc?.tracks)&&doc.tracks.length){withTracks++;for(const track of doc.tracks)inc(tracks,String(track));}
  if(Number.isFinite(Number(doc?.xpCost)))withXpCost++;
  if(Array.isArray(doc?.prerequisites)&&doc.prerequisites.length)withPrerequisites++;
  const raw=doc?.raw;
  if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
    withRaw++;
    for(const key of Object.keys(raw))inc(fields,key);
    const rs=raw.rewards&&typeof raw.rewards==='object'?Object.values(raw.rewards):[];
    rewards+=rs.length;rewardCounts[id]=rs.length;
    const ms=Array.isArray(raw.milestones)?raw.milestones:raw.milestones&&typeof raw.milestones==='object'?Object.values(raw.milestones):[];
    milestones+=ms.length;milestoneCounts[id]=ms.length;
  }
}
for(const ids of Object.values(kindIds))ids.sort();
const missing={landGrand:[],landChoices:[],airGrand:[],airChoices:[]};
for(const id of Object.keys(GRAND_DOCTRINES))if(!doctrines[id]&&!doctrines[`new_${id}`])missing.landGrand.push(id);
for(const meta of Object.values(LAND_DOCTRINE_TRACKS))for(const [id] of meta.choices)if(!doctrines[id])missing.landChoices.push(id);
for(const id of Object.keys(AIR_GRAND_DOCTRINES))if(!doctrines[id]&&!doctrines[`new_${id}`])missing.airGrand.push(id);
for(const meta of Object.values(AIR_DOCTRINE_TRACKS))for(const [id] of meta.choices)if(!doctrines[id]&&!doctrines[`air_subdoctrine_${id}`])missing.airChoices.push(id);
const metadataIds=Object.keys(metadata).sort();
const summary={records:Object.keys(doctrines).length,metadataRecords:metadataIds.length,kinds,kindIds,metadataIds,tracks,withTrack,withTracks,withXpCost,withPrerequisites,withRaw,rewards,milestones,missing,fields,rewardCounts:Object.fromEntries(Object.entries(rewardCounts).filter(([,n])=>n)),milestoneCounts:Object.fromEntries(Object.entries(milestoneCounts).filter(([,n])=>n))};
assert.equal(summary.records,121,'complete 1.19.2 doctrine catalog must be 12 grand + 14 track + 95 subdoctrine records');
assert.equal(summary.metadataRecords,36,'AI/folder doctrine metadata must be preserved outside the doctrine node catalog');
assert.equal(withRaw,summary.records,'every bundled doctrine node must preserve raw data');
assert.deepEqual(kinds,{grand:12,subdoctrine:95,track:14});
assert.equal(kinds.legacy,undefined,'legacy AI/folder metadata must not remain in doctrine node catalog');
assert.equal(builtin1192.meta.doctrineCount,121);
assert.equal(builtin1192.meta.doctrineMetadataCount,36);
assert.equal(builtin1192.meta.doctrineNodeCatalogSeparated,true);
assert.equal(builtin1192.meta.doctrineSourceInventoryCertified,true);
assert.equal(builtin1192.meta.doctrineSourceFileCount,21);
assert.deepEqual(missing,{landGrand:[],landChoices:[],airGrand:[],airChoices:[]},'every current Land/Air doctrine UI choice must resolve to a source-pack node');
assert.equal(rewards,474,'all 95 source subdoctrines preserve their ordered reward nodes');
assert.equal(milestones,44,'all 12 source grand-doctrine milestone nodes are preserved');
assert.ok(metadataIds.includes('land')&&metadataIds.includes('air')&&metadataIds.includes('naval')&&metadataIds.includes('special_forces'),'doctrine folder descriptors remain preserved as metadata');
assert.ok(metadataIds.some(id=>id.startsWith('DOCTRINE_')),'AI doctrine strategy/ratio records remain preserved as metadata');
console.log('DOCTRINE_AUDIT_COVERAGE',JSON.stringify(summary));
console.log('Doctrine audit coverage measurement passed.');
