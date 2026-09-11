import assert from 'node:assert/strict';
import {ORACLE_SCHEMA_VERSION,compareOracleTrace,oracleEvidenceClass,plannerTimelineToOracleSamples,validateOracleCapture} from '../src/oracle.js';

const capture={
  schemaVersion:ORACLE_SCHEMA_VERSION,
  metadata:{gameVersion:'1.19.2',checksum:'test-checksum',scenarioId:'baseline-plain-01'},
  samples:[
    {hour:0,attacker:{org:100,strength:100},defender:{org:100,strength:100}},
    {hour:6,attacker:{org:92.5,strength:99.4},defender:{org:88.1,strength:98.8}},
    {hour:12,attacker:{org:84.7,strength:98.9},defender:{org:75.9,strength:97.5}},
  ],
};

assert.deepEqual(validateOracleCapture(capture),{ok:true,errors:[]});
assert.equal(validateOracleCapture({...capture,metadata:{...capture.metadata,checksum:''}}).ok,false);
assert.equal(validateOracleCapture({...capture,samples:[capture.samples[1],capture.samples[0]]}).ok,false);

const exactSimulation={timeline:[
  {hour:0,aOrg:100,dOrg:100,aStrength:100,dStrength:100},
  {hour:6,aOrg:92.5,dOrg:88.1,aStrength:99.4,dStrength:98.8},
  {hour:12,aOrg:84.7,dOrg:75.9,aStrength:98.9,dStrength:97.5},
]};
assert.equal(plannerTimelineToOracleSamples(exactSimulation).length,3);
const exact=compareOracleTrace(capture,exactSimulation);
assert.equal(exact.pass,true);
assert.equal(exact.matchedSamples,3);
assert.equal(exact.endHourError,0);
assert.equal(oracleEvidenceClass(exact),'oracle-validated');

const closeSimulation={timeline:[
  {hour:0,aOrg:100,dOrg:100,aStrength:100,dStrength:100},
  {hour:6,aOrg:92.4,dOrg:88.2,aStrength:99.35,dStrength:98.82},
  {hour:12,aOrg:84.8,dOrg:76.0,aStrength:98.85,dStrength:97.55},
]};
assert.equal(compareOracleTrace(capture,closeSimulation).pass,true);

const divergentSimulation={timeline:[
  {hour:0,aOrg:100,dOrg:100,aStrength:100,dStrength:100},
  {hour:6,aOrg:90.0,dOrg:88.1,aStrength:99.4,dStrength:98.8},
  {hour:12,aOrg:84.7,dOrg:75.9,aStrength:98.9,dStrength:97.5},
]};
const divergent=compareOracleTrace(capture,divergentSimulation);
assert.equal(divergent.pass,false);
assert.equal(divergent.firstDivergence.hour,6);
assert.equal(oracleEvidenceClass(divergent),'oracle-divergent');

console.log('HOI4 oracle differential harness certification passed.');
