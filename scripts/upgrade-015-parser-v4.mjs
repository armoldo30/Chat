import fs from 'node:fs';
const path='src/parser.js';
let s=fs.readFileSync(path,'utf8');
if(s.includes('function blockRoots(v)')){console.log('Parser v4 repeated-block migration already applied.');process.exit(0);}
const itemsEnd=`function items(v){\n  if(Array.isArray(v))return v.map(String);\n  if(v&&typeof v==='object'&&Array.isArray(v.__items))return v.__items.map(String);\n  if(typeof v==='string')return [v];\n  return [];\n}\n`;
if(!s.includes(itemsEnd))throw new Error('parser v4: items helper pattern not found');
s=s.replace(itemsEnd,itemsEnd+`\nfunction blockRoots(v){return (Array.isArray(v)?v:[v]).map(obj).filter(root=>Object.keys(root).length);}\n`);
s=s.replace(`export function extractSubUnits(parsed){\n  const root=obj(last(parsed?.sub_units)),out={};\n  for(const [id,raw0] of Object.entries(root)){`,`export function extractSubUnits(parsed){\n  const out={};\n  for(const root of blockRoots(parsed?.sub_units))for(const [id,raw0] of Object.entries(root)){`);
s=s.replace(`export function extractEquipment(parsed){\n  const root=obj(last(parsed?.equipments)),out={};\n  for(const [id,raw0] of Object.entries(root)){`,`export function extractEquipment(parsed){\n  const out={};\n  for(const root of blockRoots(parsed?.equipments))for(const [id,raw0] of Object.entries(root)){`);
const oldModules=`export function extractEquipmentModules(parsed){\n  let root=obj(last(parsed?.equipment_modules??parsed?.modules));\n  if(!Object.keys(root).length){\n    root={};\n    for(const [id,raw0] of Object.entries(parsed||{})){\n      const raw=obj(last(raw0));\n      if(raw.category&&(raw.add_stats||raw.multiply_stats||raw.add_average_stats||raw.build_cost_resources))root[id]=raw0;\n    }\n  }\n  const out={};\n  for(const [id,raw0] of Object.entries(root)){`;
const newModules=`export function extractEquipmentModules(parsed){\n  let roots=blockRoots(parsed?.equipment_modules??parsed?.modules);\n  if(!roots.length){\n    const root={};\n    for(const [id,raw0] of Object.entries(parsed||{})){\n      const raw=obj(last(raw0));\n      if(raw.category&&(raw.add_stats||raw.multiply_stats||raw.add_average_stats||raw.build_cost_resources))root[id]=raw0;\n    }\n    roots=Object.keys(root).length?[root]:[];\n  }\n  const out={};\n  for(const root of roots)for(const [id,raw0] of Object.entries(root)){`;
if(!s.includes(oldModules))throw new Error('parser v4: equipment_modules pattern not found');
s=s.replace(oldModules,newModules);
if(!s.includes('for(const root of blockRoots(parsed?.sub_units))')||!s.includes('for(const root of blockRoots(parsed?.equipments))')||!s.includes('for(const root of roots)for(const [id,raw0] of Object.entries(root))'))throw new Error('parser v4 migration validation failed');
fs.writeFileSync(path,s);
console.log('Parser v4: repeated Clausewitz blocks are merged.');
