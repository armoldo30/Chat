export const AIR_ORACLE_SCHEMA_VERSION=1;

const finite=value=>{const n=Number(value);return Number.isFinite(n)?n:null;};
const nonNegative=value=>{const n=finite(value);return n!==null&&n>=0?n:null;};
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
const sampleStdDev=values=>{
  if(values.length<2)return 0;
  const m=mean(values),variance=values.reduce((sum,value)=>sum+(value-m)**2,0)/(values.length-1);
  return Math.sqrt(variance);
};
const relativeError=(actual,expected)=>{
  if(!Number.isFinite(actual)||!Number.isFinite(expected))return actual===expected?0:Infinity;
  const denominator=Math.abs(expected);
  if(denominator===0)return Math.abs(actual)===0?0:Infinity;
  return Math.abs(actual-expected)/denominator;
};

export function validateAirOracleCapture(capture){
  const errors=[];
  if(!capture||typeof capture!=='object')return {ok:false,errors:['capture must be an object']};
  if(Number(capture.schemaVersion)!==AIR_ORACLE_SCHEMA_VERSION)errors.push(`schemaVersion must be ${AIR_ORACLE_SCHEMA_VERSION}`);
  if(!capture.metadata||typeof capture.metadata!=='object')errors.push('metadata is required');
  for(const key of ['gameVersion','checksum','scenarioId'])if(!capture.metadata?.[key])errors.push(`metadata.${key} is required`);
  if(!capture.controlled||typeof capture.controlled!=='object')errors.push('controlled is required');
  else{
    if(!capture.controlled.mission)errors.push('controlled.mission is required');
    for(const key of ['countA','countB']){
      const n=nonNegative(capture.controlled[key]);
      if(n===null||n<=0)errors.push(`controlled.${key} must be a positive finite number`);
    }
  }
  if(!Array.isArray(capture.trials)||!capture.trials.length)errors.push('trials must contain at least one observation');
  else{
    const countA=nonNegative(capture.controlled?.countA),countB=nonNegative(capture.controlled?.countB),ids=new Set();
    capture.trials.forEach((trial,index)=>{
      const lossA=nonNegative(trial?.lossA),lossB=nonNegative(trial?.lossB);
      if(lossA===null||lossB===null)errors.push(`trials[${index}] must contain finite non-negative lossA/lossB`);
      if(countA!==null&&lossA!==null&&lossA>countA)errors.push(`trials[${index}].lossA cannot exceed controlled.countA`);
      if(countB!==null&&lossB!==null&&lossB>countB)errors.push(`trials[${index}].lossB cannot exceed controlled.countB`);
      if(trial?.trialId!==undefined&&trial?.trialId!==null){
        const id=String(trial.trialId);
        if(ids.has(id))errors.push(`trials[${index}].trialId must be unique`);else ids.add(id);
      }
      for(const key of ['windowHours','sortiesA','sortiesB'])if(trial?.[key]!==undefined&&nonNegative(trial[key])===null)errors.push(`trials[${index}].${key} must be finite and non-negative when supplied`);
    });
  }
  return {ok:errors.length===0,errors};
}

export function summarizeAirOracleCapture(capture){
  const validation=validateAirOracleCapture(capture);
  if(!validation.ok)throw new Error(`Invalid Air oracle capture: ${validation.errors.join('; ')}`);
  const lossA=capture.trials.map(trial=>Number(trial.lossA)),lossB=capture.trials.map(trial=>Number(trial.lossB));
  const summarize=values=>({mean:mean(values),sampleStdDev:sampleStdDev(values),min:Math.min(...values),max:Math.max(...values)});
  const a=summarize(lossA),b=summarize(lossB),exchangeRatio=a.mean>0?b.mean/a.mean:(b.mean>0?Infinity:1);
  return {trialCount:capture.trials.length,lossA:a,lossB:b,exchangeRatio};
}

