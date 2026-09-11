function stripLuaComments(text){
  const source=String(text||'');let out='',quote=null,escape=false;
  for(let i=0;i<source.length;i++){
    const ch=source[i],next=source[i+1];
    if(quote){out+=ch;if(escape){escape=false;continue;}if(ch==='\\'){escape=true;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='"'||ch==="'"){quote=ch;out+=ch;continue;}
    if(ch==='-'&&next==='-'){while(i<source.length&&source[i]!=='\n')i++;if(i<source.length)out+='\n';continue;}
    out+=ch;
  }
  return out;
}

function splitTopLevel(text){
  const out=[];let start=0,depth=0,quote=null,escape=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quote){if(escape){escape=false;continue;}if(ch==='\\'){escape=true;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='{')depth++;else if(ch==='}')depth=Math.max(0,depth-1);
    else if(ch===','&&depth===0){out.push(text.slice(start,i).trim());start=i+1;}
  }
  const tail=text.slice(start).trim();if(tail)out.push(tail);return out;
}

function parseLuaValue(raw){
  const text=String(raw||'').trim().replace(/,\s*$/,'').trim();
  if(!text)return '';
  if((text.startsWith('"')&&text.endsWith('"'))||(text.startsWith("'")&&text.endsWith("'")))return text.slice(1,-1).replace(/\\([\\"'])/g,'$1');
  if(/^true$/i.test(text))return true;if(/^false$/i.test(text))return false;if(/^nil$/i.test(text))return null;
  if(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(text))return Number(text);
  if(text.startsWith('{')&&text.endsWith('}')){
    const body=text.slice(1,-1).trim();if(!body)return [];
    const parts=splitTopLevel(body);
    if(parts.some(part=>/(^|\s)[A-Za-z_][A-Za-z0-9_]*\s*=/.test(part)))return text;
    return parts.map(parseLuaValue);
  }
  return text;
}

function readAssignmentValue(text,start){
  let i=start,depth=0,quote=null,escape=false;
  for(;i<text.length;i++){
    const ch=text[i];
    if(quote){if(escape){escape=false;continue;}if(ch==='\\'){escape=true;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='{')depth++;else if(ch==='}')depth=Math.max(0,depth-1);
    if(ch==='\n'&&depth===0)break;
  }
  return {raw:text.slice(start,i).trim(),end:i};
}

export function extractDefinesText(text,sourceFile=''){
  const source=stripLuaComments(text),out={};
  const re=/NDefines\.([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*=\s*/g;let match;
  while((match=re.exec(source))){
    const {raw,end}=readAssignmentValue(source,re.lastIndex),namespace=match[1],key=match[2],id=`${namespace}.${key}`;
    out[id]={id,namespace,key,value:parseLuaValue(raw),rawValue:raw.replace(/,\s*$/,'').trim(),sourceFile:String(sourceFile||'')};
    re.lastIndex=end;
  }
  return out;
}

export function mergeDefineRecords(target,source){
  for(const [id,record] of Object.entries(source||{}))target[id]=record;return target;
}

export function defineValue(records,namespace,key,fallback=undefined){
  const record=records?.[`${namespace}.${key}`];return record?.value===undefined?fallback:record.value;
}
