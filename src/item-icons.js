import { iconSvg, visualKind } from './ui-labels.js';

const common='viewBox="0 0 48 48" aria-hidden="true" focusable="false"';
const svg=body=>`<svg ${common}>${body}</svg>`;

const ICON={
  empty:svg('<path d="M12 24h24"/><path d="M24 12v24" opacity=".28"/>'),
  infantry:svg('<circle cx="17" cy="9" r="4"/><path d="M17 13v16M17 20l-8 7M17 20l8 7M17 29l-6 12M17 29l8 12M30 11l7 31"/>'),
  motorized:svg('<path d="M5 18h23v16H5zM28 24h8l7 7v3H28z"/><circle cx="13" cy="37" r="4"/><circle cx="35" cy="37" r="4"/><path d="M10 23h12"/>'),
  mechanized:svg('<path d="M5 18h30l8 10v7H5zM11 18l4-7h14l7 7M10 35h29"/><circle cx="13" cy="38" r="3"/><circle cx="23" cy="38" r="3"/><circle cx="33" cy="38" r="3"/>'),
  cavalry:svg('<path d="M11 34c6-3 10-9 13-18 4 5 8 7 13 7l4 8-7 10M15 34l-4 8M28 31l3 11M21 16l-4-7M30 17l4-5"/><circle cx="14" cy="11" r="3"/>'),
  mountaineer:svg('<path d="M4 40 18 14l7 12 6-9 13 23zM14 22l4 5 4-4M28 40l5-10 4 6"/>'),
  marine:svg('<path d="M24 6v28M16 14h16M13 34c5 7 17 7 22 0M8 31h8M32 31h8"/><circle cx="24" cy="9" r="3"/>'),
  paratrooper:svg('<path d="M7 17c5-12 29-12 34 0-5-3-9-3-13 0-3-3-6-3-9 0-4-3-8-3-12 0zM11 17l10 13M37 17 27 30M24 17v13"/><circle cx="24" cy="34" r="3"/><path d="M24 37v7"/>'),
  engineer:svg('<path d="M9 38 21 26M16 31l-6-6 6-6 6 6M26 11l11 11M31 8l9 9M24 28l14 14"/>'),
  recon:svg('<circle cx="20" cy="20" r="10"/><path d="M27 27l12 12M15 20h10M20 15v10"/>'),
  logistics:svg('<path d="M5 18h23v16H5zM28 24h8l7 7v3H28z"/><circle cx="13" cy="37" r="3"/><circle cx="35" cy="37" r="3"/><path d="M10 23h12M16 18v16"/>'),
  signal:svg('<path d="M24 42V18M17 42h14M10 18c4-5 8-7 14-7s10 2 14 7M5 12C10 6 16 3 24 3s14 3 19 9"/><circle cx="24" cy="18" r="3"/>'),
  hospital:svg('<path d="M8 12h32v28H8zM24 17v18M15 26h18"/>'),
  maintenance:svg('<circle cx="18" cy="20" r="7"/><path d="M23 25l13 13M31 31l7-7M8 39l9-9"/>'),
  military_police:svg('<path d="M24 5 39 11v11c0 10-5 17-15 22C14 39 9 32 9 22V11z"/><path d="M17 22h14M24 15v14"/>'),
  artillery:svg('<circle cx="15" cy="35" r="7"/><path d="M20 31l19-15 3 4-18 16M8 35h5M22 23l-5-6"/>'),
  antitank:svg('<circle cx="16" cy="35" r="6"/><path d="M21 31L42 17M13 28l5-8h10M35 14l8 8"/>'),
  antiair:svg('<circle cx="16" cy="36" r="6"/><path d="M19 30l8-20M25 30l9-19M12 28h18M31 9l7 4"/>'),

  light_tank:svg('<path d="M8 29h5l4-8h15l7 8v7H8zM19 21v-5h9l5 5M13 36h25"/><circle cx="16" cy="38" r="2"/><circle cx="31" cy="38" r="2"/>'),
  medium_tank:svg('<path d="M6 28h7l5-10h18l6 10v8H6zM20 18v-6h12l4 6M11 36h29M15 40h21M31 12h8"/>'),
  heavy_tank:svg('<path d="M5 27h7l5-11h21l6 11v10H5zM19 16V9h15l5 7M9 37h33M12 41h27M34 9h9M9 23h5"/>'),
  superheavy_tank:svg('<path d="M3 25h8l5-12h24l5 12v13H3zM18 13V7h18l5 6M7 38h37M9 42h33M34 7h11M6 21h8"/>'),
  modern_tank:svg('<path d="M6 29h5l6-10h22l4 10v8H6zM20 19l2-7h13l5 7M10 37h31M15 41h22M35 12l8-3"/>'),
  amphibious_tank:svg('<path d="M7 26h6l5-8h18l6 8v8H7zM20 18v-5h11l5 5M7 38c6-4 10 4 16 0s10 4 18 0"/>'),
  land_cruiser:svg('<path d="M3 25h8l4-13h26l4 13v13H3zM17 12V6h19l6 6M7 38h37M9 42h33M30 6h15"/>'),
  tank_destroyer:svg('<path d="M5 29h8l5-10h18l6 10v8H5zM18 19h16M29 15l14-7M9 37h31M13 41h23"/>'),
  spg:svg('<path d="M5 30h8l4-9h19l6 9v7H5zM18 21l14-10M29 11l10-4M9 37h31"/><circle cx="15" cy="39" r="2"/><circle cx="32" cy="39" r="2"/>'),
  spaa:svg('<path d="M5 31h8l4-8h19l6 8v6H5zM21 23l4-14M27 23l7-13M9 37h31M20 12h16"/>'),
  flame_tank:svg('<path d="M6 30h8l4-9h18l6 9v7H6zM10 37h30M30 16c0-5 5-6 6-10 4 5 6 8 3 12-2 3-7 4-9-2z"/>'),

  hmg_tank:svg('<path d="M8 32h25l9-8M12 27V17h8v10M23 27V20h6v7M34 22h9"/>'),
  small_cannon:svg('<path d="M7 32h25l10-8M12 28V19h11v9M30 24h13"/><circle cx="15" cy="37" r="4"/><circle cx="31" cy="37" r="4"/>'),
  close_support_gun:svg('<circle cx="14" cy="35" r="6"/><path d="M19 31l18-14 5 5-18 14M10 27h13M34 15l7 8"/>'),
  high_velocity_gun:svg('<circle cx="14" cy="36" r="5"/><path d="M18 31L44 13M9 29h16M35 10l9 7"/>'),
  medium_cannon:svg('<path d="M7 31h24l12-9M12 27V17h15v10M30 23h14"/><circle cx="14" cy="37" r="4"/><circle cx="31" cy="37" r="4"/>'),
  improved_medium_cannon:svg('<path d="M6 31h25l13-10M11 27V15h17v12M30 22h15M15 12h9"/><circle cx="14" cy="37" r="4"/><circle cx="32" cy="37" r="4"/>'),
  tank_howitzer:svg('<circle cx="14" cy="36" r="6"/><path d="M19 31l15-17 7 6-17 16M10 27h14M31 12l11 9"/>'),
  heavy_cannon:svg('<path d="M5 31h27l13-11M10 27V14h19v13M31 21h15M14 10h12"/><circle cx="13" cy="38" r="5"/><circle cx="34" cy="38" r="5"/>'),

  turret_one:svg('<path d="M11 33h26l-4-13H18zM22 20v-7h8l4 7M8 33h32M22 13h10"/>'),
  turret_two:svg('<path d="M9 33h30l-4-14H16zM19 19v-8h14l4 8M7 33h34M20 15h5M29 15h5"/>'),
  turret_three:svg('<path d="M7 33h34l-5-15H15zM18 18V9h17l4 9M5 33h38M19 14h4M26 14h4M33 14h4"/>'),
  fixed_superstructure:svg('<path d="M6 33h36l-6-16H15l-6 9M10 33h29M26 17l15-7"/>'),

  bogie:svg('<path d="M6 28h36M10 22h28"/><circle cx="13" cy="35" r="5"/><circle cx="25" cy="35" r="5"/><circle cx="37" cy="35" r="5"/>'),
  christie:svg('<path d="M5 29h38M8 20c5 9 10 9 15 0s10-9 17 0"/><circle cx="13" cy="36" r="5"/><circle cx="35" cy="36" r="5"/>'),
  torsion:svg('<path d="M6 30h36M8 23h32M12 19l5 8 5-8 5 8 5-8 5 8"/><circle cx="14" cy="37" r="4"/><circle cx="34" cy="37" r="4"/>'),
  interleaved:svg('<path d="M5 29h38"/><circle cx="12" cy="35" r="5"/><circle cx="20" cy="35" r="5"/><circle cx="28" cy="35" r="5"/><circle cx="36" cy="35" r="5"/>'),

  riveted:svg('<path d="M24 5 40 11v11c0 11-6 18-16 22C14 40 8 33 8 22V11z"/><circle cx="16" cy="18" r="1"/><circle cx="24" cy="18" r="1"/><circle cx="32" cy="18" r="1"/><circle cx="16" cy="27" r="1"/><circle cx="24" cy="27" r="1"/><circle cx="32" cy="27" r="1"/>'),
  welded:svg('<path d="M24 5 40 11v11c0 11-6 18-16 22C14 40 8 33 8 22V11zM15 19h18M15 28h18"/>'),
  cast:svg('<path d="M24 5c7 2 13 4 16 7v10c0 11-6 18-16 22C14 40 8 33 8 22V12c4-3 9-5 16-7z"/><path d="M16 24c3-5 13-5 16 0"/>'),

  gasoline_engine:svg('<circle cx="24" cy="24" r="11"/><path d="M24 7v8M24 33v8M7 24h8M33 24h8M16 16l16 16M32 16 16 32"/>'),
  diesel_engine:svg('<path d="M9 14h30v24H9zM14 19h20v14H14zM18 9v5M30 9v5M18 38v4M30 38v4"/><path d="M19 26h10"/>'),
  petrol_electric:svg('<circle cx="19" cy="24" r="10"/><path d="M29 24h10M34 16v16M39 20l5 4-5 4M12 24h14"/>'),
  radio_tank:svg('<path d="M24 41V20M17 41h14M12 20c3-4 7-6 12-6s9 2 12 6M7 14C11 8 17 5 24 5s13 3 17 9"/><path d="M32 31h10"/>'),
  sloped_armor:svg('<path d="M8 35 17 13h23l-8 22zM14 30h20M18 21h19"/>'),
  wet_ammo:svg('<path d="M10 9h28v30H10zM17 15h4v18h-4zM27 15h4v18h-4z"/><path d="M8 42c5-4 9 4 14 0s9 4 18 0"/>'),
  easy_maintenance:svg('<circle cx="18" cy="22" r="8"/><path d="M24 28l12 12M31 33l8-8M8 40l10-10M33 9l3 3 5-5"/>'),
  extra_mg:svg('<path d="M8 31h26l8-7M13 26V17h7v9M23 26V14h7v12M34 21h10M34 26h10"/>'),
  smoke:svg('<path d="M11 39h26M15 35V25h18v10"/><path d="M18 22c-4-5 1-8 4-5 0-6 7-8 9-3 5-3 10 3 6 7"/>'),
  stabilizer:svg('<circle cx="24" cy="24" r="14"/><path d="M9 24h30M24 9v30M15 16l18 16M33 16 15 32"/>'),

  fighter:svg('<path d="M24 4l4 16 15 6-2 5-13-3-2 15h-4l-2-15-13 3-2-5 15-6zM18 18h12"/>'),
  cas:svg('<path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5zM10 39h11M16 34v10"/>'),
  naval_bomber:svg('<path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5zM6 43c6-4 10 4 16 0s10 4 20 0"/>'),
  tactical_bomber:svg('<path d="M24 5l6 15 13 5-2 5-12-2-3 14h-4l-3-14-12 2-2-5 13-5zM16 32h16M19 36h10"/>'),
  strategic_bomber:svg('<path d="M24 4l8 16 13 4-2 6-14-2-3 15h-4l-3-15-14 2-2-6 13-4zM10 19h28M15 34h18"/>'),
  scout_air:svg('<path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5z"/><circle cx="36" cy="11" r="6"/><path d="M40 15l5 5"/>'),
  transport_air:svg('<path d="M24 4l8 17 13 4-2 6-14-2-3 14h-4l-3-14-14 2-2-6 13-4zM13 18h22M12 37h24"/>'),
  airframe_small:svg('<path d="M24 5l4 15 13 5-2 5-12-2-2 14h-2l-2-14-12 2-2-5 13-5z"/>'),
  airframe_medium:svg('<path d="M24 5l6 15 14 5-2 5-13-2-3 14h-4l-3-14-13 2-2-5 14-5zM13 20h22"/>'),
  airframe_large:svg('<path d="M24 4l8 16 13 4-2 6-14-2-3 15h-4l-3-15-14 2-2-6 13-4zM10 19h28M15 34h18"/>'),
  prop_engine:svg('<circle cx="24" cy="24" r="7"/><path d="M24 4c5 7 5 13 0 20M44 24c-7 5-13 5-20 0M24 44c-5-7-5-13 0-20M4 24c7-5 13-5 20 0"/>'),
  jet_engine:svg('<path d="M8 18h23l10 6-10 6H8zM13 18l5-8M13 30l5 8M31 19l7-7M31 29l7 7"/>'),
  rocket_engine:svg('<path d="M18 8h12l6 18-6 8H18l-6-8zM20 34l-4 9M28 34l4 9M22 14h4"/>'),
  light_mg_air:svg('<path d="M8 31h25l10-8M13 26V17h5v9M22 26V17h5v9M34 22h10"/>'),
  heavy_mg_air:svg('<path d="M6 31h27l11-9M11 26V15h7v11M21 26V15h7v11M32 20h12M32 25h12"/>'),
  cannon_air:svg('<path d="M7 31h25l11-9M12 27V14h14v13M31 22h13M18 10h4"/>'),
  bomb_locks:svg('<path d="M9 13h30M14 13v9M34 13v9M18 22c-4 7-1 14 6 18M30 22c4 7 1 14-6 18"/>'),
  bomb_bay:svg('<path d="M8 12h32v13H8zM13 25v9M24 25v13M35 25v9"/><path d="M10 34l3 7 3-7M21 38l3 7 3-7M32 34l3 7 3-7"/>'),
  torpedo:svg('<path d="M5 24h28l8-6v12l-8-6M12 19l-5-5M12 29l-5 5"/>'),
  defensive_turret_air:svg('<circle cx="24" cy="28" r="10"/><path d="M17 23l-5-13M24 20V6M31 23l5-13M15 38h18"/>'),
  radar:svg('<path d="M24 40V25M17 40h14M13 24a11 11 0 0 1 22 0M7 20a18 18 0 0 1 34 0"/><circle cx="24" cy="24" r="3"/>'),
  recon_camera:svg('<rect x="9" y="15" width="30" height="24" rx="2"/><circle cx="24" cy="27" r="8"/><path d="M15 15l3-6h12l3 6"/>'),
  drop_tank:svg('<path d="M19 8h10l5 13-5 18H19l-5-18zM24 8V4M24 39v5"/>'),
  extra_fuel:svg('<path d="M12 8h19v33H12zM16 13h11v9H16zM31 16h5l5 5v14c0 4-6 4-6 0V25"/>'),
  self_sealing:svg('<path d="M10 10h28v28H10zM16 16h16v16H16z"/><path d="M24 5v10M24 33v10M5 24h10M33 24h10"/>'),
  air_armor:svg('<path d="M24 5 40 11v11c0 11-6 18-16 22C14 40 8 33 8 22V11zM16 19h16M16 27h16"/>'),
  non_strategic:svg('<path d="M8 36 18 12h12l10 24zM17 27h14M21 18h6"/><path d="M10 40h28"/>'),
  radio_navigation:svg('<path d="M24 41V22M18 41h12M13 22c3-5 7-7 11-7s8 2 11 7M8 16C12 9 17 6 24 6s12 3 16 10"/><path d="M35 31l8 5-8 5z"/>'),
  support:svg('<path d="M10 10h28v28H10zM24 14v20M14 24h20"/>'),
  generic:svg('<circle cx="24" cy="24" r="16"/><path d="M16 24h16M24 16v16"/>')
};

