# HOI4 War Planner / HOI Oracle — Project Handoff

Date: 2026-09-19
Status: Oracle executable testing paused by user for the next few days.

## Source of truth and branch safety

Production:
- Repository: `armoldo30/Chat`
- Branch: `main`
- Production SHA: `8c357dc0966fa8773143b9e9a9f38dfd02fc5f45`
- Release: `0.17.0`
- Live site: https://hoioracle.com/
- Target data baseline: HOI4 `1.19.3.0.c01a`, checksum `5632`

Oracle:
- Branch: `oracle-validation-1.19.3`
- PR #42 is CI-only and **DO NOT MERGE**
- Pre-handoff Oracle head: `72b135cb88476cda0f76580bf68d6e9560d083e5`
- Exact-head Release Candidate Validation run #298: SUCCESS
- Keep Oracle experimentation isolated from production until a separate deliberate merge decision.

Evidence labels remain exact:
- `game-file exact`
- `executable inferred`
- `planner analytical`
- `oracle-validated`
- `oracle-divergent`
- `unvalidated`

Never claim bit-for-bit `hoi4.exe` parity.

## Oracle state at pause

O1:
- Narrowly `oracle-validated` for controlled combat-entry timing only.
- `initialFireDelayHours = 1` remains validated at the controlled boundary.

O2:
- Completed at the predeclared six-run stopping point.
- Do not collect runs 7–12.
- Remains `unvalidated`.

O3:
- Sub-10 attack produced positive damage at displayed Soft Attack 7.
- Simple `floor(SoftAttack / 10)` zero-transmission model contradicted.
- O3 remains `unvalidated`.

O4 v2:
- Guaranteed-hit control: 5/5 positive intervals at Soft Attack 11 / Defense 255.
- Probe: Soft Attack 2 / Defense 255, K = 1/5 positive intervals.
- Deterministic minimum-one/ceiling-style sub-10 transmission contradicted.
- Exact stochastic-rounding implementation remained `unvalidated`.

O5:
- Fixed-damage run at Soft Attack 15 / Defense 255.
- Two stable organization-loss levels, approximately 1x and 2x, ratio about 1.91.
- Strong executable evidence for stochastic discrete damage multiplicity.
- Exact internal placement remained `unvalidated`.

O6:
- Low mode Soft Attack 12 / Defense 255: multiplicities 0x=9, 1x=20, 2x=11.
- High mode Soft Attack 18 / Defense 255: multiplicities 1x=17, 2x=20, 3x=3.
- Current planner mechanism `stochasticRound(totalAttack * 0.1)` is narrowly `oracle-divergent` at the controlled O6 fixed-damage boundary because its support cannot produce those observed 0x/3x outcomes.
- The `/10` mean scale is not rejected; empirical mean multiplicity changed by 0.60 when Soft Attack changed by 6, consistent with a 0.10 mean slope.
- Broad resolver remains `unvalidated`.

O7:
- Fully predeclared and built but NOT yet executable-run.
- Candidate under test: `round(attack / 10 + U[-1,+1])`.
- One 60-firing-interval run only.
- Target: displayed Soft Attack exactly 20, tooltip/effective Soft Attack 19.8–20.2 inclusive, POL Defense >=200.
- O7 overlay generated as `hoi4-war-planner-oracle-o7-wide-rounding-overlay.zip`.
- If O7 supports the candidate, manual attack-point integerization testing should stop and work should shift to planner-side integration/regression rather than creating an O8 by default.

## Non-Oracle production state

The major launch/data work is already complete in production:
- 0.17.0 is live on `hoioracle.com`.
- HOI4 1.19.3 source migration is complete.
- English localization was migrated/source-backed in 0.17.0.
- Division Gauntlet is integrated and previously passed the full 160,000-matchup smoke.
- Google Analytics 4 is integrated in production.
- Custom domain is already active; it is no longer an outstanding setup item.
- AdSense verification/policy-remediation infrastructure exists, but ad serving remains deliberately disabled while policy review is pending.

Current non-Oracle work is therefore mostly:
1. user-reported live-site bugs/issues and usability defects;
2. production bugfix/maintenance arising from those reports;
3. AdSense review follow-up and deliberate ad activation only after approval;
4. optional analytics verification/monitoring and UX polish if issues justify it;
5. repository housekeeping, including disposition of stale open PR #27 if it is no longer relevant.

There are currently no open GitHub Issues returned by repository search. Open PRs include:
- #42 Oracle CI — DO NOT MERGE;
- #27 production-plan-aware Counter recommendation work — currently open and should be reviewed before any action because production has evolved since it was opened.

## Immediate next session

Do not resume Oracle testing unless the user has time and explicitly wants to.

The user has found several issues in the actual live site. The next priority is to collect those issues, reproduce them against production `main`, fix them on an isolated production-fix branch, run the release gate, and only then merge/deploy.

Do not modify `main` merely to preserve Oracle findings. Oracle stays isolated.
