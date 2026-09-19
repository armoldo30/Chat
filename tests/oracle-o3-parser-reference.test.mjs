import assert from 'node:assert/strict';
import {
  parseO3Batch,O3_HOURS,O3_GAME_VERSION,O3_BASE_CHECKSUM,O3_CHECKSUM_SCOPE,O3_METHOD
} from '../scripts/oracle-o3-sub10-trial6.mjs';
import {buildO3Reference} from '../scripts/oracle-o3-sub10-reference.mjs';

function m(low,high){return {low:low.toFixed(5),high:high.toFixed(5)};}
function run({damage=false,variant=0}={}){
  const lines=[
    `WPO3 BEGIN schema=1 scenario=o3-sub10-defended-incidence-v1 gameVersion=${O3_GAME_VERSION} checksum=${O3_BASE_CHECKSUM} checksumScope=${O3_CHECKSUM_SCOPE} method=${O3_METHOD} runMode=trial6 tacticMode=neutral-basic-only attenuator=army_infantry_attack_factor:-0.89 prepared=yes attenuatorPresent=yes`
  ];
  for(const hour of O3_HOURS){
    const fire=Math.max(0,hour-1);
    const aOrg=m(.99994-fire*(.00012+.00001*variant),1-fire*(.00012+.00001*variant));
    const aStr=m(.99994-fire*(.00003+.000005*variant),1-fire*(.00003+.000005*variant));
    const dLoss=damage&&hour>=2?.00030:0;
    const dOrg=m(.99994-dLoss,1-dLoss);
    const dStr=m(.99994-dLoss,1-dLoss);
    lines.push(`WPO3 SAMPLE hour=${hour}`);
    lines.push(`WPO3 ATTACKER orgLow=${aOrg.low} orgHigh=${aOrg.high} strengthLow=${aStr.low} strengthHigh=${aStr.high}`);
    lines.push(`WPO3 DEFENDER orgLow=${dOrg.low} orgHigh=${dOrg.high} strengthLow=${dStr.low} strengthHigh=${dStr.high}`);
  }
  lines.push('WPO3 END hour=6 reason=trial6-complete attenuatorRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}

const batch=parseO3Batch(run({damage:true,variant:0})+run({damage:false,variant:1}));
assert.equal(batch.totalRuns,2);
assert.equal(batch.acceptedRuns,2);
assert.equal(batch.rejectedRuns,0);
assert.equal(batch.uniqueTraceCount,2);
assert.equal(batch.primaryMetric,'runsWithDefenderStrengthDamage');
assert.equal(batch.incidence.damageRuns,1);
assert.equal(batch.incidence.zeroDamageRuns,1);
assert.equal(batch.runs[0].capture.incidence.defenderStrengthDamageObserved,true);
assert.equal(batch.runs[1].capture.incidence.defenderStrengthDamageObserved,false);

const ref8=buildO3Reference({attackerSoft:8});
assert.equal(ref8.sensitivity.length,3);
assert.ok(ref8.probabilityEnvelope.anyDamagePerRunMin>.30);
assert.ok(ref8.probabilityEnvelope.anyDamagePerRunMax<.38);
assert.ok(ref8.probabilityEnvelope.allZeroAt6Max>.08);
assert.ok(ref8.probabilityEnvelope.allZeroAt6Max<.12);
assert.ok(ref8.probabilityEnvelope.allZeroAt10Max<.03);
assert.equal(ref8.predeclaredSamplingPlan.preliminaryUniqueRuns,6);
assert.equal(ref8.predeclaredSamplingPlan.confirmatoryTotalUniqueRuns,10);

const ref7=buildO3Reference({attackerSoft:7});
assert.ok(ref7.probabilityEnvelope.allZeroAt10Max<.05);
assert.throws(()=>buildO3Reference({attackerSoft:9}),/only in \[7,8\]/);

console.log('Oracle O3 parser/reference regression passed.');
