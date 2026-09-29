import { HOI4_ICON_ATLAS, HOI4_ICON_CELLS, HOI4_ICON_INDEX } from './hoi4-icon-atlas.js';

const MODULE_URL=new URL(import.meta.url);
const ATLAS_ASSET_URL=new URL('../hoi4-icons.webp',MODULE_URL);
ATLAS_ASSET_URL.search=MODULE_URL.search;
const ATLAS_URL=ATLAS_ASSET_URL.href;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').trim().toLowerCase().replace(/^gfx_/,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const has=key=>HOI4_ICON_INDEX.has(key);

const UNIT_ALIASES={
  mountaineer:'mountaineers',mountain:'mountaineers',paratroopers:'paratrooper',
  signal:'signal_company',logistics:'logistics_company',maintenance:'maintenance_company',hospital:'field_hospital',
  support_artillery:'artillery',support_anti_tank:'anti_tank',support_at:'anti_tank',support_anti_air:'anti_air',support_aa:'anti_air',
  antitank:'anti_tank',antiair:'anti_air',motorized_artillery:'mot_artillery_brigade',motorised_artillery:'mot_artillery_brigade',
  motorized_rocket_artillery:'mot_rocket_artillery_brigade',motorised_rocket_artillery:'mot_rocket_artillery_brigade',
  rocket_artillery_battalion:'rocket_artillery_brigade'
};
const AIR_ROLE_ALIASES={
  fighter:'fighter',air_superiority:'fighter',interceptor:'interceptor',
  cas:'cas',close_air_support:'cas',naval_bomber:'naval_bomber',naval_strike:'naval_bomber',
  tactical_bomber:'tactical_bomber',strategic_bomber:'strategic_bomber',scout_air:'scout_plane',scout_plane:'scout_plane',
  maritime_patrol:'maritime_patrol_plane',maritime_patrol_plane:'maritime_patrol_plane'
};
const TANK_ROLE_ALIASES={
  anti_tank:'anti_tank',tank_destroyer:'anti_tank',td:'anti_tank',artillery:'artillery',sp_artillery:'artillery',spg:'artillery',
  anti_air:'anti_air',sp_anti_air:'anti_air',spaa:'anti_air',flame:'flame',flame_tank:'flame',amphibious:'amphibious'
};
const ARCHETYPE_ALIASES={
  infantry:'infantry_equipment',infantry_equipment:'infantry_equipment',support_equipment:'support_equipment',
  motorized_equipment:'motorized_equipment',motorised_equipment:'motorized_equipment',artillery_equipment:'artillery_equipment',
  rocket_artillery_equipment:'rocket_artillery_equipment',anti_tank_equipment:'anti_tank_equipment',anti_air_equipment:'anti_air_equipment',
  light_tank_equipment:'light_tank_equipment',medium_tank_equipment:'medium_tank_equipment',heavy_tank_equipment:'heavy_tank_equipment',
  modern_tank_equipment:'modern_tank_equipment',super_heavy_tank_equipment:'super_heavy_tank_equipment',armored_car_equipment:'armored_car_equipment',
  fighter_equipment:'fighter_equipment',heavy_fighter_equipment:'heavy_fighter_equipment',cas_equipment:'CAS_equipment',strat_bomber_equipment:'strat_bomber_equipment'
};

function tankFamily(value=''){
  const s=norm(value);
  if(/land_cruiser/.test(s))return 'land_cruiser';
  if(/super_heavy/.test(s))return 'super_heavy';
  if(/modern/.test(s))return 'modern';
  if(/amphibious/.test(s))return 'amphibious';
  if(/heavy/.test(s))return 'heavy';
  if(/medium/.test(s))return 'medium';
  if(/light/.test(s))return 'light';
  return '';
}

