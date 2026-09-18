import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const raw=execFileSync(process.execPath,['scripts/oracle-o1-base-compare.mjs'],{
  cwd:process.cwd(),
  encoding:'utf8',
  env:{...process.env,ORACLE_COMPARE_RUNS:'1500'}
});
const report=JSON.parse(raw);

assert.equal(report.schemaVersion,2);
assert.equal(report.scenario,'o1-base-neutral-tactics-v1');
assert.equal(report.evidenceStatus,'unvalidated');
assert.equal(report.plannerRunsPerSensitivityPoint,1500);
assert.equal(report.plannerInputs.exactControlled.sharedBaseSoftAttack,54);
assert.equal(report.plannerInputs.exactControlled.sharedExperienceAttackFactor,0.25);
assert.equal(report.plannerInputs.exactControlled.sharedSoftAttackAfterExperience,67.5);

const ui=report.plannerInputs.uiDerivedSensitivity;
assert.equal(ui.vanillaBasicTacticFactorRemoved,0.05);
assert.equal(ui.displayedSensitivityHalfWidth,1);
assert.ok(ui.attackerSoftAttackNeutralRange[0]<ui.attackerSoftAttackNeutralRange[1]);
assert.ok(ui.defenderSoftAttackNeutralRange[0]<ui.defenderSoftAttackNeutralRange[1]);
assert.deepEqual(ui.attackerBreakthroughRange,[34,36]);
assert.deepEqual(ui.defenderDefenseRange,[254,256]);

assert.equal(report.hitRegimeAcrossSensitivity.attackerIntoDefender.allAttackPointsRemainDefended,true);
assert.equal(report.hitRegimeAcrossSensitivity.defenderIntoAttacker.undefendedAttackPointsRemainPossible,true);

for(const point of ['lowDamage','midpoint','highDamage']){
  assert.equal(report.oraclePatchedOneHourDelay[point].attackerStrengthLoss.n,1500);
  assert.equal(report.oraclePatchedOneHourDelay[point].defenderStrengthLoss.n,1500);
  assert.ok(Number.isFinite(report.oraclePatchedOneHourDelay[point].attackerStrengthLoss.q95));
  assert.ok(Number.isFinite(report.oraclePatchedOneHourDelay[point].defenderStrengthLoss.zeroLossProbability));
}

assert.match(report.evidenceBoundary,/organization remains deferred/i);
assert.ok(report.limitations.some(x=>/not a pass\/fail Oracle promotion criterion/i.test(x)));

console.log('Oracle O1 bounded-input distribution comparator regression passed.');
