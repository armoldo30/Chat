/* Display-only parser for HOI4 localisation/*.yml files. */

const linePattern=/^\s*([^\s:#][^:]*?):(?:\d+)?\s+"((?:\\.|[^"\\])*)"\s*(?:#.*)?$/;

function unescapeValue(value=''){
  return String(value).replace(/\\"/g,'"').replace(/\\n/g,'\n').replace(/\\t/g,'\t').replace(/\\\\/g,'\\');
}

export function parseHoi4Localization(text,{language='english'}={}){
  const source=String(text||'').replace(/^\uFEFF/,''),entries={};
  let active=false,detected=null;
  for(const rawLine of source.split(/\r?\n/)){
    const header=rawLine.match(/^\s*l_([a-z0-9_]+):\s*$/i);
    if(header){detected=header[1].toLowerCase();active=detected===String(language).toLowerCase();continue;}
    if(!active)continue;
    const match=rawLine.match(linePattern);if(!match)continue;
    const key=match[1].trim();if(!key)continue;
    entries[key]=unescapeValue(match[2]);
  }
  return {language:detected||String(language).toLowerCase(),entries,count:Object.keys(entries).length};
}

export function mergeLocalization(...maps){
  const out={};for(const map of maps)for(const [key,value] of Object.entries(map||{}))if(typeof value==='string'&&value.trim())out[key]=value;return out;
}

export function localizationValue(localization,...keys){
  for(const raw of keys){
    const key=String(raw??'').trim();if(!key)continue;
    if(typeof localization?.[key]==='string'&&localization[key].trim())return localization[key].trim();
  }
  return '';
}

export async function parseEnglishLocalizationFiles(files){
  const merged={},recognized=[];
  for(const file of [...(files||[])]){
    const path=String(file.webkitRelativePath||file.name||'').replaceAll('\\','/');
    if(!/\.ya?ml$/i.test(path))continue;
    if(!/(?:^|\/)localisation\/english\//i.test(path)&&!/_l_english\.ya?ml$/i.test(path)&&!/english/i.test(file.name||''))continue;
    let parsed;try{parsed=parseHoi4Localization(await file.text(),{language:'english'});}catch{continue;}
    if(!parsed.count)continue;Object.assign(merged,parsed.entries);recognized.push(path||file.name);
  }
  return {entries:merged,count:Object.keys(merged).length,files:recognized};
}
