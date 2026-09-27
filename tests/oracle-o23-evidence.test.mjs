import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o23-armored-org-die-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o23-armored-org-die-001-assessment.json',import.meta.url),'utf8'));
const cert=readFileSync(new URL('../src/builtin1193/oracle-combat-certification-1193.js',import.meta.url),'utf8');

assert.equal(summary.scenario,'o23-armored-org-die-v1');
assert.equal(summary.controls.firingIntervals,120);
assert.deepEqual(summary.counts,{one:20,two:18,three:22,four:22,five:18,six:20,zero:0,outOfSupport:0});
assert.equal(assessment.action,'armored-org-die-uniform-1-through-6-supported');
assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.pearsonChiSquare,0.8);
assert.ok(assessment.pearsonChiSquare<=assessment.criticalValue1PctDf5);
assert.equal(assessment.requiredFacesObserved.five,true);
assert.equal(assessment.requiredFacesObserved.six,true);
assert.match(cert,/armoredOrganizationDieEvidence:Object\.freeze/);
assert.match(cert,/action:'armored-org-die-uniform-1-through-6-supported'/);
console.log('Oracle O23 evidence regression passed.');
