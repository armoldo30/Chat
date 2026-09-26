import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O18_HOURS=Object.freeze(Array.from({length:22},(_,i)=>i));
export const O18_SCENARIO='o18-normal-strength-die-v1';

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(s){const o={};for(const m of String(s).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))o[m[1]]=m[2];return o;}
function payload(line){const i=line.indexOf('WPO18');return i<0?null:line.slice(i+5).trim();}
function measure(f,line){const o={};for(const k of ['orgLow','orgHigh','strengthLow','strengthHigh']){const n=finite(f[k]);if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${k}`);o[k]=n;}return o;}
function sameOrg(a,b){return a.orgLow===b.orgLow&&a.orgHigh===b.orgHigh;}
function sameAll(a,b){return sameOrg(a,b)&&a.strengthLow===b.strengthLow&&a.strengthHigh===b.strengthHigh;}
function mid(m){return (m.strengthLow+m.strengthHigh)/2;}
function classify(loss,strict){if(!strict)return 0;if(loss>=.014&&loss<.037)return 1;if(loss>=.037&&loss<.064)return 2;return 3;}

export function parseO18Runs(text){
 const runs=[];let run=null,current=null;
 for(const [i,line] of String(text??'').split(/\r?\n/).entries()){
  const p=payload(line);if(p===null)continue;const j=p.indexOf(' '),type=j<0?p:p.slice(0,j),f=kv(j<0?'':p.slice(j+1)),lineNo=i+1;
  if(type==='BEGIN'){run={begin:f,samples:[],end:null};runs.push(run);current=null;continue;}
  if(!run)continue;
  if(type==='SAMPLE'){current={hour:Number(f.hour),attackers:[],defenders:[]};run.samples.push(current);continue;}
  if(type==='ATTACKER'||type==='DEFENDER'){if(!current)throw new Error(`line ${lineNo}: measurement before sample`);(type==='ATTACKER'?current.attackers:current.defenders).push(measure(f,lineNo));continue;}
  if(type==='END'){run.end=f;current=null;}
 }
 return runs;
}

export function captureO18Run(run){
 const b=run?.begin||{};if(!run?.end)throw new Error('missing END');
 if(Number(b.schema)!==1||b.scenario!==O18_SCENARIO)throw new Error('bad schema/scenario');
 if(b.gameVersion!=='1.19.3.0.c01a'||b.checksum!=='5632'||b.checksumScope!=='base-game-reference')throw new Error('bad version/checksum');
 if(b.method!=='bisection14'||b.runMode!=='trial21'||b.tacticMode!=='neutral-basic-only')throw new Error('bad method/run/tactics');
 if(b.defineOverrides!=='BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0,STR_DAMAGE_MODIFIER:0.060,STR_DICE:2,STR_ARMOR_SOFT_DICE:2,NIGHT_PENALTY:0')throw new Error('bad defines');
 if(b.attackModifier!=='army_infantry_attack_factor:-0.721'||b.defenderAttackModifier!=='army_infantry_attack_factor:-0.99'||b.defenseModifier!=='army_infantry_defence_factor:-0.9923784016'||b.prepared!=='yes'||b.modifiersPresent!=='yes')throw new Error('bad modifiers');
 if(run.end.reason!=='trial21-complete'||Number(run.end.hour)!==21||run.end.modifiersRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad cleanup');
 if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O18_HOURS))throw new Error('expected hours 0..21');
 for(const s of run.samples)if(s.attackers.length!==1||s.defenders.length!==1)throw new Error('expected one attacker and defender');
 const h0=run.samples[0],h1=run.samples[1];
 if(!sameAll(h0.attackers[0],h1.attackers[0])||!sameAll(h0.defenders[0],h1.defenders[0]))throw new Error('startup changed');
 for(const s of run.samples)if(!sameOrg(s.defenders[0],h0.defenders[0]))throw new Error('defender organization changed');
 const counts={zero:0,one:0,two:0,outOfSupport:0},intervals=[];
 for(let h=2;h<=21;h++){const prev=run.samples[h-1].defenders[0],cur=run.samples[h].defenders[0],loss=(mid(prev)-mid(cur))*100,strict=cur.strengthHigh<prev.strengthLow,m=classify(loss,strict);intervals.push({fromHour:h-1,toHour:h,strengthLossPp:loss,strict,die:m});if(m===0)counts.zero++;else if(m===1)counts.one++;else if(m===2)counts.two++;else counts.outOfSupport++;}
 return {counts,intervals};
}
export function parseO18Batch(text){const cand=parseO18Runs(text),accepted=[],rejected=[];cand.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO18Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});return {scenario:O18_SCENARIO,totalRuns:cand.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,runs:accepted};}

async function cli(){const [,,f]=process.argv;if(!f){process.exitCode=2;return;}console.log(JSON.stringify(parseO18Batch(await fs.readFile(f,'utf8')),null,2));}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url)))await cli();
