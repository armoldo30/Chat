import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseO2Batch} from '../scripts/oracle-o2-trial6.mjs';

const log=readFileSync(new URL('../oracle-lab/captures/o2-defended-amplified-smoke-001-wpo2.log.txt',import.meta.url),'utf8');
const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o2-defended-amplified-smoke-001-summary.json',import.meta.url),'utf8'));
const parsed=parseO2Batch(log);

assert.equal(parsed.acceptedRuns,1);
assert.equal(parsed.rejectedRuns,0);
assert.equal(parsed.uniqueTraceCount,1);
assert.equal(parsed.primaryMetric,'defenderStrengthLoss');
assert.equal(parsed.runs[0].capture.samples.length,7);
assert.deepEqual(parsed.runs[0].capture.samples[0],parsed.runs[0].capture.samples[1]);

const d=parsed.runs[0].capture.deltas;
assert.equal(d.attackerOrgLoss,summary.measured.attackerOrgLoss);
assert.equal(d.attackerStrengthLoss,summary.measured.attackerStrengthLoss);
assert.equal(d.defenderOrgLoss,summary.measured.defenderOrgLoss);
assert.equal(d.defenderStrengthLoss,summary.measured.defenderStrengthLoss);

assert.equal(summary.observedCombatPanel.attackerSoftAttack,215);
assert.equal(summary.observedCombatPanel.attackerBreakthrough,35);
assert.equal(summary.observedCombatPanel.defenderSoftAttack,69);
assert.equal(summary.observedCombatPanel.defenderDefense,255);
assert.equal(summary.observedCombatPanel.defendedMargin,40);
assert.ok(summary.observedCombatPanel.defendedMargin>=10);
assert.equal(summary.visualControls.attackerDivisions,1);
assert.equal(summary.visualControls.defenderDivisions,1);
assert.equal(summary.visualControls.attackerWidth,18);
assert.equal(summary.visualControls.defenderWidth,18);
assert.equal(summary.visualControls.attackerReserves,0);
assert.equal(summary.visualControls.defenderReserves,0);
assert.equal(summary.evidenceStatus,'unvalidated');

console.log('Oracle O2 executable smoke 001 capture regression passed.');
