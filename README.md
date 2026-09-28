# HOI4 War Planner — 0.17.23

A browser-based Hearts of Iron IV theorycrafting and combat-analysis suite built around a bundled **vanilla HOI4 1.19.3** baseline.

**Live site:** https://hoioracle.com/  
**Report a bug or request a feature:** https://github.com/armoldo30/Chat/issues/new/choose

## What it does

HOI4 War Planner is built for controlled matchup testing rather than one-size-fits-all template advice.

- **Division Lab** — build both sides of a matchup with technology, doctrine, MIO, equipment and battlefield assumptions.
- **Counter Analysis** — test bounded structural changes against that exact opponent and show the combat and IC/div tradeoff.
- **Tank Designer** — build and compare source-backed tank designs and connect them to divisions.
- **Air Lab** — compare aircraft designs with an explicitly bounded air-combat model.
- **Division Gauntlet** — stress-test a division against 10,000 deterministic opponents across eight terrain types while attacking and defending: **160,000 matchup checks**.
- **Industry / replacement context** — inspect equipment cost, production burden and modeled replacement losses without pretending to reconstruct a live country's complete economy.

## Accuracy boundary

The project keeps different evidence classes separate:

- **game-file exact** — values or relationships directly retained from the supplied 1.19.3 game files;
- **executable inferred** — behavior constrained by evidence but not fully provable from those files alone;
- **planner analytical** — Oracle's own comparison, search, scoring and generated-opponent layers;
- **oracle-validated / oracle-divergent / unvalidated** — black-box executable evidence states used by the Oracle validation laboratory.

Controlled Oracle experiments **O1–O25** validate the current ordinary 1v1 land-combat core at the tested boundaries, including the tested armor/piercing damage tiers and armored-on-soft organization behavior. The implementation remains an executable reconstruction and **does not claim bit-for-bit parity with `hoi4.exe`**.

See [Methodology](https://hoioracle.com/methodology.html) for the current validation boundary.

## Project status

Production is deployed from `main` to GitHub Pages and served at **hoioracle.com**. The current public build targets **HOI4 1.19.3**.

The separate Oracle validation laboratory is intentionally kept out of production; validated results are promoted into `main` only after controlled testing and regression coverage.

## Release validation

Presentation-only changes use an accelerated validation lane with targeted UI/static regressions and a compact browser smoke. Changes to mechanics, data, Oracle, Counter, shared runtime code, build tooling or CI still require the full certification suite.

## Development

No package install is required.

```bash
npm test
npm run build
```

`npm test` covers mechanics/data certification, UI regressions, scenario persistence/sharing, Gauntlet checks, Counter quality, runtime recovery, static-site integrity, and the promoted Oracle combat regressions.

`npm run build` creates the static site in `dist/`.

## Independence

HOI4 War Planner is an independent fan-made tool and is not affiliated with or endorsed by Paradox Interactive.
