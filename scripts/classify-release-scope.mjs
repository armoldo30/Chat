import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PUBLIC_HTML=/^(?:index|about|guides|methodology|privacy|division-counter|division-gauntlet|tank-designer|air-lab)\.html$/;
const STATIC_ASSET=/\.(?:svg|png|jpe?g|webp|ico)$/i;
const PRESENTATION_JS=new Set([
  'src/ads.js',
  'src/air-doctrine-board.js',
  'src/air-doctrine-primary.js',
  'src/battle-report-visuals.js',
  'src/battlefield-visuals.js',
  'src/designer-visuals.js',
  'src/division-visuals.js',
  'src/gauntlet-ui.js',
  'src/hoi4-model-icons.js',
  'src/hoi4-model-runtime.js',
  'src/icon-overhaul.js',
  'src/industry-visuals.js',
  'src/inline-mio-board.js',
  'src/item-icons.js',
  'src/mio-tree-visual.js',
  'src/mio-workflow-ui.js',
  'src/nav-visuals.js',
  'src/product-direction-runtime.js',
  'src/stat-visuals.js',
  'src/tech-system-summary.js',
  'src/ui-enhancer-runtime.js',
  'src/ui-localization-bootstrap.js',
  'src/ui-localization-runtime.js',
  'src/ui-localization.js',
  'src/ui-polish.js',
  'src/visible-label-cleanup.js',
  'src/visual-overhaul.js',
  'src/visual-quick-controls.js'
]);
const PRESENTATION_TEST=/^tests\/(?:battle-report-visuals|display-label-coverage|game-ui-parity|gauntlet-ui|google-analytics|icon-overhaul|item-icons-regression|launch-hardening|localization-bootstrap|mio-mobile-tree-hotfix|mio-tree-visual|mio-workflow-ui|mobile-workflow-v4|monetization-readiness|nav-visuals|performance-build|quick-controls|seo-discoverability|stat-visuals|static-site-integrity|system-primary-ui|ui-copy-cleanup|ui-localization|ui-polish|ui-smoke|visual-boards|visual-overhaul)\.test\.mjs$/;

export function isPresentationOnlyPath(path){
  if(!path) return false;
  if(path==='README.md'||path==='robots.txt'||path==='ads.txt') return true;
  if(PUBLIC_HTML.test(path)) return true;
  if(/^src\/.*\.css$/i.test(path)) return true;
  if(PRESENTATION_JS.has(path)) return true;
  if(PRESENTATION_TEST.test(path)) return true;
  if(STATIC_ASSET.test(path)&&!path.startsWith('tests/fixtures/')) return true;
  return false;
}

export function classifyPaths(paths){
  const clean=[...new Set(paths.map(path=>String(path||'').trim()).filter(Boolean))];
  if(!clean.length) return {scope:'full',disallowed:['<no changes>'],paths:clean};
  const disallowed=clean.filter(path=>!isPresentationOnlyPath(path));
  return {scope:disallowed.length?'full':'fast',disallowed,paths:clean};
}

function changedFiles(base,head){
  return execFileSync('git',['diff','--name-only',base,head],{encoding:'utf8'})
    .split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
}

const invoked=fileURLToPath(import.meta.url)===process.argv[1];
if(invoked){
  const [base,head]=process.argv.slice(2);
  if(!base||!head){
    console.error('Usage: node scripts/classify-release-scope.mjs <base-sha> <head-sha>');
    process.exit(2);
  }
  const result=classifyPaths(changedFiles(base,head));
  console.error(`Release scope: ${result.scope}`);
  console.error(`Changed files (${result.paths.length}): ${result.paths.join(', ')||'<none>'}`);
  if(result.disallowed.length) console.error(`Full-suite triggers: ${result.disallowed.join(', ')}`);
  process.stdout.write(result.scope);
}
