import assert from 'node:assert/strict';
import { DEFINE_VALUES_1192, DEFINES_CERTIFICATION_1192 } from '../src/builtin1192/defines-certification-1192.js';

const military=Object.keys(DEFINE_VALUES_1192.NMilitary),production=Object.keys(DEFINE_VALUES_1192.NProduction);
const total=military.length+production.length;
assert.equal(military.length,20,'20 planner-consumed NMilitary source defines are classified');
assert.equal(production.length,4,'4 planner-consumed NProduction source defines are classified');
assert.equal(total,24,'all planner-consumed source define values are classified');
assert.equal(DEFINES_CERTIFICATION_1192.sourceBoundary.plannerConsumedDefineValues,24);
assert.equal(DEFINES_CERTIFICATION_1192.sourceBoundary.authoritativeRawGameDefinesRetained,false,'do not overclaim a complete raw 1.19.2 defines source file');
assert.equal(DEFINES_CERTIFICATION_1192.corrections.length,1,'the audit currently contains one confirmed stale runtime define correction');
assert.equal(DEFINES_CERTIFICATION_1192.corrections[0].runtime,'COMBAT_CONSTANTS.nightAttackPenalty');
assert.equal(DEFINES_CERTIFICATION_1192.formulaDerived['PRODUCTION_CONSTANTS.efficiencyBaseGain'].sourceValue,1);
assert.equal(DEFINES_CERTIFICATION_1192.formulaDerived['PRODUCTION_CONSTANTS.efficiencyBaseGain'].runtimeValue,.001);
assert.equal(DEFINES_CERTIFICATION_1192.formulaDerived['PRODUCTION_CONSTANTS.efficiencyBaseGain'].deferredTo,'Production formulas');
assert.ok(DEFINES_CERTIFICATION_1192.formulaDeferred.includes('piercingDamageFactor thresholds and partial-piercing damage factors'));
assert.ok(DEFINES_CERTIFICATION_1192.formulaDeferred.includes('exact define interaction/order inside combat and production formulas'));
console.log('DEFINES_AUDIT_COVERAGE',JSON.stringify({military:military.length,production:production.length,total,classification:DEFINES_CERTIFICATION_1192.classification,rawGameDefinesRetained:false,confirmedRuntimeCorrections:DEFINES_CERTIFICATION_1192.corrections.length,formulaDerived:Object.keys(DEFINES_CERTIFICATION_1192.formulaDerived).length,formulaDeferred:DEFINES_CERTIFICATION_1192.formulaDeferred.length}));
console.log('Defines bounded audit coverage certification passed.');
