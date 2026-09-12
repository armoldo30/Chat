import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,tree,css]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-tree-visual.js',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-mobile-tree-hotfix.css',import.meta.url),'utf8')
]);

assert.match(html,/mio-mobile-tree-hotfix\.css/);
assert.ok(html.indexOf('mio-mobile-tree-hotfix.css')>html.indexOf('game-ui-parity.css'));
assert.match(tree,/maxCount\*3/,'tree canvas should grow with its widest level');
assert.match(tree,/--mio-tree-columns/);
assert.match(tree,/--mio-tree-min-width/);
assert.match(tree,/span=Math\.max\(3/,'nodes need a minimum readable span');
assert.match(tree,/focusCurrentBranch/,'phone view should center the next useful branch');
assert.match(css,/repeat\(var\(--mio-tree-columns,18\),minmax\(0,1fr\)\)/);
assert.match(css,/min-width:var\(--mio-tree-min-width/);
assert.match(css,/SWIPE LEFT \/ RIGHT TO EXPLORE BRANCHES/);
assert.match(css,/mio-board-trait>span:last-child>em\{display:none!important\}/);
assert.match(css,/mio-board-trait\.locked small\{display:none!important\}/);
assert.doesNotMatch(tree,/simulateBattle|calcDivision|engine\.js/);
assert.doesNotMatch(css,/url\(/);

console.log('MIO mobile tree readability regression checks passed.');
