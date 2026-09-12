import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,css,tree,mio,land,air]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/game-ui-parity.css',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-tree-visual.js',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/doctrine-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/air-doctrine-board.js',import.meta.url),'utf8')
]);

assert.match(html,/game-ui-parity\.css/,'parity styling must be loaded by the site');
assert.ok(html.indexOf('game-ui-parity.css')>html.indexOf('mobile-cleanup-v3.css'),'parity layer should load last so mobile-specific game layouts are preserved');

// MIO: company first, then one connected branching tree. The old next-choice cards may
// remain in DOM for compatibility, but must not compete visually with the tree.
assert.match(css,/#mio-board-modal \.mio-next-step[\s\S]*display:none!important/,'redundant available-now MIO card section should be visually suppressed');
assert.match(css,/#mio-board-modal \.mio-path-summary[\s\S]*display:none!important/,'redundant selected-path summary should be visually suppressed');
assert.match(css,/grid-template-columns:repeat\(18,minmax\(0,1fr\)\)!important/,'full MIO view should reserve a branching-tree grid');
assert.match(tree,/placeByLevel/,'MIO nodes should be positioned by prerequisite depth');
assert.match(tree,/active-link/,'selected MIO branches should visually carry through connector lines');
assert.match(tree,/available-link/,'currently reachable MIO branches should be visible in the tree');
assert.match(tree,/root\.closest\('#mio-board-modal'\)\?placeByLevel/,'18-column tree placement must be scoped to the full MIO board');
assert.match(mio,/mio-full-tree/,'source-backed full trait tree must remain the authoritative visual surface');

// Doctrines: Paradox's reworked presentation uses tall vertical tracks, framed windows,
// and milestone/progression emphasis. Keep planner controls authoritative underneath.
assert.match(css,/#doctrine-board-modal \.doctrine-board-tracks[\s\S]*grid-auto-flow:column/,'land doctrines should present as vertical track strips');
assert.match(css,/#air-doctrine-board-modal \.air-doctrine-board-tracks[\s\S]*grid-auto-flow:column/,'air doctrines should use the same vertical track language');
assert.match(css,/#doctrine-board-modal \.board-mastery[\s\S]*grid-template-columns:1fr!important/,'land mastery should read vertically');
assert.match(css,/#air-doctrine-board-modal \.board-mastery[\s\S]*grid-template-columns:1fr!important/,'air mastery should read vertically');
assert.match(css,/radial-gradient\(circle at 0 0/,'framed boards should include planner-owned rivet decoration');
assert.match(css,/@media\(max-width:720px\)[\s\S]*grid-auto-flow:column!important/,'phone layouts should scroll the doctrine tracks rather than collapse their structure');
assert.match(css,/@media\(max-width:720px\)[\s\S]*mio-tree-links\{display:block!important/,'phone layouts should retain the MIO branch map');

for(const source of [tree,mio,land,air,css])assert.doesNotMatch(source,/simulateBattle|calcDivision|engine\.js/,'game-inspired presentation must remain UI-only');
assert.doesNotMatch(css,/url\(/,'visual parity layer must use planner-owned CSS rather than bundled/copied game artwork');

console.log('Game-structure MIO/doctrine visual parity regression checks passed.');
