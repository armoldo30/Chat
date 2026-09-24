import assert from 'node:assert/strict';
import {sampleAttackPoints} from '../src/engine.js';

function gridCounts(attack,steps=10000){
  const counts=new Map();
  for(let i=0;i<steps;i++){
    const u=(i+.5)/steps;
    const n=sampleAttackPoints(attack,()=>u);
    counts.set(n,(counts.get(n)||0)+1);
  }
  return Object.fromEntries([...counts.entries()].sort((a,b)=>a[0]-b[0]));
}
function chi2(observed,expected){
  let x=0;
  for(const [k,e] of Object.entries(expected))x+=(observed[k]-e)**2/e;
  return x;
}

// O7 exact center: round(2 + U[-1,+1]) => 25% / 50% / 25%.
assert.deepEqual(gridCounts(20),{'1':2500,'2':5000,'3':2500});

// O6 replay: the same law naturally permits the tails that rejected the old Bernoulli sampler.
assert.deepEqual(gridCounts(12),{'0':1500,'1':5000,'2':3500});
assert.deepEqual(gridCounts(18),{'1':3500,'2':5000,'3':1500});

// O3 replay: sub-10 attack still has positive support while retaining a zero outcome.
const sub10=gridCounts(9);
assert.ok((sub10['1']||0)>0);
assert.ok((sub10['2']||0)>0);
assert.ok((sub10['0']||0)>0);

// O5 exact center retains two main multiplicities at 15 attack.
assert.deepEqual(gridCounts(15),{'1':5000,'2':5000});

// Executable O6 observations remain statistically compatible with the wider law.
const o6Low={0:9,1:20,2:11};
const o6High={1:17,2:20,3:3};
assert.ok(chi2(o6Low,{0:6,1:20,2:14})<9.21034);
assert.ok(chi2(o6High,{1:14,2:20,3:6})<9.21034);

// Executable O7 observation: 18 / 33 / 9 versus 15 / 30 / 15 => chi-square 3.3.
const o7={1:18,2:33,3:9};
assert.ok(Math.abs(chi2(o7,{1:15,2:30,3:15})-3.3)<1e-12);
assert.ok(chi2(o7,{1:15,2:30,3:15})<9.21034);

console.log('Oracle O7 engine integration/replay regression passed.');
