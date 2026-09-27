import assert from 'node:assert/strict';
import {parseO21,assessO21} from '../scripts/oracle-o21-assess.mjs';

const log='WPO21 STATUS state=prepared schema=1 scenario=o21-armor-piercing-injection-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=manual-panel-calibration tacticMode=not-applicable baseline=perfect-baseline-ready expectedGERPiercing=20.0 expectedPOLArmor=20.0 sourceBaselinePiercing=4 armorDelta=20 piercingDelta=16 techsPresent=yes';
const parsed=parseO21(log);
assert.equal(parsed.statuses.length,1);
assert.equal(parsed.statuses[0].state,'prepared');

const ok=assessO21({parsed,panel:{gerPiercingDisplayed:20,gerPiercingTooltip:20,polArmorDisplayed:20,polArmorTooltip:20}});
assert.equal(ok.action,'armor-piercing-injection-calibrated');

assert.throws(()=>assessO21({parsed,panel:{gerPiercingDisplayed:19.9,gerPiercingTooltip:20,polArmorDisplayed:20,polArmorTooltip:20}}),/GER Piercing displayed exactly 20\.0/);
assert.equal(assessO21({parsed:{scenario:parsed.scenario,statuses:[]},panel:{gerPiercingDisplayed:20,gerPiercingTooltip:20,polArmorDisplayed:20,polArmorTooltip:20}}).action,'repair-o21-injector');

console.log('Oracle O21 parser/assessment regression passed.');
