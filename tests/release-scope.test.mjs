import assert from 'node:assert/strict';
import { classifyPaths, isPresentationOnlyPath } from '../scripts/classify-release-scope.mjs';

assert.equal(classifyPaths(['methodology.html','src/style.css']).scope,'fast');
assert.equal(classifyPaths(['src/gauntlet-ui.js','src/gauntlet.css','tests/gauntlet-ui.test.mjs']).scope,'fast');
assert.equal(classifyPaths(['README.md','src/icons/sample.svg']).scope,'fast');

for(const path of ['src/main.js','src/engine.js','src/data.js','src/gauntlet.js','src/counter-search.js','package.json','.github/workflows/main.yml','scripts/build.mjs']){
  assert.equal(isPresentationOnlyPath(path),false,`${path} must force the full certification lane`);
  assert.equal(classifyPaths(['src/style.css',path]).scope,'full',`${path} must override otherwise-fast changes`);
}

assert.equal(classifyPaths([]).scope,'full','an empty/unknown diff must fail safe to the full lane');
console.log('Release-scope classification regression checks passed.');
