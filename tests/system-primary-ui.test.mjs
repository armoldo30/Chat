import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,summary,summaryCss,airPrimary,airPrimaryCss]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/tech-system-summary.js',import.meta.url),'utf8'),
  readFile(new URL('../src/tech-system-summary.css',import.meta.url),'utf8'),
  readFile(new URL('../src/air-doctrine-primary.js',import.meta.url),'utf8'),
  readFile(new URL('../src/air-doctrine-primary.css',import.meta.url),'utf8')
]);
for(const file of ['tech-system-summary.js','tech-system-summary.css','air-doctrine-primary.js','air-doctrine-primary.css'])assert.match(html,new RegExp(file.replace('.','\\.')),`index should load ${file}`);
assert.match(summary,/data-summary-doctrine/);
assert.match(summary,/data-summary-mio/);
assert.match(summary,/system-advanced-source/,'dense source controls should remain available as collapsed advanced controls');
assert.match(summary,/data-open-doctrine-board/,'doctrine summary must open the doctrine board');
assert.match(summary,/data-open-mio-board/,'MIO summary must open the MIO board');
assert.doesNotMatch(summary,/engine\.js|simulateBattle|calcDivision/,'summary layer must remain UI-only');
assert.match(summaryCss,/visual-system-summary-grid/);
assert.match(airPrimary,/details\.air-doctrine/,'air doctrine primary layer should target the existing doctrine drawer');
assert.match(airPrimary,/data-open-air-doctrine-board/,'air doctrine summary must open the board launcher');
assert.doesNotMatch(airPrimary,/engine\.js|simulateBattle|calcDivision/,'air doctrine primary layer must remain UI-only');
assert.match(airPrimaryCss,/OPEN BOARD/);
new Function(summary.replace(/^import .*$/gm,''));
new Function(airPrimary);
console.log('Primary doctrine/MIO UI regression checks passed.');
