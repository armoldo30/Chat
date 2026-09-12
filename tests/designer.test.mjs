import assert from 'node:assert/strict';
import { DESIGNER_COLS, DESIGNER_ROWS, blankGrid, normalizeGrid, countsToGrid, gridToCounts, filledInRegiment, fillRegiment, regimentGroup, canPlaceBattalion } from '../src/designer.js';
const valid=['infantry','artillery','medium_armor'];
const units={infantry:{group:'infantry'},artillery:{group:'combat_support',categories:['category_line_artillery']},motorized:{group:'mobile'},medium_armor:{group:'armor'}};

const grid=countsToGrid([{type:'infantry',count:9},{type:'artillery',count:1}],valid,units);
assert.equal(grid.length,DESIGNER_COLS);assert.equal(grid[0].length,DESIGNER_ROWS);
assert.equal(filledInRegiment(grid,0),5);
assert.equal(filledInRegiment(grid,1),4,'remaining infantry should stay in an infantry regiment');
assert.equal(filledInRegiment(grid,2),1,'line artillery should start a separate combat-support regiment');
assert.equal(regimentGroup(grid,0,units),'infantry');
assert.equal(regimentGroup(grid,2,units),'combat_support');
assert.deepEqual(gridToCounts(grid,valid),[{type:'infantry',count:9},{type:'artillery',count:1}]);

const capped=countsToGrid([{type:'infantry',count:40}],valid,units);assert.equal(gridToCounts(capped,valid)[0].count,25,'designer cannot exceed 25 line battalions');
const dirty=blankGrid();dirty[0][0]='bogus';dirty[0][1]='infantry';const clean=normalizeGrid(dirty,valid,units);assert.equal(clean[0][0],null);assert.equal(clean[0][1],'infantry');
const filled=fillRegiment(blankGrid(),2,'medium_armor',valid,units);assert.equal(filledInRegiment(filled,2),5);assert.ok(filled[2].every(x=>x==='medium_armor'),'shift-fill should populate the full regiment');
const cleared=fillRegiment(filled,2,null,valid,units);assert.equal(filledInRegiment(cleared,2),0,'shift-remove should clear the full regiment');

const grouped=blankGrid();grouped[0][0]='infantry';
assert.equal(canPlaceBattalion(grouped,0,1,'motorized',units),false,'an infantry regiment should reject mobile battalions');
assert.equal(canPlaceBattalion(grouped,0,1,'artillery',units),false,'an infantry regiment should reject line artillery');
assert.equal(canPlaceBattalion(grouped,0,1,'infantry',units),true);
assert.equal(canPlaceBattalion(grouped,0,1,'artillery',units,{replaceRegiment:true}),true,'full-regiment replacement may change the regiment group');

const legacyMixed=blankGrid();legacyMixed[0][0]='infantry';legacyMixed[0][1]='artillery';legacyMixed[0][2]='infantry';
const repaired=normalizeGrid(legacyMixed,valid,units);
assert.equal(regimentGroup(repaired,0,units),'infantry');
assert.equal(repaired[0].filter(Boolean).length,2,'valid infantry should remain in the original regiment');
assert.equal(regimentGroup(repaired,1,units),'combat_support','legacy mixed artillery should migrate to a separate regiment');
assert.equal(repaired[1].filter(Boolean).length,1);
assert.deepEqual(gridToCounts(repaired,valid),[{type:'infantry',count:2},{type:'artillery',count:1}],'repair must preserve battalion counts');
console.log('All designer invariants passed.');
