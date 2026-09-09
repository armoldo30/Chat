from pathlib import Path
import re


def update(path, fn):
    p = Path(path)
    old = p.read_text()
    new = fn(old)
    if new != old:
        p.write_text(new)
        print(f'updated {path}')
    else:
        print(f'no changes {path}')


def harden_designer(s):
    # Air modules must carry the same real 1.19.2 prerequisite index as tank modules.
    s = s.replace("const bucket=airModuleBucket(m);if(bucket)out[bucket][m.id]=moduleRecord(m);", "const bucket=airModuleBucket(m);if(bucket)out[bucket][m.id]=moduleRecord(m,pack);")
    return s


def harden_main(s):
    if 'function requirementInfo(record)' not in s:
        s, n = re.subn(
            r"function requirementBadge\(record\)\{.*?\}\n(?=function pickerBattalionMeta)",
            "function requirementInfo(record){const req=prerequisiteText(record);return req?`Requirements (informational only): ${req}`:'';}\nfunction requirementBadge(record){const info=requirementInfo(record);return info?`<em class=\"req-info\" title=\"${esc(info)}\">ⓘ req</em>`:'';}\n",
            s, count=1, flags=re.S)
        if n != 1:
            raise SystemExit('requirementBadge marker not found')

    s, n = re.subn(
        r"function pickerSupportMeta\(side,key\)\{.*?\}\n(?=function supportSlot)",
        '''function pickerSupportMeta(side,key){
  const u=techData(side).supports[key];if(!u)return '';
  const ic=templateIC({need:u.need||{}},side);
  return `<span class="picker-meta"><em>${fmt(u.soft||0,0)} SA</em><em>${fmt(u.def||0,0)} DEF</em>${u.piercing?`<em>${fmt(u.piercing,0)} pierce</em>`:''}<em>${fmt(ic,0)} IC</em>${requirementBadge(u)}</span>`;
}
''', s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit('pickerSupportMeta marker not found')

    s, n = re.subn(
        r"function supportSlot\(side,i\)\{.*?\}\n(?=function regimentalSupportSlot)",
        '''function supportSlot(side,i){
  const key=state[side+'Supports'][i];
  if(!key)return `<button class="hoi-support-slot empty" data-sslot="${i}" title="Add support company"><span>+</span><small>Support</small></button>`;
  const info=requirementInfo(supports[key]);
  return `<button class="hoi-support-slot filled tone-${battalionTone(key)} ${info?'prereq-info':''}" data-sslot="${i}" title="${esc(supports[key]?.name||key)}${info?' · '+esc(info):''}"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}${info?' · ⓘ':''}</small></button>`;
}
''', s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit('supportSlot marker not found')

    s, n = re.subn(
        r"function regimentalSupportSlot\(side,c,filled\)\{.*?\}\n(?=function regimentColumn)",
        '''function regimentalSupportSlot(side,c,filled){
  const key=state[side+'RegimentalSupports'][c];
  if(filled<3)return `<button class="regimental-support locked" disabled title="Requires at least 3 line battalions in this regiment"><span>◆</span><small>Requires 3 battalions</small></button>`;
  if(!key)return `<button class="regimental-support available" data-rslot="${c}" title="Add regimental support"><span>+</span><small>Regimental support</small></button>`;
  const info=requirementInfo(supports[key]);
  return `<button class="regimental-support available filled tone-${battalionTone(key)} ${info?'prereq-info':''}" data-rslot="${c}" title="${esc(supports[key]?.name||key)}${info?' · '+esc(info):''}"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}${info?' · ⓘ':''}</small></button>`;
}
''', s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit('regimentalSupportSlot marker not found')

    s, n = re.subn(
        r"function regimentColumn\(side,c\)\{.*?\}\n(?=function designerPicker)",
        '''function regimentColumn(side,c){
  const grid=state[side+'Grid'],filled=filledInRegiment(grid,c);
  const group=regimentGroup(side,c);return `<div class="hoi-regiment"><div class="regiment-title"><span>REGIMENT ${c+1}${group?` · ${group.toUpperCase()}`:''}</span><b>${filled}/5</b></div><div class="regiment-slots">${grid[c].map((type,r)=>{if(!type)return `<button class="hoi-battalion-slot empty" data-bslot="1" data-c="${c}" data-r="${r}" title="Add battalion"><span>+</span><small>Add</small></button>`;const info=requirementInfo(battalions[type]);return `<button class="hoi-battalion-slot filled tone-${battalionTone(type)} ${info?'prereq-info':''}" data-bslot="1" data-c="${c}" data-r="${r}" title="${esc(battalions[type].name)}${info?' · '+esc(info):''}"><span class="unit-symbol">${BATTALION_CODES[type]||'BAT'}</span><small>${esc(battalions[type].name)}${info?' · ⓘ':''}</small></button>`;}).join('')}</div>${regimentalSupportSlot(side,c,filled)}</div>`;
}
''', s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit('regimentColumn marker not found')

    # Picker choices use actual file-derived requirements; no research selection disables them.
    s = s.replace("const unmet=!techAvailable('support',k,state[side+'Tech']);return `<button class=\"picker-choice ${unmet?'tech-prereq':''}\" data-choice=\"${k}\" ${used.has(k)&&k!==current?'disabled':''} title=\"${unmet?'Prerequisite not selected; available for theorycrafting':''}\"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(v.name)}${unmet?' · prerequisite':''}</small>${pickerSupportMeta(side,k)}</button>`;", "const info=requirementInfo(v);return `<button class=\"picker-choice ${info?'prereq-info':''}\" data-choice=\"${k}\" ${used.has(k)&&k!==current?'disabled':''} title=\"${esc(info)}\"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(v.name)}${info?' · ⓘ':''}</small>${pickerSupportMeta(side,k)}</button>`;")
    s = s.replace("<p class=\"muted\">Conservative 1.19 baseline: weapon support only. Imported game data will expand the full company list and exact regiment compatibility.</p>", "<p class=\"muted\">Bundled 1.19.2 support definitions are active. Structural regiment compatibility is enforced; research, DLC and Special Project requirements are informational only.</p>")
    s = s.replace("const unmet=!techAvailable('support',k,state[side+'Tech']);return `<button class=\"picker-choice tone-fire ${unmet?'tech-prereq':''}\" data-choice=\"${k}\" title=\"${unmet?'Prerequisite not selected; available for theorycrafting':''}\"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(supports[k]?.name||k)}${unmet?' · prerequisite':''}</small>${pickerSupportMeta(side,k)}</button>`;", "const info=requirementInfo(supports[k]);return `<button class=\"picker-choice tone-fire ${info?'prereq-info':''}\" data-choice=\"${k}\" title=\"${esc(info)}\"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(supports[k]?.name||k)}${info?' · ⓘ':''}</small>${pickerSupportMeta(side,k)}</button>`;")
    s = s.replace("const unmet=!techAvailable('battalion',k,state[side+'Tech']);return `<button class=\"picker-choice tone-${battalionTone(k)} ${unmet?'tech-prereq':''}\" data-choice=\"${k}\" title=\"${unmet?'Prerequisite not selected; available for theorycrafting':''}\"><b>${BATTALION_CODES[k]||'BAT'}</b><small>${esc(battalions[k].name)}${unmet?' · prerequisite':''}</small>${pickerBattalionMeta(side,k)}</button>`;", "const info=requirementInfo(battalions[k]);return `<button class=\"picker-choice tone-${battalionTone(k)} ${info?'prereq-info':''}\" data-choice=\"${k}\" title=\"${esc(info)}\"><b>${BATTALION_CODES[k]||'BAT'}</b><small>${esc(battalions[k].name)}${info?' · ⓘ':''}</small>${pickerBattalionMeta(side,k)}</button>`;")

    s = s.replace('Built-in module numbers are a transparent analytical baseline. Exact chassis/modules/upgrades will be supplied by imported game files once the module resolver is active.', 'Bundled 1.19.2 chassis, module and upgrade data are active. Requirements are informational; executable-only module aggregation remains explicitly analytical where the files do not define the behavior.')
    s = s.replace('1.19.3 is announced but not yet public as of this model snapshot, so this build does not silently mix future balance changes into the 1.19.2 baseline.', 'This release is intentionally locked to the supplied vanilla HOI4 1.19.2 game files. Newer patch data is not mixed into the 0.15.0 model.')
    s = s.replace('Not yet executable-parity: combat tactics/counters, true per-division reinforcement timing and coordination, exact CAS direct damage, commander traits, weather, experience, complete exact 1.19.2 equipment/technology/doctrine scripted data, the full regimental-support compatibility rules, exact imported tank/air module compatibility, executable-parity air combat, every national/DLC MIO special case, and broad mod compatibility. Those belong in the data-import milestone rather than being faked.', 'Not yet executable-parity: some combat-tactic/counter resolution, true per-division reinforcement timing and coordination, exact CAS direct damage, commander traits, weather, experience, some executable-only regimental/module compatibility semantics, executable-parity air combat, every national/DLC MIO special case, and broad mod compatibility. The 1.19.2 files are bundled; behavior that only lives in hoi4.exe remains conservative and explicitly analytical.')
    s = s.replace('Resolve this in Division Lab before trusting the industrial recommendation.', 'Informational prerequisite only; the theorycrafted unit remains selectable and its selected equipment tier still feeds this industrial estimate.')
    s = s.replace("if(confirm('Return to the built-in public-data baseline?'))", "if(confirm('Return to the bundled vanilla 1.19.2 baseline?'))")
    return s

update('src/designerData.js', harden_designer)
update('src/main.js', harden_main)
