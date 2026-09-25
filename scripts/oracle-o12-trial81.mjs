import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O12_HOURS=Object.freeze(Array.from({length:82},(_,i)=>i));
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function kv(s){const o={};for(const m of String(s).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))o[m[1]]=m[2];return o;}
function mid(x){return (x.orgLow+x.orgHigh)/2;}
function cls(prev,cur){const loss=(mid(prev)-mid(cur))*100;if(!(cur.orgHigh<prev.orgLow))return 0;if(loss<.13)return 1;if(loss<.225)return 2;if(loss<.315)return 3;return 4;}
export function parseO12Batch(text){
  let run=null,cur=null;const runs=[];
  for(const [idx,line] of String(text).split(/\r?\n/).entries()){
    const p=line.indexOf('WPO12');if(p<0)continue;const s=line.slice(p+5).trim(),j=s.indexOf(' '),type=j<0?s:s.slice(0,j),f=kv(j<0?'':s.slice(j+1));
    if(type==='BEGIN'){run={begin:f,samples:[],end:null};runs.push(run);cur=null;continue;} if(!run)continue;
    if(type==='SAMPLE'){cur={hour:Number(f.hour),attackers:[],defenders:[]};run.samples.push(cur);continue;}
    if(type==='ATTACKER'||type==='DEFENDER'){if(!cur)throw new Error('measurement before sample');const m={};for(const k of ['orgLow','orgHigh','strengthLow','strengthHigh'])m[k]=finite(f[k]);(type==='ATTACKER'?cur.attackers:cur.defenders).push(m);continue;}
    if(type==='END')run.end=f;
  }
  const accepted=[],rejected=[];
  runs.forEach((r,i)=>{try{
    const b=r.begin;
    if(!r.end||b.scenario!=='o12-defended-only-defense12-v1'||b.gameVersion!=='1.19.3.0.c01a'||b.checksum!=='5632')throw new Error('bad header/end');
    if(b.defineOverrides!=='BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0')throw new Error('bad defines');
    if(b.attackModifier!=='army_infantry_attack_factor:-0.721'||b.defenseModifier!=='army_infantry_defence_factor:-0.9842773534')throw new Error('bad modifiers');
    if(r.end.reason!=='trial81-complete'||Number(r.end.hour)!==81||r.end.modifiersRemoved!=='yes'||r.end.cleanupFailure==='yes')throw new Error('bad cleanup');
    if(JSON.stringify(r.samples.map(x=>x.hour))!==JSON.stringify(O12_HOURS))throw new Error('bad hours');
    for(const s of r.samples)if(s.attackers.length!==1||s.defenders.length!==1)throw new Error('bad division count');
    const h0=r.samples[0],h1=r.samples[1];
    const keys=['orgLow','orgHigh','strengthLow','strengthHigh'];
    if(!keys.every(k=>h0.attackers[0][k]===h1.attackers[0][k]&&h0.defenders[0][k]===h1.defenders[0][k]))throw new Error('startup changed');
    const a0=h0.attackers[0],d0=h0.defenders[0];
    for(const s of r.samples){if(s.attackers[0].strengthLow!==a0.strengthLow||s.attackers[0].strengthHigh!==a0.strengthHigh||s.defenders[0].strengthLow!==d0.strengthLow||s.defenders[0].strengthHigh!==d0.strengthHigh)throw new Error('strength changed');}
    const counts={zero:0,one:0,two:0,three:0,fourPlus:0},intervals=[];
    for(let h=2;h<=81;h++){const m=cls(r.samples[h-1].defenders[0],r.samples[h].defenders[0]);intervals.push(m);if(m===0)counts.zero++;else if(m===1)counts.one++;else if(m===2)counts.two++;else if(m===3)counts.three++;else counts.fourPlus++;}
    accepted.push({runNumber:i+1,capture:{counts,intervals}});
  }catch(e){rejected.push({runNumber:i+1,reason:e.message});}});
  return {scenario:'o12-defended-only-defense12-v1',totalRuns:runs.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,runs:accepted};
}
async function cli(){const [,,f]=process.argv;if(!f){process.exitCode=2;return;}console.log(JSON.stringify(parseO12Batch(await fs.readFile(f,'utf8')),null,2));}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url)))await cli();
