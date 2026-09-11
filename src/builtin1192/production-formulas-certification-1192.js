export const PRODUCTION_SOURCE_1192 = Object.freeze({
  gameVersion:'1.19.2',
  sourceFile:'common/defines/00_defines.lua',
  sourceBytes:405669,
  sourceSha256:'405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4',
  defines:Object.freeze({
    MAX_MIL_FACTORIES_PER_LINE:150,
    EFFICIENCY_LOSS_PER_UNUSED_DAY:1,
    RESOURCE_PENALTY_WARNING_CRITICAL_RATIO:0.8,
    RESOURCE_TO_ENERGY_COEFFICIENT:9.0,
    BASE_COUNTRY_ENERGY_PRODUCTION:10.0,
    ENERGY_SCALING_COST_BY_FACTORY_COUNT:0.0225,
    BASE_ENERGY_COST:0.25,
    ENERGY_COST_CAP:6.6,
    ENERGY_SCALE_PER_TRADE_FACTORY_EXPORT:0.25,
    BASE_FACTORY_SPEED_MIL:3.5,
    POWERED_FACTORY_SPEED_MIL:4.5,
    BASE_FACTORY_START_EFFICIENCY_FACTOR:10,
    BASE_FACTORY_MAX_EFFICIENCY_FACTOR:50,
    BASE_FACTORY_EFFICIENCY_GAIN:1,
    BASE_FACTORY_EFFICIENCY_BALANCE_FACTOR:0.1,
    BASE_FACTORY_EFFICIENCY_VARIANT_CHANGE_FACTOR:90,
    BASE_FACTORY_EFFICIENCY_PARENT_CHANGE_FACTOR:30,
    BASE_FACTORY_EFFICIENCY_FAMILY_CHANGE_FACTOR:70,
    BASE_FACTORY_EFFICIENCY_ARCHETYPE_CHANGE_FACTOR:20,
    PRODUCTION_RESOURCE_LACK_PENALTY:-0.05
  })
});

export const PRODUCTION_EXECUTABLE_1192 = Object.freeze({
  efficiencyGainScale:0.001,
  resourceShortagePenaltyCap:1.0,
  factoryEnergyInterpolation:'linear-base-to-powered',
  positiveFactoryOutputModifierEnergyScaling:true,
  resourcePenaltyAggregation:'per-factory-max-missing-resource-then-line-average'
});

export const PRODUCTION_FORMULA_CERTIFICATION_1192 = Object.freeze({
  gameVersion:'1.19.2',
  classification:'bounded-production-formulas',
  sourceExact:[
    'BASE_FACTORY_SPEED_MIL = 3.5',
    'POWERED_FACTORY_SPEED_MIL = 4.5',
    'BASE_FACTORY_START_EFFICIENCY_FACTOR = 10',
    'BASE_FACTORY_MAX_EFFICIENCY_FACTOR = 50',
    'BASE_FACTORY_EFFICIENCY_GAIN = 1',
    'PRODUCTION_RESOURCE_LACK_PENALTY = -0.05',
    'MAX_MIL_FACTORIES_PER_LINE = 150'
  ],
  executableInferred:[
    'daily efficiency gain = 0.001 * BASE_FACTORY_EFFICIENCY_GAIN * growth multiplier * cap^2/current efficiency',
    'military factory base output interpolates linearly from 3.5 to 4.5 by energy satisfaction',
    'positive aggregate factory-output modifiers are scaled by energy satisfaction; non-positive modifiers are not energy-scaled',
    'resource shortage penalty is 5% per missing resource unit, uses the worst resource shortage for each factory, and averages factory factors across the line',
    'resource shortage can reduce an individual factory to zero output; the historical 90% floor does not apply to 1.19.2'
  ],
  explicitInputBoundary:[
    'energy satisfaction percentage',
    'effective starting production efficiency',
    'effective production efficiency gain multiplier',
    'effective production efficiency cap',
    'effective country factory-output modifier',
    'daily available strategic resources'
  ],
  deferred:[
    'automatic national coal-to-energy satisfaction from complete civilian/military/naval factory counts, trade, economic laws and local energy modifiers',
    'automatic aggregation of every focus/idea/law/technology factory-output modifier into the effective scenario input',
    'per-factory efficiency histories when factories are added, removed or left idle',
    'production-line switch retention and unused-slot efficiency loss',
    'licensed production and equipment conversion formula details',
    'exact MIO production modifier ordering under partial energy'
  ],
  corrections:[
    {id:'P-001',before:'90% maximum resource-shortage penalty',after:'100% maximum; factories can reach zero output'},
    {id:'P-002',before:'free-form base MIC output with 4.5 fallback',after:'energy-aware 3.5 -> 4.5 source-exact MIC interpolation with legacy scenario migration'},
    {id:'P-003',before:'helper fallbacks implied 0% start / 0% growth / 100% cap',after:'source-exact 10% start / 100% base gain multiplier / 50% cap'},
    {id:'P-004',before:'synthetic 1% denominator let 0%-efficiency lines recover',after:'0% remains 0 rather than inventing unsupported recovery'},
    {id:'P-005',before:'production summary labeled raw unconstrained IC as effective',after:'summary sums projected line IC after efficiency, MIO and resource constraints'}
  ]
});

export default PRODUCTION_FORMULA_CERTIFICATION_1192;
