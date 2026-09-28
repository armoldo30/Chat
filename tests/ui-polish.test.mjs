import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,css,js,main,gauntlet]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/ui-polish.css',import.meta.url),'utf8'),
  readFile(new URL('../src/ui-polish.js',import.meta.url),'utf8'),
  readFile(new URL('../src/main.js',import.meta.url),'utf8'),
  readFile(new URL('../src/gauntlet-ui.js',import.meta.url),'utf8')
]);

assert.match(html,/\.\/src\/ui-polish\.css/,'index should load the UI polish stylesheet');
assert.match(html,/\.\/src\/ui-polish\.js/,'index should load the UI polish module');
assert.match(css,/prefers-reduced-motion/,'polish layer should respect reduced-motion preferences');
assert.match(css,/:focus-visible/,'polish layer should provide keyboard focus treatment');
assert.match(css,/@media\(max-width:980px\)/,'polish layer should include tablet/mobile navigation rules');
assert.match(css,/\.compact-model-notes/,'working-screen methodology should use compact on-demand notes');
assert.doesNotMatch(css,/battle-report-panel \.report>\.grid\.two>div:nth-child\(2\)/,'density cleanup should not depend on Battle Report child position');
assert.match(main,/compact-model-notes battle-model-notes/,'Battle Report uncertainty should remain available on demand');
assert.doesNotMatch(main,/Combat mechanics<\/h3>/,'repeated Battle Report mechanics prose should be removed structurally');
assert.match(main,/variant-link-summary/,'Tank Designer integration should use value-first summaries');
assert.doesNotMatch(main,/Optimization objective:/,'Industry should not carry a permanent optimization explainer below results');
assert.match(main,/How uncertainty is applied/,'Intel uncertainty caveat should remain available on demand');
assert.doesNotMatch(main,/Named saves use the same compact/,'Saved Matchups should not carry a permanent explanatory footer');
assert.match(gauntlet,/gauntlet-model-notes/,'Gauntlet evidence boundary should be collapsed into model notes');

for(const route of ['dashboard','front','intel','battle','tank','air','production','data','scenario']){
  assert.ok(js.includes(`'${route}'`),`polished navigation should expose ${route}`);
}
assert.doesNotMatch(js,/from ['"]\.\/engine\.js/,'cosmetic navigation layer must not import combat engine logic');
assert.doesNotMatch(js,/localStorage|simulateBattle|calcDivision/,'cosmetic navigation layer must not mutate planner state or run simulations');
assert.match(js,/ui-enhancer-runtime\.js/,'polish layer should use the shared UI enhancement scheduler');

// Parse the module body without executing DOM APIs. Imports are valid module
// syntax but new Function parses script syntax, so remove import declarations
// before this lightweight syntax check.
new Function(js.replace(/^import[^\n]*\n/gm,''));

console.log('UI polish regression checks passed.');
