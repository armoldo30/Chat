import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const publisherCss=readFileSync(new URL('../src/publisher-content.css',import.meta.url),'utf8');
const battlefield=readFileSync(new URL('../src/battlefield-visuals.js',import.meta.url),'utf8');

assert.doesNotMatch(html,/publisher-guide|QUICK GUIDE|What can I use this for\?/,'planner should not restore the lower-page Quick Guide block');
assert.match(html,/site-legal-footer/,'compact legal/navigation footer must remain');
assert.doesNotMatch(main,/attack axes/i,'battle-plan UI should not use attack-axis wording');
assert.match(main,/Attacking directions/,'battlefield controls should say Attacking directions');
assert.match(main,/Extra attacking directions/,'front controls should say Extra attacking directions');
assert.doesNotMatch(battlefield,/axis|axes/i,'enhanced battlefield controls should not use axis terminology');
assert.match(battlefield,/Attacking Directions/,'enhanced battlefield controls should say Attacking Directions');
assert.match(battlefield,/Single direction/,'single-direction readout should use direction terminology');
assert.doesNotMatch(publisherCss,/\.publisher-guide/,'retired lower-page guide styling should stay removed');

console.log('UI copy and lower-page cleanup regression passed.');
