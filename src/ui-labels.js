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
  const id=String(value??'').trim(),shown=String(candidate??'').trim();
  if(DISPLAY_NAMES[id])return DISPLAY_NAMES[id];
  if(shown&&shown!==id&&!looksLikeIdentifier(shown))return shown;
  return humanizeIdentifier(shown||id);
}

export function visualKind(value=''){
  const s=String(value||'').toLowerCase();
  if(/tank|armor|armour|chassis|turret|suspension/.test(s))return 'armor';
  if(/air|plane|fighter|bomber|engine|wing|cannon|mg/.test(s))return 'air';
  if(/artillery|howitzer|gun|rocket|spg/.test(s))return 'artillery';
  if(/anti.?tank|pierc|destroyer|\btd\b/.test(s))return 'antitank';
  if(/anti.?air|\baa\b/.test(s))return 'antiair';
  if(/infantry|rifle|weapon|cavalry|mechanized|motorized/.test(s))return 'infantry';
  if(/support|engineer|recon|logistic|signal|hospital/.test(s))return 'support';
  if(/doctrine|warfare|battle|assault|defen|operation|infiltration|firepower|mass_/.test(s))return 'doctrine';
  if(/mio|organization|organisation|porsche|henschel|design|works|arsenal|company|factory/.test(s))return 'industry';
  return 'generic';
}

export function iconSvg(kind='generic'){
  const common='viewBox="0 0 48 48" aria-hidden="true" focusable="false"';
  const icons={
    armor:`<svg ${common}><path d="M8 27h4l4-9h20l5 9v9H8z"/><path d="M19 18v-5h11l5 5M13 36h27M16 40h20"/></svg>`,
    air:`<svg ${common}><path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5z"/></svg>`,
    artillery:`<svg ${common}><circle cx="15" cy="35" r="7"/><path d="M20 31l19-15 3 4-18 16M8 35h5M22 23l-5-6"/></svg>`,
    antitank:`<svg ${common}><circle cx="16" cy="35" r="6"/><path d="M21 31L41 18M13 28l5-8h10M35 15l7 7"/></svg>`,
    antiair:`<svg ${common}><circle cx="16" cy="36" r="6"/><path d="M19 30l8-20M25 30l9-19M12 28h18"/></svg>`,
    infantry:`<svg ${common}><circle cx="18" cy="10" r="5"/><path d="M18 15v15M18 21l-8 8M18 21l9 7M18 30l-6 12M18 30l8 12M29 12l8 30"/></svg>`,
    support:`<svg ${common}><path d="M10 10h28v28H10zM24 14v20M14 24h20"/></svg>`,
    doctrine:`<svg ${common}><path d="M7 10h14c3 0 5 2 5 5v25c0-3-2-5-5-5H7zM41 10H27c-3 0-5 2-5 5v25c0-3 2-5 5-5h14z"/></svg>`,
    industry:`<svg ${common}><path d="M7 39V22l10 6v-8l10 6v-9l14 8v14zM13 18V8h7v15M31 31h4M14 34h4M23 34h4"/></svg>`,
    generic:`<svg ${common}><circle cx="24" cy="24" r="16"/><path d="M16 24h16M24 16v16"/></svg>`
  };
  return icons[kind]||icons.generic;
}
