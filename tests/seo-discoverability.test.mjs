import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const toolRoutes={
  'division-counter.html':'battle',
  'tank-designer.html':'tank',
  'air-lab.html':'air',
  'division-gauntlet.html':'gauntlet'
};
const toolPages=Object.keys(toolRoutes);
const allPages=['index.html','guides.html','methodology.html','about.html','privacy.html',...toolPages];
const pages=new Map();
for(const file of allPages)pages.set(file,await readFile(resolve(root,file),'utf8'));

const index=pages.get('index.html');
assert.match(index,/<script[^>]+type="application\/ld\+json"/i,'homepage must expose JSON-LD structured data');
assert.match(index,/"@type":"WebSite"/,'homepage structured data must identify the site');
assert.match(index,/"@type":"SoftwareApplication"/,'homepage structured data must identify the planner application');
assert.match(index,/"isAccessibleForFree":true/,'homepage structured data must preserve free-access status');

const sitemap=await readFile(resolve(root,'sitemap.xml'),'utf8');
const build=await readFile(resolve(root,'scripts/build.mjs'),'utf8');
const guides=pages.get('guides.html');
const titles=new Set(),descriptions=new Set();
for(const file of toolPages){
  const html=pages.get(file),route=toolRoutes[file];
  const title=html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description=html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1]?.trim();
  assert.ok(title&&description,`${file} must expose title and description metadata`);
  assert.ok(!titles.has(title),`${file} title must be unique`);
  assert.ok(!descriptions.has(description),`${file} description must be unique`);
  titles.add(title);descriptions.add(description);
  assert.ok(sitemap.includes(`https://hoioracle.com/${file}`),`${file} must be listed in sitemap.xml`);
  assert.ok(build.includes(`'${file}'`),`${file} must be copied by the static build`);
  assert.ok(index.includes(`./${file}`)||guides.includes(`./${file}`),`${file} must have an internal crawl path from index or guides`);
  assert.match(html,/<script[^>]+type="application\/ld\+json"/i,`${file} should expose WebPage structured data`);
  assert.match(html,/"@type":"WebPage"/,`${file} structured data should identify a WebPage`);
  assert.ok(html.includes(`href="./#${route}"`),`${file} primary planner CTA must deep-link to #${route}`);
  assert.ok(!html.includes('href="./#app"'),`${file} must not use the non-route #app fallback`);
}

const fullTitles=[];
const fullDescriptions=[];
for(const [file,html] of pages){
  const title=html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description=html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1]?.trim();
  if(title)fullTitles.push([file,title]);
  if(description)fullDescriptions.push([file,description]);
}
assert.equal(new Set(fullTitles.map(([,value])=>value)).size,fullTitles.length,'all public page titles should be unique');
assert.equal(new Set(fullDescriptions.map(([,value])=>value)).size,fullDescriptions.length,'all public meta descriptions should be unique');

console.log('SEO discoverability regression checks passed.');
