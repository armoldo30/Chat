import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [html,js,css,mobile]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-tree-visual.js',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-tree-visual.css',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-mobile-tree-hotfix.css',import.meta.url),'utf8')
]);
assert.match(html,/mio-tree-visual\.js/);
assert.match(html,/mio-tree-visual\.css/);
assert.match(html,/mio-mobile-tree-hotfix\.css/);
assert.ok(html.indexOf('mio-mobile-tree-hotfix.css')>html.indexOf('game-ui-parity.css'));
for(const field of ['parents','allParents','parentTraits','parentCount','mutuallyExclusive'])assert.ok(js.includes(field),`MIO tree should consume ${field} source metadata`);
assert.match(js,/mioCatalog/);
assert.match(js,/mio-tree-links/);
assert.match(js,/Requires one:/);
assert.match(js,/Requires all:/);
assert.match(js,/Exclusive with:/);
assert.match(js,/maxCount\*3/);
assert.match(js,/--mio-tree-columns/);
assert.match(js,/--mio-tree-min-width/);
assert.match(js,/span=Math\.max\(3/);
assert.match(js,/focusCurrentBranch/);
assert.match(mobile,/SWIPE LEFT \/ RIGHT TO EXPLORE BRANCHES/);
assert.match(mobile,/--mio-tree-columns/);
assert.match(mobile,/--mio-tree-min-width/);
assert.match(mobile,/mio-board-trait>span:last-child>em\{display:none!important\}/);
assert.match(css,/dependency-all/);
assert.match(css,/dependency-counted/);
console.log('Source-backed MIO tree visual regression checks passed.');