const text=(value,label,context)=>`${value||''} ${label||''} ${context||''}`.toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();

export function itemIconKey(value='',label='',context=''){
  const s=text(value,label,context),id=String(value||'').toLowerCase();
  if(!id||id==='none'||/^empty$/.test(s))return 'empty';

  if(/land cruiser/.test(s))return 'land_cruiser';
  if(/amphibious/.test(s)&&/(tank|armor|chassis)/.test(s))return 'amphibious_tank';
  if(/super heavy/.test(s)&&/(tank|armor|chassis)/.test(s))return 'superheavy_tank';
  if(/modern/.test(s)&&/(tank|armor|chassis)/.test(s))return 'modern_tank';
  if(/tank destroyer|destroyer chassis|\banti tank\b.*tank|\btd\b/.test(s))return 'tank_destroyer';
  if(/self propelled.*anti air|sp anti air|tank aa|\bspaa\b/.test(s))return 'spaa';
  if(/self propelled.*artillery|sp artillery|tank artillery|\bspg\b/.test(s))return 'spg';
  if(/flame/.test(s)&&/(tank|armor|chassis)/.test(s))return 'flame_tank';
  if(/heavy/.test(s)&&/(tank|armor|chassis)/.test(s))return 'heavy_tank';
  if(/medium/.test(s)&&/(tank|armor|chassis)/.test(s))return 'medium_tank';
  if(/light/.test(s)&&/(tank|armor|chassis)/.test(s))return 'light_tank';

  if(/heavy machine gun/.test(s)&&/(tank|gun|weapon|module)/.test(s))return 'hmg_tank';
  if(/close support gun/.test(s))return 'close_support_gun';
  if(/high velocity/.test(s))return 'high_velocity_gun';
  if(/improved medium cannon/.test(s))return 'improved_medium_cannon';
  if(/medium howitzer|howitzer/.test(s)&&/(tank|module|gun)/.test(s))return 'tank_howitzer';
  if(/heavy cannon/.test(s)&&!/(air|aircraft)/.test(s))return 'heavy_cannon';
  if(/medium cannon/.test(s)&&!/(air|aircraft)/.test(s))return 'medium_cannon';
  if(/small cannon/.test(s)&&!/(air|aircraft)/.test(s))return 'small_cannon';

  if(/one man turret|one man/.test(s)&&/turret/.test(s))return 'turret_one';
  if(/two man turret|two man/.test(s)&&/turret/.test(s))return 'turret_two';
  if(/three man turret|three man/.test(s)&&/turret/.test(s))return 'turret_three';
  if(/fixed superstructure|casemate/.test(s))return 'fixed_superstructure';
  if(/bogie/.test(s))return 'bogie';
  if(/christie/.test(s))return 'christie';
  if(/torsion/.test(s))return 'torsion';
  if(/interleaved/.test(s))return 'interleaved';
  if(/riveted/.test(s))return 'riveted';
  if(/welded/.test(s))return 'welded';
  if(/cast armor|cast armour/.test(s))return 'cast';
  if(/gasoline|petrol engine/.test(s)&&!(/electric/.test(s)))return 'gasoline_engine';
  if(/diesel/.test(s))return 'diesel_engine';
  if(/petrol electric|gasoline electric/.test(s))return 'petrol_electric';
  if(/sloped armor|sloped armour/.test(s))return 'sloped_armor';
  if(/wet ammunition|wet ammo/.test(s))return 'wet_ammo';
  if(/easy maintenance/.test(s))return 'easy_maintenance';
  if(/additional machine guns|extra machine guns/.test(s)&&!/(air|aircraft)/.test(s))return 'extra_mg';
  if(/smoke launcher/.test(s))return 'smoke';
  if(/stabilizer|stabiliser/.test(s))return 'stabilizer';
  if(/\bradio\b/.test(s)&&/(tank|armor|module)/.test(s))return 'radio_tank';

  if(/strategic bomber/.test(s))return 'strategic_bomber';
  if(/tactical bomber/.test(s))return 'tactical_bomber';
  if(/naval bomber|naval strike|maritime patrol/.test(s))return 'naval_bomber';
  if(/close air support|\bcas\b/.test(s))return 'cas';
  if(/scout|recon plane|recon aircraft/.test(s))return 'scout_air';
  if(/transport/.test(s)&&/(air|plane|aircraft)/.test(s))return 'transport_air';
  if(/fighter/.test(s))return 'fighter';
  if(/large/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_large';
  if(/medium/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_medium';
  if(/small/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_small';

  if(/rocket engine/.test(s))return 'rocket_engine';
  if(/jet engine/.test(s))return 'jet_engine';
  if(/engine/.test(s)&&(context==='air'||/air|aircraft|plane/.test(s)||/^engine[ _-]?\d/.test(id)))return 'prop_engine';
  if(/light machine gun|light mg|light_mg/.test(s))return 'light_mg_air';
  if(/heavy machine gun|heavy mg|heavy_mg/.test(s)&&(context==='air'||/air|aircraft/.test(s)))return 'heavy_mg_air';
  if(/aircraft cannon|cannon/.test(s)&&(context==='air'||/air|aircraft/.test(s)))return 'cannon_air';
  if(/bomb lock/.test(s))return 'bomb_locks';
  if(/bomb bay/.test(s))return 'bomb_bay';
  if(/torpedo/.test(s))return 'torpedo';
  if(/defensive turret/.test(s))return 'defensive_turret_air';
  if(/recon camera|camera/.test(s))return 'recon_camera';
  if(/radio navigation|navigation/.test(s)&&(context==='air'||/air|aircraft/.test(s)))return 'radio_navigation';
  if(/radar/.test(s))return 'radar';
  if(/drop tank/.test(s))return 'drop_tank';
  if(/extra fuel|fuel tanks?/.test(s)&&!(/self sealing/.test(s)))return 'extra_fuel';
  if(/self sealing/.test(s))return 'self_sealing';
  if(/armor plate|armour plate/.test(s)&&(context==='air'||/air|aircraft/.test(s)))return 'air_armor';
  if(/non strategic material/.test(s))return 'non_strategic';

  if(/mechanized|mechanised/.test(s))return 'mechanized';
  if(/motorized|motorised/.test(s))return 'motorized';
  if(/mountain|mountaineer/.test(s))return 'mountaineer';
  if(/marine/.test(s))return 'marine';
  if(/paratroop|airborne/.test(s))return 'paratrooper';
  if(/cavalry/.test(s))return 'cavalry';
  if(/engineer/.test(s))return 'engineer';
  if(/recon/.test(s))return 'recon';
  if(/logistic/.test(s))return 'logistics';
  if(/signal/.test(s))return 'signal';
  if(/hospital|medical/.test(s))return 'hospital';
  if(/maintenance/.test(s))return 'maintenance';
  if(/military police|\bmp\b/.test(s))return 'military_police';
  if(/anti tank/.test(s))return 'antitank';
  if(/anti air/.test(s))return 'antiair';
  if(/artillery|rocket/.test(s))return 'artillery';
  if(/infantry|rifle/.test(s))return 'infantry';

  return visualKind(s);
}

function signature(value=''){
  const seed=String(value||'').trim();if(!seed)return '';
  let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  const a=34+(h&3),b=36+((h>>>2)&3),c=39+((h>>>4)&3),d=35+((h>>>6)&3);
  return `<path class="icon-signature" d="M${a} 43l${(h>>>8)&1?3:-3} -3M${b} 44h${(h>>>9)&1?5:-5}M42 ${c}l-4 ${((h>>>10)&1)?-3:3}M${d} 39v${((h>>>11)&1)?5:-5}"/>`;
}

export function itemIconSvg(value='',label='',context='',fallback='generic'){
  const key=itemIconKey(value,label,context),base=ICON[key]||iconSvg(fallback)||ICON.generic,mark=signature(value||label);
  return mark?base.replace('</svg>',`${mark}</svg>`):base;
}
