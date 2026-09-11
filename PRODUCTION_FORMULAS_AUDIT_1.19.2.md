# HOI4 War Planner — Production Formulas Audit 1.19.2

**Status: COMPLETE — bounded certification of the military-equipment production formulas currently consumed by the planner. Country-wide energy generation and dynamic production-line history remain explicit boundaries rather than guessed mechanics.**

## Source boundary

The audit uses the same retained authoritative HOI4 1.19.2 source certified by the Defines phase: `common/defines/00_defines.lua`, 405,669 bytes, SHA-256 `405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4`.

Core exact `NProduction` values used here are:

| Define | 1.19.2 value | Runtime role |
| --- | ---: | --- |
| `BASE_FACTORY_SPEED_MIL` | 3.5 | MIC output at 0% energy satisfaction |
| `POWERED_FACTORY_SPEED_MIL` | 4.5 | MIC output at 100% energy satisfaction |
| `BASE_FACTORY_START_EFFICIENCY_FACTOR` | 10 | unmodified new-line starting efficiency (%) |
| `BASE_FACTORY_MAX_EFFICIENCY_FACTOR` | 50 | unmodified efficiency cap (%) |
| `BASE_FACTORY_EFFICIENCY_GAIN` | 1 | source coefficient feeding the executable growth scale |
| `PRODUCTION_RESOURCE_LACK_PENALTY` | -0.05 | 5% penalty per missing resource unit |
| `MAX_MIL_FACTORIES_PER_LINE` | 150 | military factory assignment cap |

The retained source also preserves the 1.19.2 energy constants (`RESOURCE_TO_ENERGY_COEFFICIENT = 9`, `BASE_COUNTRY_ENERGY_PRODUCTION = 10`, `ENERGY_SCALING_COST_BY_FACTORY_COUNT = 0.0225`, `BASE_ENERGY_COST = 0.25`, `ENERGY_COST_CAP = 6.6`) and line-change/idle-efficiency constants. They are recorded in the certification module even where the current planner does not have enough country or line-history state to execute them exactly.

## Certified executable-inferred formulas

### Military factory output and energy

The retained game files provide exact 3.5/4.5 endpoints. Industrial output moves along the base-to-fully-powered range according to energy satisfaction. The planner therefore uses:

`MIC source output = 3.5 + energy_satisfaction × (4.5 - 3.5)`

where energy satisfaction is clamped to 0–100%.

The **sum of positive** Factory Output modifiers is scaled by energy satisfaction, while already-negative modifier sums are not additionally energy-scaled. The planner applies this rule to the explicit effective country Factory Output input. Exact automatic aggregation of every idea/law/focus/technology modifier remains outside this bounded phase.

The old editable `Base MIC output/day` shortcut has been replaced by an `Energy satisfaction %` input. Fresh scenarios default to 100% energy; old saved scenarios that explicitly stored 3.5–4.5 base output are migrated to the equivalent 0–100% energy ratio so their prior projection is not silently reinterpreted.

### Production efficiency growth

For a positive current efficiency below its cap, the planner uses the established nonlinear curve:

`daily gain = 0.001 × BASE_FACTORY_EFFICIENCY_GAIN × effective_gain_multiplier × cap² / current_efficiency`

The exact define value is `BASE_FACTORY_EFFICIENCY_GAIN = 1`; the `×0.001` scale is **executable inferred**, not a literal game-file value. Source defaults are now 10% starting efficiency, a 50% cap, and a 100% base gain multiplier when those scenario values are omitted.

The previous implementation divided through an invented 1% floor, which caused a scenario entered at exactly 0% efficiency to recover. That unsupported floor is removed: 0% stays 0 in this bounded projection.

### Strategic-resource shortage

The exact source supplies `PRODUCTION_RESOURCE_LACK_PENALTY = -0.05`. The planner's progressive allocation structure is retained:

1. Higher-priority lines receive available daily resources first.
2. Each active factory is evaluated separately.
3. Each missing unit of a required resource contributes 5 percentage points of penalty.
4. When multiple resource types are short, the largest applicable penalty determines that factory's shortage factor.
5. The production line displays/uses the average of its individual factory factors.

The old 90% penalty floor was historical and is **not present in the retained 1.19.2 Defines corpus**. Modern production shortage can drive an individual factory to 0 output, so the audited cap is 100%. This is an executable behavior classification, not a fabricated replacement define.

### Equipment output

For each line in the bounded planner path:

`daily IC = active MIC × energy-adjusted MIC output × average production efficiency × effective Factory Output × line-specific MIO output factor × strategic-resource factor`

`equipment/day = daily IC / effective equipment IC cost`

Equipment IC/resource data and MIO-derived equipment cost/resource adjustments come from their already-audited source layers. Exact MIO production-modifier ordering under partial energy remains explicitly deferred from this Production phase rather than silently declared executable-exact.

## Corrections

- **P-001 — FIXED:** resource-shortage maximum changed from the stale 90% floor to 100%; sufficiently starved factories can now produce zero.
- **P-002 — FIXED:** free-form/magic MIC base-output handling replaced with source-exact 3.5 → 4.5 energy interpolation and legacy scenario migration.
- **P-003 — FIXED:** production-efficiency helper fallbacks now use source-exact 10% start and 50% cap, with 100% as the neutral gain multiplier.
- **P-004 — FIXED:** removed invented 1% denominator recovery from an exactly 0%-efficiency line.
- **P-005 — FIXED:** the Production UI's “effective IC/day” summary now sums actual projected line IC after efficiency, resource and line-specific adjustments instead of showing an unconstrained raw-capacity number.

## Explicit boundaries / deferred mechanics

This phase certifies the formulas the current military equipment planner actually consumes. It does **not** guess missing national state. The following remain deferred or explicit inputs:

- deriving national energy satisfaction automatically from coal, total CIC/MIC/NIC, trade, economic law, dams/local modifiers and other energy modifiers;
- automatically aggregating every country Factory Output modifier from technologies, ideas, focuses and laws — the planner accepts the effective value as an input;
- separate efficiency histories for factories added/removed during the horizon;
- unused-slot efficiency decay and line-switch retention (`variant`, `parent`, `family`, `archetype`) because the current planner has no dated line-switch events;
- licensing and conversion details;
- exact MIO production-modifier ordering under partial energy.

These are not represented as zero or as “vanilla defaults”; they are explicitly outside the current model boundary.

## Permanent verification

`tests/production-formulas-certification.test.mjs` locks down the exact source constants/fingerprint, the 3.5/4.5 energy endpoints, positive-modifier energy scaling, nonlinear efficiency growth and source defaults, zero-efficiency behavior, 100% resource starvation, multi-resource per-factory shortage aggregation, line averaging, legacy base-output migration, and modern full-power default.

Production formulas are closed only with the repository's normal `npm test` and static build passing on the final clean `audit-1.19.2` head, while Pages configuration/artifact upload/deploy remain skipped on the audit branch.

**Next audit phase: Combat formulas.**
