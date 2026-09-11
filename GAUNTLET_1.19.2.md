# Division Gauntlet — HOI4 1.19.2

## Purpose

Division Gauntlet evaluates one user-built division against a large, deterministic pool of plausible HOI4 opponent templates. It is designed to answer a broader question than a single battle: how robust is this division across terrain, roles, costs, supply burdens, armor/piercing relationships, and common player archetypes?

## Modes

- Quick Gauntlet: 500 opponent designs × 8 terrain types × attack/defense = 8,000 screened matchups.
- Full Gauntlet: 10,000 opponent designs × 8 terrain types × attack/defense = 160,000 screened matchups.
- After screening, extreme scenarios are re-run through seeded stochastic combat simulations (40 runs/scenario in Quick, 60 in Full).

## Terrain matrix

Plains, Forest, Hills, Mountain, Jungle, Marsh, Desert, Urban.

## Opponent archetypes

1. Infantry Wall
2. Artillery Infantry
3. Cheap Holding Division
4. Motorized Division
5. Mechanized Division
6. Light Armor
7. Medium Armor
8. Heavy Armor
9. Breakthrough Tanks
10. High-Hardness Formation
11. AT-Heavy Counter
12. AA-Heavy Formation
13. Space-Marine Style
14. High-ORG Infantry
15. Low-Cost Spam
16. Expensive Elite Formation

Each family varies combat width, divisional supports, equipment quality, armor/piercing strength, doctrine profile, production cost and supply burden. Generation is deterministic so the same active data and settings produce the same pool.

Opponent battalion/support/equipment baselines come from the opposite Division Lab side. If the user tests the attacker template, generated opponents baseline from the defender-side technology, tank variants, MIO-adjusted data and equipment costs; testing the defender reverses this. Procedural quality/doctrine variation is then applied on top.

## Screening and stochastic validation

The full matrix uses expected combat behavior from the certified bounded combat engine. The screening score estimates which side reaches organization/strength defeat first using expected hits, armor/piercing damage tiers and HOI4 1.19.2 damage dice.

The most extreme best/worst screened scenarios are then rerun with `simulateBattle` using fixed seeds. This validates that the fast screening layer is not simply producing attractive rankings that disagree with the stochastic simulator.

## Scores

Raw Combat Score is the mean combat result across all terrain × attack/defense matchups.

Practical Division Score combines:

- 50% Raw Combat
- 18% IC Efficiency
- 12% Terrain Versatility
- 8% Supply Efficiency
- 7% Consistency
- 5% Counter Resilience

IC Efficiency compares combat performance to the median production cost of the generated pool. Supply Efficiency does the same for supply burden. Terrain Versatility penalizes terrain variance. Consistency penalizes matchup variance. Counter Resilience uses the 10th-percentile matchup floor.

Grades:

- S: 95+
- A+: 90–94.9
- A: 85–89.9
- A-: 80–84.9
- B+: 75–79.9
- B: 70–74.9
- B-: 65–69.9
- C+: 60–64.9
- C: 55–59.9
- C-: 50–54.9
- D: 40–49.9
- F: below 40

## Percentile

The displayed Gauntlet percentile is empirical within the generated pool: the percentage of opponent designs against which the tested division scores above 50 when averaged across the full terrain/role matrix. It is not a fabricated population percentile and is not presented as a percentile of all human HOI4 builds.

## Result breakdown

The UI reports:

- Practical grade and score
- Raw combat grade and score
- Offense / Defense
- All eight terrain grades
- Armor / Infantry / Mobile / Counter / Hybrid / Elite matchup classes
- IC efficiency
- Supply efficiency
- Consistency
- Terrain versatility
- Counter resilience
- Best matchup families
- Worst matchup families
- Stress tests: low-supply offense, river-crossing offense, level-3 fort assault, low-supply defense
- Stochastic validation agreement
- Gauntlet percentile

## Evidence taxonomy

### Game/source-backed inputs

Active 1.19.2 battalion, support, equipment, terrain, technology, MIO and designer data are consumed through the existing planner data/runtime layers where available.

### Certified bounded combat engine

Expected hits, terrain effects, supply penalties, armor/piercing thresholds, damage dice and the stochastic combat simulator use the existing Combat-certified 1.19.2 planner engine.

### Planner analytical

The following are intentionally planner-created rather than claimed as HOI4 source data:

- archetype definitions
- procedural width/support/quality variation
- procedural doctrine profiles
- screening-to-score transformation
- Practical Division Score weights
- letter-grade thresholds
- stress-test selection

These must remain labeled analytical. Oracle validation can improve executable-inferred combat behavior later without changing the basic Gauntlet architecture.

## Deferred extension

A two-template comparison mode can later run two saved/user templates through the identical deterministic pool and explain the score delta by terrain, matchup family, IC, supply and consistency. This is deliberately separate from the launch-critical single-template Gauntlet.
