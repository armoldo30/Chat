-- HOI4 War Planner Oracle O10 zero-defense hit-gate control.
-- NOT vanilla balance data.
--
-- Same hit gates as O8:
-- defended points are forced to miss; undefended points are forced to hit.
-- POL Defense is separately driven to zero, so every generated GER attack
-- point should travel through the undefended branch.

NDefines.NMilitary.BASE_CHANCE_TO_AVOID_HIT = 100
NDefines.NMilitary.CHANCE_TO_AVOID_HIT_AT_NO_DEF = 0
NDefines.NMilitary.LAND_COMBAT_ORG_DICE_SIZE = 1
NDefines.NMilitary.LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE = 1
NDefines.NMilitary.LAND_COMBAT_STR_DAMAGE_MODIFIER = 0
NDefines.NMilitary.BASE_NIGHT_ATTACK_PENALTY = 0
