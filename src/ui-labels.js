/* Display-only naming helpers. Internal HOI4 ids remain untouched. */

const DISPLAY_NAMES={
  infantry_equipment:'Infantry Equipment',support_equipment:'Support Equipment',motorized_equipment:'Motorized Equipment',mechanized_equipment:'Mechanized Equipment',
  support_artillery:'Support Artillery',support_anti_tank:'Support Anti-Tank',support_at:'Support Anti-Tank',support_anti_air:'Support Anti-Air',support_aa:'Support Anti-Air',
  anti_tank:'Anti-Tank',anti_air:'Anti-Air',regimental_infantry_guns:'Regimental Infantry Guns',regimental_at:'Regimental Anti-Tank',regimental_aa:'Regimental Anti-Air',
  light_tank:'Light Tank',medium_tank:'Medium Tank',heavy_tank:'Heavy Tank',super_heavy_tank:'Super-Heavy Tank',modern_tank:'Modern Tank',
  small_airframe:'Small Airframe',medium_airframe:'Medium Airframe',large_airframe:'Large Airframe',small_plane_airframe:'Small Airframe',medium_plane_airframe:'Medium Airframe',large_plane_airframe:'Large Airframe',
  air_superiority:'Air Superiority',naval_strike:'Naval Strike',close_air_support:'Close Air Support',
  mobile_warfare:'Mobile Warfare',superior_firepower:'Superior Firepower',grand_battleplan:'Grand Battleplan',mass_assault:'Mass Assault',
  mobile_infantry:'Mobile Infantry',defensive_postures:'Defensive Postures',large_unit_tactics:'Large Unit Tactics',assault_infantry:'Assault Infantry',mounted_infantry:'Mounted Infantry',
  fire_concentration:'Fire Concentration',anti_tank_frontline:'Anti-Tank Frontline',flying_batteries:'Flying Batteries',air_cavalry:'Air Cavalry',mobile_recon_and_assault:'Mobile Recon & Assault',
  self_propelled_support:'Self-Propelled Support',siege_artillery:'Siege Artillery',field_engineering:'Field Engineering',armored_spearhead:'Armored Spearhead',armored_infantry_support:'Armored Infantry Support',
  streamlined_deployment:'Streamlined Deployment',mobile_defense:'Mobile Defense',armored_cavalry:'Armored Cavalry',tank_destroyer_force:'Tank Destroyer Force',mission_type_tactics:'Mission-Type Tactics',
  last_stand:'Desperate Defense',infiltration_tactics:'Infiltration Tactics',grand_assault:'Grand Assault',deep_battle:'Deep Battle',guerilla_war:'Guerrilla War',rapid_domination:'Rapid Domination',
  expeditionary_warfare:'Expeditionary Warfare',dispersed_operations:'Dispersed Operations',GER_porsche_tank:'Porsche'
};

const ACRONYMS=new Map([['aa','AA'],['at','AT'],['cas','CAS'],['ic','IC'],['mio','MIO'],['spg','SPG'],['td','TD'],['mg','MG']]);
let DISPLAY_LOCALIZATION={};

export function setDisplayLocalization(localization={}){DISPLAY_LOCALIZATION={...localization};}
export function getDisplayLocalization(){return {...DISPLAY_LOCALIZATION};}

function localizedValue(id,candidate=''){
  const keys=[candidate,id,`${id}_name`,`${id}_NAME`,`${id}_title`,`${id}_TITLE`].filter(Boolean);
  for(const key of keys){const value=DISPLAY_LOCALIZATION[key];if(typeof value==='string'&&value.trim())return value.trim();}
  return '';
}

export function looksLikeIdentifier(value=''){
  const s=String(value||'').trim();
  return !!s&&(s.includes('_')||/^[A-Z]{3}_[a-z0-9_]+$/i.test(s)||/^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(s));
}

