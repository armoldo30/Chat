import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const nav=readFileSync(new URL('../src/nav-visuals.js',import.meta.url),'utf8');
const battlefield=readFileSync(new URL('../src/battlefield-visuals.js',import.meta.url),'utf8');
const stats=readFileSync(new URL('../src/stat-visuals.js',import.meta.url),'utf8');
const modelCss=readFileSync(new URL('../src/hoi4-model-icons.css',import.meta.url),'utf8');
const divisionCss=readFileSync(new URL('../src/division-visuals.css',import.meta.url),'utf8');

for(const [route,kind] of Object.entries({dashboard:'hq',front:'front',intel:'intel',gauntlet:'gauntlet',data:'data',scenario:'scenario'})){
  assert.match(nav,new RegExp(route+":'"+kind+"'"),route+' should use its dedicated pictogram');
}
for(const kind of ['supply','planning','night','directions','entrench','fort'])assert.ok(battlefield.includes("kind:'"+kind+"'"),'battlefield should use '+kind+' icon');
for(const kind of ['soft_attack','defense','health','reliability','supply','cost','speed','range','agility','organization','width'])assert.ok(stats.includes("return '"+kind+"'"),'stats should map to '+kind);
assert.match(modelCss,/hoi-model-rivets/);
assert.match(modelCss,/hoi-model-bevel/);
assert.match(divisionCss,/width:66px;height:66px/,'desktop division choices should use larger readable icons');
assert.match(divisionCss,/min-height:88px/,'filled division slots should reserve room for the clearer icon treatment');

console.log('Unified icon-system regression passed.');
