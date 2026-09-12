import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORACLE_SCHEMA_VERSION, validateOracleCapture } from '../src/oracle.js';

export const O1_PREFIX='[WPO1]';
export const O1_BISECTIONS=14;
export const O1_INTERVAL_PCT=100/(2**O1_BISECTIONS);
export const O1_MIDPOINT_MAX_ERROR_PCT=O1_INTERVAL_PCT/2;

function finiteToken(value){
  if(value===undefined||value===null)return null;
  const n=Number(String(value).replace(',','.'));
  return Number.isFinite(n)?n:null;
}

function keyValues(text){
  const out={};
  for(const match of text.matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))out[match[1]]=match[2];
  return out;
}

function measurement(fields,lineNumber){
  const orgLow=finiteToken(fields.orgLow),orgHigh=finiteToken(fields.orgHigh);
  const strengthLow=finiteToken(fields.strengthLow),strengthHigh=finiteToken(fields.strengthHigh);
  const values={orgLow,orgHigh,strengthLow,strengthHigh};
  for(const [key,value] of Object.entries(values)){
    if(value===null)throw new Error(`line ${lineNumber}: ${key} is not a finite number`);
    if(value<0||value>1)throw new Error(`line ${lineNumber}: ${key} must be within 0..1`);
  }
  if(orgLow>orgHigh)throw new Error(`line ${lineNumber}: organization lower bound exceeds upper bound`);
  if(strengthLow>strengthHigh)throw new Error(`line ${lineNumber}: strength lower bound exceeds upper bound`);
  return {...values,lineNumber};
}

export function parseOracleRuns(text){
  const runs=[];
  let run=null,current=null;
  const lines=String(text??'').split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const marker=lines[i].indexOf(O1_PREFIX);
    if(marker<0)continue;
    const payload=lines[i].slice(marker+O1_PREFIX.length).trim();
    const firstSpace=payload.indexOf(' ');
    const type=(firstSpace<0?payload:payload.slice(0,firstSpace)).trim();
    const rest=firstSpace<0?'':payload.slice(firstSpace+1);
    const fields=keyValues(rest);
    const lineNumber=i+1;

    if(type==='BEGIN'){
      run={begin:fields,beginLine:lineNumber,samples:[],end:null};
      runs.push(run);current=null;continue;
    }
    if(!run)continue;

    if(type==='SAMPLE'){
      const hour=finiteToken(fields.hour);
      if(hour===null)throw new Error(`line ${lineNumber}: SAMPLE hour is not finite`);
      current={hour,attackers:[],defenders:[],lineNumber};
      run.samples.push(current);continue;
    }
    if(type==='ATTACKER'||type==='DEFENDER'){
      if(!current)throw new Error(`line ${lineNumber}: ${type} appeared before SAMPLE`);
      const value=measurement(fields,lineNumber);
      if(type==='ATTACKER')current.attackers.push(value);else current.defenders.push(value);
      continue;
    }
    if(type==='END'){
      run.end={...fields,lineNumber};current=null;continue;
    }
    if(type==='STATUS')run.status={...fields,lineNumber};
  }
  return runs;
}

function midpointPct(low,high){return (low+high)*50;}

export function oracleCaptureFromRun(run){
  if(!run||typeof run!=='object')throw new Error('Oracle run is required');
  if(!run.end)throw new Error('Oracle run is incomplete: END marker is missing');
  if(Number(run.begin?.schema)!==ORACLE_SCHEMA_VERSION)throw new Error(`Unsupported WPO1 schema ${run.begin?.schema??'missing'}`);
  for(const key of ['scenario','gameVersion','checksum'])if(!run.begin?.[key])throw new Error(`BEGIN ${key} is required`);
  if(!run.samples?.length)throw new Error('Oracle run contains no SAMPLE records');

  let previous=-Infinity;
  const samples=run.samples.map(sample=>{
    if(sample.hour<=previous)throw new Error(`sample hour ${sample.hour} is not strictly increasing`);
    previous=sample.hour;
    if(sample.attackers.length!==1)throw new Error(`hour ${sample.hour}: expected exactly 1 ATTACKER division, found ${sample.attackers.length}`);
    if(sample.defenders.length!==1)throw new Error(`hour ${sample.hour}: expected exactly 1 DEFENDER division, found ${sample.defenders.length}`);
    const a=sample.attackers[0],d=sample.defenders[0];
    return {
      hour:sample.hour,
      attacker:{org:midpointPct(a.orgLow,a.orgHigh),strength:midpointPct(a.strengthLow,a.strengthHigh)},
      defender:{org:midpointPct(d.orgLow,d.orgHigh),strength:midpointPct(d.strengthLow,d.strengthHigh)},
    };
  });

  const capture={
    schemaVersion:ORACLE_SCHEMA_VERSION,
    metadata:{
      gameVersion:run.begin.gameVersion,
      checksum:run.begin.checksum,
      scenarioId:run.begin.scenario,
      captureMethod:run.begin.method||'unknown',
      measurementBisections:O1_BISECTIONS,
      measurementIntervalPct:O1_INTERVAL_PCT,
      measurementMidpointMaxErrorPct:O1_MIDPOINT_MAX_ERROR_PCT,
      endReason:run.end.reason||'unknown',
      source:'HOI4 game.log [WPO1]',
    },
    samples,
  };
  const validation=validateOracleCapture(capture);
  if(!validation.ok)throw new Error(`Generated Oracle capture failed schema validation: ${validation.errors.join('; ')}`);
  return capture;
}

export function parseOracleLog(text){
  const complete=parseOracleRuns(text).filter(run=>run.end);
  if(!complete.length)throw new Error('No complete [WPO1] run found in log');
  return oracleCaptureFromRun(complete.at(-1));
}

async function cli(){
  const [, ,input,output]=process.argv;
  if(!input){
    console.error('Usage: node scripts/oracle-log-to-capture.mjs <game.log> [output.json]');
    process.exitCode=2;return;
  }
  try{
    const text=await fs.readFile(input,'utf8');
    const capture=parseOracleLog(text);
    const json=JSON.stringify(capture,null,2)+'\n';
    if(output){
      await fs.writeFile(output,json,'utf8');
      console.log(`Wrote ${capture.samples.length} Oracle samples to ${output}`);
    }else process.stdout.write(json);
  }catch(error){
    console.error(`Oracle log conversion failed: ${error.message}`);
    process.exitCode=1;
  }
}

const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();
