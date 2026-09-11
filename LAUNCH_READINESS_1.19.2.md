# HOI4 War Planner 0.16.0 — Launch Readiness

Date: 2026-09-11  
Game baseline: HOI4 1.19.2  
Candidate branch: `launch-candidate-1.19.2`

## Status

**READY FOR FINAL PROMOTION AFTER EXACT-HEAD VALIDATION.**

This candidate consolidates the completed HOI4 1.19.2 audit foundation, visual/UX work, monetization-ready-but-disabled infrastructure, Division Gauntlet, persistence hardening and browser-recovery/public-feedback safeguards. Oracle work and AdSense activation are explicitly outside this release-hardening pass.

## Completed before promotion

- All planned 1.19.2 source/data/formula audits remain in branch history and the permanent regression suite.
- Division Gauntlet supports Quick (~500 designs) and Full (10,000 designs / 160,000 terrain-role matchups) modes.
- Historical `.mio-stage` payload fragments and their audit-only workflows were removed from the release candidate; the audit branch remains the archival record.
- Temporary feature/payload validation workflows were removed in favor of one read-only release-candidate gate plus the production `main` deployment workflow.
- Full-scenario import/reset no longer downgrades schema 7 to schema 6.
- Scenario export no longer embeds the redundant bundled 1.19.2 data pack.
- Local-storage write failures and malformed/oversized JSON imports fail visibly without crashing the planner.
- The SPA renders into `#app`, preserving the privacy/footer shell and enhancement modules across route changes.
- Keyboard focus, a skip-to-content link and reduced-motion behavior are under regression coverage.
- A browser-side runtime recovery layer handles failed startup/runtime exceptions, offers reload/local-state reset, and adds no telemetry.
- A `<noscript>` fallback prevents disabled JavaScript from presenting a blank page.
- The public footer exposes a structured GitHub issue-reporting path, with dedicated bug and feature-request templates.
- `robots.txt`, launch metadata, privacy policy and an explicit unofficial/non-affiliation footer are present.
- The build will carry a future `CNAME` automatically if a custom domain is later supplied.
- AdSense configuration remains deliberately disabled and contains no active publisher or slot IDs.
- Production Pages deployment is explicitly guarded to `main`, including manual workflow dispatches.

## Final release gate

`.github/workflows/release-candidate-ci.yml` is read-only and requires:

1. full `npm test` certification suite,
2. explicit 10,000-opponent / 160,000-matchup Gauntlet smoke,
3. clean static build,
4. built asset/privacy/robots/activation checks,
5. local HTTP serving checks,
6. headless desktop Gauntlet render,
7. headless mobile Scenario render,
8. preservation of the legal/privacy footer after the SPA starts.

The full regression suite additionally covers runtime recovery, no-JavaScript/feedback surface, UI/accessibility regressions, monetization-disabled state and all certified mechanics/data tests.

## Intentionally not blocking this release

### Oracle

Exact `hoi4.exe` black-box/oracle work remains a separate project. The planner continues to disclose executable-inferred and planner-analytical behavior rather than claiming binary parity.

### AdSense activation

The integration surface and privacy groundwork exist, but advertising stays off until publisher/client/slot IDs and any required consent configuration are deliberately activated.

### Custom domain

No custom domain is configured in this candidate. The existing GitHub Pages endpoint can remain public until a domain is chosen. Build support for a future `CNAME` is already in place, so choosing a domain does not require another application-code change.

## Promotion rule

Promote this candidate to `main` only after the final release-candidate workflow succeeds on the exact candidate head. The subsequent `main` workflow must then pass tests/build and complete GitHub Pages deployment before the hardening pass is considered live.

## Remaining repository-account housekeeping

The available connector can validate and modify repository contents but cannot create the GitHub Release or edit repository metadata. After code promotion, the only recommended manual GitHub housekeeping is:

- change the repository description from `Gpt` to a useful HOI4 War Planner description,
- optionally create a `0.16.0` GitHub Release/tag using `RELEASE_NOTES.md`.
