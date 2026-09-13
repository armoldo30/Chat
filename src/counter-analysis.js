export function economicBurden(baselineIC,candidateIC,baseFactories=30,divisionCount=24){
  const base=Math.max(0,Number(baselineIC)||0);
  const candidate=Math.max(0,Number(candidateIC)||0);
  const factories=Math.max(0,Number(baseFactories)||0);
  const divisions=Math.max(1,Math.floor(Number(divisionCount)||1));
  const delta=candidate-base;
  const pct=base>0?delta/base*100:0;
  const extraFactories=delta>0&&base>0?Math.ceil(factories*delta/base):0;
  return {baselineIC:base,candidateIC:candidate,delta,pct,extraFactories,divisionCount:divisions,totalDelta:delta*divisions,baseFactories:factories};
}
