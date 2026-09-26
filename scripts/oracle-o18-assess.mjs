import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO18Batch} from './oracle-o18-trial21.mjs';

function panel(p){if(Number(p.displayedSoft)!==20||Number(p.tooltipSoft)!==20||Number(p.displayedDefense)!==10||Number(p.tooltipDefense)!==10)throw new Error('O18 requires exact 20.0 Soft Attack / 10.0 Defense');}
export function assessO18({batch,panel:live}){
 panel(live);const base={schemaVersion:1,scenario:'o18-normal-strength-die-v1',evidenceStatus:'unvalidated'};
 if(batch.rejectedRuns||batch.acceptedRuns!==1)return {...base,action:'invalid-run'};
 const c=batch.runs[0].capture.counts,n=c.zero+c.one+c.two+c.outOfSupport;
 if(n!==20)return {...base,action:'bad-interval-count',counts:c};
 if(c.zero>0)return {...base,stage:'complete',action:'one-defended-point-control-broke-under-strength-feedback',counts:c};
 if(c.outOfSupport>0)return {...base,stage:'complete',action:'strength-die-semantics-mismatch',counts:c};
 const supported=c.two>=4&&c.two<=16&&c.one>0&&c.two>0;
 return {...base,stage:'complete',action:supported?'strength-die-uniform-1-through-2-supported':'strength-die-semantics-mismatch',counts:c,dieTwoExactAcceptance:{min:4,max:16},interpretation:supported?'The 20 one-hit strength losses are compatible with a uniform integer die on 1 through 2.':'The die-2 count lies outside the predeclared exact two-sided 1% Binomial(20,0.5) acceptance region.'};
}
export function assessO18Log({text,...panelArgs}){const batch=parseO18Batch(text);return {assessment:assessO18({batch,panel:panelArgs}),batch};}
async function cli(){const [,,f,ds,ts,dd,td]=process.argv;if([f,ds,ts,dd,td].some(v=>v===undefined)){process.exitCode=2;return;}console.log(JSON.stringify(assessO18Log({text:await fs.readFile(f,'utf8'),displayedSoft:+ds,tooltipSoft:+ts,displayedDefense:+dd,tooltipDefense:+td}),null,2));}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url)))await cli();
