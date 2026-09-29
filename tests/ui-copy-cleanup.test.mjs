import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const publisherCss=readFileSync(new URL('../src/publisher-content.css',import.meta.url),'utf8');
const battlefield=readFileSync(new URL('../src/battlefield-visuals.js',import.meta.url),'utf8');
const labelCleanup=readFileSync(new URL('../src/visible-label-cleanup.js',import.meta.url),'utf8');
const divisionVisuals=readFileSync(new URL('../src/division-visuals.css',import.meta.url),'utf8');

assert.match(html,/Division planning and combat analysis/,'homepage intro should use the restrained analysis heading');
assert.doesNotMatch(html,/Build divisions\. Test counters\. See what actually changes the matchup\.|Recreate the fight you care about/,'homepage intro should not restore promotional matchup copy');
assert.doesNotMatch(html,/publisher-guide|QUICK GUIDE|What can I use this for\?/,'planner should not restore the lower-page Quick Guide block');
assert.doesNotMatch(html,/publisher-intro-actions|>Open planner<|>Guide<|>How accuracy works</,'homepage header should not restore the three action links');
assert.match(html,/site-legal-footer/,'compact legal/navigation footer must remain');
assert.doesNotMatch(main,/attack axes/i,'battle-plan UI should not use attack-axis wording');
assert.match(main,/Attacking directions/,'battlefield controls should say Attacking directions');
assert.doesNotMatch(main,/Extra attacking directions/,'front controls should use the same Attacking directions label as Division Lab');
assert.doesNotMatch(battlefield,/axis|axes/i,'enhanced battlefield controls should not use axis terminology');
assert.match(battlefield,/Attacking Directions/,'enhanced battlefield controls should say Attacking Directions');
assert.match(battlefield,/Single direction/,'single-direction readout should use direction terminology');
assert.doesNotMatch(publisherCss,/\.publisher-guide/,'retired lower-page guide styling should stay removed');
assert.doesNotMatch(main,/Implemented systems/,'Scenario Control should not end with an implementation checklist');
assert.doesNotMatch(main,/Known limits/,'Scenario Control should not duplicate Methodology at the bottom');
assert.doesNotMatch(main,/model-footnote/,'persistent model disclaimer footnote should stay removed from the app surface');
assert.match(main,/side-meta[^\n]*MODEL_META\.gameVersion[^\n]*MODEL_META\.appVersion/,'version information should remain in the compact sidebar status');
assert.doesNotMatch(main,/GENERAL STAFF<\/b>|LAND FORCES|ARMORED FORCES · EQUIPMENT DESIGN|AIR MINISTRY · AIRCRAFT DESIGN & TEST|ADVANCED · CUSTOM GAME DATA/,'top-level tool headers should stay restrained and non-roleplay');
assert.doesNotMatch(main,/battalions\[type\]\.name\)\}\$\{info\?' · req':''\}/,'filled battalion slots should not show visible req suffixes');
assert.doesNotMatch(main,/battalions\[k\]\.name\)\}\$\{info\?' · req':''\}/,'battalion picker choices should not show visible req suffixes');
assert.doesNotMatch(main,/pickerBattalionMeta[\s\S]{0,700}requirementBadge\(u\)/,'battalion picker metadata should not show a REQ badge');
assert.match(main,/class="source-effect-meta"/,'support picker source-effect metadata should expose a wrapping hook');
assert.match(divisionVisuals,/\.picker-choice \.picker-meta \.source-effect-meta[\s\S]*white-space:normal[\s\S]*overflow-wrap:anywhere/,'long support source-effect text must wrap inside its picker card');
assert.doesNotMatch(main,/SCENARIO CONTROL/,'retired Scenario page UI should stay removed');
assert.match(labelCleanup,/Attacking Axes/,'runtime cleanup should translate legacy Attacking Axes copy');
assert.match(labelCleanup,/Attacking directions/,'legacy axis copy should normalize to attacking directions');

console.log('UI copy and lower-page cleanup regression passed.');
