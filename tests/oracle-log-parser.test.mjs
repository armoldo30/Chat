import assert from 'node:assert/strict';
import {parseOracleLog} from '../scripts/oracle-log-to-capture.mjs';

const realStyle=`[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 BEGIN schema=1 scenario=o1-land-baseline-v1 gameVersion=1.19.3.0.c01a checksum=5632 method=bisection14 runMode=trial6
[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 SAMPLE hour=0
[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 ATTACKER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 DEFENDER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 END hour=0 reason=manual
`;
const real=parseOracleLog(realStyle);
assert.equal(real.metadata.scenarioId,'o1-land-baseline-v1');
assert.equal(real.metadata.gameVersion,'1.19.3.0.c01a');
assert.equal(real.metadata.checksum,'5632');
assert.equal(real.metadata.runMode,'trial6');
assert.equal(real.samples.length,1);
assert.equal(real.samples[0].hour,0);
assert.ok(real.samples[0].attacker.org>99.99);

const legacy=realStyle.replaceAll('WPO1 ','[WPO1] ');
const backwards=parseOracleLog(legacy);
assert.deepEqual(backwards.samples,real.samples);

console.log('Oracle executable-log parser certification passed.');
