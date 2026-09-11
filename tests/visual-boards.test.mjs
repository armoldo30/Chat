import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,doctrine,mio,runtime,css]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/doctrine-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/ui-localization-runtime.js',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-boards.css',import.meta.url),'utf8')
]);

for(const file of ['ui-localization-runtime.js','doctrine-board.js','mio-board.js'])assert.match(html,new RegExp(file.replace('.','\\.')),`index should load ${file}`);
assert.match(html,/visual-boards\.css/,'index should load board styling');
assert.match(doctrine,/\[data-doctrine-choice\]/,'doctrine board must use existing doctrine controls');
assert.match(doctrine,/\[data-doctrine-mastery=/,'doctrine board must use existing mastery controls');
assert.match(doctrine,/dispatchEvent\(new Event\('change'/,'doctrine board must drive existing change handlers');
assert.match(mio,/\[data-mio-org\]/,'MIO board must use existing MIO organization controls');
assert.match(mio,/\[data-mio-trait\]/,'MIO board must use existing MIO trait controls');
assert.match(mio,/dispatchEvent\(new Event\('change'/,'MIO board must drive existing change handlers');
assert.match(runtime,/localisation\/english/,'localization importer should direct the user to the HOI4 English localization folder');
assert.doesNotMatch(doctrine,/engine\.js|simulateBattle|calcDivision/,'doctrine board must remain UI-only');
assert.doesNotMatch(mio,/engine\.js|simulateBattle|calcDivision/,'MIO board must remain UI-only');
assert.match(css,/doctrine-board-tracks/);
assert.match(css,/mio-board-traits/);
assert.match(css,/localization-import-panel/);
new Function(doctrine.replace(/^import .*$/gm,''));
new Function(mio.replace(/^import .*$/gm,''));

console.log('Visual doctrine/MIO board regression checks passed.');
