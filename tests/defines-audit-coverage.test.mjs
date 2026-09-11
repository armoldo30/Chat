import assert from 'node:assert/strict';
import { DEFINE_VALUES_1192, PLANNER_ANALYTICAL_CONSTANTS_1192, DEFINES_SOURCE_1192, DEFINES_CERTIFICATION_1192 } from '../src/builtin1192/defines-certification-1192.js';

const military=Object.keys(DEFINE_VALUES_1192.NMilitary),production=Object.keys(DEFINE_VALUES_1192.NProduction);
assert.equal(military.length,20,'20 planner-consumed NMilitary source defines are exact');
assert.equal(production.length,3,'3 planner-consumed NProduction source defines are exact');
assert.equal(military.length+production.length,23,'all source-backed planner-consumed define values are classified');
assert.equal(DEFINES_CERTIFICATION_1192.classification,'game-file-exact-consumed-defines');
assert.equal(DEFINES_CERTIFICATION_1192.sourceBoundary.authoritativeRawGameDefinesRetained,true);
assert.equal(DEFINES_CERTIFICATION_1192.sourceBoundary.fullDefinesCorpusCensused,true);
assert.equal(DEFINES_CERTIFICATION_1192.sourceBoundary.plannerConsumedSourceDefineValues,23);
assert.equal(DEFINES_CERTIFICATION_1192.sourceBoundary.plannerAnalyticalConstants,1);
assert.equal(PLANNER_ANALYTICAL_CONSTANTS_1192.maxLineResourcePenalty,.90);

assert.equal(DEFINES_SOURCE_1192.sourceFiles.length,3);
assert.equal(DEFINES_SOURCE_1192.totalBytes,498124);
assert.equal(DEFINES_SOURCE_1192.namespaceCount,39);
assert.equal(DEFINES_SOURCE_1192.directAssignmentCount,4503);
assert.equal(DEFINES_SOURCE_1192.recursiveScalarLeafCount,5997);
assert.deepEqual(DEFINES_SOURCE_1192.directValueTypes,{number:4124,boolean:42,string:22,table:315});
assert.equal(DEFINES_SOURCE_1192.duplicateAssignments,2);
assert.equal(DEFINES_SOURCE_1192.duplicateEffectiveValueChanges,0);
assert.equal(DEFINES_SOURCE_1192.sourceFiles[0].sha256,'405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4');
assert.equal(DEFINES_SOURCE_1192.sourceFiles[1].sha256,'dfdab0a5fad7319d7b5ac524d98af49d3a0c1f95772e6b7a76abce54836f3d86');
assert.equal(DEFINES_SOURCE_1192.sourceFiles[2].sha256,'49a3c68dde41a092b1af94674db6369a7abcfc0445153bb9da248cdb3f5c8604');

assert.equal(DEFINES_CERTIFICATION_1192.corrections.length,5);
assert.equal(DEFINES_CERTIFICATION_1192.provenanceCorrections.length,1);
assert.equal(DEFINES_CERTIFICATION_1192.provenanceCorrections[0].runtime,'PRODUCTION_CONSTANTS.maxLineResourcePenalty');
assert.equal(DEFINES_CERTIFICATION_1192.provenanceCorrections[0].classification,'planner-analytical');
assert.equal(DEFINES_CERTIFICATION_1192.formulaDerived['PRODUCTION_CONSTANTS.efficiencyBaseGain'].sourceValue,1);
assert.equal(DEFINES_CERTIFICATION_1192.formulaDerived['PRODUCTION_CONSTANTS.efficiencyBaseGain'].runtimeValue,.001);
assert.equal(DEFINES_CERTIFICATION_1192.formulaDerived['PRODUCTION_CONSTANTS.efficiencyBaseGain'].deferredTo,'Production formulas');
assert.ok(DEFINES_CERTIFICATION_1192.formulaDeferred.includes('exact define interaction/order inside combat and production formulas'));
console.log('DEFINES_AUDIT_COVERAGE',JSON.stringify({military:military.length,production:production.length,sourceExact:23,analytical:1,namespaces:DEFINES_SOURCE_1192.namespaceCount,directAssignments:DEFINES_SOURCE_1192.directAssignmentCount,corrections:DEFINES_CERTIFICATION_1192.corrections.length}));
console.log('Defines exact-source audit coverage certification passed.');
