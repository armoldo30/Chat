import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [index,direction,mode,model,candidates,search]=await Promise.all([
  read('index.html'),read('src/product-direction-runtime.js'),read('src/counter-analysis-ui.js'),read('src/counter-state-model.js'),read('src/counter-candidates.js'),read('src/counter-search.js')
]);

assert.match(index,/Counter Analysis/,'public landing copy must describe Counter Analysis');
assert.match(index,/counter-analysis\.css/,'Counter Analysis styles must ship');
assert.match(index,/counter-results-ui\.js/,'Counter Analysis renderer must ship');
assert.match(index,/counter-analysis-ui\.js/,'Counter Analysis Division Lab mode must ship');
assert.match(direction,/\['front','intel','production'\]/,'Front, Intel, and Industry must remain retired as public routes');
assert.match(mode,/COUNTER ANALYSIS/,'Division Lab must expose the Counter Analysis mode');
assert.match(model,/buildTechAdjustedData/,'counter model must honor selected technology');
assert.match(model,/applyMioEquipmentBonus/,'counter model must honor MIO equipment effects');
assert.match(model,/applyTankDesignToBattalion/,'counter model must honor tank variants');
assert.match(candidates,/canPlaceBattalion/,'candidate search must respect regiment structure');
assert.match(search,/simulateBattle/,'counter candidates must be evaluated through the combat model');
assert.doesNotMatch(index,/enemy uncertainty bands/i,'landing copy must not frame uncertainty as a core workflow');

console.log('Counter Analysis UI regression checks passed.');
