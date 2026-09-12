import { registerUiEnhancer } from './ui-enhancer-runtime.js';

/*
 * Item-specific icon layer.
 * Broad family icons remain useful as fallbacks, but every distinct selectable item
 * receives a semantic base plus a deterministic variant mark so unrelated options
 * no longer collapse to one tank / infantry / aircraft glyph.
 */

const common='viewBox="0 0 48 48" aria-hidden="true" focusable="false"';
const BASE={
  infantry:'<circle cx="17" cy="9" r="4"/><path d="M17 13v15M17 19l-7 8M17 19l8 7M17 28l-5 12M17 28l7 12M29 11l8 30"/>',
  motorized:'<path d="M5 18h24v15H5zM29 23h8l6 6v4H29z"/><circle cx="13" cy="36" r="4"/><circle cx="35" cy="36" r="4"/><path d="M10 23h8M22 23h5"/>',
  mechanized:'<path d="M5 19h29l8 9v7H5zM10 19l5-7h15l6 7M9 35h31"/><circle cx="12" cy="38" r="3"/><circle cx="22" cy="38" r="3"/><circle cx="32" cy="38" r="3"/>',
  cavalry:'<path d="M10 34c6-3 10-9 13-17 4 5 8 7 13 7l5 7-8 10M14 34l-4 8M27 32l3 10M20 17l-4-7M28 18l5-5"/><circle cx="13" cy="11" r="3"/>',
  mountaineer:'<path d="M4 39 18 13l8 13 6-9 12 22zM13 23l5 4 4-5M28 39l5-10 4 6"/>',
  marine:'<path d="M24 6v28M16 14h16M12 34c5 8 19 8 24 0M8 30h9M31 30h9"/><circle cx="24" cy="9" r="3"/>',
  paratrooper:'<path d="M6 17c6-12 30-12 36 0-5-3-9-3-13 0-3-3-7-3-10 0-4-3-8-3-13 0zM11 17l10 13M37 17 27 30M24 17v13"/><circle cx="24" cy="34" r="3"/><path d="M24 37v7"/>',
  artillery:'<circle cx="14" cy="35" r="6"/><path d="M19 31l20-15 3 4-18 16M7 35h5M22 23l-5-6"/>',
  rocket_artillery:'<circle cx="13" cy="36" r="5"/><path d="M17 32 34 17M23 27l-5-5M29 22l-5-5M35 17l7-8M37 14l4 4M10 30h8"/>',
  anti_tank:'<circle cx="15" cy="35" r="6"/><path d="M20 31 42 18M12 28l5-8h10M34 15l8 7"/>',
  anti_air:'<circle cx="15" cy="36" r="6"/><path d="M18 30 26 9M24 30l10-20M11 28h19M28 12l8 2"/>',
  light_tank:'<path d="M7 29h6l4-8h15l7 8v7H7zM19 21v-5h9l5 5M12 36h26"/><circle cx="15" cy="38" r="2"/><circle cx="31" cy="38" r="2"/>',
  medium_tank:'<path d="M5 28h8l5-10h18l6 10v8H5zM20 18v-6h12l4 6M10 36h31M14 40h23M31 12h9"/>',
  heavy_tank:'<path d="M4 27h8l5-11h21l6 11v10H4zM19 16V9h15l5 7M8 37h35M11 41h29M34 9h10"/>',
  superheavy_tank:'<path d="M2 25h9l5-12h24l6 12v13H2zM18 13V7h18l6 6M6 38h39M8 42h35M34 7h12"/>',
  modern_tank:'<path d="M5 29h6l6-10h22l4 10v8H5zM20 19l2-7h13l5 7M9 37h33M14 41h24M35 12l9-3"/>',
  tank_destroyer:'<path d="M4 29h9l5-10h18l6 10v8H4zM18 19h16M29 15l15-7M8 37h33M12 41h25"/>',
  spg:'<path d="M4 30h9l4-9h19l6 9v7H4zM18 21l14-10M29 11l11-4M8 37h33"/><circle cx="14" cy="39" r="2"/><circle cx="32" cy="39" r="2"/>',
  spaa:'<path d="M4 31h9l4-8h19l6 8v6H4zM21 23l4-14M27 23l8-13M8 37h33M20 12h16"/>',
  engineer:'<path d="M8 39 21 26M16 31l-6-6 6-6 6 6M26 11l11 11M31 8l9 9M24 28l14 14"/>',
  recon:'<circle cx="20" cy="20" r="10"/><path d="M27 27l12 12M15 20h10M20 15v10"/>',
  logistics:'<path d="M5 18h23v16H5zM28 24h8l7 7v3H28z"/><circle cx="13" cy="37" r="3"/><circle cx="35" cy="37" r="3"/><path d="M10 23h12"/>',
  signal:'<path d="M24 42V18M17 42h14M10 18c4-5 8-7 14-7s10 2 14 7M5 12C10 6 16 3 24 3s14 3 19 9"/><circle cx="24" cy="18" r="3"/>',
  hospital:'<path d="M8 12h32v28H8zM24 17v18M15 26h18"/>',
  maintenance:'<path d="M8 38 21 25M17 18l7 7M28 21l8-8 4 4-8 8M11 9l7 7-5 5-7-7z"/><circle cx="29" cy="32" r="7"/><path d="M29 28v8M25 32h8"/>',
  military_police:'<path d="M24 5 39 11v12c0 10-6 17-15 21C15 40 9 33 9 23V11zM18 18h12M18 24h12M21 30h6"/>',
  support_artillery:'<circle cx="14" cy="34" r="5"/><path d="M18 31 36 18M8 34h5M20 25l-4-5M35 15l6 6"/><path d="M39 31v11M34 36h10"/>',
  support_at:'<circle cx="14" cy="34" r="5"/><path d="M18 31 39 19M11 28l5-7h9M34 16l7 6"/><path d="M37 32l6 6M43 32l-6 6"/>',
  support_aa:'<circle cx="14" cy="35" r="5"/><path d="M18 30 25 10M24 30l9-19M10 28h18"/><path d="M36 36h8M40 32v8"/>',

  fighter:'<path d="M24 4l4 16 15 6-2 5-13-3-2 15h-4l-2-15-13 3-2-5 15-6zM18 18h12"/>',
  heavy_fighter:'<path d="M24 4l6 16 14 5-2 6-13-3-3 15h-4l-3-15-13 3-2-6 14-5zM14 19h20M18 15h12"/>',
  cas:'<path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5zM11 39h11M16 34v10M32 34l7-5"/>',
  tactical_bomber:'<path d="M24 5l6 15 13 5-2 5-12-2-3 14h-4l-3-14-12 2-2-5 13-5zM16 32h16M19 36h10"/>',
  strategic_bomber:'<path d="M24 4l8 16 13 4-2 6-14-2-3 15h-4l-3-15-14 2-2-6 13-4zM10 19h28M14 34h20"/>',
  naval_bomber:'<path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5zM5 43c6-4 11 4 17 0s10 4 21 0M33 34l8-4"/>',
  scout_plane:'<path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5z"/><circle cx="36" cy="11" r="6"/><path d="M40 15l5 5"/>',
  airframe_small:'<path d="M24 5l4 15 13 5-2 5-12-2-2 14h-2l-2-14-12 2-2-5 13-5z"/>',
  airframe_medium:'<path d="M24 5l6 15 14 5-2 5-13-2-3 14h-4l-3-14-13 2-2-5 14-5zM13 20h22"/>',
  airframe_large:'<path d="M24 4l8 16 13 4-2 6-14-2-3 15h-4l-3-15-14 2-2-6 13-4zM10 19h28M15 34h18"/>',
  piston_engine:'<circle cx="24" cy="24" r="10"/><path d="M24 5v9M24 34v9M5 24h9M34 24h9M11 11l7 7M30 30l7 7M37 11l-7 7M18 30l-7 7"/>',
  jet_engine:'<path d="M5 24h27M16 15l16 9-16 9M32 17l10-5v24l-10-5zM8 19v10"/>',
  rocket_engine:'<path d="M13 8h19l5 19-8 8H16l-5-8zM18 35l-3 8M24 35v9M30 35l3 8M18 14h9"/>',
  light_mg:'<path d="M7 29h27l8-5v5l-8 5H7zM12 25V15h6v10M20 29h8M11 36h17"/>',
  heavy_mg:'<path d="M5 30h29l9-6v7l-8 6H5zM11 25V13h8v12M22 25V11h7v14M10 40h22"/>',
  cannon:'<path d="M6 31h25l12-8v6l-11 9H6zM13 26V13h9v13M25 26V16h6M10 40h25"/>',
  bomb_lock:'<path d="M8 17h32M15 17v9M33 17v9M12 27l5 12 5-12zM28 27l5 12 5-12z"/>',
  bomb_bay_small:'<path d="M13 9h22v9H13zM18 18v8M30 18v8M16 27l4 11 4-11zM26 27l4 11 4-11z"/>',
  bomb_bay_medium:'<path d="M10 9h28v10H10zM15 19v7M24 19v7M33 19v7M12 27l4 11 4-11zM20 27l4 11 4-11zM28 27l4 11 4-11z"/>',
  bomb_bay_large:'<path d="M7 8h34v11H7zM13 19v7M20 19v7M28 19v7M35 19v7M10 27l4 12 4-12zM18 27l4 12 4-12zM26 27l4 12 4-12zM34 27l4 12 4-12z"/>',
  torpedo:'<path d="M5 24h28l9-6v12l-9-6M12 19l-5-5M12 29l-5 5M18 21h8"/>',
  rocket_rail:'<path d="M8 33h31M13 28l8-16 5 16M25 28l8-14 5 14M18 11l3-6 3 6M30 13l3-6 3 6"/>',
  light_def_turret:'<path d="M10 33h28M15 33l3-12h12l3 12M21 21v-7h6v7M24 14l10-6"/>',
  heavy_def_turret:'<path d="M8 34h32M13 34l4-14h14l4 14M20 20v-8h8v8M22 12l8-8M26 12l12-5"/>',
  radar:'<path d="M24 41V25M17 41h14M13 24a11 11 0 0 1 22 0M7 20a18 18 0 0 1 34 0"/><circle cx="24" cy="24" r="3"/>',
  radio_nav:'<path d="M24 42V16M18 42h12M15 18c2-4 5-6 9-6s7 2 9 6M9 13C13 7 18 5 24 5s11 2 15 8M31 27l8 8M35 27l-4 4"/>',
  air_armor:'<path d="M24 5 40 11v11c0 11-6 18-16 22C14 40 8 33 8 22V11zM15 18h18M15 25h18M18 32h12"/>',
  self_sealing:'<path d="M12 8h22v31H12zM17 13h12v9H17zM15 29h16M20 25v9M26 25v9"/><path d="M34 15h5l4 5v12"/>',
  drop_tank:'<path d="M6 20h36M14 20l4 19h5l3-19M30 20l3 15h4l3-15M12 15h28"/>',
  fuel_tank:'<path d="M12 8h20v33H12zM16 13h12v9H16zM32 16h5l5 5v14c0 4-6 4-6 0V25"/>',
  camera:'<rect x="8" y="14" width="32" height="24" rx="3"/><circle cx="24" cy="26" r="8"/><path d="M15 14l3-5h12l3 5M35 19h2"/>',
  floats:'<path d="M8 19h32M13 19l4 12h14l4-12M9 35c5-3 9 3 14 0s9 3 16 0M20 10h8v9"/>',
  materials:'<path d="M8 36 18 12h12l10 24zM14 31h20M18 23h12M21 15h6"/>',

  tank_turret_1:'<path d="M10 32h28l-4-12H17zM21 20v-6h8l4 6M7 32h34M14 38h20"/>',
  tank_turret_2:'<path d="M8 32h32l-4-13H15zM18 19v-7h14l4 7M6 32h36M13 39h22M31 12h8"/>',
  tank_turret_3:'<path d="M6 31h36l-5-14H14zM17 17V9h17l4 8M5 31h38M11 39h27M33 9h10"/>',
  fixed_superstructure:'<path d="M6 32h36l-5-15H14l-6 15M17 17h17M27 14l16-5M8 32h33M12 39h25"/>',
  autocannon:'<path d="M7 31h24l12-8v5l-11 9H7zM13 27V17h6v10M22 27V15h5v12M8 40h24"/>',
  close_support_gun:'<circle cx="14" cy="35" r="6"/><path d="M20 31 36 22M11 28l5-7h9M31 19l8 6M34 25l6 4"/>',
  high_velocity_gun:'<circle cx="13" cy="35" r="5"/><path d="M18 31 44 14M10 29l4-7h10M37 11l7 6M28 22l11-1"/>',
  howitzer:'<circle cx="14" cy="35" r="6"/><path d="M20 31 34 17M31 14l8 7M9 28h10M22 24l-6-6"/>',
  tank_cannon_small:'<path d="M8 31h23l11-7v5l-10 8H8zM14 26V18h8v8M11 40h24"/>',
  tank_cannon_medium:'<path d="M6 31h26l12-8v6l-11 8H6zM13 26V16h10v10M10 40h27"/>',
  tank_cannon_heavy:'<path d="M4 31h29l12-9v7l-11 9H4zM11 26V14h12v12M8 41h30"/>',
  tank_cannon_super:'<path d="M3 31h30l13-10v8l-12 10H3zM10 26V12h14v14M6 42h34M28 22h13"/>',
  tank_aa_gun:'<circle cx="14" cy="36" r="5"/><path d="M18 31 25 10M24 31l9-20M10 29h18M26 13h9M31 9v8"/>',
  flamethrower:'<path d="M7 31h24l10-6v5l-9 7H7zM13 26V17h9v9M34 20c6-5 8-10 3-14 8 3 10 10 4 17"/>',
  gasoline_engine:'<circle cx="20" cy="24" r="9"/><path d="M20 6v9M20 33v9M2 24h9M29 24h10M34 12l8 8M34 36l8-8"/><path d="M37 7v8M33 11h8"/>',
  diesel_engine:'<circle cx="20" cy="24" r="9"/><path d="M20 6v9M20 33v9M2 24h9M29 24h10M34 12l8 8M34 36l8-8"/><path d="M35 8h7v7h-7z"/>',
  electric_engine:'<circle cx="20" cy="24" r="9"/><path d="M20 6v9M20 33v9M2 24h9M29 24h10"/><path d="M37 6l-6 11h7l-5 12 11-15h-7l5-8z"/>',
  bogie:'<path d="M5 29h38M9 23c5 7 10 7 15 0s10-7 15 0"/><circle cx="13" cy="36" r="4"/><circle cx="35" cy="36" r="4"/>',
  christie:'<path d="M5 30h38M8 22l8 10 8-14 8 14 8-10"/><circle cx="12" cy="37" r="3"/><circle cx="24" cy="37" r="3"/><circle cx="36" cy="37" r="3"/>',
  torsion:'<path d="M5 30h38M9 23h30M12 23l4-8 4 8 4-8 4 8 4-8 4 8"/><circle cx="13" cy="37" r="3"/><circle cx="24" cy="37" r="3"/><circle cx="35" cy="37" r="3"/>',
  interleaved:'<path d="M5 29h38M8 21h32"/><circle cx="12" cy="35" r="5"/><circle cx="20" cy="39" r="5"/><circle cx="28" cy="35" r="5"/><circle cx="36" cy="39" r="5"/>',
  riveted_armor:'<path d="M24 5 40 11v11c0 11-6 18-16 22C14 40 8 33 8 22V11z"/><circle cx="16" cy="16" r="1.5"/><circle cx="32" cy="16" r="1.5"/><circle cx="16" cy="28" r="1.5"/><circle cx="32" cy="28" r="1.5"/>',
  welded_armor:'<path d="M24 5 40 11v11c0 11-6 18-16 22C14 40 8 33 8 22V11zM14 18h20M14 26h20M18 34h12"/>',
  cast_armor:'<path d="M24 5c10 2 16 6 16 14v6c0 10-6 16-16 20C14 41 8 35 8 25v-6c0-8 6-12 16-14zM16 21c5-3 11-3 16 0"/>',
  sloped_armor:'<path d="M10 34 18 9h19l-7 25zM10 34h20M18 9l10 8M15 25h18"/>',
  tank_radio:'<path d="M11 14h26v27H11zM16 20h16M16 26h11M16 33h7M33 14l6-8M37 6l5 4"/><circle cx="32" cy="33" r="3"/>',
  stabilizer:'<circle cx="24" cy="24" r="15"/><path d="M9 24h30M24 9v30M15 15l18 18M33 15 15 33"/>',
  wet_ammo:'<path d="M10 8h28v31H10zM17 14h14v7H17zM16 29c4-7 12-7 16 0-3 6-13 6-16 0z"/>',
  squeeze_bore:'<path d="M5 24h34M10 19h18l10 5-10 5H10zM39 20l5 4-5 4"/>',
  smoke:'<path d="M8 37h30M14 34c-5-5 1-9 5-6-3-6 5-10 9-5 1-7 10-5 10 1 6-2 8 7 2 10"/>',
  extra_ammo:'<path d="M9 10h30v29H9zM15 16h7v17h-7zM26 16h7v17h-7zM15 13h7M26 13h7"/>',
  easy_maintenance:'<path d="M10 38 22 26M18 20l7 7M29 22l8-8 4 4-8 8"/><circle cx="31" cy="34" r="7"/><path d="M31 30v8M27 34h8"/>',
  additional_mg:'<path d="M7 31h27l8-6v5l-8 7H7zM12 26V17h6v9M21 26V14h6v12M30 26V18h5v8"/>',
  amphibious:'<path d="M6 26h36l-5 10H11zM12 26l5-10h15l6 10M5 42c6-4 10 4 16 0s10 4 22 0"/>',
  generic_component:'<rect x="9" y="9" width="30" height="30" rx="4"/><path d="M16 24h16M24 16v16"/>'
};

