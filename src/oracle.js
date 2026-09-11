export const ORACLE_SCHEMA_VERSION = 1;

const DEFAULT_TOLERANCES = Object.freeze({
  orgPct: 0.25,
  strengthPct: 0.10,
  endHour: 1,
});

function finite(value){
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}

function metric(sample, side, key){
  const nested=sample?.[side]?.[key];
  if(nested!==undefined&&nested!==null)return finite(nested);
  const prefix=side==='attacker'?'a':'d';
  if(key==='org')return finite(sample?.[`${prefix}Org`]);
  if(key==='strength')return finite(sample?.[`${prefix}Strength`]);
  return null;
}

function normalizeSample(sample){
  const hour=finite(sample?.hour);
  const aOrg=metric(sample,'attacker','org');
  const dOrg=metric(sample,'defender','org');
  const aStrength=metric(sample,'attacker','strength');
  const dStrength=metric(sample,'defender','strength');
  if(hour===null||aOrg===null||dOrg===null||aStrength===null||dStrength===null)return null;
  return {hour,aOrg,dOrg,aStrength,dStrength};
}

export function validateOracleCapture(capture){
  const errors=[];
  if(!capture||typeof capture!=='object')return {ok:false,errors:['capture must be an object']};
  if(Number(capture.schemaVersion)!==ORACLE_SCHEMA_VERSION)errors.push(`schemaVersion must be ${ORACLE_SCHEMA_VERSION}`);
  if(!capture.metadata||typeof capture.metadata!=='object')errors.push('metadata is required');
  for(const key of ['gameVersion','checksum','scenarioId'])if(!capture.metadata?.[key])errors.push(`metadata.${key} is required`);
  if(!Array.isArray(capture.samples)||!capture.samples.length)errors.push('samples must contain at least one observation');
  else{
    let last=-Infinity;
    capture.samples.forEach((sample,index)=>{
      const normalized=normalizeSample(sample);
      if(!normalized)errors.push(`samples[${index}] must contain finite hour/org/strength observations for both sides`);
      else if(normalized.hour<=last)errors.push(`samples[${index}].hour must be strictly increasing`);
      else last=normalized.hour;
    });
  }
  return {ok:errors.length===0,errors};
}

export function plannerTimelineToOracleSamples(simulation){
  return (simulation?.timeline||[]).map(normalizeSample).filter(Boolean);
}

function mean(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;}

export function compareOracleTrace(capture,simulation,tolerances={}){
  const validation=validateOracleCapture(capture);
  if(!validation.ok)throw new Error(`Invalid oracle capture: ${validation.errors.join('; ')}`);
  const limits={...DEFAULT_TOLERANCES,...tolerances};
  const oracle=capture.samples.map(normalizeSample);
  const planner=plannerTimelineToOracleSamples(simulation);
  const plannerByHour=new Map(planner.map(x=>[x.hour,x]));
  const rows=[];
  let firstDivergence=null;
  for(const expected of oracle){
    const actual=plannerByHour.get(expected.hour);
    if(!actual){
      const row={hour:expected.hour,missing:true};rows.push(row);
      if(!firstDivergence)firstDivergence={hour:expected.hour,reason:'missing planner sample'};
      continue;
    }
    const errors={
      aOrg:Math.abs(actual.aOrg-expected.aOrg),
      dOrg:Math.abs(actual.dOrg-expected.dOrg),
      aStrength:Math.abs(actual.aStrength-expected.aStrength),
      dStrength:Math.abs(actual.dStrength-expected.dStrength),
    };
    const divergent=errors.aOrg>limits.orgPct||errors.dOrg>limits.orgPct||errors.aStrength>limits.strengthPct||errors.dStrength>limits.strengthPct;
    rows.push({hour:expected.hour,missing:false,expected,actual,errors,divergent});
    if(divergent&&!firstDivergence)firstDivergence={hour:expected.hour,reason:'metric tolerance exceeded',errors};
  }
  const present=rows.filter(x=>!x.missing);
  const metricErrors={
    aOrg:present.map(x=>x.errors.aOrg),dOrg:present.map(x=>x.errors.dOrg),
    aStrength:present.map(x=>x.errors.aStrength),dStrength:present.map(x=>x.errors.dStrength),
  };
  const summary={};
  for(const [key,values] of Object.entries(metricErrors))summary[key]={meanAbs:mean(values),maxAbs:values.length?Math.max(...values):null};
  const oracleEnd=oracle.at(-1)?.hour??0,plannerEnd=planner.at(-1)?.hour??0;
  const endHourError=Math.abs(plannerEnd-oracleEnd);
  if(endHourError>limits.endHour&&!firstDivergence)firstDivergence={hour:Math.min(oracleEnd,plannerEnd),reason:'battle duration tolerance exceeded',endHourError};
  return {
    pass:firstDivergence===null,
    scenarioId:capture.metadata.scenarioId,
    matchedSamples:present.length,
    oracleSamples:oracle.length,
    plannerSamples:planner.length,
    tolerances:limits,
    endHourError,
    firstDivergence,
    summary,
    rows,
  };
}

export function oracleEvidenceClass(result){
  if(!result||typeof result!=='object')return 'unvalidated';
  return result.pass?'oracle-validated':'oracle-divergent';
}
