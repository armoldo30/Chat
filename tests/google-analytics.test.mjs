import assert from 'node:assert/strict';
import fs from 'node:fs';

const build=fs.readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const privacy=fs.readFileSync(new URL('../privacy.html',import.meta.url),'utf8');

const id='G-QYF9SQFM4V';
const pages=['index.html','division-counter.html','tank-designer.html','air-lab.html','division-gauntlet.html','guides.html','methodology.html','about.html','privacy.html'];

assert.ok(build.includes(`const GOOGLE_ANALYTICS_ID='${id}'`),'GA4 measurement ID should be explicit in the build');
assert.ok(build.includes('googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}'),'Build should inject the Google tag');
assert.ok(build.includes("send_page_view: false"),'SPA integration should disable automatic pageviews before manual pageviews');
assert.ok(build.includes("gtag('event', 'page_view'"),'Build should send explicit page_view events');
assert.ok(build.includes("window.addEventListener('hashchange', hoi4AnalyticsPageView)"),'Hash-route changes should produce page views');
for(const page of pages)assert.ok(build.includes(`'${page}'`),`${page} should be part of the public build surface`);
assert.match(privacy,/Google Analytics 4/,'Privacy policy should disclose Google Analytics 4');
assert.ok(privacy.includes(id),'Privacy policy should identify the GA4 property measurement ID');
assert.match(privacy,/_ga/,'Privacy policy should disclose the GA first-party cookie');
assert.match(privacy,/does not intentionally send planner designs, saved matchup contents, or imported data packs/i,'Privacy policy should describe the custom-event data boundary');

console.log('Google Analytics GA4 integration regression passed.');
