import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../src/steel-theme.css',import.meta.url),'utf8');
const pages=['index.html','about.html','air-lab.html','division-counter.html','division-gauntlet.html','guides.html','methodology.html','privacy.html','tank-designer.html'];

for(const token of ['--bg:#0b1017','--panel:#111a24','--panel2:#172331','--line:#2b3c4d','--accent:#78afc7']){
  assert.ok(css.includes(token),'steel theme should define '+token);
}

let depth=0;
for(const ch of css){
  if(ch==='{')depth++;
  if(ch==='}')depth--;
  assert.ok(depth>=0,'steel-theme.css should not close more blocks than it opens');
}
assert.equal(depth,0,'steel-theme.css should have balanced braces');

for(const page of pages){
  const html=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  assert.match(html,/src\/steel-theme\.css/,page+' should load the steel theme');
  const steel=html.lastIndexOf('steel-theme.css');
  const cssLink=html.lastIndexOf('.css');
  assert.ok(steel>=0&&steel<=cssLink,page+' should include the steel theme in its final stylesheet layer');
}

const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(index,/theme-color" content="#0b1017"/,'browser theme color should match the graphite background');

console.log('Steel-blue palette integrity checks passed.');
