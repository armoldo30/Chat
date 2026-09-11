import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,js,css]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/nav-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/nav-visuals.css',import.meta.url),'utf8')
]);
assert.match(html,/nav-visuals\.js/);
assert.match(html,/nav-visuals\.css/);
for(const route of ['dashboard','front','intel','battle','tank','air','production','data','scenario'])assert.ok(js.includes(`${route}:`),`navigation pictogram map should cover ${route}`);
assert.match(js,/\.sidebar nav a/,'navigation visuals should enhance existing links');
assert.doesNotMatch(js,/engine\.js|simulateBattle|calcDivision/,'navigation visuals must remain UI-only');
assert.match(css,/nav-visual-icon/);
new Function(js.replace(/^import .*$/gm,''));
console.log('Visual navigation regression checks passed.');
