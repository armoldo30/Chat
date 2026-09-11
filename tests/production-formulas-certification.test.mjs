import assert from 'node:assert/strict';
import { PRODUCTION_CONSTANTS } from '../src/data.js';
import { efficiencyProjection, militaryFactoryOutputProfile, evaluateProduction } from '../src/engine.js';
import { PRODUCTION_SOURCE_1192, PRODUCTION_EXECUTABLE_1192, PRODUCTION_FORMULA_CERTIFICATION_1192 } from '../src/builtin1192/production-formulas-certification-1192.js';

const src=PRODUCTION_SOURCE_1192.defines;
assert.equal(PRODUCTION_SOURCE_1192.sourceSha256,'405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4');
assert.equal(PRODUCTION_SOURCE_1192.sourceBytes,405669);
assert.equal(src.BASE_FACTORY_SPEED_MIL,3.5);
assert.equal(src.POWERED_FACTORY_SPEED_MIL,4.5);
assert.equal(src.BASE_FACTORY_START_EFFICIENCY_FACTOR,10);
assert.equal(src.BASE_FACTORY_MAX_EFFICIENCY_FACTOR,50);
assert.equal(src.BASE_FACTORY_EFFICIENCY_GAIN,1);
assert.equal(src.PRODUCTION_RESOURCE_LACK_PENALTY,-.05);
assert.equal(src.MAX_MIL_FACTORIES_PER_LINE,150);
assert.equal(src.RESOURCE_TO_ENERGY_COEFFICIENT,9);
assert.equal(src.BASE_COUNTRY_ENERGY_PRODUCTION,10);
assert.equal(src.ENERGY_SCALING_COST_BY_FACTORY_COUNT,.0225);
assert.equal(src.BASE_ENERGY_COST,.25);
assert.equal(src.ENERGY_COST_CAP,6.6);

assert.equal(PRODUCTION_CONSTANTS.baseFactoryOutput,3.5);
assert.equal(PRODUCTION_CONSTANTS.poweredFactoryOutput,4.5);
assert.equal(PRODUCTION_CONSTANTS.baseStartEfficiency,10);
assert.equal(PRODUCTION_CONSTANTS.baseMaxEfficiency,50);
assert.equal(PRODUCTION_CONSTANTS.efficiencyBaseGain,.001);
assert.equal(PRODUCTION_CONSTANTS.resourceLackPenaltyPerUnit,.05);
assert.equal(PRODUCTION_CONSTANTS.maxLineResourcePenalty,1);
assert.equal(PRODUCTION_CONSTANTS.maxMilitaryFactoriesPerLine,150);
assert.equal(PRODUCTION_EXECUTABLE_1192.resourceShortagePenaltyCap,1);

const oneDay=efficiencyProjection(undefined,undefined,1,undefined);
assert.equal(oneDay.start,.10,'missing scenario start must use exact 10% base efficiency');
assert.equal(oneDay.cap,.50,'missing scenario cap must use exact 50% base cap');
assert.ok(Math.abs(oneDay.end-.1025)<1e-12,'base day-one efficiency gain must follow 0.001 * cap^2/current');
assert.equal(oneDay.average,.10,'one-day production uses the starting efficiency for that modeled day');
const boosted=efficiencyProjection(10,110,1,50);
assert.ok(Math.abs(boosted.end-.10275)<1e-12,'+10% effective gain must multiply the nonlinear base gain');
const zero=efficiencyProjection(0,100,30,50);
assert.equal(zero.end,0,'planner must not invent recovery from an exactly zero efficiency state');

const unpowered=militaryFactoryOutputProfile(0,0),half=militaryFactoryOutputProfile(50,0),powered=militaryFactoryOutputProfile(100,0);
assert.equal(unpowered.factoryICPerDay,3.5);
assert.equal(half.factoryICPerDay,4.0);
assert.equal(powered.factoryICPerDay,4.5);
assert.ok(Math.abs(militaryFactoryOutputProfile(50,20).factoryICPerDay-4.4)<1e-12,'positive factory-output modifier must scale with 50% energy');
assert.ok(Math.abs(militaryFactoryOutputProfile(0,-20).factoryICPerDay-2.8)<1e-12,'negative factory-output modifiers remain active at zero energy');

const synthetic={widget:{cost:1,resources:{steel:2,aluminum:1}}};
const constrained=evaluateProduction([{type:'widget',stock:0,target:9999,factories:11,priority:1}],{days:1,factories:11,efficiency:100,efficiencyGain:0,maxEfficiency:100,outputBonus:0,energySatisfaction:100,resources:{steel:2,aluminum:0}},synthetic);
const expected=[.95,.90,.80,.70,.60,.50,.40,.30,.20,.10,0];
assert.equal(constrained.lines[0].resourceFactoryFactors.length,expected.length);
constrained.lines[0].resourceFactoryFactors.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-12,`factory ${i+1} shortage factor`));
assert.ok(Math.abs(constrained.lines[0].resourceFactor-(expected.reduce((a,b)=>a+b,0)/expected.length))<1e-12,'line shortage factor must average its per-factory factors');

const rifles={rifle:{cost:.5,resources:{steel:2}}};
const common={days:1,factories:1,efficiency:100,efficiencyGain:0,maxEfficiency:100,outputBonus:0,resources:{steel:2}};
const full=evaluateProduction([{type:'rifle',stock:0,target:100,factories:1,priority:1}],{...common,energySatisfaction:100},rifles);
const none=evaluateProduction([{type:'rifle',stock:0,target:100,factories:1,priority:1}],{...common,energySatisfaction:0},rifles);
assert.equal(full.lines[0].daily,9,'fully powered MIC must provide 4.5 IC/day before equipment cost conversion');
assert.equal(none.lines[0].daily,7,'unpowered MIC must provide 3.5 IC/day before equipment cost conversion');
const legacy=evaluateProduction([{type:'rifle',stock:0,target:100,factories:1,priority:1}],{...common,baseFactoryOutput:3.5},rifles);
assert.equal(legacy.factoryOutput.energySatisfaction,0,'legacy 3.5 base-output scenarios migrate to 0% energy without changing their output');
const modernDefault=evaluateProduction([{type:'rifle',stock:0,target:100,factories:1,priority:1}],common,rifles);
assert.equal(modernDefault.factoryOutput.energySatisfaction,1,'new scenarios without a legacy base-output override default to fully powered industry');

assert.equal(PRODUCTION_FORMULA_CERTIFICATION_1192.classification,'bounded-production-formulas');
assert.ok(PRODUCTION_FORMULA_CERTIFICATION_1192.deferred.some(x=>x.includes('coal-to-energy')));
assert.ok(PRODUCTION_FORMULA_CERTIFICATION_1192.deferred.some(x=>x.includes('MIO')));
console.log('PRODUCTION_FORMULAS_AUDIT_COVERAGE',JSON.stringify({sourceExact:PRODUCTION_FORMULA_CERTIFICATION_1192.sourceExact.length,executableInferred:PRODUCTION_FORMULA_CERTIFICATION_1192.executableInferred.length,corrections:PRODUCTION_FORMULA_CERTIFICATION_1192.corrections.length,deferred:PRODUCTION_FORMULA_CERTIFICATION_1192.deferred.length}));
console.log('Production formulas bounded certification passed.');
