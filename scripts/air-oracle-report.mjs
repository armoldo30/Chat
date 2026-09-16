import fs from 'node:fs';
import {airOracleEvidenceClass,compareAirOracleCapture,validateAirOracleCapture} from '../src/air-oracle.js';

const [capturePath,plannerPath,policyPath]=process.argv.slice(2);
if(!capturePath||!plannerPath){
  console.error('Usage: node scripts/air-oracle-report.mjs <capture.json> <planner-comparison.json> [policy.json]');
  process.exit(2);
}
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const capture=read(capturePath),planner=read(plannerPath),policy=policyPath?read(policyPath):{};
const validation=validateAirOracleCapture(capture);
if(!validation.ok){
  console.error(JSON.stringify({ok:false,errors:validation.errors},null,2));
  process.exit(1);
}
const result=compareAirOracleCapture(capture,planner,policy);
console.log(JSON.stringify({ok:true,evidenceClass:airOracleEvidenceClass(result),...result},null,2));
process.exit(result.pass===false?1:0);
