import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,doctrine,airDoctrine,mio,inlineMio,runtime,css,airCss,inlineCss]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/doctrine-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/air-doctrine-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/inline-mio-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/ui-localization-runtime.js',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-boards.css',import.meta.url),'utf8'),
  readFile(new URL('../src/air-doctrine-board.css',import.meta.url),'utf8'),
  readFile(new URL('../src/inline-mio-board.css',import.meta.url),'utf8')
]);

for(const file of ['ui-localization-runtime.js','doctrine-board.js','air-doctrine-board.js','mio-board.js','inline-mio-board.js'])assert.match(html,new RegExp(file.replace('.','\\.')),`index should load ${file}`);
for(const file of ['visual-boards.css','air-doctrine-board.css','inline-mio-board.css'])assert.match(html,new RegExp(file.replace('.','\\.')),`index should load ${file}`);
assert.match(doctrine,/\[data-doctrine-choice\]/,'land doctrine board must use existing doctrine controls');
assert.match(doctrine,/\[data-doctrine-mastery=/,'land doctrine board must use existing mastery controls');
assert.match(doctrine,/dispatchEvent\(new Event\('change'/,'land doctrine board must drive existing change handlers');
assert.match(airDoctrine,/data-air-doctrine-choice/,'air doctrine board must use existing air doctrine controls');
assert.match(airDoctrine,/data-air-doctrine-mastery/,'air doctrine board must use existing air mastery controls');
assert.match(airDoctrine,/dispatchEvent\(new Event\('change'/,'air doctrine board must drive existing change handlers');
assert.match(mio,/\[data-mio-org\]/,'MIO board must use existing MIO organization controls');
assert.match(mio,/\[data-mio-trait\]/,'MIO board must use existing MIO trait controls');
assert.match(mio,/dispatchEvent\(new Event\('change'/,'MIO board must drive existing change handlers');
assert.match(inlineMio,/select\[id\$="-mio-org"\]/,'designer MIO board must reuse inline organization controls');
assert.match(inlineMio,/data-inline-mio/,'designer MIO board must reuse inline trait controls');
assert.match(inlineMio,/dispatchEvent\(new Event\('change'/,'designer MIO board must drive existing change handlers');
assert.match(runtime,/localisation\/english/,'localization importer should direct the user to the HOI4 English localization folder');
for(const source of [doctrine,airDoctrine,mio,inlineMio])assert.doesNotMatch(source,/engine\.js|simulateBattle|calcDivision/,'visual boards must remain UI-only');
assert.match(css,/doctrine-board-tracks/);
assert.match(css,/mio-board-traits/);
assert.match(css,/localization-import-panel/);
assert.match(airCss,/air-doctrine-board-tracks/);
assert.match(inlineCss,/inline-mio-board-launch/);
new Function(doctrine.replace(/^import .*$/gm,''));
new Function(airDoctrine.replace(/^import .*$/gm,''));
new Function(mio.replace(/^import .*$/gm,''));
new Function(inlineMio.replace(/^import .*$/gm,''));

console.log('Visual doctrine/MIO board regression checks passed.');
