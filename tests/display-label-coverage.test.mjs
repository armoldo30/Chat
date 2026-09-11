import assert from 'node:assert/strict';
import BUILTIN_1192 from '../src/builtin1192.js';
import { displayLabel } from '../src/ui-labels.js';

const ids=new Set();
for(const key of ['subUnits','equipment','modules','mios','doctrines','combatTactics','terrain'])for(const id of Object.keys(BUILTIN_1192?.[key]||{}))ids.add(id);
for(const org of Object.values(BUILTIN_1192?.mios||{}))for(const id of Object.keys(org?.traits||{}))ids.add(id);

const failures=[];
for(const id of ids){const label=displayLabel(id);if(label.includes('_'))failures.push([id,label]);}
assert.equal(failures.length,0,`built-in display labels must not expose underscore IDs: ${JSON.stringify(failures.slice(0,20))}`);
assert.ok(ids.size>100,'coverage should span a meaningful built-in ID corpus');
console.log(`Display-label coverage passed for ${ids.size} built-in IDs.`);
