import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../methodology.html',import.meta.url),'utf8');

assert.match(html,/HOI4 War Planner 0\.17\.19/,'methodology metadata must match the release version');
assert.match(html,/O22 validates the retained piercing damage tiers/,'methodology must describe the promoted piercing validation');
assert.match(html,/O23 validates the unpierced armored 1–6 organization die/,'methodology must describe the promoted armored organization die');
assert.match(html,/O25 validates those armor\/piercing mechanics composing with the ordinary damage resolver/,'methodology must describe the promoted combined armored validation');
assert.doesNotMatch(html,/Armor\/piercing special cases, armored-on-soft damage behavior[^<]*are not promoted by the O1–O20 result/,'methodology must not retain the pre-O25 armor limitation text');
assert.match(html,/does not claim bit-for-bit <code>hoi4\.exe<\/code> parity/,'methodology must preserve the parity limitation');

console.log('Methodology O25 accuracy regression passed.');
