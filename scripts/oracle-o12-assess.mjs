import {parseO12Batch} from './oracle-o12-trial81.mjs';
export const CANDIDATES=Object.freeze({
  deterministicOne:Object.freeze({zero:0,one:1,two:0}),
  singleBernoulliBounded:Object.freeze({zero:0,one:.85,two:.15}),
  widerIndependentBounded:Object.freeze({zero:.15,one:.5875,two:.2625}),
  deterministicCeilingBounded:Object.freeze({zero:0,one:.25,two:.75})
});
function panel(p){if(Number(p.displayedSoft)!==20||Number(p.tooltipSoft)!==20||Number(p.displayedDefense)!==12||Number(p.tooltipDefense)!==12)throw new Error('O12 requires exact 20.0 Soft Attack / 12.0 Defense');}
function chi(counts,p){let s=0;for(const k of ['zero','one','two']){const e=80*p[k];if(e===0){if(counts[k]>0)return Infinity;continue;}s+=(counts[k]-e)**2/e;}return s;}
export function assessO12({batch,panel:live}){panel(live);const base={scenario:'o12-defended-only-defense12-v1',evidenceStatus:'unvalidated'};if(batch.rejectedRuns||batch.acceptedRuns!==1)return {...base,action:'invalid-run'};const c=batch.runs[0].capture.counts;if(c.three||c.fourPlus)return {...base,action:'candidate-families-mismatch',counts:c};const stats={};for(const [name,p] of Object.entries(CANDIDATES))stats[name]=chi(c,p);const compatible=Object.entries(stats).filter(([name,x])=>name==='deterministicOne'?x===0:x<=9.21034).map(([name])=>name);return {...base,stage:'complete',counts:c,candidateChiSquare:stats,compatibleFamilies:compatible,action:compatible.length?'candidate-family-set-resolved':'candidate-families-mismatch'};}
export function assessO12Log({text,...panelArgs}){const batch=parseO12Batch(text);return {assessment:assessO12({batch,panel:panelArgs}),batch};}
