import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [index,direction,mode,model,candidates,search,searchView,explanations]=await Promise.all([
  read('index.html'),read('src/product-direction-runtime.js'),read('src/counter-analysis-ui.js'),read('src/counter-state-model.js'),read('src/counter-candidates.js'),read('src/counter-search.js'),read('src/counter-search-view.js'),read('src/counter-explanations.js')
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
assert.match(candidates,/priorChanges/,'candidate generator must carry prior changes into multi-step designs');
assert.match(candidates,/replace-support/,'full support templates must support company swaps');
assert.match(search,/simulateBattle/,'counter candidates must be evaluated through the combat model');
assert.match(search,/beamWidth/,'counter search must bound second-step expansion with a beam');
assert.match(search,/secondStepLimit/,'counter search must cap second-step simulation work');
assert.match(searchView,/FOCUSED TWO-STEP SEARCH/,'Counter Analysis must tell the user the current search depth');
assert.match(searchView,/Why it works/,'recommendation cards must explain why a counter improves the matchup');
assert.match(searchView,/Tradeoffs/,'recommendation cards must expose counter tradeoffs');
assert.match(explanations,/Crosses the target armor threshold/,'explanations must identify threshold crossings');
assert.match(explanations,/Effective attack against this exact hardness profile/,'explanations must connect attack mix to target hardness');
assert.doesNotMatch(index,/enemy uncertainty bands/i,'landing copy must not frame uncertainty as a core workflow');

console.log('Counter Analysis UI regression checks passed.');
