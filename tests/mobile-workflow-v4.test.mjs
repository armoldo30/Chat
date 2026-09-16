import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [workflow,cleanup,index]=await Promise.all([
  readFile(new URL('../src/mobile-workflow-v4.css',import.meta.url),'utf8'),
  readFile(new URL('../src/mobile-cleanup-v3.css',import.meta.url),'utf8'),
  readFile(new URL('../index.html',import.meta.url),'utf8')
]);

assert.match(cleanup,/^\/\*[^\n]*\*\/\s*@import url\('\.\/mobile-workflow-v4\.css'\);/s,'mobile workflow overrides must load through the existing late mobile stylesheet');
assert.ok(index.includes('./src/mobile-cleanup-v3.css'),'mobile cleanup stylesheet must remain on the production page');

assert.match(workflow,/@media\(max-width:720px\)/,'workflow rules must be phone/tablet scoped');
assert.match(workflow,/\.sidebar\s*\{[^}]*position:fixed!important;[^}]*bottom:0!important;/s,'primary tool navigation must become a fixed bottom dock');
assert.match(workflow,/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)!important/,'all seven primary tools must fit the mobile dock without horizontal scrolling');
assert.match(workflow,/\.sidebar nav a\s*\{[^}]*min-height:50px!important;/s,'mobile tool targets must remain finger-sized');
assert.ok(workflow.includes('body{padding-bottom:calc(var(--mobile-tool-dock-height) + env(safe-area-inset-bottom))!important}'),'page footer must reserve the mobile dock and safe-area height');
assert.ok(workflow.includes('.app-shell{display:block!important;min-height:100vh!important;padding-bottom:calc(var(--mobile-tool-dock-height) + env(safe-area-inset-bottom))!important}'),'planner content must reserve space for the bottom dock and safe area');
assert.match(workflow,/\.lab-command-bar\s*\{[^}]*position:sticky!important;[^}]*top:52px!important;/s,'Division Lab mode controls must stay reachable below the compact header');
assert.match(workflow,/\.actions:has\(#shareState\)[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/,'scenario/share controls must use a touch-friendly grid');
assert.match(workflow,/\.counter-actions \.primary\{min-height:48px!important\}/,'Counter Analysis improvement actions must remain touch-friendly');
assert.doesNotMatch(workflow,/simulateBattle|compareBuiltAirDesigns|optimizeForceProduction|COMBAT_CONSTANTS/,'mobile workflow CSS must not contain or redefine model logic');

console.log('Mobile workflow navigation and touch-target contract passed.');
