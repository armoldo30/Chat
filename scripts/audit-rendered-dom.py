#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import sys

VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Node:
    def __init__(self,tag='',attrs=None,parent=None):
        self.tag=tag
        self.attrs=dict(attrs or [])
        self.parent=parent
        self.children=[]
        self.text=[]
    def text_content(self):
        return ' '.join(' '.join(self.text).split())

class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root=Node('root')
        self.stack=[self.root]
        self.nodes=[]
    def handle_starttag(self,tag,attrs):
        node=Node(tag.lower(),attrs,self.stack[-1])
        self.stack[-1].children.append(node)
        self.nodes.append(node)
        if tag.lower() not in VOID:self.stack.append(node)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if self.stack[-1].tag==tag.lower() and tag.lower() not in VOID:self.stack.pop()
    def handle_endtag(self,tag):
        tag=tag.lower()
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag:
                del self.stack[i:]
                break
    def handle_data(self,data):
        for node in self.stack[1:]:node.text.append(data)

def ancestor(node,tag):
    p=node.parent
    while p:
        if p.tag==tag:return p
        p=p.parent
    return None

def named(node):
    a=node.attrs
    if any(str(a.get(k,'')).strip() for k in ('aria-label','aria-labelledby','title')):return True
    if node.tag in ('button','a') and node.text_content().strip():return True
    if node.tag=='input' and a.get('type','').lower() in ('button','submit','reset') and str(a.get('value','')).strip():return True
    return False

path=Path(sys.argv[1])
route=sys.argv[2] if len(sys.argv)>2 else path.stem
parser=Tree();parser.feed(path.read_text(errors='replace'))
nodes=parser.nodes
fail=[]

html=next((n for n in nodes if n.tag=='html'),None)
if not html or not str(html.attrs.get('lang','')).strip():fail.append('document language missing')
title=next((n for n in nodes if n.tag=='title'),None)
if not title or not title.text_content().strip():fail.append('document title missing')

ids={}
for n in nodes:
    ident=str(n.attrs.get('id','')).strip()
    if ident:
        if ident in ids:fail.append(f'duplicate id: {ident}')
        ids[ident]=n

app=ids.get('app')
if not app or (not app.children and not app.text_content().strip()):fail.append('#app did not render content')
if not any(n.tag=='footer' and 'site-legal-footer' in str(n.attrs.get('class','')).split() for n in nodes):fail.append('legal footer missing')

label_for={str(n.attrs.get('for','')).strip() for n in nodes if n.tag=='label' and str(n.attrs.get('for','')).strip()}
for n in nodes:
    a=n.attrs
    if n.tag=='img' and 'alt' not in a:fail.append('image without alt attribute')
    if n.tag=='a' and a.get('href') and not named(n):fail.append(f'link without accessible name: {a.get("href")}')
    if n.tag=='button' and not named(n):fail.append(f'button without accessible name: {a.get("id") or a.get("class") or "anonymous"}')
    if n.tag in ('input','select','textarea'):
        if n.tag=='input' and a.get('type','').lower()=='hidden':continue
        ident=str(a.get('id','')).strip()
        labelled=ident in label_for or ancestor(n,'label') is not None or named(n)
        if not labelled:fail.append(f'{n.tag} without label: {ident or a.get("name") or a.get("class") or "anonymous"}')
    if str(a.get('role','')).lower()=='dialog':
        has_heading=any(c.tag in ('h1','h2','h3') and c.text_content().strip() for c in n.children)
        if not named(n) and not has_heading:fail.append('dialog without accessible name')

if fail:
    unique=[]
    for item in fail:
        if item not in unique:unique.append(item)
    print(f'Rendered DOM audit failed for {route}:',file=sys.stderr)
    for item in unique[:30]:print(f' - {item}',file=sys.stderr)
    if len(unique)>30:print(f' - ... {len(unique)-30} more',file=sys.stderr)
    raise SystemExit(1)
print(f'Rendered DOM accessibility/integrity audit passed for {route}.')
