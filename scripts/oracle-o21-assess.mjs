import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O21_SCENARIO='o21-armor-piercing-injection-v1';

function kv(s){const o={};for(const m of String(s).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))o[m[1]]=m[2];return o;}

export function parseO21(text){
  const statuses=[];
  for(const [i,line] of String(text??'').split(/\r?\n/).entries()){
    const p=line.indexOf('WPO21');if(p<0)continue;
    const body=line.slice(p+5).trim();
    if(!body.startsWith('STATUS '))continue;
    statuses.push({line:i+1,...kv(body.slice(7))});
  }
  return {scenario:O21_SCENARIO,statuses};
}

function exact(v,target,label){
  const n=Number(v);
  if(!Number.isFinite(n)||n!==target)throw new Error(`O21 requires ${label} exactly ${target.toFixed(1)}, got ${v}`);
  return n;
}

export function assessO21({parsed,panel}){
  const prepared=parsed.statuses.filter(x=>x.state==='prepared'&&x.scenario===O21_SCENARIO);
  const base={schemaVersion:1,scenario:O21_SCENARIO,evidenceStatus:'unvalidated'};
  if(prepared.length!==1)return {...base,stage:'invalid-preparation-log',action:'repair-o21-injector',preparedCount:prepared.length,statuses:parsed.statuses};
  const gerPiercingDisplayed=exact(panel.gerPiercingDisplayed,20,'GER Piercing displayed');
  const gerPiercingTooltip=exact(panel.gerPiercingTooltip,20,'GER Piercing tooltip');
  const polArmorDisplayed=exact(panel.polArmorDisplayed,20,'POL Armor displayed');
  const polArmorTooltip=exact(panel.polArmorTooltip,20,'POL Armor tooltip');
  return {
    ...base,
    stage:'complete',
    action:'armor-piercing-injection-calibrated',
    observedCombatPanel:{gerPiercingDisplayed,gerPiercingTooltip,polArmorDisplayed,polArmorTooltip},
    interpretation:'The clean baseline save can be reused with Oracle-only flat infantry stat injections: GER Piercing 20.0 and POL Armor 20.0 were observed exactly. This calibrates instrumentation only and does not validate armor combat behavior.'
  };
}

export function assessO21Log({text,...panel}){const parsed=parseO21(text);return {assessment:assessO21({parsed,panel}),parsed};}

async function cli(){
  const [,,input,gpd,gpt,pad,pat]=process.argv;
  if([input,gpd,gpt,pad,pat].some(v=>v===undefined)){
    console.error('Usage: node scripts/oracle-o21-assess.mjs <game.log> <GER piercing displayed> <GER piercing tooltip> <POL armor displayed> <POL armor tooltip>');
    process.exitCode=2;return;
  }
  try{
    process.stdout.write(JSON.stringify(assessO21Log({
      text:await fs.readFile(input,'utf8'),
      gerPiercingDisplayed:Number(gpd),gerPiercingTooltip:Number(gpt),
      polArmorDisplayed:Number(pad),polArmorTooltip:Number(pat)
    }),null,2)+'\n');
  }catch(error){console.error(`O21 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();
