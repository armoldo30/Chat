import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { displayLabel, humanizeIdentifier, visualKind, iconSvg } from '../src/ui-labels.js';

assert.equal(displayLabel('support_artillery'),'Support Artillery');
assert.equal(displayLabel('mobile_warfare'),'Mobile Warfare');
assert.equal(displayLabel('GER_porsche_tank'),'Porsche');
assert.equal(humanizeIdentifier('USA_example_aircraft_organization'),'Example Aircraft');
assert.ok(!displayLabel('regimental_infantry_guns').includes('_'),'visible labels must not expose underscore ids');
assert.equal(visualKind('medium_tank_chassis'),'armor');
assert.equal(visualKind('fighter_airframe'),'air');
assert.match(iconSvg('armor'),/<svg/);

const [html,js,css,cleanup]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-overhaul.js',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-overhaul.css',import.meta.url),'utf8'),
  readFile(new URL('../src/visible-label-cleanup.js',import.meta.url),'utf8')
]);

assert.match(html,/visual-overhaul\.css/,'index should load the visual overhaul stylesheet');
assert.match(html,/visual-overhaul\.js/,'index should load the visual overhaul module');
assert.match(html,/visible-label-cleanup\.js/,'index should load the visible ID cleanup layer');
for(const selector of ['#land-grand','[data-doctrine-choice]','[data-mio-org]','.tank-module-grid select','.air-module-grid select'])assert.ok(js.includes(selector),`visual picker coverage should include ${selector}`);
assert.match(js,/dispatchEvent\(new Event\('change'/,'visual choices must drive the existing certified controls');
assert.doesNotMatch(js,/engine\.js|simulateBattle|calcDivision/,'visual layer must not import or execute simulation mechanics');
assert.match(cleanup,/looksLikeIdentifier/,'visible label cleanup should only rewrite identifier-like labels');
assert.match(cleanup,/Game ID:/,'raw game IDs should remain inspectable as tooltips');
assert.match(cleanup,/\.(?:txt\|lua\|yml/,'source filenames should be excluded from display rewriting');
assert.doesNotMatch(cleanup,/engine\.js|simulateBattle|calcDivision/,'label cleanup must remain UI-only');
assert.match(css,/visual-picker-grid/);
assert.match(css,/mastery-pips/);
assert.match(css,/visual-mio-node/);
assert.match(css,/prefers-reduced-motion/);

console.log('Visual overhaul regression checks passed.');
