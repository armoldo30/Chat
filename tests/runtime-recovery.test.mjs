import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [index,guard,css,bug,feature]=await Promise.all([
  read('index.html'),read('src/runtime-guard.js'),read('src/runtime-guard.css'),read('.github/ISSUE_TEMPLATE/bug_report.yml'),read('.github/ISSUE_TEMPLATE/feature_request.yml')
]);

assert.match(index,/src\/runtime-guard\.css/,'runtime recovery styles must ship');
assert.match(index,/src\/runtime-guard\.js/,'runtime recovery script must ship');
assert.ok(index.indexOf('src/runtime-guard.js')<index.indexOf('src/main.js'),'runtime guard must load before the planner entry module');
assert.match(index,/class="skip-link" href="#main-content"/,'keyboard users must be able to skip navigation');
assert.match(index,/<noscript>/,'disabled JavaScript must not produce a blank page');
assert.match(index,/Report issue/,'public site must expose a feedback path');
assert.match(index,/strict-origin-when-cross-origin/,'launch page should use a conservative referrer policy');

assert.match(guard,/window\.addEventListener\('error'/,'runtime errors must be caught');
assert.match(guard,/window\.addEventListener\('unhandledrejection'/,'unhandled promise failures must be caught');
assert.match(guard,/12000/,'stalled app startup must have a recovery path');
assert.match(guard,/hoi4-war-planner-v7/,'reset must target current local planner storage');
assert.match(guard,/issues\/new\/choose/,'runtime recovery must expose bug reporting');
assert.doesNotMatch(guard,/fetch\(|XMLHttpRequest|sendBeacon|analytics|gtag\(/i,'runtime recovery must not add telemetry');
assert.match(css,/\.skip-link/,'skip link must have dedicated visibility behavior');
assert.match(css,/:focus-visible/,'recovery controls need visible keyboard focus');
assert.match(css,/@media\(max-width:720px\)/,'recovery UI must adapt to mobile');

for(const [name,text] of [['bug',bug],['feature',feature]]){
  assert.match(text,/name:/,`${name} issue template must be valid structured content`);
  assert.match(text,/body:/,`${name} issue template must define fields`);
}

console.log('Runtime recovery and public feedback checks passed.');
