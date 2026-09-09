import fs from 'node:fs';
const path='src/parser.js';
let s=fs.readFileSync(path,'utf8'),changes=0;
const replace=(from,to,label)=>{if(s.includes(to))return;if(!s.includes(from))throw new Error(`0.15 parser v3 pattern not found: ${label}`);s=s.replace(from,to);changes++;};

replace(
`      if(tokens[at]==='}'){
        if(expectClose)at++;
        break;
      }
      const key=tokens[at++];
      if(key==='{'||key==='=')continue;`,
`      if(tokens[at]==='}'){
        if(expectClose)at++;
        break;
      }
      // HOI4 uses anonymous object entries inside list blocks (notably doctrine milestones).
      // Preserve them as list items instead of discarding the opening brace.
      if(tokens[at]==='{'){at++;items.push(block(true));continue;}
      const key=tokens[at++];
      if(key==='=')continue;`,
'anonymous Clausewitz object lists');

replace(
`  if(Number.isFinite(mil.BASE_FORT_PENALTY)){combat.fortPenaltyPerLevel=Math.abs(mil.BASE_FORT_PENALTY);combatCount++;}
  combatCount+=set(combat,'orgDice',mil.LAND_COMBAT_ORG_DICE_SIZE);`,
`  if(Number.isFinite(mil.BASE_FORT_PENALTY)){combat.fortPenaltyPerLevel=Math.abs(mil.BASE_FORT_PENALTY);combatCount++;}
  if(Number.isFinite(mil.DIG_IN_FACTOR)){combat.entrenchmentPerPoint=Math.abs(mil.DIG_IN_FACTOR);combatCount++;}
  if(Number.isFinite(mil.ENEMY_AIR_SUPERIORITY_IMPACT)){combat.maxAirSuperiorityPenalty=Math.abs(mil.ENEMY_AIR_SUPERIORITY_IMPACT);combatCount++;}
  if(Number.isFinite(mil.BASE_NIGHT_ATTACK_PENALTY)){combat.nightAttackPenalty=Math.abs(mil.BASE_NIGHT_ATTACK_PENALTY);combatCount++;}
  combatCount+=set(combat,'orgDice',mil.LAND_COMBAT_ORG_DICE_SIZE);
  combatCount+=set(combat,'armoredOrgDice',mil.LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE);`,
'combat define coverage');

replace(
`  combatCount+=set(combat,'combatMinimumHours',mil.COMBAT_MINIMUM_TIME);
  const prod=pack?.defines?.NProduction||pack?.defines?.NMilitary||{};`,
`  combatCount+=set(combat,'combatMinimumHours',mil.COMBAT_MINIMUM_TIME);
  combatCount+=set(combat,'equipmentCombatLossFactor',mil.EQUIPMENT_COMBAT_LOSS_FACTOR);
  const prod=pack?.defines?.NProduction||pack?.defines?.NMilitary||{};`,
'equipment combat loss define');

replace(
`  if(Number.isFinite(prod.MAX_LINE_RESOURCE_PENALTY)){production.maxLineResourcePenalty=Math.abs(prod.MAX_LINE_RESOURCE_PENALTY)>1?Math.abs(prod.MAX_LINE_RESOURCE_PENALTY)/100:Math.abs(prod.MAX_LINE_RESOURCE_PENALTY);productionCount++;}
  return {combatCount,productionCount};`,
`  if(Number.isFinite(prod.MAX_LINE_RESOURCE_PENALTY)){production.maxLineResourcePenalty=Math.abs(prod.MAX_LINE_RESOURCE_PENALTY)>1?Math.abs(prod.MAX_LINE_RESOURCE_PENALTY)/100:Math.abs(prod.MAX_LINE_RESOURCE_PENALTY);productionCount++;}
  productionCount+=set(production,'maxMilitaryFactoriesPerLine',prod.MAX_MIL_FACTORIES_PER_LINE);
  return {combatCount,productionCount};`,
'production define coverage');

if(changes){fs.writeFileSync(path,s);console.log(`Applied ${changes} parser v3 migrations.`);}else console.log('0.15 parser v3 migration already applied.');