export function humanizeIdentifier(value=''){
  let s=String(value||'').trim();
  if(!s)return '—';
  if(DISPLAY_NAMES[s])return DISPLAY_NAMES[s];
  s=s.replace(/^[A-Z]{3}_/,'').replace(/^(?:generic|default)_/i,'').replace(/_(?:organization|organisation|mio)$/i,'');
  s=s.replace(/_/g,' ').replace(/\s+/g,' ').trim();
  return s.split(' ').filter(Boolean).map(word=>{
    const low=word.toLowerCase();
    if(ACRONYMS.has(low))return ACRONYMS.get(low);
    if(/^mk\d+$/i.test(word))return word.toUpperCase();
    return low.charAt(0).toUpperCase()+low.slice(1);
  }).join(' ');
}

export function displayLabel(value,candidate=''){
  const id=String(value??'').trim(),shown=String(candidate??'').trim(),localized=localizedValue(id,shown);
  if(localized)return localized;
  if(DISPLAY_NAMES[id])return DISPLAY_NAMES[id];
  if(shown&&shown!==id&&!looksLikeIdentifier(shown))return shown;
  return humanizeIdentifier(shown||id);
}

export function visualKind(value=''){
  const s=String(value||'').toLowerCase();
  if(/anti.?tank|pierc|tank.?destroyer|\btd\b/.test(s))return 'antitank';
  if(/anti.?air|\baa\b|spaa/.test(s))return 'antiair';
  if(/artillery|howitzer|gun|rocket|spg/.test(s))return 'artillery';
  if(/tank|armor|armour|chassis|turret|suspension/.test(s))return 'armor';
  if(/air|plane|fighter|bomber|engine|wing|cannon|mg/.test(s))return 'air';
  if(/support|engineer|recon|logistic|signal|hospital/.test(s))return 'support';
  if(/infantry|rifle|weapon|cavalry|mechanized|motorized|marine|mountain|paratroop/.test(s))return 'infantry';
  if(/doctrine|warfare|battle|assault|defen|operation|infiltration|firepower|mass_/.test(s))return 'doctrine';
  if(/mio|organization|organisation|porsche|henschel|design|works|arsenal|company|factory/.test(s))return 'industry';
  return 'generic';
}