function norm(value=''){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
function words(value='',label=''){return `${String(value||'')} ${String(label||'')}`.toLowerCase().replace(/[_-]+/g,' ');}
function hash32(value=''){
  let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;
}
function stageOf(value='',label=''){
  const s=`${value} ${label}`;const m=s.match(/(?:^|[_\s-])([1-6])(?:x|$|[_\s-])/i)||s.match(/\b(?:mk\s*)?([1-6])\b/i);
  if(m)return Number(m[1]);
  const r=s.match(/\b(IV|III|II|I)\b/i);return r?({I:1,II:2,III:3,IV:4}[r[1].toUpperCase()]||0):0;
}
function variantMark(seed,label=''){
  const h=hash32(seed),code=(h%1296).toString(36).toUpperCase().padStart(2,'0'),stage=stageOf(seed,label);
  const ticks=stage?Array.from({length:Math.min(4,stage)},(_,i)=>`<path d="M${34+i*3} 5v4"/>`).join(''):'';
  const x1=8+(h%9),x2=20+((h>>>4)%9),x3=33+((h>>>8)%7);
  return `${ticks}<circle cx="${x1}" cy="44" r="1"/><circle cx="${x2}" cy="44" r="1"/><circle cx="${x3}" cy="44" r="1"/><text x="46" y="46" text-anchor="end" font-size="6" font-family="system-ui,sans-serif" font-weight="800" fill="currentColor" stroke="none">${code}</text>`;
}
function svg(key,seed,label=''){
  const body=BASE[key]||BASE.generic_component;return `<svg ${common} data-icon-key="${key}">${body}${variantMark(seed,label)}</svg>`;
}

function divisionKey(value='',label=''){
  const s=words(value,label);
  if(/support.*anti.?air|support aa/.test(s))return 'support_aa';
  if(/support.*anti.?tank|support at/.test(s))return 'support_at';
  if(/support.*artillery/.test(s))return 'support_artillery';
  if(/rocket artillery/.test(s))return 'rocket_artillery';
  if(/tank destroyer|\btd\b/.test(s))return 'tank_destroyer';
  if(/self propelled.*anti.?air|spaa/.test(s))return 'spaa';
  if(/self propelled.*artillery|\bspg\b/.test(s))return 'spg';
  if(/super heavy/.test(s))return 'superheavy_tank';
  if(/modern.*tank/.test(s))return 'modern_tank';
  if(/heavy.*tank|heavy armor|heavy armour/.test(s))return 'heavy_tank';
  if(/medium.*tank|medium armor|medium armour/.test(s))return 'medium_tank';
  if(/light.*tank|light armor|light armour/.test(s))return 'light_tank';
  if(/mechanized|mechanised/.test(s))return 'mechanized';
  if(/motorized|motorised/.test(s))return 'motorized';
  if(/mountain|mountaineer/.test(s))return 'mountaineer';
  if(/marine/.test(s))return 'marine';
  if(/paratroop|airborne/.test(s))return 'paratrooper';
  if(/cavalry/.test(s))return 'cavalry';
  if(/engineer/.test(s))return 'engineer';
  if(/maintenance/.test(s))return 'maintenance';
  if(/military police|\bmp\b/.test(s))return 'military_police';
  if(/recon/.test(s))return 'recon';
  if(/logistic/.test(s))return 'logistics';
  if(/signal/.test(s))return 'signal';
  if(/hospital|medical/.test(s))return 'hospital';
  if(/anti.?tank|\bat\b/.test(s))return 'anti_tank';
  if(/anti.?air|\baa\b/.test(s))return 'anti_air';
  if(/artillery|howitzer/.test(s))return 'artillery';
  return 'infantry';
}
function airKey(value='',label=''){
  const s=words(value,label);
  if(/heavy fighter/.test(s))return 'heavy_fighter';
  if(/strategic bomber|strat bomber/.test(s))return 'strategic_bomber';
  if(/tactical bomber|tac bomber/.test(s))return 'tactical_bomber';
  if(/naval bomber|naval strike|maritime/.test(s))return 'naval_bomber';
  if(/close air support|\bcas\b/.test(s))return 'cas';
  if(/scout|recon camera/.test(s)&&/(air|plane|aircraft|camera)/.test(s))return /camera/.test(s)?'camera':'scout_plane';
  if(/fighter/.test(s))return 'fighter';
  if(/large/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_large';
  if(/medium/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_medium';
  if(/small/.test(s)&&/(airframe|plane|aircraft)/.test(s))return 'airframe_small';
  if(/jet engine/.test(s))return 'jet_engine';
  if(/rocket engine/.test(s))return 'rocket_engine';
  if(/engine/.test(s))return 'piston_engine';
  if(/light.*machine gun|light mg|lmg/.test(s))return 'light_mg';
  if(/heavy.*machine gun|heavy mg|hmg/.test(s))return 'heavy_mg';
  if(/aircraft cannon|cannon/.test(s))return 'cannon';
  if(/bomb lock/.test(s))return 'bomb_lock';
  if(/large bomb bay/.test(s))return 'bomb_bay_large';
  if(/medium bomb bay/.test(s))return 'bomb_bay_medium';
  if(/small bomb bay|bomb bay/.test(s))return 'bomb_bay_small';
  if(/torpedo/.test(s))return 'torpedo';
  if(/rocket rail|rocket/.test(s))return 'rocket_rail';
  if(/heavy.*defen.*turret|hmg.*turret/.test(s))return 'heavy_def_turret';
  if(/defen.*turret|lmg.*turret/.test(s))return 'light_def_turret';
  if(/radio navigation/.test(s))return 'radio_nav';
  if(/radar/.test(s))return 'radar';
  if(/self.?sealing/.test(s))return 'self_sealing';
  if(/armor plate|armour plate/.test(s))return 'air_armor';
  if(/drop tank/.test(s))return 'drop_tank';
  if(/fuel tank|extra fuel/.test(s))return 'fuel_tank';
  if(/recon camera|camera/.test(s))return 'camera';
  if(/float|flying boat/.test(s))return 'floats';
  if(/non.?strategic material/.test(s))return 'materials';
  return 'scout_plane';
}
function tankKey(value='',label=''){
  const s=words(value,label);
  if(/super heavy/.test(s)&&/(chassis|tank|armor|armour)/.test(s))return 'superheavy_tank';
  if(/modern/.test(s)&&/(chassis|tank|armor|armour)/.test(s))return 'modern_tank';
  if(/heavy/.test(s)&&/(chassis|tank|armor|armour)/.test(s))return 'heavy_tank';
  if(/medium/.test(s)&&/(chassis|tank|armor|armour)/.test(s))return 'medium_tank';
  if(/light/.test(s)&&/(chassis|tank|armor|armour)/.test(s))return 'light_tank';
  if(/tank destroyer|\btd\b/.test(s))return 'tank_destroyer';
  if(/self propelled.*anti.?air|spaa/.test(s))return 'spaa';
  if(/self propelled.*artillery|\bspg\b/.test(s))return 'spg';
  if(/fixed superstructure|casemate/.test(s))return 'fixed_superstructure';
  if(/three man turret|3 man turret/.test(s))return 'tank_turret_3';
  if(/two man turret|2 man turret/.test(s))return 'tank_turret_2';
  if(/one man turret|1 man turret/.test(s))return 'tank_turret_1';
  if(/turret/.test(s))return stageOf(value,label)>=3?'tank_turret_3':stageOf(value,label)===2?'tank_turret_2':'tank_turret_1';
  if(/flame|flamethrower/.test(s))return 'flamethrower';
  if(/anti.?air|aa gun/.test(s))return 'tank_aa_gun';
  if(/high velocity/.test(s))return 'high_velocity_gun';
  if(/close support/.test(s))return 'close_support_gun';
  if(/howitzer/.test(s))return 'howitzer';
  if(/autocannon/.test(s))return 'autocannon';
  if(/super heavy cannon/.test(s))return 'tank_cannon_super';
  if(/heavy cannon/.test(s))return 'tank_cannon_heavy';
  if(/medium cannon/.test(s))return 'tank_cannon_medium';
  if(/small cannon|cannon|gun/.test(s))return 'tank_cannon_small';
  if(/petrol electric|gas electric/.test(s))return 'electric_engine';
  if(/diesel/.test(s))return 'diesel_engine';
  if(/gasoline|petrol engine/.test(s))return 'gasoline_engine';
  if(/engine/.test(s))return 'gasoline_engine';
  if(/interleav/.test(s))return 'interleaved';
  if(/torsion/.test(s))return 'torsion';
  if(/christie/.test(s))return 'christie';
  if(/bogie|leaf spring/.test(s))return 'bogie';
  if(/suspension/.test(s))return 'torsion';
  if(/riveted/.test(s))return 'riveted_armor';
  if(/welded/.test(s))return 'welded_armor';
  if(/cast armor|cast armour/.test(s))return 'cast_armor';
  if(/sloped/.test(s))return 'sloped_armor';
  if(/armor|armour/.test(s))return 'welded_armor';
  if(/radio/.test(s))return 'tank_radio';
  if(/stabilizer/.test(s))return 'stabilizer';
  if(/wet ammo/.test(s))return 'wet_ammo';
  if(/squeeze bore/.test(s))return 'squeeze_bore';
  if(/smoke/.test(s))return 'smoke';
  if(/extra ammo|additional ammo/.test(s))return 'extra_ammo';
  if(/easy maintenance|maintenance/.test(s))return 'easy_maintenance';
  if(/additional machine gun|secondary.*machine gun|machine gun/.test(s))return 'additional_mg';
  if(/amphibious/.test(s))return 'amphibious';
  return 'generic_component';
}
function contextKey(value='',label='',context=''){
  if(context==='air')return airKey(value,label);
  if(context==='tank')return tankKey(value,label);
  return divisionKey(value,label);
}

function replaceIcon(node,key,seed,label=''){
  if(!node)return;const sig=`${key}|${seed}|${label}`;if(node.dataset.itemIconSignature===sig)return;
  node.dataset.itemIconSignature=sig;node.dataset.itemIconKey=key;node.innerHTML=svg(key,seed,label);
}

function enhanceModuleTriggers(){
  document.querySelectorAll('.air-module-grid label').forEach(label=>{
    const select=label.querySelector('select'),trigger=label.querySelector('.visual-picker-trigger'),icon=trigger?.querySelector('.visual-trigger-icon');
    if(!select||!icon)return;const option=select.selectedOptions?.[0]||select.options?.[select.selectedIndex],value=option?.value||'',text=option?.textContent||'';
    replaceIcon(icon,airKey(value,text),value||text,text);
  });
  document.querySelectorAll('.tank-module-grid label').forEach(label=>{
    const select=label.querySelector('select'),trigger=label.querySelector('.visual-picker-trigger'),icon=trigger?.querySelector('.visual-trigger-icon');
    if(!select||!icon)return;const option=select.selectedOptions?.[0]||select.options?.[select.selectedIndex],value=option?.value||'',text=option?.textContent||'';
    replaceIcon(icon,tankKey(value,text),value||text,text);
  });
}
function enhanceTankTabs(){
  document.querySelectorAll('[data-tank-class]').forEach(button=>{
    const id=button.dataset.tankClass||'',icon=button.querySelector('.designer-tab-icon');if(!icon)return;
    replaceIcon(icon,tankKey(`${id}_tank_chassis`,id),`${id}_tank_chassis`,id);
  });
  document.querySelectorAll('[data-tank-role]').forEach(button=>{
    const id=button.dataset.tankRole||'',icon=button.querySelector('.designer-tab-icon');if(!icon)return;
    replaceIcon(icon,tankKey(id,id),`role_${id}`,id);
  });
  document.querySelectorAll('.tank-silhouette-icon').forEach(icon=>{
    const family=document.querySelector('[data-tank-class].active')?.dataset.tankClass||'medium',role=document.querySelector('[data-tank-role].active')?.dataset.tankRole||'armor',seed=`${family}_${role}_tank`;
    replaceIcon(icon,tankKey(seed,`${family} ${role}`),seed,`${family} ${role}`);
  });
}
function enhanceAirRoles(){
  document.querySelectorAll('.aircraft-role span').forEach(span=>{
    const text=span.querySelector('b')?.textContent||span.textContent||'',icon=span.querySelector('i');if(!icon)return;
    replaceIcon(icon,airKey(text,text),`air_role_${norm(text)}`,text);
  });
}
function enhanceDivision(){
  document.querySelectorAll('.picker-choice[data-choice]').forEach(button=>{
    const value=button.dataset.choice||'',label=button.querySelector('small')?.textContent||button.title||'',icon=button.querySelector('.division-unit-icon');
    replaceIcon(icon,divisionKey(value,label),value||label,label);
  });
  document.querySelectorAll('.hoi-battalion-slot.filled,.regimental-support.filled').forEach(button=>{
    const label=button.querySelector('small')?.textContent||button.title||'',icon=button.querySelector('.picture-unit-symbol');
    replaceIcon(icon,divisionKey(label,label),norm(label)||label,label);
  });
}
function enhanceModal(){
  const modal=document.getElementById('visual-picker-modal');if(!modal||modal.hidden)return;
  const title=modal.querySelector('#visual-picker-title')?.textContent||'',titleWords=title.toLowerCase();
  let context=/air|airframe|aircraft|weapon|bomb|torpedo|special/.test(titleWords)?'air':/tank|chassis|turret|suspension|armor|armour/.test(titleWords)?'tank':'';
  modal.querySelectorAll('.visual-option').forEach((card,index)=>{
    const label=card.querySelector('.visual-option-copy b')?.textContent||'',sub=card.querySelector('.visual-option-copy small')?.textContent||'',icon=card.querySelector('.visual-option-icon');
    if(!icon)return;let local=context;if(!local){const combined=`${label} ${sub}`;if(airKey(combined,combined)!=='scout_plane')local='air';else if(tankKey(combined,combined)!=='generic_component')local='tank';}
    if(!local)return;const seed=`${norm(sub||label)}_${index}`,key=contextKey(sub||label,label,local);replaceIcon(icon,key,seed,label);
  });
}
function enhance(){
  enhanceModuleTriggers();enhanceTankTabs();enhanceAirRoles();enhanceDivision();enhanceModal();
}
registerUiEnhancer(enhance);
