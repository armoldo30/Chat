import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AD_CONFIG, adsReady, validAdSenseClient, validAdSenseSlot } from '../src/ad-config.js';

const [index,ads,privacy,adsTxt,build]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/ads.js',import.meta.url),'utf8'),
  readFile(new URL('../privacy.html',import.meta.url),'utf8'),
  readFile(new URL('../ads.txt',import.meta.url),'utf8'),
  readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8')
]);

assert.equal(AD_CONFIG.enabled,false,'ads must remain disabled until real AdSense IDs are configured');
assert.equal(adsReady(),false,'unconfigured branch must not make live ad requests');
assert.equal(validAdSenseClient('ca-pub-1234567890123456'),true);
assert.equal(validAdSenseClient('ca-pub-placeholder'),false);
assert.equal(validAdSenseSlot('1234567890'),true);
assert.equal(validAdSenseSlot('slot-name'),false);
assert.match(index,/src\/ads\.js/);
assert.match(index,/privacy\.html/);
assert.match(index,/ADSENSE_ACCOUNT_META/);
assert.match(ads,/pagead2\.googlesyndication\.com/);
assert.match(ads,/report\.insertAdjacentElement\('afterend'/);
assert.match(ads,/view\.append\(node\)/);
assert.match(privacy,/Third-party vendors, including Google, may use cookies/i);
assert.match(privacy,/Google Ads Settings/);
assert.match(privacy,/Google-certified consent management platform/i);
assert.match(adsTxt,/^# google\.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0$/m);
assert.doesNotMatch(adsTxt,/^google\.com, pub-/m,'ads.txt must not authorize a fake publisher before account setup');
assert.match(build,/privacy\.html/);
assert.match(build,/ads\.txt/);
assert.match(build,/google-adsense-account/);
console.log('Monetization readiness tests passed.');
