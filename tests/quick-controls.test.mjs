import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,js,css]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-quick-controls.js',import.meta.url),'utf8'),
  readFile(new URL('../src/quick-controls.css',import.meta.url),'utf8')
]);

assert.match(html,/visual-quick-controls\.js/);
assert.match(html,/quick-controls\.css/);
for(const selector of ['#b-terrain','#f-terrain','#b-river','#role','#air-mission'])assert.ok(js.includes(selector),`quick visual control should cover ${selector}`);
for(const terrain of ['forest','mountain','hills','desert','jungle','marsh','urban'])assert.ok(js.includes(terrain),`terrain pictograms should distinguish ${terrain}`);
assert.match(js,/dispatchEvent\(new Event\('change'/,'visual strips must drive existing controls');
assert.doesNotMatch(js,/engine\.js|simulateBattle|calcDivision/,'quick visual controls must remain UI-only');
assert.match(css,/quick-visual-choice/);
assert.match(css,/terrain-choices/);
new Function(js.replace(/^import .*$/gm,''));

console.log('Picture-first quick control regression checks passed.');