const common='viewBox="0 0 48 48" aria-hidden="true" focusable="false" class="ui-symbol-icon"';
const ICONS={
  armor:`<svg ${common}><path d="M8 27h4l4-9h20l5 9v9H8z"/><path d="M19 18v-5h11l5 5M13 36h27M16 40h20"/></svg>`,
  armor_light:`<svg ${common}><path d="M8 29h5l4-8h15l7 8v7H8zM19 21v-5h9l5 5M13 36h25"/><circle cx="16" cy="37" r="2"/><circle cx="31" cy="37" r="2"/></svg>`,
  armor_medium:`<svg ${common}><path d="M6 28h7l5-10h18l6 10v8H6zM20 18v-6h12l4 6M11 36h29M15 40h21"/><path d="M31 12h8"/></svg>`,
  armor_heavy:`<svg ${common}><path d="M5 27h7l5-11h21l6 11v10H5zM19 16v-7h15l5 7M9 37h33M12 41h27"/><path d="M34 9h9M9 23h5"/></svg>`,
  armor_superheavy:`<svg ${common}><path d="M3 25h8l5-12h24l5 12v13H3zM18 13V7h18l5 6M7 38h37M9 42h33"/><path d="M34 7h11M6 21h8"/></svg>`,
  armor_modern:`<svg ${common}><path d="M6 29h5l6-10h22l4 10v8H6zM20 19l2-7h13l5 7M10 37h31M15 41h22"/><path d="M35 12l8-3"/></svg>`,
  tank_destroyer:`<svg ${common}><path d="M5 29h8l5-10h18l6 10v8H5zM18 19h16M29 15l14-7M9 37h31M13 41h23"/></svg>`,
  spg:`<svg ${common}><path d="M5 30h8l4-9h19l6 9v7H5zM18 21l14-10M29 11l10-4M9 37h31"/><circle cx="15" cy="39" r="2"/><circle cx="32" cy="39" r="2"/></svg>`,
  spaa:`<svg ${common}><path d="M5 31h8l4-8h19l6 8v6H5zM21 23l4-14M27 23l7-13M9 37h31"/><path d="M20 12h16"/></svg>`,
  infantry:`<svg ${common}><circle cx="18" cy="10" r="5"/><path d="M18 15v15M18 21l-8 8M18 21l9 7M18 30l-6 12M18 30l8 12M29 12l8 30"/></svg>`,
  motorized:`<svg ${common}><path d="M5 17h24v17H5zM29 23h8l6 6v5H29z"/><circle cx="13" cy="36" r="4"/><circle cx="35" cy="36" r="4"/><path d="M10 22h8M22 22h5"/></svg>`,
  mechanized:`<svg ${common}><path d="M6 17h29l7 10v8H6zM11 17l4-7h14l7 7M11 35h27"/><circle cx="13" cy="38" r="3"/><circle cx="22" cy="38" r="3"/><circle cx="31" cy="38" r="3"/></svg>`,
  cavalry:`<svg ${common}><path d="M12 33c5-3 9-9 12-17 4 5 8 7 13 7l4 8-7 9M15 33l-4 8M27 31l3 10M21 16l-4-7M29 17l4-5"/><circle cx="14" cy="11" r="3"/></svg>`,
  mountaineer:`<svg ${common}><path d="M4 39 18 14l7 12 6-9 13 22zM14 22l4 5 4-4"/><path d="M27 39l5-10 4 6"/></svg>`,
  marine:`<svg ${common}><path d="M24 6v28M16 14h16M13 34c5 7 17 7 22 0M8 31h8M32 31h8"/><circle cx="24" cy="9" r="3"/></svg>`,
  paratrooper:`<svg ${common}><path d="M7 17c5-12 29-12 34 0-5-3-9-3-13 0-3-3-6-3-9 0-4-3-8-3-12 0zM11 17l10 13M37 17 27 30M24 17v13"/><circle cx="24" cy="34" r="3"/><path d="M24 37v7"/></svg>`,
  engineer:`<svg ${common}><path d="M9 38 21 26M16 31l-6-6 6-6 6 6M26 11l11 11M31 8l9 9M24 28l14 14"/></svg>`,
  recon:`<svg ${common}><circle cx="20" cy="20" r="10"/><path d="M27 27l12 12M15 20h10M20 15v10"/></svg>`,
  logistics:`<svg ${common}><path d="M5 18h23v16H5zM28 24h8l7 7v3H28z"/><circle cx="13" cy="37" r="3"/><circle cx="35" cy="37" r="3"/><path d="M10 23h12"/></svg>`,
  signal:`<svg ${common}><path d="M24 42V18M17 42h14M10 18c4-5 8-7 14-7s10 2 14 7M5 12C10 6 16 3 24 3s14 3 19 9"/><circle cx="24" cy="18" r="3"/></svg>`,
  hospital:`<svg ${common}><path d="M8 12h32v28H8zM24 17v18M15 26h18"/></svg>`,
  air:`<svg ${common}><path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5z"/></svg>`,
  fighter:`<svg ${common}><path d="M24 4l4 16 15 6-2 5-13-3-2 15h-4l-2-15-13 3-2-5 15-6z"/><path d="M18 18h12"/></svg>`,
  cas:`<svg ${common}><path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5zM12 39h10M17 34v10"/></svg>`,
  tactical_bomber:`<svg ${common}><path d="M24 5l6 15 13 5-2 5-12-2-3 14h-4l-3-14-12 2-2-5 13-5z"/><path d="M16 32h16M19 36h10"/></svg>`,
  strategic_bomber:`<svg ${common}><path d="M24 4l7 16 13 4-2 6-13-2-3 15h-4l-3-15-13 2-2-6 13-4z"/><path d="M11 19h26M15 34h18"/></svg>`,
  naval_air:`<svg ${common}><path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5zM6 43c6-4 10 4 16 0s10 4 20 0"/></svg>`,
  scout_air:`<svg ${common}><path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5z"/><circle cx="36" cy="11" r="6"/><path d="M40 15l5 5"/></svg>`,
  airframe_small:`<svg ${common}><path d="M24 5l4 15 13 5-2 5-12-2-2 14h-2l-2-14-12 2-2-5 13-5z"/></svg>`,
  airframe_medium:`<svg ${common}><path d="M24 5l6 15 14 5-2 5-13-2-3 14h-4l-3-14-13 2-2-5 14-5z"/><path d="M13 20h22"/></svg>`,
  airframe_large:`<svg ${common}><path d="M24 4l8 16 13 4-2 6-14-2-3 15h-4l-3-15-14 2-2-6 13-4z"/><path d="M10 19h28M15 34h18"/></svg>`,
  air_engine:`<svg ${common}><circle cx="24" cy="24" r="10"/><path d="M24 5v9M24 34v9M5 24h9M34 24h9M11 11l7 7M30 30l7 7M37 11l-7 7M18 30l-7 7"/></svg>`,
  air_gun:`<svg ${common}><path d="M7 31h25l10-8v5l-9 9H7zM14 26V15h7v11M24 26V12h7v14"/></svg>`,
  bomb:`<svg ${common}><path d="M21 6h6v9l5 8c5 12-1 20-8 20s-13-8-8-20l5-8zM18 31h12"/></svg>`,
  torpedo:`<svg ${common}><path d="M5 24h28l8-6v12l-8-6M12 19l-5-5M12 29l-5 5"/></svg>`,
  radar:`<svg ${common}><path d="M24 40V25M17 40h14M13 24a11 11 0 0 1 22 0M7 20a18 18 0 0 1 34 0"/><circle cx="24" cy="24" r="3"/></svg>`,
  fuel:`<svg ${common}><path d="M12 8h19v33H12zM16 13h11v9H16zM31 16h5l5 5v14c0 4-6 4-6 0V25"/></svg>`,
  turret:`<svg ${common}><path d="M10 31h28l-3-12H17zM20 19v-6h10l5 6M7 31h34M13 37h22"/></svg>`,
  suspension:`<svg ${common}><path d="M6 30h36M10 23c4 8 8 8 12 0s8-8 12 0 6 8 8 0"/><circle cx="14" cy="36" r="4"/><circle cx="34" cy="36" r="4"/></svg>`,
  armor_plate:`<svg ${common}><path d="M24 5 40 11v11c0 11-6 18-16 22C14 40 8 33 8 22V11z"/><path d="M16 18h16M16 25h16M18 32h12"/></svg>`,
  artillery:`<svg ${common}><circle cx="15" cy="35" r="7"/><path d="M20 31l19-15 3 4-18 16M8 35h5M22 23l-5-6"/></svg>`,
  antitank:`<svg ${common}><circle cx="16" cy="35" r="6"/><path d="M21 31L41 18M13 28l5-8h10M35 15l7 7"/></svg>`,
  antiair:`<svg ${common}><circle cx="16" cy="36" r="6"/><path d="M19 30l8-20M25 30l9-19M12 28h18"/></svg>`,
  support:`<svg ${common}><path d="M10 10h28v28H10zM24 14v20M14 24h20"/></svg>`,
  hq:`<svg ${common}><path d="M24 5 39 11v11c0 10-6 17-15 21C15 39 9 32 9 22V11z"/><path d="m24 13 3 6 7 .9-5 4.7 1.4 7-6.4-3.4-6.4 3.4 1.4-7-5-4.7 7-.9z"/></svg>`,
  front:`<svg ${common}><path d="M6 34c6-1 8-9 14-9s7 8 13 8 7-7 10-10"/><path d="M8 12h12l5 5-5 5H8M27 10h13l-4 4 4 4H27"/><path d="M24 25v15"/></svg>`,
  intel:`<svg ${common}><path d="M9 21h10l3 6v9H7v-8zM39 21H29l-3 6v9h15v-8z"/><circle cx="14" cy="31" r="5"/><circle cx="34" cy="31" r="5"/><path d="M19 21l2-9h6l2 9M21 27h6"/></svg>`,
  gauntlet:`<svg ${common}><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="3"/><path d="M24 4v7M24 37v7M4 24h7M37 24h7"/></svg>`,
  data:`<svg ${common}><ellipse cx="24" cy="10" rx="15" ry="6"/><path d="M9 10v10c0 3 7 6 15 6s15-3 15-6V10M9 20v10c0 3 7 6 15 6s15-3 15-6V20M9 30v8c0 3 7 6 15 6s15-3 15-6v-8"/></svg>`,
  scenario:`<svg ${common}><rect x="10" y="8" width="28" height="34" rx="2"/><path d="M17 8V5h14v3M16 17h16M16 24h16M16 31h10"/><path d="m30 34 3 3 7-8"/></svg>`,
  directions:`<svg ${common}><path d="M24 42V22M24 22 12 10M24 22 36 10M24 22V6"/><path d="m8 14 4-4 4 4M20 10l4-4 4 4M32 14l4-4 4 4"/></svg>`,
  supply:`<svg ${common}><path d="M5 19h24v15H5zM29 24h8l6 6v4H29z"/><circle cx="13" cy="37" r="4"/><circle cx="35" cy="37" r="4"/><path d="M10 24h13M18 19v15"/><path d="M11 14h14"/></svg>`,
  planning:`<svg ${common}><path d="M7 9 18 6l12 4 11-3v31l-11 3-12-4-11 3zM18 6v31M30 10v31"/><path d="M11 29c7-9 13-9 20-4l6-6"/><path d="m34 17 4 2-1 4"/></svg>`,
  night:`<svg ${common}><path d="M32 7c-8 3-13 10-13 18 0 8 5 14 12 17-12 1-22-7-22-19S19 4 32 7z"/><path d="m36 12 1.5 3.5L41 17l-3.5 1.5L36 22l-1.5-3.5L31 17l3.5-1.5z"/></svg>`,
  fort:`<svg ${common}><path d="M7 39V19h6v-7h7v7h8v-7h7v7h6v20z"/><path d="M16 39V29h16v10M12 24h24"/></svg>`,
  entrench:`<svg ${common}><path d="M9 39h30M14 34l8-8M18 22l10 10M28 32l10-10"/><path d="M7 14h14l-3 8H10zM30 8h8v12h-8z"/></svg>`,
  soft_attack:`<svg ${common}><path d="m24 5 4 10 10-4-4 10 10 4-10 4 4 10-10-4-4 10-4-10-10 4 4-10-10-4 10-4-4-10 10 4z"/><circle cx="24" cy="25" r="5"/></svg>`,
  defense:`<svg ${common}><path d="M24 5 40 11v12c0 10-6 17-16 21C14 40 8 33 8 23V11z"/><path d="M15 24h18M24 15v18"/></svg>`,
  health:`<svg ${common}><path d="M24 41S8 31 8 18c0-6 4-10 10-10 3 0 5 2 6 5 1-3 3-5 6-5 6 0 10 4 10 10 0 13-16 23-16 23z"/><path d="M15 24h6l3-7 4 13 3-6h5"/></svg>`,
  reliability:`<svg ${common}><circle cx="24" cy="24" r="9"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4"/><path d="m19 24 3 3 7-8"/></svg>`,
  cost:`<svg ${common}><path d="M7 39V22l10 6v-8l10 6v-9l14 8v14z"/><circle cx="35" cy="12" r="7"/><path d="M32 12h6M35 9v6"/></svg>`,
  speed:`<svg ${common}><path d="M8 34a16 16 0 1 1 32 0"/><path d="m24 30 10-10M14 34h20"/><circle cx="24" cy="30" r="2"/></svg>`,
  range:`<svg ${common}><circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="7"/><path d="M24 4v7M24 37v7M4 24h7M37 24h7"/><path d="m29 19 8-8"/></svg>`,
  agility:`<svg ${common}><path d="M10 29c2-11 10-17 22-17h6"/><path d="m33 7 6 5-6 5"/><path d="M38 27c-2 9-9 14-20 14h-7"/><path d="m16 36-6 5 6 5"/></svg>`,
  organization:`<svg ${common}><path d="M8 10h26l6 6-6 6H8zM8 26h21l6 6-6 6H8z"/><path d="M14 16h14M14 32h9"/></svg>`,
  width:`<svg ${common}><path d="M7 24h34M7 24l6-6M7 24l6 6M41 24l-6-6M41 24l-6 6"/><path d="M15 11v26M33 11v26"/></svg>`,
  doctrine:`<svg ${common}><path d="M7 10h14c3 0 5 2 5 5v25c0-3-2-5-5-5H7zM41 10H27c-3 0-5 2-5 5v25c0-3 2-5 5-5h14z"/></svg>`,
  industry:`<svg ${common}><path d="M7 39V22l10 6v-8l10 6v-9l14 8v14zM13 18V8h7v15M31 31h4M14 34h4M23 34h4"/></svg>`,
  generic:`<svg ${common}><circle cx="24" cy="24" r="16"/><path d="M16 24h16M24 16v16"/></svg>`
};

