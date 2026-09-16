import assert from 'node:assert/strict';
import {buildScenarioShareUrl,decodeScenarioShare,encodeScenarioShare,materializeScenarioShare,MAX_SHARE_TOKEN_LENGTH,scenarioShareDelta} from '../src/scenario-share.js';

const defaults={
  schema:7,
  country:'Germany',
  operation:'Operation Iron Compass',
  attacker:[{type:'infantry',count:9}],
  defender:[{type:'infantry',count:10}],
  battlefield:{terrain:'plains',runs:500,seed:1944},
  tankVariants:null,
  dataPack:null,
  lastBattle:null
};

const state={
  ...structuredClone(defaults),
  country:'España',
  operation:'Prüfung Δ',
  attackerGrid:[["infantry","infantry",null,null,null]],
  battlefield:{terrain:'hills',runs:750,seed:8675309},
  tankVariants:{attacker:{medium:{armor:{name:'Shared Medium',armor:9}}}},
  dataPack:{meta:{bundled:false},privateSource:'must-not-share'},
  lastBattle:{winRate:99,seed:1234}
};

const delta=scenarioShareDelta(state,defaults);
assert.equal(delta.country,'España');
assert.equal(delta.operation,'Prüfung Δ');
assert.equal(delta.dataPack,undefined,'custom data packs must never enter share state');
assert.equal(delta.lastBattle,undefined,'cached battle output must never enter share state');
assert.equal(delta.defender,undefined,'unchanged defaults should be omitted from compact links');

const token=encodeScenarioShare(state,defaults,{gameVersion:'1.19.2'});
assert.ok(token.length<MAX_SHARE_TOKEN_LENGTH);
assert.match(token,/^[A-Za-z0-9_-]+$/,'share token must be URL-safe base64');
const decoded=decodeScenarioShare(token);
assert.equal(decoded.gameVersion,'1.19.2');
const restored=materializeScenarioShare(defaults,decoded);
assert.equal(restored.country,'España');
assert.equal(restored.operation,'Prüfung Δ');
assert.equal(restored.battlefield.terrain,'hills');
assert.equal(restored.battlefield.runs,750);
assert.equal(restored.defender[0].count,10,'omitted defaults must be restored');
assert.equal(restored.attackerGrid[0][1],'infantry','extra runtime state keys must survive round trip');
assert.equal(restored.dataPack,null);
assert.equal(restored.lastBattle,null);
assert.equal(restored.schema,7);

const url=buildScenarioShareUrl('https://hoioracle.com/?utm_source=test#scenario',token,'battle');
const parsedUrl=new URL(url);
assert.equal(parsedUrl.searchParams.get('utm_source'),'test','existing query parameters must be preserved');
assert.equal(parsedUrl.searchParams.get('scenario'),token);
assert.equal(parsedUrl.hash,'#battle');

const defaultToken=encodeScenarioShare(defaults,defaults,{gameVersion:'1.19.2'});
assert.ok(defaultToken.length<200,'default scenario should compress to a very small delta token');
assert.deepEqual(decodeScenarioShare(defaultToken).state,{});

assert.throws(()=>decodeScenarioShare('***'),/invalid/i);
assert.throws(()=>decodeScenarioShare('A'.repeat(MAX_SHARE_TOKEN_LENGTH+1)),/too large/i);
assert.throws(()=>encodeScenarioShare(state,defaults,{gameVersion:''}),/game version/i);

const base64url=text=>{
  const bytes=new TextEncoder().encode(text);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const malicious=base64url(JSON.stringify({version:1,gameVersion:'1.19.2',schema:7,state:JSON.parse('{"__proto__":{"polluted":true},"country":"Safe"}')}));
const safe=materializeScenarioShare(defaults,decodeScenarioShare(malicious));
assert.equal(safe.country,'Safe');
assert.equal({}.polluted,undefined,'share decoding must not permit prototype pollution');

console.log('Scenario share codec round-trip and safety tests passed.');
