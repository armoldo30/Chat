const norm=value=>String(value||'').toLowerCase().replace(/-/g,'_');

export function sourceIconHint(value='',label='',context='',slot=''){
  const id=norm(value),shown=String(label||''),where=String(slot||'');
  if(context==='armor'){
    if(/^tank_anti_air_cannon(?:_\d+)?$/.test(id))return `${shown} Tank Anti-Air Gun`;
    if(/^tank_auto_cannon(?:_\d+)?$/.test(id))return `${shown} Small Cannon Autocannon`;
    if(/^tank_close_support_gun$/.test(id))return `${shown} Close Support Gun`;
    if(/^tank_high_velocity_cannon(?:_\d+)?$/.test(id))return `${shown} High Velocity Cannon`;
    if(/^tank_small_cannon(?:_\d+)?$/.test(id))return `${shown} Small Cannon`;
    if(/^tank_medium_cannon(?:_\d+)?$/.test(id))return `${shown} Medium Cannon`;
    if(/^tank_heavy_cannon(?:_\d+)?$/.test(id))return `${shown} Heavy Cannon`;
    if(/^tank_super_heavy_cannon(?:_\d+)?$/.test(id))return `${shown} Heavy Cannon Super Heavy`;
    if(/^tank_(?:medium|heavy)_howitzer(?:_\d+)?$/.test(id))return `${shown} Tank Howitzer`;
    if(/^tank_rocket_launcher(?:_\d+)?$/.test(id))return `${shown} Rocket Artillery`;
    if(/^tank_heavy_machine_gun$/.test(id))return `${shown} Heavy Machine Gun Tank Gun`;
    if(/fixed_superstructure_turret$/.test(id))return `${shown} Fixed Superstructure`;
    if(/one_man_tank_turret$/.test(id))return `${shown} One Man Turret`;
    if(/two_man_tank_turret$/.test(id))return `${shown} Two Man Turret`;
    if(/three_man_tank_turret$/.test(id))return `${shown} Three Man Turret`;
    if(/four_man_tank_turret$/.test(id))return `${shown} Three Man Turret Four Crew`;
    if(id==='tank_bogie_suspension')return `${shown} Bogie Suspension`;
    if(id==='tank_christie_suspension')return `${shown} Christie Suspension`;
    if(id==='tank_torsion_bar_suspension')return `${shown} Torsion Suspension`;
    if(id==='tank_interleaved_suspension')return `${shown} Interleaved Suspension`;
    if(id==='tank_half_track_suspension')return `${shown} Christie Suspension Half Track`;
    if(id==='tank_wheeled_suspension')return `${shown} Bogie Suspension Wheeled`;
    if(id==='tank_riveted_armor')return `${shown} Riveted Armor`;
    if(id==='tank_welded_armor')return `${shown} Welded Armor`;
    if(id==='tank_cast_armor')return `${shown} Cast Armor`;
    if(id==='tank_gasoline_engine')return `${shown} Gasoline Engine`;
    if(id==='tank_diesel_engine')return `${shown} Diesel Engine`;
    if(id==='tank_petrol_electric_engine')return `${shown} Petrol Electric Engine`;
    if(id==='tank_gas_turbine_engine')return `${shown} Gasoline Engine Turbine`;
    if(/^tank_radio_\d+$/.test(id))return `${shown} Tank Radio Module`;
    if(id==='sloped_armor'||id==='armor_skirts')return `${shown} Sloped Armor`;
    if(id==='wet_ammo_storage'||id==='extra_ammo_storage')return `${shown} Wet Ammo Storage`;
    if(id==='easy_maintenance')return `${shown} Easy Maintenance`;
    if(id==='additional_machine_guns')return `${shown} Additional Machine Guns`;
    if(id==='smoke_launchers')return `${shown} Smoke Launcher`;
    if(id==='stabilizer'||id==='auto_loader')return `${shown} Stabilizer`;
    if(id==='dozer_blade')return `${shown} Engineer Dozer`;
    if(id==='expanded_fuel_tank')return `${shown} Extra Fuel Tank`;
    if(id==='squeezebore_adaptor')return `${shown} Anti Tank Adapter`;
    if(id==='amphibious_drive')return `${shown} Amphibious Tank Drive`;
    if(id==='flamethrower'||id==='advanced_flamethrower')return `${shown} Flame Tank Module`;
    if(id==='secondary_turret_hmg')return `${shown} Heavy Machine Gun Tank Turret`;
    if(id==='secondary_turret_small_cannon')return `${shown} Small Cannon Tank Turret`;
  }
  if(context==='air'){
    if(/^engine_\d+_\d+x$/.test(id))return `${shown} Propeller Engine Aircraft`;
    if(/^jet_engine_\d+x$/.test(id))return `${shown} Jet Engine Aircraft`;
    if(/^rocket_engine_\d+/.test(id))return `${shown} Rocket Engine Aircraft`;
    if(/^light_mg_\d+x$/.test(id))return `${shown} Light Machine Gun Aircraft`;
    if(/^heavy_mg_\d+x$/.test(id))return `${shown} Heavy Machine Gun Aircraft`;
    if(/^aircraft_cannon_\d+_\d+x$/.test(id))return `${shown} Aircraft Cannon`;
    if(id==='bomb_locks')return `${shown} Bomb Locks`;
    if(/bomb_bay/.test(id))return `${shown} Bomb Bay`;
    if(/torpedo/.test(id))return `${shown} Torpedo`;
    if(/rocket_rails?/.test(id))return `${shown} Rocket Artillery Aircraft`;
    if(/defense_turret/.test(id))return `${shown} Defensive Turret Aircraft`;
    if(/recon_camera/.test(id))return `${shown} Recon Camera Aircraft`;
    if(/radio_navigation/.test(id))return `${shown} Radio Navigation Aircraft`;
    if(/radar/.test(id))return `${shown} Radar Aircraft`;
    if(/drop_tanks?/.test(id))return `${shown} Drop Tank Aircraft`;
    if(/self_sealing_fuel_tanks/.test(id))return `${shown} Self Sealing Fuel Tanks Aircraft`;
    if(/armor_plate/.test(id))return `${shown} Armor Plate Aircraft`;
    if(/fuel_tanks/.test(id))return `${shown} Extra Fuel Tanks Aircraft`;
    if(/non_strategic_materials/.test(id))return `${shown} Non Strategic Materials Aircraft`;
    if(/floats?|flying_boat/.test(id))return `${shown} Scout Aircraft Floats`;
  }
  return `${shown} ${where}`.trim();
}
