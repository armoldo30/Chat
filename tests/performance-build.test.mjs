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

const temp=resolve(root,'.performance-main-check.mjs');
await writeFile(temp,patched);
const checked=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});
await rm(temp,{force:true});
assert.equal(checked.status,0,checked.stderr||'patched main.js must parse');

console.log('performance build transform tests passed');
