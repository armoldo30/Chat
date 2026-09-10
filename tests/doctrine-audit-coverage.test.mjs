import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';
import { LAND_DOCTRINE_TRACKS, GRAND_DOCTRINES, AIR_DOCTRINE_TRACKS, AIR_GRAND_DOCTRINES } from '../src/doctrine.js';

const doctrines=builtin1192.doctrines||{};
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
const summary={records:Object.keys(doctrines).length,kinds,kindIds,tracks,withTrack,withTracks,withXpCost,withPrerequisites,withRaw,rewards,milestones,missing,fields,rewardCounts:Object.fromEntries(Object.entries(rewardCounts).filter(([,n])=>n)),milestoneCounts:Object.fromEntries(Object.entries(milestoneCounts).filter(([,n])=>n))};
assert.ok(summary.records>0,'built-in 1.19.2 doctrine corpus must not be empty');
assert.equal(withRaw,summary.records,'every bundled doctrine record must preserve raw data');
assert.ok((kinds.grand||0)>0,'grand doctrines must be present');
assert.ok((kinds.track||0)>0,'doctrine tracks must be present');
assert.ok((kinds.subdoctrine||0)>0,'subdoctrines must be present');
console.log('DOCTRINE_AUDIT_COVERAGE',JSON.stringify(summary));
console.log('Doctrine audit coverage measurement passed.');
