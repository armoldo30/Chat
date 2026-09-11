# AdSense Launch Checklist

The site is prepared for Google AdSense but intentionally ships with advertising disabled until the custom domain and real AdSense identifiers are available.

## 1. Put the custom domain live

Point the final domain at the production deployment and confirm the homepage, `/privacy.html`, and `/ads.txt` all return HTTP 200.

## 2. Add the real AdSense account ID for site verification

Edit `src/ad-config.js` and set `client` to the account value in `ca-pub-################` form. Leave `enabled: false` at this stage.

The production build will automatically add:

`<meta name="google-adsense-account" content="ca-pub-################">`

This allows AdSense site ownership/review without turning on live ad requests.

## 3. Replace ads.txt with the exact AdSense seller line

Copy the line shown by AdSense. For a direct Google seller it has this form:

`google.com, pub-################, DIRECT, f08c47fec0942fa0`

Do not use the example publisher number currently present in the comment-only readiness file.

## 4. Configure privacy/consent

The site already publishes `privacy.html` and a footer Privacy choices control. Before serving personalized ads in the EEA, UK, or Switzerland, configure a Google-certified CMP (Google's CMP through AdSense Privacy & messaging is a straightforward option) and connect its reopen/privacy-choice action to `window.HOI4_CMP_OPEN` if needed.

## 5. Create responsive ad units and enable serving

Create responsive display units in AdSense and copy the numeric slot IDs into `AD_CONFIG.slots.result` and `AD_CONFIG.slots.footer`.

Only after the account/site is ready:

- set `AD_CONFIG.enabled` to `true`;
- keep the real `ca-pub-...` client value;
- keep only real numeric slot IDs;
- run the full CI/build before production deployment.

The launch implementation intentionally displays at most one unit per planner view: a result unit after a completed battle report when available, otherwise a bottom-of-view unit. Ads are kept away from navigation and dense interactive controls to reduce accidental-click risk.
