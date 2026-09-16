import assert from 'node:assert/strict';
import {parseOracleLog} from '../scripts/oracle-log-to-capture.mjs';

const realStyle=`[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 BEGIN schema=1 scenario=o1-land-baseline-v1 gameVersion=1.19.2.0.a729 checksum=d245 method=bisection14\n[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 SAMPLE hour=0\n[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 ATTACKER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1\n[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 DEFENDER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1\n[15:14:25][1936.01.23.01][effectbase.cpp:1783]: WPO1 END hour=0 reason=manual\n`;
const real=parseOracleLog(realStyle);
assert.equal(real.metadata.scenarioId,'o1-land-baseline-v1');
assert.equal(real.samples.length,1);
assert.equal(real.samples[0].hour,0);
assert.ok(real.samples[0].attacker.org>99.99);

const legacy=realStyle.replaceAll('WPO1 ','[WPO1] ');
const backwards=parseOracleLog(legacy);
assert.deepEqual(backwards.samples,real.samples);

console.log('Oracle executable-log parser certification passed.');
