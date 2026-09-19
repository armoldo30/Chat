import assert from 'node:assert/strict';
import {parseO4V2Batch,O4V2_HOURS} from '../scripts/oracle-o4v2-trial6.mjs';
import {assessO4V2} from '../scripts/oracle-o4v2-assess.mjs';
import {buildO4V2Reference} from '../scripts/oracle-o4v2-reference.mjs';

function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(mode,positive){
  const mod=mode==='control'?'army_infantry_attack_factor:-0.84':'army_infantry_attack_factor:-0.97';
  const lines=['WPO4V2 BEGIN schema=1 scenario=o4-guaranteed-hit-sub10-v2 mode='+mode+' gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial6 tacticMode=neutral-basic-only defineOverride=BASE_CHANCE_TO_AVOID_HIT:0 attackModifier='+mod+' prepared=yes modifierPresent=yes'];
  let d=1;
  for(const h of O4V2_HOURS){
    if(h>=2&&positive.includes(h-1))d-=.00025;
    const a=b(h<2?1:1-h*.00001),db=b(d);
    lines.push('WPO4V2 SAMPLE hour='+h);
    lines.push('WPO4V2 ATTACKER orgLow='+a.low+' orgHigh='+a.high+' strengthLow='+a.low+' strengthHigh='+a.high);
    lines.push('WPO4V2 DEFENDER orgLow='+db.low+' orgHigh='+db.high+' strengthLow='+db.low+' strengthHigh='+db.high);
  }
  lines.push('WPO4V2 END hour=6 reason=trial6-complete modifiersRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}
const text=run('control',[1,2,3,4,5])+run('probe',[2]);
const batch=parseO4V2Batch(text);
assert.equal(batch.acceptedRuns,2);
assert.equal(batch.byMode.control[0].capture.positiveIntervals,5);
assert.equal(batch.byMode.probe[0].capture.positiveIntervals,1);

const assessment=assessO4V2({batch,controlStats:{attackerSoft:12,defenderDefense:255},probeStats:{attackerSoft:2,defenderDefense:255}});
assert.equal(assessment.action,'minimum-one-hypothesis-contradicted');
assert.equal(assessment.evidenceStatus,'unvalidated');

const allFive=parseO4V2Batch(run('control',[1,2,3,4,5])+run('probe',[1,2,3,4,5]));
const high=assessO4V2({batch:allFive,controlStats:{attackerSoft:12,defenderDefense:255},probeStats:{attackerSoft:2,defenderDefense:255}});
assert.equal(high.action,'stochastic-rounding-mismatch-candidate');
assert.ok(Math.abs(high.worstCasePlannerProbability-.00243)<1e-12);

const ref=buildO4V2Reference();
assert.ok(Math.abs(ref.probe.plannerWorstCaseAllFivePositiveProbability-.00243)<1e-12);
console.log('Oracle O4 v2 parser/assessment regression passed.');
