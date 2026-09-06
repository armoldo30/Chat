# HOI4 War Planner 0.14.0 — Release Notes

## Headline changes

- Added integrated Tank Designer for light/medium/heavy variants on both sides.
- Tank variant stats feed Division Lab; tank IC/resource cost feeds Industry.
- Added Air Lab for aircraft design and head-to-head comparison.
- Air Lab reports kill ratio, IC exchange, air-power share and mission output/IC.
- Added staged land doctrine/mastery profiles.
- Added staged air doctrine/mastery profiles.
- Added country/equipment-family MIO selection and trait dependency handling.
- MIO equipment and production modifiers apply to land equipment, tank variants and aircraft variants.
- Data Packs now parse MIO organization files and report parsed MIO coverage.
- Industry remains the “What Should I Build?” optimizer driven by the current Lab design.

## Air MIO status

Air MIO support is included in 0.14.0. Small- and medium-airframe MIOs can alter aircraft characteristics and production economics, and Air Lab filters organizations by country and aircraft family. The built-in catalog intentionally does not invent broad national air-MIO data; actual country-specific organizations are expected to come from imported HOI4 `common/military_industrial_organization/organizations/` files. Regression coverage verifies air-MIO combat and IC effects.

## Verification

- `npm test` — PASS
- `npm run build` — PASS
- JavaScript syntax validation — PASS
- Route-level UI smoke tests — PASS
- Static `dist/` equivalence to source build — PASS
- GitHub Pages workflow included and runs tests before deployment
