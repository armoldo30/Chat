import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { applyPerformancePatch } from '../scripts/performance-patch-v2.mjs';

const root=resolve(import.meta.dirname,'..');
const source=await readFile(resolve(root,'src/main.js'),'utf8');
const patched=applyPerformancePatch(source);

assert.match(patched,/currentMioCatalogPack/,'MIO catalog should be cached');
assert.match(patched,/equipmentSideCache/,'equipment derivation should be cached');
assert.match(patched,/techSideCache/,'tech derivation should be cached');
assert.match(patched,/divisionSideCache/,'division calculation should be cached');
assert.match(patched,/combatBandCache/,'combat uncertainty bands should be cached');
assert.match(patched,/querySelector\('\.app-shell'\)/,'the application shell should be reused after first render');
assert.match(patched,/refreshDivisionLab/,'Division Lab should have a view-only refresh path');
assert.doesNotMatch(patched,/data-bslot[^\n]+designerPick[^\n]+shell\(\)/,'opening a battalion picker must not rebuild the whole application shell');
assert.doesNotMatch(patched,/data-sslot[^\n]+designerPick[^\n]+shell\(\)/,'opening a support picker must not rebuild the whole application shell');
assert.doesNotMatch(patched,/data-rslot[^\n]+designerPick[^\n]+shell\(\)/,'opening a regimental picker must not rebuild the whole application shell');

const enhancerModules=[
  'ui-polish.js','nav-visuals.js','ui-localization-runtime.js','visual-overhaul.js','visible-label-cleanup.js','visual-quick-controls.js',
  'division-visuals.js','industry-visuals.js','battlefield-visuals.js','battle-report-visuals.js','designer-visuals.js','stat-visuals.js',
  'doctrine-board.js','air-doctrine-board.js','air-doctrine-primary.js','mio-board.js','inline-mio-board.js','mio-tree-visual.js','tech-system-summary.js','ads.js'
];
const enhancerRuntime=await readFile(resolve(root,'src/ui-enhancer-runtime.js'),'utf8');
assert.match(enhancerRuntime,/new MutationObserver/,'shared enhancer runtime should own the single DOM observer');
assert.match(enhancerRuntime,/requestAnimationFrame/,'shared enhancer work should be batched by animation frame');
for(const file of enhancerModules){
  const text=await readFile(resolve(root,'src',file),'utf8');
  assert.match(text,/registerUiEnhancer/ ,`${file} should use the shared visual scheduler`);
  assert.doesNotMatch(text,/new MutationObserver/ ,`${file} must not create a competing document observer`);
}

const temp=resolve(root,'.performance-main-check.mjs');
await writeFile(temp,patched);
const checked=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});
await rm(temp,{force:true});
assert.equal(checked.status,0,checked.stderr||'patched main.js must parse');

console.log('performance build transform tests passed');
