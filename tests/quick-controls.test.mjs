import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,js,css,battlefield,battlefieldCss]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-quick-controls.js',import.meta.url),'utf8'),
  readFile(new URL('../src/quick-controls.css',import.meta.url),'utf8'),
  readFile(new URL('../src/battlefield-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/battlefield-visuals.css',import.meta.url),'utf8')
]);

assert.match(html,/visual-quick-controls\.js/);
assert.match(html,/quick-controls\.css/);
assert.match(html,/battlefield-visuals\.js/);
assert.match(html,/battlefield-visuals\.css/);
for(const selector of ['#b-terrain','#f-terrain','#b-river','#role','#air-mission'])assert.ok(js.includes(selector),`quick visual control should cover ${selector}`);
for(const terrain of ['forest','mountain','hill','desert','jungle','marsh','urban'])assert.ok(js.includes(terrain),`terrain pictograms should distinguish ${terrain}`);
assert.match(js,/dispatchEvent\(new Event\('change'/,'visual strips must drive existing controls');
assert.doesNotMatch(js,/engine\.js|simulateBattle|calcDivision/,'quick visual controls must remain UI-only');
for(const id of ['b-asupply','b-dsupply','b-air','b-cas','b-planning','b-directions','b-entrench','b-fort','f-asupply','f-air','f-planning','f-cas','f-directions'])assert.ok(battlefield.includes(`'${id}'`),`battlefield visuals should cover ${id}`);
assert.match(battlefield,/dispatchEvent\(new Event\('change'/,'battlefield gauges must drive existing inputs');
assert.doesNotMatch(battlefield,/engine\.js|simulateBattle|calcDivision/,'battlefield visual layer must remain UI-only');
assert.match(css,/quick-visual-choice/);
assert.match(css,/terrain-choices/);
assert.match(battlefieldCss,/battlefield-gauge/);
assert.match(battlefieldCss,/battlefield-pips/);
new Function(js.replace(/^import .*$/gm,''));
new Function(battlefield.replace(/^import .*$/gm,''));

console.log('Picture-first quick control regression checks passed.');
