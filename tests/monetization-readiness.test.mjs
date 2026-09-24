import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AD_CONFIG, adsReady, validAdSenseClient, validAdSenseSlot } from '../src/ad-config.js';

const [index,ads,privacy,build,guides,methodology,about,pkg]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/ads.js',import.meta.url),'utf8'),
  readFile(new URL('../privacy.html',import.meta.url),'utf8'),
  readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8'),
  readFile(new URL('../guides.html',import.meta.url),'utf8'),
  readFile(new URL('../methodology.html',import.meta.url),'utf8'),
  readFile(new URL('../about.html',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8')
]);

assert.equal(AD_CONFIG.enabled,false,'ad serving must remain disabled during policy review');
assert.equal(adsReady(),false,'policy-review build must not make live ad requests');
assert.equal(validAdSenseClient('ca-pub-1234567890123456'),true);
assert.equal(validAdSenseClient('ca-pub-placeholder'),false);
assert.equal(validAdSenseSlot('1234567890'),true);
assert.equal(validAdSenseSlot('slot-name'),false);
assert.match(index,/src\/ads\.js/);
assert.match(index,/publisher-intro/,'homepage should keep a crawlable publisher introduction');
assert.match(index,/Build divisions\. Test counters\./,'homepage should lead with the compact player-facing value proposition');
assert.doesNotMatch(index,/publisher-facts/,'homepage should not restore the oversized AdSense-era facts panel');
assert.match(index,/guides\.html/);
assert.match(index,/methodology\.html/);
assert.match(index,/about\.html/);
assert.match(index,/privacy\.html/);
assert.match(index,/ADSENSE_ACCOUNT_META/);
assert.match(ads,/pagead2\.googlesyndication\.com/,'runtime ad loader should remain gated by adsReady');
assert.match(privacy,/Third-party vendors, including Google, may use cookies/i);
assert.match(privacy,/Google Ads Settings/);
assert.match(privacy,/Google-certified consent management platform/i);
assert.match(build,/guides\.html/);
assert.match(build,/methodology\.html/);
assert.match(build,/about\.html/);
assert.match(build,/sitemap\.xml/);
assert.match(build,/google-adsense-account/,'ownership verification meta should remain in the production build');
assert.doesNotMatch(build,/pagead2\.googlesyndication\.com/,'build must not inject the AdSense serving script while ads are disabled');
for(const [name,page] of [['guides',guides],['methodology',methodology],['about',about]]){
  assert.match(page,/<h1>/,`${name} page should have a primary heading`);
  assert.ok(page.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().length>500,`${name} page should contain substantive publisher-written content`);
}
const packageVersion=JSON.parse(pkg).version;
assert.ok(about.includes(`current public release is ${packageVersion}`),'About page release should match package version');
assert.doesNotMatch(about,/Advertising integration is kept separate|site is being reviewed for policy compliance/i,'About page should not read like AdSense-review copy');
console.log('Monetization readiness tests passed.');
