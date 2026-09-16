// Mission-specific Air detection doctrine modifiers are source-backed, while the
// Air Lab's absolute detection baseline remains an explicit user input. This
// helper only resolves the relative source modifier for a mission already
// modeled by the Lab; it does not construct regional detection from game state.

let DOCTRINES=null;

export function configureAirDoctrineDetectionPack(pack){
  DOCTRINES=pack?.doctrines&&typeof pack.doctrines==='object'?pack.doctrines:null;
}

const DETECTION_FIELD_BY_MISSION={air_superiority:'air_superiority_detect_factor'};
const number=value=>Number.isFinite(Number(value))?Number(value):0;

function addNodeField(total,node,field){
  return total+number(node?.[field]);
}

export function airDoctrineDetectionFactor(design,mission='air_superiority'){
  const field=DETECTION_FIELD_BY_MISSION[mission];
  const fx=design?.doctrineEffects,state=fx?.state;
  if(!field||fx?.source!=='game-pack'||!state||!DOCTRINES)return 0;

  let total=0;
  for(const id of fx.used||[]){
    const doc=DOCTRINES[id];
    if(!doc?.raw)continue;
    total=addNodeField(total,doc.raw,field);

    if(doc.kind==='subdoctrine'){
      const mastery=Math.max(0,Math.min(5,Math.floor(number(state.tracks?.[doc.track]?.mastery))));
      const rewards=Object.values(doc.raw.rewards||{});
      for(let i=0;i<Math.min(mastery,rewards.length);i++)total=addNodeField(total,rewards[i],field);
      continue;
    }

    if(doc.kind==='grand'){
      const order=Array.isArray(doc.tracks)&&doc.tracks.length?doc.tracks:(Array.isArray(doc.raw.tracks)?doc.raw.tracks:[]);
      const milestones=Array.isArray(doc.raw.milestones)?doc.raw.milestones:[];
      for(let i=0;i<order.length;i++)if(number(state.tracks?.[order[i]]?.mastery)>=5)total=addNodeField(total,milestones[i],field);
    }
  }
  return total;
}

export const AIR_DOCTRINE_DETECTION_EVIDENCE_1192=Object.freeze({
  sourceFields:['air_superiority_detect_factor'],
  appliedMissions:['air_superiority'],
  evidenceClass:'game-file-exact-source-modifier/executable-inferred-application',
  absoluteDetection:'explicit-input',
  deferred:['air_interception_detect_factor','regional detection construction','weather/night detection construction']
});
