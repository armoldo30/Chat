import assert from 'node:assert/strict';
import {
  AIR_ORACLE_TARGET_1193,
  validateAirOracle1193Capture,
  summarizeAirOracleRates1193
} from '../src/air-oracle.js';
import {
  AIR_ORACLE_1193_TARGET,
  AIR_ORACLE_1193_SCENARIOS,
  AIR_ORACLE_1193_PHASE1_REQUIRED_FIELDS
} from '../src/air-oracle-scenarios-1193.js';

assert.deepEqual(AIR_ORACLE_1193_TARGET,AIR_ORACLE_TARGET_1193);
assert.equal(AIR_ORACLE_1193_SCENARIOS.length,16);
assert.deepEqual(AIR_ORACLE_1193_SCENARIOS.map(s=>s.id),Array.from({length:16},(_,i)=>`A${String(i+1).padStart(2,'0')}`));
assert.equal(new Set(AIR_ORACLE_1193_SCENARIOS.map(s=>s.variable)).size,16);
assert.ok(AIR_ORACLE_1193_SCENARIOS.every(s=>s.mission==='air_superiority'&&s.minimumTrials>=20));
assert.ok(AIR_ORACLE_1193_PHASE1_REQUIRED_FIELDS.includes('trials[].windowHours'));

const capture={
  schemaVersion:1,
  metadata:{gameVersion:AIR_ORACLE_TARGET_1193.gameVersion,checksum:AIR_ORACLE_TARGET_1193.checksum,scenarioId:'A01'},
  controlled:{mission:'air_superiority',countA:100,countB:100,aircraftA:'baseline-a',aircraftB:'baseline-b'},
  trials:[
    {trialId:'T1',lossA:2,lossB:4,windowHours:24},
    {trialId:'T2',lossA:1,lossB:3,windowHours:12}
  ]
};
assert.deepEqual(validateAirOracle1193Capture(capture),{ok:true,errors:[]});
assert.equal(validateAirOracle1193Capture({...capture,metadata:{...capture.metadata,checksum:'bad'}}).ok,false);
assert.equal(validateAirOracle1193Capture({...capture,trials:[{trialId:'T1',lossA:2,lossB:4}]}).ok,false);

const rates=summarizeAirOracleRates1193(capture);
assert.equal(rates.trialCount,2);
assert.equal(rates.lossAper24h.mean,2);
assert.equal(rates.lossBper24h.mean,5);
assert.equal(rates.exchangeRatio24h,2.5);

console.log('Air Oracle 1.19.3 target and scenario matrix passed.');
