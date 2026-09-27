import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const publisherCss=readFileSync(new URL('../src/publisher-content.css',import.meta.url),'utf8');

assert.doesNotMatch(html,/publisher-guide|QUICK GUIDE|What can I use this for\?/,'planner should not restore the lower-page Quick Guide block');
assert.match(html,/site-legal-footer/,'compact legal/navigation footer must remain');
assert.doesNotMatch(main,/attack axes/i,'battle-plan UI should not use attack-axis wording');
assert.match(main,/Attack directions/,'battlefield controls should say Attack directions');
assert.match(main,/Extra attack directions/,'front controls should say Extra attack directions');
assert.doesNotMatch(publisherCss,/\.publisher-guide/,'retired lower-page guide styling should stay removed');

console.log('UI copy and lower-page cleanup regression passed.');
