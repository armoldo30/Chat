import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [main,ui,css,core,polish]=await Promise.all([
  readFile(new URL('../src/main.js',import.meta.url),'utf8'),
  readFile(new URL('../src/gauntlet-ui.js',import.meta.url),'utf8'),
  readFile(new URL('../src/gauntlet.css',import.meta.url),'utf8'),
  readFile(new URL('../src/gauntlet.js',import.meta.url),'utf8'),
  readFile(new URL('../src/ui-polish.js',import.meta.url),'utf8')
]);

assert.match(main,/renderGauntlet/,'main app must import Gauntlet UI');
assert.match(main,/\['gauntlet','GNT','Division Gauntlet'\]/,'base sidebar must expose Division Gauntlet');
assert.match(polish,/\['gauntlet','GNT','Division Gauntlet'\]/,'polished navigation must preserve Division Gauntlet');
assert.match(main,/dashboard,battle,gauntlet,tank/,'route renderer must include Gauntlet');
assert.match(main,/\['dashboard','battle','gauntlet'/,'route whitelist must include Gauntlet');
assert.match(ui,/Quick Gauntlet/);assert.match(ui,/500 opponent designs/);assert.match(ui,/Full Gauntlet/);assert.match(ui,/10,000 opponent designs/);assert.match(ui,/160,000 terrain\/role matchups/);
assert.match(ui,/PRACTICAL/);assert.match(ui,/Raw Combat/);assert.match(ui,/IC Efficiency/);assert.match(ui,/Supply Efficiency/);assert.match(ui,/Consistency/);assert.match(ui,/Counter Resilience/);assert.match(ui,/Best Matchups/);assert.match(ui,/Worst Matchups/);assert.match(ui,/SECOND-STAGE VALIDATION/);
assert.match(ui,/opponentSide=side==='attacker'\?'defender':'attacker'/,'generated opponents must baseline from the opposite Lab side');
for(const terrain of ['plains','forest','hills','mountain','jungle','marsh','desert','urban'])assert.ok(core.includes(`'${terrain}'`),`Gauntlet core must include ${terrain}`);
for(const archetype of ['infantry_wall','artillery_infantry','cheap_holding','motorized','mechanized','light_armor','medium_armor','heavy_armor','breakthrough_tank','high_hardness','at_counter','aa_heavy','space_marine','high_org','low_cost_spam','elite'])assert.ok(core.includes(`id:'${archetype}'`),`missing archetype ${archetype}`);
assert.match(ui,/planner analytical/,'UI must disclose analytical opponent/grading boundary');
assert.match(ui,/certified bounded 1\.19\.2 combat engine/,'UI must disclose combat evidence boundary');
assert.match(css,/\.gauntlet-terrain-grid/);assert.match(css,/\.gauntlet-grade-grid/);assert.match(css,/@media\(max-width:600px\)/,'Gauntlet must retain a mobile layout');

console.log('Division Gauntlet UI regression checks passed.');
