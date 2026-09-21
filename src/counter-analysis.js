export function economicBurden(baselineIC,candidateIC){
  const baseline=Math.max(0,Number(baselineIC)||0),candidate=Math.max(0,Number(candidateIC)||0),delta=candidate-baseline;
  return {baselineIC:baseline,candidateIC:candidate,delta,pct:baseline>0?delta/baseline*100:0};
}
