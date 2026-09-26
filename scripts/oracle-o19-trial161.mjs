import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O19_HOURS=Object.freeze(Array.from({length:162},(_,i)=>i));
export const O19_SCENARIO='o19-combined-normal-damage-v1';

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(s){const o={};for(const m of String(s).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))o[m[1]]=m[2];return o;}
function payload(line){const i=line.indexOf('WPO19');return i<0?null:line.slice(i+5).trim();}
function measure(f,line){
  const o={};
  for(const k of ['orgLow','orgHigh','strengthLow','strengthHigh']){
    const n=finite(f[k]);if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${k}`);o[k]=n;
  }
  if(o.orgLow>o.orgHigh||o.strengthLow>o.strengthHigh)throw new Error(`line ${line}: reversed bounds`);
  return o;
}
function sameAll(a,b){return ['orgLow','orgHigh','strengthLow','strengthHigh'].every(k=>a[k]===b[k]);}
function midOrg(m){return (m.orgLow+m.orgHigh)/2;}
function midStrength(m){return (m.strengthLow+m.strengthHigh)/2;}
function orgDie(loss){
  if(loss>0&&loss<.13)return 1;
  if(loss>=.13&&loss<.225)return 2;
  if(loss>=.225&&loss<.315)return 3;
  if(loss>=.315&&loss<.405)return 4;
  return 0;
}
function strengthDie(loss){
  if(loss>=.014&&loss<.037)return 1;
  if(loss>=.037&&loss<.064)return 2;
  return 0;
}

export function parseO19Runs(text){
  const runs=[];let run=null,current=null;
  for(const [i,line] of String(text??'').split(/\r?\n/).entries()){
    const p=payload(line);if(p===null)continue;
    const j=p.indexOf(' '),type=j<0?p:p.slice(0,j),f=kv(j<0?'':p.slice(j+1)),lineNo=i+1;
    if(type==='BEGIN'){run={begin:f,samples:[],end:null};runs.push(run);current=null;continue;}
    if(!run)continue;
    if(type==='SAMPLE'){const hour=finite(f.hour);if(hour===null)throw new Error(`line ${lineNo}: bad hour`);current={hour,attackers:[],defenders:[]};run.samples.push(current);continue;}
    if(type==='ATTACKER'||type==='DEFENDER'){if(!current)throw new Error(`line ${lineNo}: measurement before sample`);(type==='ATTACKER'?current.attackers:current.defenders).push(measure(f,lineNo));continue;}
    if(type==='END'){run.end={...f,line:lineNo};current=null;}
  }
  return runs;
}

export function captureO19Run(run){
  const b=run?.begin||{};if(!run?.end)throw new Error('missing END');
  if(Number(b.schema)!==1||b.scenario!==O19_SCENARIO)throw new Error('bad schema/scenario');
  if(b.gameVersion!=='1.19.3.0.c01a'||b.checksum!=='5632'||b.checksumScope!=='base-game-reference')throw new Error('bad version/checksum');
  if(b.method!=='bisection14'||b.runMode!=='trial161'||b.tacticMode!=='neutral-basic-only')throw new Error('bad method/run/tactics');
  if(b.defineOverrides!=='BASE_CHANCE_TO_AVOID_HIT:90,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0.053,ORG_DICE:4,ORG_ARMOR_SOFT_DICE:6,STR_DAMAGE_MODIFIER:0.060,STR_DICE:2,STR_ARMOR_SOFT_DICE:2,NIGHT_PENALTY:0')throw new Error('bad defines');
  if(b.attackModifier!=='army_infantry_attack_factor:-0.721'||b.defenderAttackModifier!=='army_infantry_attack_factor:-0.99'||b.defenseModifier!=='army_infantry_defence_factor:-0.9923784016'||b.prepared!=='yes'||b.modifiersPresent!=='yes')throw new Error('bad modifiers/preparation');
  if(run.end.reason!=='trial161-complete'||Number(run.end.hour)!==161||run.end.modifiersRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad END/cleanup');
  if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O19_HOURS))throw new Error('expected hours 0..161');
  for(const s of run.samples)if(s.attackers.length!==1||s.defenders.length!==1)throw new Error(`hour ${s.hour}: expected one attacker and defender`);
  const h0=run.samples[0],h1=run.samples[1];
  if(h0.attackers[0].orgLow<.9999||h0.defenders[0].orgLow<.9999||h0.attackers[0].strengthLow<.9999||h0.defenders[0].strengthLow<.9999)throw new Error('h0 not fresh');
  if(!sameAll(h0.attackers[0],h1.attackers[0])||!sameAll(h0.defenders[0],h1.defenders[0]))throw new Error('startup changed');

  const counts={miss:0,hit:0,mixedChannel:0,supportViolation:0};
  const orgDice={one:0,two:0,three:0,four:0};
  const strengthDice={one:0,two:0};
  const intervals=[];

  for(let h=2;h<=161;h++){
    const prev=run.samples[h-1].defenders[0],cur=run.samples[h].defenders[0];
    const orgLoss=(midOrg(prev)-midOrg(cur))*100;
    const strLoss=(midStrength(prev)-midStrength(cur))*100;
    const orgStrict=cur.orgHigh<prev.orgLow;
    const strStrict=cur.strengthHigh<prev.strengthLow;
    let kind='miss',o=0,s=0;

    if(!orgStrict&&!strStrict){counts.miss++;}
    else if(orgStrict!==strStrict){kind='mixedChannel';counts.mixedChannel++;}
    else{
      o=orgDie(orgLoss);s=strengthDie(strLoss);
      if(!o||!s){kind='supportViolation';counts.supportViolation++;}
      else{
        kind='hit';counts.hit++;
        orgDice[['','one','two','three','four'][o]]++;
        strengthDice[s===1?'one':'two']++;
      }
    }
    intervals.push({fromHour:h-1,toHour:h,orgLossPp:orgLoss,strengthLossPp:strLoss,orgStrict,strengthStrict:strStrict,kind,orgDie:o,strengthDie:s});
  }
  return {counts,orgDice,strengthDice,intervals};
}

export function parseO19Batch(text){
  const candidates=parseO19Runs(text),accepted=[],rejected=[];
  candidates.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO19Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});
  return {scenario:O19_SCENARIO,totalRuns:candidates.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,runs:accepted};
}

async function cli(){
  const [,,input]=process.argv;
  if(!input){console.error('Usage: node scripts/oracle-o19-trial161.mjs <game.log>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(parseO19Batch(await fs.readFile(input,'utf8')),null,2)+'\n');}
  catch(error){console.error(`O19 parse failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();
