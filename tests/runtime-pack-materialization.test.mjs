import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import BUILTIN_1193 from '../src/builtin1193.js';
import {
  RUNTIME_PACK_DIST_IMPORT,
  RUNTIME_PACK_SOURCE_IMPORT,
  materializedRuntimePackModule,
  rewriteMainForMaterializedPack
} from '../scripts/materialize-runtime-pack.mjs';

const root=resolve(import.meta.dirname,'..');
const generated=materializedRuntimePackModule(BUILTIN_1193);
assert.ok(generated.startsWith('// Generated at build time from the certified source pack.'),'generated module should identify itself as build output');
assert.doesNotMatch(generated,/builtin1192raw\//,'runtime pack must not import the 22 raw source chunks');
assert.doesNotMatch(generated,/JSON\.parse\(text\)/,'runtime pack must not reconstruct the compact source payload in the browser');
assert.match(generated,/RUNTIME_PACK_FORMAT=1/,'runtime pack should expose an explicit generated format marker');

const mainSource=await readFile(resolve(root,'src/main.js'),'utf8');
assert.ok(mainSource.includes(RUNTIME_PACK_SOURCE_IMPORT),'canonical main.js must keep the source-time certified pack import');
const rewritten=rewriteMainForMaterializedPack(mainSource);
assert.ok(rewritten.includes(RUNTIME_PACK_DIST_IMPORT),'build rewrite must use the generated runtime pack');
assert.ok(!rewritten.includes(RUNTIME_PACK_SOURCE_IMPORT),'build rewrite must remove the source reconstruction import');
assert.throws(()=>rewriteMainForMaterializedPack(mainSource.replace(RUNTIME_PACK_SOURCE_IMPORT,'')),/could not find/i,'missing build anchor must fail closed');
assert.throws(()=>rewriteMainForMaterializedPack(`${mainSource}\n${RUNTIME_PACK_SOURCE_IMPORT}`),/more than once/i,'duplicate build anchor must fail closed');

const temp=resolve(root,`.runtime-pack-materialized-${process.pid}.mjs`);
try{
  await writeFile(temp,generated);
  const roundTrip=await import(`${pathToFileURL(temp).href}?t=${Date.now()}`);
  assert.equal(roundTrip.RUNTIME_PACK_FORMAT,1,'generated module format marker should survive import');
  assert.deepStrictEqual(roundTrip.default,BUILTIN_1193,'materialized runtime pack must preserve the complete certified data object, including explicit undefined fields');
  assert.ok(Object.prototype.hasOwnProperty.call(roundTrip.default?.technologies?.early_ship_hull_light||{},'folder'),'materialized pack must preserve explicit undefined own-properties');
  assert.equal(roundTrip.default?.technologies?.early_ship_hull_light?.folder,undefined,'explicit undefined technology fields must remain undefined');
  assert.equal(roundTrip.default?.meta?.definesSourceSha256,'881b4076a41355fd67771064770338791fc7076bff1038c6271bb0dd0b717ac6','materialized pack must retain the certified 1.19.3 Defines fingerprint');
  assert.equal(roundTrip.default?.meta?.technologySourceInventoryCertified,true,'materialized pack must retain technology source certification');
  assert.equal(roundTrip.default?.meta?.doctrineSourceInventoryCertified,true,'materialized pack must retain doctrine source certification');
}finally{
  await rm(temp,{force:true});
}

console.log('materialized 1.19.3 runtime pack exact-object equivalence passed');
