import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [html,js,css]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/battle-report-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/battle-report-visuals.css',import.meta.url),'utf8')
]);
assert.match(html,/battle-report-visuals\.js/);
assert.match(html,/battle-report-visuals\.css/);
assert.match(js,/battle-outcome-visual/,'battle reports should gain an outcome visualization');
assert.match(js,/\.result-grid > div/,'battle metrics should gain pictograms');
assert.match(js,/\.saved-battle/,'saved result cards should gain a win meter');
assert.doesNotMatch(js,/engine\.js|simulateBattle|calcDivision/,'battle report visuals must remain UI-only');
assert.match(css,/battle-outcome-track/);
assert.match(css,/saved-battle-meter/);
new Function(js.replace(/^import .*$/gm,''));
console.log('Visual battle report regression checks passed.');
