import { itemIconKey, itemIconSvg } from './item-icons.js';
import { sourceIconHint } from './source-icon-hints.js';

/*
 * Planner-owned HOI4-style icon renderer.
 * These are original SVG silhouettes, not extracted Paradox artwork. The intent is
 * to match the visual language of the HOI4 designers more closely: equipment is
 * shown as a recognizable vehicle/aircraft/module model inside a dark stamped plate.
 */

const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const stageOf=(value,label='')=>{
  const s=`${value||''} ${label||''}`.toLowerCase();
  const x=s.match(/(?:^|[_\s-])(\d+)(?:x|\b|$)/);if(x)return Math.max(1,Math.min(9,+x[1]||1));
  if(/\biv\b|advanced/.test(s))return 4;if(/\biii\b/.test(s))return 3;if(/\bii\b|improved/.test(s))return 2;if(/\bi\b|basic/.test(s))return 1;return 0;
};
const hash32=s=>{let h=2166136261;for(const c of String(s||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const inner=markup=>String(markup||'').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');

function identityMark(seed,stage=0){
  const h=hash32(seed),roman=['','I','II','III','IV','V','VI','VII','VIII','IX'][stage]||'';
  const dots=[0,1,2].map(i=>{const x=7+(((h>>>(i*4))&7)*4.6),y=42-(((h>>>(i*5+3))&1)*3);return `<circle class="hoi-id-rivet" cx="${x.toFixed(1)}" cy="${y}" r="1.1"/>`;}).join('');
  return `${dots}${roman?`<text class="hoi-stage" x="41" y="10" text-anchor="end">${roman}</text>`:''}`;
}

function plate(body,seed,kind,stage=0){
  return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" class="hoi-model-icon hoi-model-${kind}" data-icon-id="${esc(norm(seed))}">
    <rect class="hoi-model-plate" x="2.5" y="2.5" width="43" height="43" rx="2.5"/>
    <path class="hoi-model-bevel" d="M5 7h38M5 41h38M7 5v38M41 5v38"/>
    ${body}${identityMark(seed,stage)}
  </svg>`;
}

const wheels=(xs=[11,18,25,32,39],y=36,r=3)=>xs.map(x=>`<circle class="hoi-wheel" cx="${x}" cy="${y}" r="${r}"/>`).join('');
function tankBody(key,stage){
  const light=key==='light_tank',heavy=key==='heavy_tank'||key==='superheavy_tank'||key==='land_cruiser';
  const modern=key==='modern_tank',amp=key==='amphibious_tank';
  const trackY=heavy?33:34,trackH=heavy?8:7;
  let upper='';
  if(key==='tank_destroyer') upper='<path class="hoi-fill" d="M13 29 18 20h18l5 9z"/><path class="hoi-barrel" d="M31 21 45 14"/>';
  else if(key==='spg') upper='<path class="hoi-fill" d="M12 29 17 22h18l5 7z"/><path class="hoi-barrel" d="M27 22 39 10"/><path class="hoi-detail" d="M34 10h7"/>';
  else if(key==='spaa') upper='<path class="hoi-fill" d="M13 29 18 22h17l5 7z"/><path class="hoi-barrel" d="M25 22 29 9M31 22 38 11"/><path class="hoi-detail" d="M27 12h12"/>';
  else if(key==='flame_tank') upper='<path class="hoi-fill" d="M15 29 18 21h15l5 8z"/><path class="hoi-barrel" d="M30 21 43 18"/><path class="hoi-flame" d="M41 17c-2-4 2-7 4-10 3 5 2 9-1 11"/>';
  else {
    const tx=light?18:heavy?17:18,tw=light?13:heavy?18:16,ty=heavy?16:modern?17:18,th=heavy?9:8;
    upper=`<path class="hoi-fill" d="M${tx-2} ${ty+th}  ${tx+1} ${ty}h${tw-3}l5 ${th}z"/><rect class="hoi-fill" x="${tx}" y="${ty-4}" width="${tw-4}" height="${th-3}" rx="${modern?1:2}"/><path class="hoi-barrel" d="M${tx+tw-4} ${ty-1} ${heavy?46:44} ${modern?13:ty-2}"/>`;
  }
  const hull=heavy?'M5 28h37l3 6H4z':modern?'M6 29 13 23h25l5 6-3 5H7z':amp?'M7 29 13 23h24l5 6v5H6z':'M7 29 13 23h25l5 6v5H6z';
  const water=amp?'<path class="hoi-water" d="M5 42c5-3 8 3 13 0s8 3 13 0 8 3 12 0"/>':'';
  const wheelXs=heavy?[9,16,23,30,37,43]:light?[12,20,28,36]:[10,17,24,31,38];
  return `<path class="hoi-track" d="M5 ${trackY}h38l-3 ${trackH}H8z"/>${wheels(wheelXs,trackY+3.4,light?2.4:2.7)}<path class="hoi-hull" d="${hull}"/>${upper}<path class="hoi-detail" d="M10 31h27M14 26h8"/>${water}`;
}

function airBody(key){
  const strategic=key==='strategic_bomber'||key==='airframe_large'||key==='transport_air';
  const tactical=key==='tactical_bomber'||key==='airframe_medium';
  const naval=key==='naval_bomber',scout=key==='scout_air',cas=key==='cas';
  const wing=strategic?20:tactical?17:14,tail=strategic?8:6;
  let body=`<path class="hoi-fill" d="M24 5 27 20 ${24+wing} 26 42 31 28 29 27 40 31 44 24 42 17 44 21 40 20 29 6 31 4 26 21 20z"/>`;
  body+=`<path class="hoi-detail" d="M24 7v32M${24-wing} 26h${wing*2}"/>`;
  if(cas)body+='<path class="hoi-weapon" d="M11 35v8M16 34v9"/>';
  if(naval)body+='<path class="hoi-weapon" d="M31 34 41 39M6 43c6-3 10 3 16 0s10 3 20 0"/>';
  if(scout)body+='<circle class="hoi-lens" cx="36" cy="12" r="5"/><path class="hoi-detail" d="M39 15l4 4"/>';
  if(strategic)body+=`<path class="hoi-detail" d="M12 ${34-tail}h24M17 34h14"/>`;
  return body;
}

function gunBody(key,stage){
  const heavy=/heavy|howitzer/.test(key),hv=/velocity/.test(key),aa=/antiair|anti_air/.test(key),mg=/mg|machine/.test(key);
  const barrel=hv?45:heavy?42:40,width=mg?3:heavy?6:4;
  return `<path class="hoi-fill" d="M8 30h18l6-6h7v7l-8 7H8z"/><rect class="hoi-fill" x="13" y="18" width="${width+7}" height="11" rx="1"/><path class="hoi-barrel" d="M${20+width} 22 ${barrel} ${aa?9:heavy?13:17}"/>${aa?'<path class="hoi-barrel" d="M24 22 34 8"/>':''}<circle class="hoi-wheel" cx="15" cy="37" r="4"/><circle class="hoi-wheel" cx="29" cy="37" r="4"/><path class="hoi-detail" d="M10 42h24"/>`;
}

function turretBody(key){
  const fixed=key==='fixed_superstructure',crew=key==='turret_three'?3:key==='turret_two'?2:1;
  if(fixed)return '<path class="hoi-fill" d="M7 33 14 16h23l5 17z"/><path class="hoi-barrel" d="M28 18 45 10"/><path class="hoi-detail" d="M12 30h27"/>';
  return `<path class="hoi-fill" d="M8 34 13 18h25l4 16z"/><rect class="hoi-fill" x="17" y="12" width="${12+crew*2}" height="10" rx="${crew}"/><path class="hoi-barrel" d="M${29+crew*2} 16 45 11"/>${Array.from({length:crew},(_,i)=>`<circle class="hoi-detail-fill" cx="${20+i*6}" cy="17" r="1.4"/>`).join('')}`;
}

function suspensionBody(key){
  const count=key==='interleaved'?6:key==='bogie'?4:5,xs=Array.from({length:count},(_,i)=>9+i*(30/(count-1)));
  const extra=key==='christie'?'<path class="hoi-detail" d="M7 20c7 10 13 10 19 0s10-8 16 0"/>':key==='torsion'?'<path class="hoi-detail" d="M9 21l5 6 5-6 5 6 5-6 5 6 5-6"/>':'<path class="hoi-detail" d="M8 22h32"/>';
  return `${extra}<path class="hoi-track" d="M6 28h36v11H6z"/>${wheels(xs,34,key==='interleaved'?3.1:3.4)}`;
}

function armorBody(key){
  if(key==='sloped_armor')return '<path class="hoi-fill" d="M9 37 17 11h24l-8 26z"/><path class="hoi-detail" d="M14 30h21M17 21h21"/>';
  const shape=key==='cast'?'<path class="hoi-fill" d="M24 6c9 2 16 7 16 13v7c0 9-6 14-16 18-10-4-16-9-16-18v-7c0-6 7-11 16-13z"/>':'<path class="hoi-fill" d="M24 5 40 12v13c0 9-6 15-16 19C14 40 8 34 8 25V12z"/>';
  const detail=key==='riveted'?'<g class="hoi-detail-fill"><circle cx="16" cy="19" r="1.4"/><circle cx="24" cy="19" r="1.4"/><circle cx="32" cy="19" r="1.4"/><circle cx="16" cy="29" r="1.4"/><circle cx="24" cy="29" r="1.4"/><circle cx="32" cy="29" r="1.4"/></g>':'<path class="hoi-detail" d="M15 20h18M15 29h18"/>';
  return shape+detail;
}

function engineBody(key){
  if(key==='petrol_electric')return '<circle class="hoi-fill" cx="18" cy="24" r="10"/><path class="hoi-detail" d="M18 15v18M9 24h18M28 24h11M34 15v18M39 19l5 5-5 5"/>';
  if(key==='diesel_engine')return '<path class="hoi-fill" d="M8 14h31v24H8z"/><path class="hoi-detail" d="M13 19h21v14H13zM17 9v5M30 9v5M16 25h14M17 38v5M30 38v5"/>';
  return '<circle class="hoi-fill" cx="24" cy="24" r="11"/><circle class="hoi-cut" cx="24" cy="24" r="4"/><path class="hoi-detail" d="M24 6v10M24 32v10M6 24h10M32 24h10M11 11l7 7M30 30l7 7M37 11l-7 7M18 30l-7 7"/>';
}

function airModuleBody(key){
  if(key==='prop_engine')return '<circle class="hoi-fill" cx="24" cy="24" r="6"/><path class="hoi-fill" d="M22 5c7 8 6 14 2 19-4-5-5-11-2-19zM43 22c-8 7-14 6-19 2 5-4 11-5 19-2zM26 43c-7-8-6-14-2-19 4 5 5 11 2 19zM5 26c8-7 14-6 19-2-5 4-11 5-19 2z"/>';
  if(key==='jet_engine')return '<path class="hoi-fill" d="M7 18h25l10 6-10 6H7z"/><path class="hoi-detail" d="M14 18l5-8M14 30l5 8M31 19l8-7M31 29l8 7"/>';
  if(key==='rocket_engine')return '<path class="hoi-fill" d="M17 7h14l6 19-7 9H18l-7-9z"/><path class="hoi-flame" d="M20 35l-5 9M24 35v10M28 35l5 9"/>';
  if(key==='bomb_locks'||key==='bomb_bay')return '<path class="hoi-fill" d="M8 11h32v12H8z"/><path class="hoi-detail" d="M14 23v7M24 23v10M34 23v7"/><path class="hoi-fill" d="M11 30l3 9 3-9M21 33l3 10 3-10M31 30l3 9 3-9"/>';
  if(key==='torpedo')return '<path class="hoi-fill" d="M6 21h28l8-5v16l-8-5H6z"/><path class="hoi-detail" d="M14 21l-6-6M14 27l-6 6"/>';
  if(key==='radar')return '<path class="hoi-detail" d="M24 41V24M17 41h14M13 23a11 11 0 0 1 22 0M7 19a18 18 0 0 1 34 0"/><circle class="hoi-fill" cx="24" cy="24" r="3"/>';
  if(key==='recon_camera')return '<rect class="hoi-fill" x="8" y="15" width="32" height="24" rx="2"/><circle class="hoi-cut" cx="24" cy="27" r="8"/><circle class="hoi-detail" cx="24" cy="27" r="5"/><path class="hoi-detail" d="M15 15l3-6h12l3 6"/>';
  if(key==='drop_tank'||key==='extra_fuel'||key==='self_sealing')return '<path class="hoi-fill" d="M17 7h14l5 14-6 19H18l-6-19z"/><path class="hoi-detail" d="M24 7V3M24 40v4M17 22h14"/>';
  if(key==='defensive_turret_air')return '<circle class="hoi-fill" cx="24" cy="28" r="10"/><path class="hoi-barrel" d="M17 23 12 9M24 19V5M31 23 36 9"/><path class="hoi-detail" d="M14 38h20"/>';
  if(key==='light_mg_air'||key==='heavy_mg_air'||key==='cannon_air')return gunBody(key,0);
  return null;
}

function supportBody(key){
  if(key==='infantry')return '<circle class="hoi-fill" cx="17" cy="10" r="4"/><path class="hoi-detail" d="M17 14v15M17 20l-7 7M17 20l8 7M17 29l-6 12M17 29l8 12M30 10l8 33"/>';
  if(key==='motorized'||key==='logistics')return '<path class="hoi-fill" d="M5 19h25v15H5zM30 24h7l6 6v4H30z"/><circle class="hoi-wheel" cx="13" cy="37" r="4"/><circle class="hoi-wheel" cx="35" cy="37" r="4"/><path class="hoi-detail" d="M10 24h12"/>';
  if(key==='mechanized')return '<path class="hoi-fill" d="M5 20h30l8 8v7H5zM11 20l5-7h14l6 7"/><path class="hoi-track" d="M7 34h34v7H7z"/>${wheels([12,20,28,36],37,2.6)}';
  if(key==='mountaineer')return '<path class="hoi-fill" d="M4 40 18 13l8 13 6-9 12 23z"/><path class="hoi-detail" d="M14 25l4 4 5-5M29 40l4-10 5 6"/>';
  if(key==='marine')return '<path class="hoi-detail" d="M24 7v28M16 15h16M12 35c5 8 19 8 24 0M8 31h9M31 31h9"/><circle class="hoi-fill" cx="24" cy="10" r="3"/>';
  if(key==='paratrooper')return '<path class="hoi-fill" d="M6 18c6-13 30-13 36 0-5-3-9-3-13 0-3-3-7-3-10 0-4-3-8-3-13 0z"/><path class="hoi-detail" d="M11 18l10 13M37 18 27 31M24 18v13"/><circle class="hoi-fill" cx="24" cy="35" r="3"/>';
  if(key==='artillery'||key==='antitank'||key==='antiair')return gunBody(key,0);
  return null;
}

function genericFallback(value,label,context,fallback){
  return `<g class="hoi-fallback">${inner(itemIconSvg(value,label,context,fallback))}</g>`;
}

export function hoi4ModelIconSvg(value='',label='',context='',fallback='generic',slot=''){
  const hint=sourceIconHint(value,label,context,slot),key=itemIconKey(value,hint,context),stage=stageOf(value,label),seed=value||label||key;
  let body=null,kind='module';
  if(['light_tank','medium_tank','heavy_tank','superheavy_tank','modern_tank','amphibious_tank','land_cruiser','tank_destroyer','spg','spaa','flame_tank'].includes(key)){body=tankBody(key,stage);kind='tank';}
  else if(['fighter','cas','naval_bomber','tactical_bomber','strategic_bomber','scout_air','transport_air','airframe_small','airframe_medium','airframe_large'].includes(key)){body=airBody(key);kind='aircraft';}
  else if(['hmg_tank','small_cannon','close_support_gun','high_velocity_gun','medium_cannon','improved_medium_cannon','tank_howitzer','heavy_cannon'].includes(key)){body=gunBody(key,stage);kind='weapon';}
  else if(['turret_one','turret_two','turret_three','fixed_superstructure'].includes(key)){body=turretBody(key);kind='turret';}
  else if(['bogie','christie','torsion','interleaved'].includes(key)){body=suspensionBody(key);kind='suspension';}
  else if(['riveted','welded','cast','sloped_armor','air_armor'].includes(key)){body=armorBody(key==='air_armor'?'welded':key);kind='armor';}
  else if(['gasoline_engine','diesel_engine','petrol_electric'].includes(key)){body=engineBody(key);kind='engine';}
  else {body=airModuleBody(key);if(body)kind='air-module';}
  if(!body){body=supportBody(key);if(body)kind='unit';}
  if(!body)body=genericFallback(value,hint,context,fallback);
  return plate(body,seed,kind,stage);
}

export function hoi4ModelIconKey(value='',label='',context='',slot=''){
  return itemIconKey(value,sourceIconHint(value,label,context,slot),context);
}