export function compareAirOracleCapture(capture,plannerComparison,policy={}){
  const observed=summarizeAirOracleCapture(capture);
  const predictedLossA=nonNegative(plannerComparison?.lossA),predictedLossB=nonNegative(plannerComparison?.lossB);
  if(predictedLossA===null||predictedLossB===null)throw new Error('plannerComparison must contain finite non-negative lossA/lossB');
  const predictedExchange=predictedLossA>0?predictedLossB/predictedLossA:(predictedLossB>0?Infinity:1);
  const metrics={
    lossA:{predicted:predictedLossA,observed:observed.lossA.mean,absError:Math.abs(predictedLossA-observed.lossA.mean),relativeError:relativeError(predictedLossA,observed.lossA.mean)},
    lossB:{predicted:predictedLossB,observed:observed.lossB.mean,absError:Math.abs(predictedLossB-observed.lossB.mean),relativeError:relativeError(predictedLossB,observed.lossB.mean)},
    exchangeRatio:{predicted:predictedExchange,observed:observed.exchangeRatio,relativeError:relativeError(predictedExchange,observed.exchangeRatio)},
  };

  const minTrials=Number.isFinite(Number(policy.minTrials))&&Number(policy.minTrials)>0?Number(policy.minTrials):null;
  const threshold=value=>value!==undefined&&value!==null&&Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
  const thresholds={
    maxMeanLossAbs:threshold(policy.maxMeanLossAbs),
    maxMeanLossRel:threshold(policy.maxMeanLossRel),
    maxExchangeRatioRel:threshold(policy.maxExchangeRatioRel),
  };
  const hasMetricThreshold=Object.values(thresholds).some(value=>value!==null);
  const eligible=minTrials!==null&&hasMetricThreshold&&observed.trialCount>=minTrials;
  const failures=[];
  if(minTrials!==null&&observed.trialCount<minTrials)failures.push({reason:'insufficient trials',actual:observed.trialCount,required:minTrials});
  if(eligible){
    if(thresholds.maxMeanLossAbs!==null){
      if(metrics.lossA.absError>thresholds.maxMeanLossAbs)failures.push({reason:'lossA mean absolute error',actual:metrics.lossA.absError,limit:thresholds.maxMeanLossAbs});
      if(metrics.lossB.absError>thresholds.maxMeanLossAbs)failures.push({reason:'lossB mean absolute error',actual:metrics.lossB.absError,limit:thresholds.maxMeanLossAbs});
    }
    if(thresholds.maxMeanLossRel!==null){
      if(metrics.lossA.relativeError>thresholds.maxMeanLossRel)failures.push({reason:'lossA mean relative error',actual:metrics.lossA.relativeError,limit:thresholds.maxMeanLossRel});
      if(metrics.lossB.relativeError>thresholds.maxMeanLossRel)failures.push({reason:'lossB mean relative error',actual:metrics.lossB.relativeError,limit:thresholds.maxMeanLossRel});
    }
    if(thresholds.maxExchangeRatioRel!==null&&metrics.exchangeRatio.relativeError>thresholds.maxExchangeRatioRel)failures.push({reason:'exchange-ratio relative error',actual:metrics.exchangeRatio.relativeError,limit:thresholds.maxExchangeRatioRel});
  }
  const pass=eligible?failures.length===0:null;
  return {
    pass,
    scenarioId:capture.metadata.scenarioId,
    gameVersion:capture.metadata.gameVersion,
    checksum:capture.metadata.checksum,
    trialCount:observed.trialCount,
    observed,
    predicted:{lossA:predictedLossA,lossB:predictedLossB,exchangeRatio:predictedExchange},
    metrics,
    policy:{minTrials,...thresholds},
    eligible,
    failures,
    distributionComparable:false,
    note:'The current Air model predicts expected losses, not a stochastic loss distribution. Per-trial variance is retained for future distribution-level validation.',
  };
}

export function airOracleEvidenceClass(result){
  if(!result||result.pass===null||result.pass===undefined)return 'unvalidated';
  return result.pass?'oracle-validated':'oracle-divergent';
}
