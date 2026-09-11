import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [html,js,css]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/stat-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/stat-visuals.css',import.meta.url),'utf8')
]);
assert.match(html,/stat-visuals\.js/);
assert.match(html,/stat-visuals\.css/);
for(const selector of ['.statgrid .stat','.tank-stat-grid > div','.air-stat-grid > div','.hq-stat-pair > div','.dossier-stats > div','.industry-summary > article'])assert.ok(js.includes(selector),`stat visual language should cover ${selector}`);
for(const term of ['soft attack','hard attack','pierc','armor','breakthrough','manpower','reliability','supply','ic cost','agility','speed','org','width'])assert.ok(js.includes(term),`stat visual language should recognize ${term}`);
assert.doesNotMatch(js,/simulateBattle|calcDivision|engine\.js/,'stat visuals must remain UI-only');
assert.match(css,/stat-visual-icon/);
new Function(js.replace(/^import .*$/gm,''));
console.log('Visual stat language regression checks passed.');
