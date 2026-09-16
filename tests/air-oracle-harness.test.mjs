import assert from 'node:assert/strict';
import {AIR_ORACLE_SCHEMA_VERSION,airOracleEvidenceClass,compareAirOracleCapture,summarizeAirOracleCapture,validateAirOracleCapture} from '../src/air-oracle.js';

const trials=Array.from({length:20},(_,i)=>({trialId:`T${i+1}`,lossA:2,lossB:4,windowHours:24}));
const capture={
  schemaVersion:AIR_ORACLE_SCHEMA_VERSION,
  metadata:{gameVersion:'1.19.2',checksum:'oracle-test-checksum',scenarioId:'air-baseline-fighter-01'},
  controlled:{mission:'air_superiority',countA:100,countB:100},
  trials,
};

assert.deepEqual(validateAirOracleCapture(capture),{ok:true,errors:[]});
assert.equal(validateAirOracleCapture({...capture,metadata:{...capture.metadata,checksum:''}}).ok,false,'checksum provenance is mandatory');
assert.equal(validateAirOracleCapture({...capture,trials:[...trials,{trialId:'overflow',lossA:101,lossB:0}]}).ok,false,'losses cannot exceed starting aircraft');
assert.equal(validateAirOracleCapture({...capture,trials:[trials[0],{...trials[1],trialId:'T1'}]}).ok,false,'trial IDs must be unique when supplied');

const summary=summarizeAirOracleCapture(capture);
assert.equal(summary.trialCount,20);
assert.equal(summary.lossA.mean,2);
assert.equal(summary.lossB.mean,4);
assert.equal(summary.exchangeRatio,2);
assert.equal(summary.lossA.sampleStdDev,0);

const planner={lossA:2,lossB:4};
const noPolicy=compareAirOracleCapture(capture,planner);
assert.equal(noPolicy.pass,null,'a capture cannot self-certify without a declared validation policy');
assert.equal(noPolicy.eligible,false);
assert.equal(airOracleEvidenceClass(noPolicy),'unvalidated');
assert.equal(noPolicy.distributionComparable,false,'expected-loss model must not claim distribution parity');

const undersampled=compareAirOracleCapture({...capture,trials:trials.slice(0,5)},planner,{minTrials:20,maxMeanLossRel:.05});
assert.equal(undersampled.pass,null,'insufficient samples remain unvalidated rather than divergent');
assert.equal(undersampled.eligible,false);
assert.equal(airOracleEvidenceClass(undersampled),'unvalidated');
assert.equal(undersampled.failures[0].reason,'insufficient trials');

const exact=compareAirOracleCapture(capture,planner,{minTrials:20,maxMeanLossAbs:.01,maxMeanLossRel:.01,maxExchangeRatioRel:.01});
assert.equal(exact.pass,true);
assert.equal(exact.eligible,true);
assert.equal(exact.failures.length,0);
assert.equal(airOracleEvidenceClass(exact),'oracle-validated');

const divergent=compareAirOracleCapture(capture,{lossA:3,lossB:2},{minTrials:20,maxMeanLossRel:.10,maxExchangeRatioRel:.10});
assert.equal(divergent.pass,false);
assert.equal(divergent.eligible,true);
assert.ok(divergent.failures.length>0);
assert.equal(airOracleEvidenceClass(divergent),'oracle-divergent');

const varied={...capture,trials:Array.from({length:20},(_,i)=>({trialId:`V${i+1}`,lossA:i%2?1:3,lossB:i%2?3:5}))};
const variedSummary=summarizeAirOracleCapture(varied);
assert.equal(variedSummary.lossA.mean,2);
assert.equal(variedSummary.lossB.mean,4);
assert.ok(variedSummary.lossA.sampleStdDev>0&&variedSummary.lossB.sampleStdDev>0,'raw trial variation must remain measurable');

const zeroLoss={...capture,metadata:{...capture.metadata,scenarioId:'zero-loss-edge'},trials:Array.from({length:20},(_,i)=>({trialId:`Z${i+1}`,lossA:0,lossB:4}))};
const zeroExact=compareAirOracleCapture(zeroLoss,{lossA:0,lossB:4},{minTrials:20,maxMeanLossAbs:.01,maxExchangeRatioRel:.01});
assert.equal(zeroExact.pass,true,'matching infinite exchange ratios must compare cleanly');
assert.equal(zeroExact.metrics.exchangeRatio.relativeError,0);
const zeroMismatch=compareAirOracleCapture(zeroLoss,{lossA:1,lossB:4},{minTrials:20,maxExchangeRatioRel:.01});
assert.equal(zeroMismatch.pass,false,'finite-vs-infinite exchange must diverge');
assert.equal(zeroMismatch.metrics.exchangeRatio.relativeError,Infinity);

console.log('Air Oracle differential harness evidence-boundary tests passed.');
