-- HOI4 War Planner Oracle O8 defense-point integerization diagnostic.
-- NOT vanilla balance data. Remove before ordinary Oracle scenarios.
--
-- Defended points are forced to miss and undefended points to hit, so fixed-die
-- defender organization loss directly exposes the count of attack points that
-- exceed defense points.

NDefines.NMilitary.BASE_CHANCE_TO_AVOID_HIT = 100
NDefines.NMilitary.CHANCE_TO_AVOID_HIT_AT_NO_DEF = 0
NDefines.NMilitary.LAND_COMBAT_ORG_DICE_SIZE = 1
NDefines.NMilitary.LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE = 1
NDefines.NMilitary.LAND_COMBAT_STR_DAMAGE_MODIFIER = 0
NDefines.NMilitary.BASE_NIGHT_ATTACK_PENALTY = 0
