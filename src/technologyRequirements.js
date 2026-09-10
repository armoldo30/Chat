const clone=v=>v===undefined?undefined:structuredClone(v);
const uniq=v=>[...new Set(v||[])];

export function technologyRequirementReport(pack,technologyId,selectedTechnologyIds=[]){
  const id=String(technologyId||'').trim(),technology=pack?.technologies?.[id]||null,selected=new Set((selectedTechnologyIds||[]).map(x=>String(x||'').trim()).filter(Boolean));
  if(!technology)return {id,known:false,selectable:true,classification:'informational-only',requiredTechnologies:[],missingTechnologies:[],xor:[],xorConflicts:[],allow:null,allowBranch:null};
  const dependencyIds=Object.keys(technology.dependencies||{}),pathIds=technology.pathPrerequisites||technology.requirements?.path||[];
  const requiredTechnologies=uniq([...pathIds,...dependencyIds]);
  const xor=uniq(technology.xor||technology.requirements?.xor||[]),xorConflicts=xor.filter(other=>selected.has(other));
  return {
    id,known:true,selectable:true,classification:'informational-only',
    sourceFile:technology.sourceFile||'',
    requiredTechnologies,
    missingTechnologies:requiredTechnologies.filter(required=>!selected.has(required)),
    dependencies:clone(technology.dependencies||{}),
    pathPrerequisites:[...pathIds],
    xor,xorConflicts,
    allow:clone(technology.requirements?.allow??null),
    allowBranch:clone(technology.requirements?.allowBranch??null),
    specialProjectSpecializations:[...(technology.specialProjectSpecializations||[])],
    isSpecialProjectTech:technology.isSpecialProjectTech===true
  };
}

export function technologySelectionRequirementReport(pack,technologyIds=[]){
  const selected=uniq((technologyIds||[]).map(x=>String(x||'').trim()).filter(Boolean));
  return {selected,reports:selected.map(id=>technologyRequirementReport(pack,id,selected)),classification:'informational-only',selectable:true};
}
