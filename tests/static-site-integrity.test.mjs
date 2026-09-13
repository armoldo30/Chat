import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const entries=await readdir(root,{withFileTypes:true});
const htmlFiles=entries.filter(entry=>entry.isFile()&&entry.name.endsWith('.html')).map(entry=>entry.name).sort();
assert.ok(htmlFiles.length>=5,'expected the public HTML surface to include index + informational pages');

const exists=async rel=>{try{await access(path.join(root,rel));return true;}catch{return false;}};
const stripFragment=value=>String(value||'').split('#',1)[0].split('?',1)[0];
const isExternal=value=>/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value);

for(const file of htmlFiles){
  const html=await readFile(path.join(root,file),'utf8');
  assert.match(html,/<html[^>]+lang="en"/i,`${file} must declare English document language`);
  assert.match(html,/<meta[^>]+name="viewport"[^>]+content="[^"]+"/i,`${file} must include a responsive viewport`);
  const title=html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  assert.ok(title,`${file} must have a non-empty title`);

  const ids=[...html.matchAll(/\sid="([^"]+)"/gi)].map(match=>match[1]);
  const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);
  assert.equal(duplicates.length,0,`${file} must not contain duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);

  for(const match of html.matchAll(/<(?:a|link|script|img)[^>]+(?:href|src)="([^"]*)"[^>]*>/gi)){
    const ref=match[1];
    assert.ok(ref.trim(),`${file} contains an empty href/src`);
    if(ref.startsWith('#')||isExternal(ref)||ref.startsWith('/'))continue;
    const normalized=stripFragment(ref.replace(/^\.\//,''));
    if(!normalized)continue;
    assert.ok(await exists(normalized),`${file} references missing local asset/page: ${ref}`);
  }

  for(const tag of html.matchAll(/<a\b([^>]*)>/gi)){
    const attrs=tag[1]||'';
    if(!/target="_blank"/i.test(attrs))continue;
    assert.match(attrs,/rel="[^"]*(?:noopener|noreferrer)[^"]*"/i,`${file} target=_blank link must include noopener/noreferrer`);
  }

  for(const tag of html.matchAll(/<img\b([^>]*)>/gi))assert.match(tag[1]||'',/\balt="[^"]*"/i,`${file} images must declare alt text`);
}

const [sitemap,robots,cname]=await Promise.all([
  readFile(path.join(root,'sitemap.xml'),'utf8'),
  readFile(path.join(root,'robots.txt'),'utf8'),
  readFile(path.join(root,'CNAME'),'utf8')
]);
assert.match(robots,/^Sitemap:\s*https:\/\/hoioracle\.com\/sitemap\.xml\s*$/mi,'robots.txt must advertise the canonical sitemap');
assert.equal(cname.trim(),'hoioracle.com','CNAME must preserve the production custom domain');
for(const match of sitemap.matchAll(/<loc>https:\/\/hoioracle\.com\/?([^<]*)<\/loc>/g)){
  const rel=stripFragment(match[1]);
  const target=!rel?'index.html':rel.endsWith('/')?`${rel}index.html`:rel;
  assert.ok(await exists(target),`sitemap points to missing local page: /${rel}`);
}

console.log(`Static site integrity checks passed for ${htmlFiles.length} HTML pages.`);
