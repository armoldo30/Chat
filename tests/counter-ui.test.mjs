import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [index,direction,mode,model,candidates,forceCandidates,search,searchView,explanations]=await Promise.all([
  read('index.html'),read('src/product-direction-runtime.js'),read('src/counter-analysis-ui.js'),read('src/counter-state-model.js'),read('src/counter-candidates.js'),read('src/counter-force-candidates.js'),read('src/counter-search.js'),read('src/counter-search-view.js'),read('src/counter-explanations.js')
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
assert.match(candidates,/canPlaceBattalion/,'template candidate search must respect regiment structure');
assert.match(candidates,/priorKinds/,'template candidate generator must preserve change categories');
assert.match(candidates,/replace-support/,'full support templates must support company swaps');
assert.match(forceCandidates,/tankDesignOptions/,'force-design search must use structurally compatible tank module options');
assert.match(forceCandidates,/tankVariantTargets/,'force-design search must only retune variants connected to modeled units');
assert.match(forceCandidates,/equipment-tech/,'force-design search must include relevant equipment-tier changes');
assert.match(forceCandidates,/counterForceKey/,'force-design candidates must use state-aware deduplication');
assert.match(search,/buildForceDesignCandidates/,'counter search must combine force-design and template candidates');
assert.match(search,/costUnpriced/,'counter search must track equipment-tier transitions whose production cost is not yet modeled');
assert.match(search,/simulateBattle/,'counter candidates must be evaluated through the combat model');
assert.match(search,/beamWidth/,'counter search must bound second-step expansion with a beam');
assert.match(search,/secondStepLimit/,'counter search must cap second-step simulation work');
assert.match(searchView,/FORCE-DESIGN TWO-STEP SEARCH/,'Counter Analysis must expose the expanded search scope');
assert.match(searchView,/equipment-tier upgrades/,'Counter Analysis must explain that equipment changes can be mixed into the search');
assert.match(searchView,/tech transition cost not priced/,'Counter Analysis must not present technology transitions as free production changes');
assert.match(searchView,/excluded from Best Value/,'unpriced transitions must be visibly excluded from cost-based recommendations');
assert.match(searchView,/Why it works/,'recommendation cards must explain why a counter improves the matchup');
assert.match(searchView,/Tradeoffs/,'recommendation cards must expose counter tradeoffs');
assert.match(explanations,/Crosses the target armor threshold/,'explanations must identify threshold crossings');
assert.match(explanations,/underlying variant/,'tank-design recommendations must explain equipment-level effects');
assert.match(explanations,/Research time, line conversion/,'technology recommendations must disclose unpriced transition burden');
assert.match(explanations,/Effective attack against this exact hardness profile/,'explanations must connect attack mix to target hardness');
assert.doesNotMatch(index,/enemy uncertainty bands/i,'landing copy must not frame uncertainty as a core workflow');

console.log('Counter Analysis UI regression checks passed.');
