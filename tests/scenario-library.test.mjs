import assert from 'node:assert/strict';
import {encodeScenarioShare} from '../src/scenario-share.js';
import {MAX_SAVED_MATCHUPS,normalizeSavedMatchups,removeSavedMatchup,savedMatchupById,upsertSavedMatchup} from '../src/scenario-library.js';

const defaults={schema:7,country:'Germany',operation:'Default',dataPack:null,lastBattle:null};
const tokenFor=(operation,version='1.19.2')=>encodeScenarioShare({...defaults,operation},defaults,{gameVersion:version});

let rows=[];
rows=upsertSavedMatchup(rows,{id:'alpha',name:'  France   vs Germany  ',token:tokenFor('Alpha'),gameVersion:'1.19.2',now:'2026-09-16T12:00:00Z'});
assert.equal(rows.length,1);
assert.equal(rows[0].name,'France vs Germany','names should be whitespace-normalized');
assert.equal(rows[0].createdAt,'2026-09-16T12:00:00.000Z');

rows=upsertSavedMatchup(rows,{id:'alpha',name:'Updated Alpha',token:tokenFor('Alpha 2'),gameVersion:'1.19.2',now:'2026-09-16T13:00:00Z'});
assert.equal(rows.length,1,'updating an id should replace rather than duplicate');
assert.equal(rows[0].name,'Updated Alpha');
assert.equal(rows[0].createdAt,'2026-09-16T12:00:00.000Z','updates must preserve original creation time');
assert.equal(rows[0].updatedAt,'2026-09-16T13:00:00.000Z');
assert.equal(savedMatchupById(rows,'alpha',{gameVersion:'1.19.2'})?.id,'alpha');

for(let i=0;i<MAX_SAVED_MATCHUPS+5;i++)rows=upsertSavedMatchup(rows,{id:`save_${i}`,name:`Save ${i}`,token:tokenFor(`Scenario ${i}`),gameVersion:'1.19.2',now:new Date(Date.UTC(2026,8,16,14,i)).toISOString()});
assert.equal(rows.length,MAX_SAVED_MATCHUPS,'library must stay bounded');
assert.equal(rows[0].id,`save_${MAX_SAVED_MATCHUPS+4}`,'most recently updated save should sort first');
assert.equal(rows.some(x=>x.id==='alpha'),false,'oldest saves should fall off the bounded library');

const corrupted=[
  null,
  {id:'bad id',name:'Bad',token:tokenFor('Bad'),gameVersion:'1.19.2',createdAt:'2026-09-16T00:00:00Z',updatedAt:'2026-09-16T00:00:00Z'},
  {id:'wrongver',name:'Wrong version',token:tokenFor('Wrong','1.19.1'),gameVersion:'1.19.1',createdAt:'2026-09-16T00:00:00Z',updatedAt:'2026-09-16T00:00:00Z'},
  {id:'broken',name:'Broken token',token:'***',gameVersion:'1.19.2',createdAt:'2026-09-16T00:00:00Z',updatedAt:'2026-09-16T00:00:00Z'},
  rows[0],rows[0]
];
const cleaned=normalizeSavedMatchups(corrupted,{gameVersion:'1.19.2'});
assert.equal(cleaned.length,1,'corrupt, mismatched and duplicate saves must be discarded safely');
assert.equal(cleaned[0].id,rows[0].id);

assert.throws(()=>upsertSavedMatchup([],{id:'bad id',name:'X',token:tokenFor('X'),gameVersion:'1.19.2'}),/id is invalid/i);
assert.throws(()=>upsertSavedMatchup([],{id:'ok',name:'   ',token:tokenFor('X'),gameVersion:'1.19.2'}),/name is required/i);
assert.throws(()=>upsertSavedMatchup([],{id:'ok',name:'X',token:tokenFor('X','1.19.1'),gameVersion:'1.19.2'}),/game version/i);

const removed=removeSavedMatchup(rows,rows[0].id,{gameVersion:'1.19.2'});
assert.equal(removed.length,MAX_SAVED_MATCHUPS-1);
assert.equal(removed.some(x=>x.id===rows[0].id),false);

console.log('Saved matchup library bounded storage and validation tests passed.');
