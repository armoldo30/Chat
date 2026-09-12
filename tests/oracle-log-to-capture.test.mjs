import assert from 'node:assert/strict';
import {O1_INTERVAL_PCT,O1_MIDPOINT_MAX_ERROR_PCT,oracleCaptureFromRun,parseOracleLog,parseOracleRuns} from '../scripts/oracle-log-to-capture.mjs';
import {validateOracleCapture} from '../src/oracle.js';

const log=`
[21:00:00][1936.01.01.12][game.cpp:1]: unrelated HOI4 log traffic
[21:00:01][1936.01.01.12][effect.cpp:1]: [WPO1] BEGIN schema=1 scenario=o1-land-baseline-v1 gameVersion=1.19.2.0.a729 checksum=d245 method=bisection14
[21:00:01][1936.01.01.12][effect.cpp:1]: [WPO1] SAMPLE hour=0
[21:00:01][1936.01.01.12][effect.cpp:1]: [WPO1] ATTACKER orgLow=0.99993896484375 orgHigh=1 strengthLow=0.99993896484375 strengthHigh=1
[21:00:01][1936.01.01.12][effect.cpp:1]: [WPO1] DEFENDER orgLow=0.99993896484375 orgHigh=1 strengthLow=0.99993896484375 strengthHigh=1
[21:01:01][1936.01.01.13][effect.cpp:1]: [WPO1] SAMPLE hour=1
[21:01:01][1936.01.01.13][effect.cpp:1]: [WPO1] ATTACKER orgLow=0.9500 orgHigh=0.95006103515625 strengthLow=0.9900 strengthHigh=0.99006103515625
[21:01:01][1936.01.01.13][effect.cpp:1]: [WPO1] DEFENDER orgLow=0.9000 orgHigh=0.90006103515625 strengthLow=0.9800 strengthHigh=0.98006103515625
[21:01:01][1936.01.01.13][effect.cpp:1]: [WPO1] END hour=1 reason=manual
`;

const runs=parseOracleRuns(log);
assert.equal(runs.length,1);
assert.equal(runs[0].samples.length,2);
assert.equal(runs[0].samples[0].attackers.length,1);
assert.equal(runs[0].samples[0].defenders.length,1);

const capture=parseOracleLog(log);
assert.equal(capture.schemaVersion,1);
assert.equal(capture.metadata.gameVersion,'1.19.2.0.a729');
assert.equal(capture.metadata.checksum,'d245');
assert.equal(capture.metadata.scenarioId,'o1-land-baseline-v1');
assert.equal(capture.metadata.captureMethod,'bisection14');
assert.equal(capture.metadata.measurementBisections,14);
assert.ok(Math.abs(capture.metadata.measurementIntervalPct-O1_INTERVAL_PCT)<1e-15);
assert.ok(Math.abs(capture.metadata.measurementMidpointMaxErrorPct-O1_MIDPOINT_MAX_ERROR_PCT)<1e-15);
assert.equal(capture.samples.length,2);
assert.ok(Math.abs(capture.samples[0].attacker.org-99.9969482421875)<1e-12);
assert.ok(Math.abs(capture.samples[1].defender.org-90.0030517578125)<1e-12);
assert.deepEqual(validateOracleCapture(capture),{ok:true,errors:[]});

const ambiguous=`
[WPO1] BEGIN schema=1 scenario=o1-probe gameVersion=1.19.2.0.a729 checksum=d245 method=bisection14
[WPO1] SAMPLE hour=0
[WPO1] ATTACKER orgLow=0.9 orgHigh=1 strengthLow=0.9 strengthHigh=1
[WPO1] ATTACKER orgLow=0.8 orgHigh=0.9 strengthLow=0.8 strengthHigh=0.9
[WPO1] DEFENDER orgLow=0.9 orgHigh=1 strengthLow=0.9 strengthHigh=1
[WPO1] END hour=0 reason=probe
`;
const ambiguousRun=parseOracleRuns(ambiguous)[0];
assert.throws(()=>oracleCaptureFromRun(ambiguousRun),/expected exactly 1 ATTACKER division, found 2/);

const incomplete=`
[WPO1] BEGIN schema=1 scenario=o1 gameVersion=1.19.2 checksum=d245 method=bisection14
[WPO1] SAMPLE hour=0
[WPO1] ATTACKER orgLow=0.9 orgHigh=1 strengthLow=0.9 strengthHigh=1
[WPO1] DEFENDER orgLow=0.9 orgHigh=1 strengthLow=0.9 strengthHigh=1
`;
assert.throws(()=>parseOracleLog(incomplete),/No complete \[WPO1\] run/);

const latest=log+`\n[WPO1] BEGIN schema=1 scenario=o1-second gameVersion=1.19.2.0.a729 checksum=d245 method=bisection14\n[WPO1] SAMPLE hour=0\n[WPO1] ATTACKER orgLow=0.5 orgHigh=0.50006103515625 strengthLow=0.6 strengthHigh=0.60006103515625\n[WPO1] DEFENDER orgLow=0.7 orgHigh=0.70006103515625 strengthLow=0.8 strengthHigh=0.80006103515625\n[WPO1] END hour=0 reason=manual\n`;
assert.equal(parseOracleLog(latest).metadata.scenarioId,'o1-second');

console.log('HOI4 Oracle O1 game.log parser certification passed.');
