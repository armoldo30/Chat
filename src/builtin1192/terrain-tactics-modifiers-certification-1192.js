// Final bounded Terrain / Tactics / Modifiers certification manifest; formula-dependent execution remains deferred.
export const TERRAIN_TACTICS_MODIFIERS_CERTIFICATION_1192={
  classification:'bounded-recovered-source',
  terrain:{
    sourceFiles:1,recordCount:8,consumedFieldSha256:'dadda3f1766da3dccaf36165fb35474c7f4951979b54fc182292ad24e5b556d0',
    fullRawSourceRetained:false,
    records:{
      desert:{id:'desert',width:70,reinforceWidth:35},
      forest:{id:'forest',width:60,reinforceWidth:30,attack:-0.15},
      hills:{id:'hills',width:70,reinforceWidth:35,attack:-0.25},
      jungle:{id:'jungle',width:60,reinforceWidth:30,attack:-0.30},
      marsh:{id:'marsh',width:50,reinforceWidth:25,attack:-0.40},
      mountain:{id:'mountain',width:50,reinforceWidth:25,attack:-0.50},
      plains:{id:'plains',width:70,reinforceWidth:35},
      urban:{id:'urban',width:80,reinforceWidth:40,attack:-0.30}
    }
  },
  tactics:{
    recordCount:55,rawRecordCount:55,rawSha256:'caec8a04d3bff8007fd2420a9b6a0410dc266179700d7df31c75dbc1fd03093e',
    ids:['tactic_ambush','tactic_assault','tactic_attacker_hb_attack','tactic_attacker_hb_rush','tactic_attacker_hb_storm','tactic_attacker_sb_hold','tactic_attacker_sb_skillful_defence','tactic_backhand_blow','tactic_banzai_charge','tactic_barrage','tactic_basic_attack','tactic_basic_defend','tactic_blitz','tactic_breakthrough','tactic_cc_attack','tactic_cc_defend','tactic_cc_local_strong_point','tactic_cc_storm','tactic_cc_withdraw','tactic_counterattack','tactic_defender_hb_hold','tactic_defender_hb_skillful_defence','tactic_defender_sb_assault','tactic_defender_sb_reckless_assault','tactic_defender_sb_retake_bridge','tactic_delay','tactic_elastic_defense','tactic_encirclement','tactic_grand_banzai_charge','tactic_guerrilla_tactics','tactic_hold_bridge','tactic_human_wave_tactics','tactic_infantry_charge','tactic_masterful_blitz','tactic_masterful_delay','tactic_overwhelming_fire','tactic_planned_attack','tactic_relentless_assault','tactic_seize_bridge','tactic_sf_ambush','tactic_sf_armor_supported_assault','tactic_sf_barrage','tactic_sf_defense','tactic_sf_fortify','tactic_sf_mouse_holing','tactic_sf_storm','tactic_shock','tactic_tactical_withdrawal','tactic_tw_attack','tactic_tw_chase','tactic_tw_defend','tactic_tw_evade','tactic_tw_intercept','tactic_unexpected_thrust','tactic_urban_defense'],
    topLevelFieldCounts:{active:38,attacker:49,attacker_movement_speed:15,attacker_org_damage_modifier:4,base:55,combat_width:24,countered_by:15,defender:45,defender_org_damage_modifier:4,display_phase:27,is_attacker:55,only_show_for:3,phase:9,picture:55,trigger:55}
  },
  modifierDefinitions:{
    recordCount:3,rawRecordCount:3,rawSha256:'6f19c3d9a73bd226a759371a68a228b34a9d0963b9ef3f89304dfa6f50316238',
    records:{
      operation_cost:{color_type:'bad',value_type:'percentage',precision:0,category:'intelligence_agency'},
      operation_infiltrate_outcome:{color_type:'good',value_type:'percentage',precision:0,category:'intelligence_agency'},
      operation_outcome:{color_type:'good',value_type:'percentage',precision:0,category:'intelligence_agency'}
    }
  }
};
export default TERRAIN_TACTICS_MODIFIERS_CERTIFICATION_1192;