export function semanticIconKey(value='',candidate=''){
  const s=`${String(value||'')} ${String(candidate||'')}`.toLowerCase().replace(/[_-]+/g,' ');
  if(/super heavy/.test(s)&&/(tank|armor|armour|chassis)/.test(s))return 'armor_superheavy';
  if(/modern/.test(s)&&/(tank|armor|armour|chassis)/.test(s))return 'armor_modern';
  if(/tank destroyer|\btd\b/.test(s))return 'tank_destroyer';
  if(/self propelled.*anti air|spaa/.test(s))return 'spaa';
  if(/self propelled.*artillery|\bspg\b/.test(s))return 'spg';
  if(/heavy/.test(s)&&/(tank|armor|armour|chassis)/.test(s))return 'armor_heavy';
  if(/medium/.test(s)&&/(tank|armor|armour|chassis)/.test(s))return 'armor_medium';
  if(/light/.test(s)&&/(tank|armor|armour|chassis)/.test(s))return 'armor_light';
  if(/mechanized|mechanised/.test(s))return 'mechanized';
  if(/motorized|motorised/.test(s))return 'motorized';
  if(/mountain|mountaineer/.test(s))return 'mountaineer';
  if(/marine/.test(s))return 'marine';
  if(/paratroop|airborne/.test(s))return 'paratrooper';
  if(/cavalry/.test(s))return 'cavalry';
  if(/engineer/.test(s))return 'engineer';
  if(/recon/.test(s)&&!/(air|plane|aircraft)/.test(s))return 'recon';
  if(/logistic/.test(s))return 'logistics';
  if(/signal/.test(s))return 'signal';
  if(/hospital|medical/.test(s))return 'hospital';
  if(/strategic bomber|strat bomber/.test(s))return 'strategic_bomber';
  if(/tactical bomber|tac bomber/.test(s))return 'tactical_bomber';
  if(/naval bomber|naval strike|maritime/.test(s))return 'naval_air';
  if(/close air support|\bcas\b/.test(s))return 'cas';
  if(/scout|recon camera/.test(s)&&/(air|plane|aircraft|camera)/.test(s))return 'scout_air';
  if(/fighter/.test(s))return 'fighter';
  if(/large/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_large';
  if(/medium/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_medium';
  if(/small/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_small';
  if(/torpedo/.test(s))return 'torpedo';
  if(/bomb|bomb bay|bomb lock/.test(s))return 'bomb';
  if(/radar|radio navigation|radio/.test(s))return 'radar';
  if(/drop tank|fuel tank|extra fuel|self sealing fuel/.test(s))return 'fuel';
  if(/air.*engine|engine.*air|jet engine|rocket engine|\bengine [ivx0-9]/.test(s))return 'air_engine';
  if(/aircraft cannon|machine gun|\bmg\b|air weapon/.test(s))return 'air_gun';
  if(/turret/.test(s)&&!/(defensive turret|air)/.test(s))return 'turret';
  if(/suspension|bogie|christie|torsion/.test(s))return 'suspension';
  if(/armor plate|armour plate|welded armor|cast armor|riveted armor/.test(s))return 'armor_plate';
  const broad=visualKind(s);
  return broad;
}

export function iconSvg(kind='generic'){return ICONS[kind]||ICONS.generic;}
export function iconSvgFor(value='',candidate='',fallback='generic'){
  const key=semanticIconKey(value,candidate),chosen=ICONS[key]?key:(ICONS[fallback]?fallback:visualKind(value||candidate));
  return ICONS[chosen]||ICONS.generic;
}
