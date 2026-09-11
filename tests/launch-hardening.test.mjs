import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [main,data,index,polish,ads,pkgText,build,mainWorkflow,releaseWorkflow]=await Promise.all([
  read('src/main.js'),read('src/data.js'),read('index.html'),read('src/ui-polish.css'),read('src/ad-config.js'),read('package.json'),read('scripts/build.mjs'),read('.github/workflows/main.yml'),read('.github/workflows/release-candidate-ci.yml')
]);
const pkg=JSON.parse(pkgText);

assert.equal(pkg.version,'0.16.0','release candidate must use 0.16.0 package version');
assert.match(data,/appVersion:\s*'0\.16\.0'/,'visible planner version must match package version');
assert.match(data,/updated:\s*'2026-09-11'/,'model metadata must carry the release-candidate update date');

assert.match(main,/function serializableState\(\)/,'scenario persistence must share one serialization path');
assert.match(main,/let saveFailureShown=false/,'local persistence failures must be throttled instead of repeatedly interrupting users');
assert.match(main,/localStorage\.setItem\(STORAGE,JSON\.stringify\(serializableState\(\)\)\)/,'local saves must use the normalized serialized state');
assert.match(main,/file\.size>25\*1024\*1024/,'JSON imports must reject unreasonable file sizes');
assert.match(main,/r\.onerror=/,'JSON imports must handle FileReader failures');
assert.doesNotMatch(main,/state\.schema=6/,'scenario import/reset must never downgrade schema 7 back to schema 6');
assert.match(main,/state\.schema=defaults\.schema/,'scenario import must normalize to the current schema');
assert.match(main,/downloadJSON\('war-planner-scenario\.json',serializableState\(\)\)/,'scenario export must omit the redundant bundled data pack');
assert.match(main,/\$\('app'\)\.innerHTML=/,'the SPA must render inside the permanent #app mount');
assert.doesNotMatch(main,/document\.body\.innerHTML=/,'app rendering must not delete the privacy footer or enhancement script nodes');
assert.doesNotMatch(main,/0\.15\.0 model/,'visible scenario copy must not describe the release as 0.15.0');

assert.match(index,/<html lang="en">/);assert.match(index,/id="app"/);assert.match(index,/class="site-legal-footer"/);assert.match(index,/name="viewport"/);assert.match(index,/href="\.\/privacy\.html"/);assert.match(index,/Not affiliated with Paradox Interactive/);
assert.match(polish,/:focus-visible/,'keyboard focus must remain visible');
assert.match(polish,/prefers-reduced-motion:reduce/,'reduced-motion preference must be honored');
assert.match(ads,/enabled:false/,'AdSense must remain disabled in the launch candidate');
assert.match(build,/\['CNAME','robots\.txt'\]/,'build must carry optional custom-domain and crawler files when present');
assert.match(mainWorkflow,/if: github\.ref == 'refs\/heads\/main'/,'Pages deployment must remain explicitly main-only even for manual workflow dispatch');
assert.match(releaseWorkflow,/permissions:\n  contents: read/,'release-candidate validation must remain read-only');

for(const path of [
  '.mio-stage',
  '.github/workflows/launch-hardening-patcher.yml',
  '.github/workflows/gauntlet-ci.yml',
  '.github/workflows/monetization-ci.yml',
  '.github/workflows/visual-full-ci.yml',
  '.github/workflows/mio-source-mirror-check.yml',
  '.github/workflows/mio-staged-payload-validation.yml',
  '.github/workflows/mio-ui-completeness-patch.yml'
]){
  let exists=true;try{await access(new URL(path,root));}catch{exists=false;}
  assert.equal(exists,false,`${path} is staging/history and must not ship in the launch candidate`);
}

console.log('Launch hardening regression checks passed.');
