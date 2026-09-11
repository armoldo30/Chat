import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [html,js,css]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-tree-visual.js',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-tree-visual.css',import.meta.url),'utf8')
]);
assert.match(html,/mio-tree-visual\.js/);
assert.match(html,/mio-tree-visual\.css/);
for(const field of ['parents','allParents','parentTraits','parentCount','mutuallyExclusive'])assert.ok(js.includes(field),`MIO tree should consume ${field} source metadata`);
assert.match(js,/mioCatalog/,'MIO tree should read the same normalized source catalog used by runtime');
assert.match(js,/mio-tree-links/,'MIO tree should draw prerequisite connections');
assert.match(js,/Requires one:/);
assert.match(js,/Requires all:/);
assert.match(js,/Exclusive with:/);
assert.doesNotMatch(js,/simulateBattle|calcDivision|engine\.js/,'MIO tree visualization must not execute simulation mechanics');
assert.match(css,/dependency-all/);
assert.match(css,/dependency-counted/);
new Function(js.replace(/^import .*$/gm,''));
console.log('Source-backed MIO tree visual regression checks passed.');