function candidates(value='',label='',context='',slot=''){
  const id=norm(value),shown=norm(label),where=norm(slot),out=[];
  const add=k=>{if(k&&!out.includes(k))out.push(k);};

  add(`module:${id}`);
  add(`unit:${id}`);
  add(`airframe:${id}`);
  add(`archetype:${id}`);

  if(context==='armor'){
    const family=tankFamily(id||shown);
    if(/tank_chassis/.test(id)&&family){
      if(['light','medium','heavy'].includes(family))add(`tankframe:${family}_tank_chassis`);
      add(`tankrole:${family}_tank_chassis`);
    }
    if(['light_tank','medium_tank','heavy_tank','modern_tank','super_heavy_tank','superheavy_tank','amphibious_tank','land_cruiser'].includes(id)){
      const f=tankFamily(id);
      add(`tankrole:${f}_tank_chassis`);
      if(['light','medium','heavy'].includes(f))add(`tankframe:${f}_tank_chassis`);
      const unit={modern:'modern_armor',super_heavy:'super_heavy_armor',amphibious:'amphibious_armor',land_cruiser:'land_cruiser'}[f];
      add(unit&&`unit:${unit}`);
    }
    add(TANK_ROLE_ALIASES[id]&&`tankrole:${TANK_ROLE_ALIASES[id]}`);
  }

  if(context==='air'){
    add(AIR_ROLE_ALIASES[id]&&`airrole:${AIR_ROLE_ALIASES[id]}`);
    if(id==='airframe_small'||id==='small_airframe'||id==='small_plane_airframe')add('airframe:small_plane_airframe_1');
    if(id==='airframe_medium'||id==='medium_airframe'||id==='medium_plane_airframe')add('airframe:medium_plane_airframe_1');
    if(id==='airframe_large'||id==='large_airframe'||id==='large_plane_airframe')add('airframe:large_plane_airframe_1');
  }

  if(context==='infantry'||context==='support'){
    add(UNIT_ALIASES[id]&&`unit:${UNIT_ALIASES[id]}`);
    add(UNIT_ALIASES[shown]&&`unit:${UNIT_ALIASES[shown]}`);
  }

  add(ARCHETYPE_ALIASES[id]&&`archetype:${ARCHETYPE_ALIASES[id]}`);

  add(`unit:${shown}`);
  add(`module:${shown}`);
  add(AIR_ROLE_ALIASES[shown]&&`airrole:${AIR_ROLE_ALIASES[shown]}`);
  add(TANK_ROLE_ALIASES[shown]&&`tankrole:${TANK_ROLE_ALIASES[shown]}`);
  if(/terrain/.test(where))add(`terrain:${shown}`);
  return out;
}

export function hoi4SourceIcon(value='',label='',context='',slot=''){
  for(const key of candidates(value,label,context,slot)){
    if(!has(key))continue;
    const position=HOI4_ICON_INDEX.get(key),index=HOI4_ICON_CELLS[position];
    const x=(index%HOI4_ICON_ATLAS.columns)*HOI4_ICON_ATLAS.cellWidth;
    const y=Math.floor(index/HOI4_ICON_ATLAS.columns)*HOI4_ICON_ATLAS.cellHeight;
    return {key,x,y,...HOI4_ICON_ATLAS};
  }
  return null;
}

export function hoi4SourceIconSvg(value='',label='',context='',slot=''){
  const icon=hoi4SourceIcon(value,label,context,slot);if(!icon)return '';
  const {key,x,y,width,height,cellWidth,cellHeight}=icon;
  return `<svg viewBox="0 0 ${cellWidth} ${cellHeight}" aria-hidden="true" focusable="false" class="hoi-model-icon hoi-source-icon" data-source-icon="${esc(key)}"><image href="${esc(ATLAS_URL)}" x="-${x}" y="-${y}" width="${width}" height="${height}"/></svg>`;
}

export function hoi4SourceFallbackSvg(context='',kind='generic'){
  const k=norm(kind),ctx=String(context||'');
  if(ctx==='armor'||/armor|tank|antitank|antiair|artillery/.test(k)){
    if(/antitank/.test(k))return hoi4SourceIconSvg('tank_destroyer','Tank Destroyer','armor','Fallback');
    if(/antiair/.test(k))return hoi4SourceIconSvg('sp_anti_air','SP Anti-Air','armor','Fallback');
    if(/artillery/.test(k))return hoi4SourceIconSvg('sp_artillery','SP Artillery','armor','Fallback');
    return hoi4SourceIconSvg('medium_tank','Medium Tank','armor','Fallback');
  }
  if(ctx==='air'||/air|fighter|bomber/.test(k))return hoi4SourceIconSvg('fighter','Fighter','air','Fallback');
  if(/support|industry|generic/.test(k))return hoi4SourceIconSvg('support_equipment','Support Equipment','generic','Fallback');
  return hoi4SourceIconSvg('infantry','Infantry','infantry','Fallback');
}
