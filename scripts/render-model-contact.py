"""Offline geometry inspection only. This is not a browser/UI screenshot."""
import json, math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parent.parent
records={q['id']:q for f in (root/'src/data/question-visuals').glob('*.json') for q in json.loads(f.read_text(encoding='utf8'))}
ids=['2017-a-11','2017-b-14','2017-b-17','2018-a-12','2018-a-17','2018-a-30','2018-b-19','2018-b-29','2018-b-30','2022-geometry-30','2018-a-29','2020-a-29','2026-probability-28','2025-probability-30','2024-probability-29','2026-calculus-26','2025-calculus-28','2024-calculus-28']
ids=[i for i in ids if i in records]
W,H=570,350
sheet=Image.new('RGB',(W*3,H*math.ceil(len(ids)/3)),'#e7e5e4')
font=ImageFont.load_default(size=16)
for idx,key in enumerate(ids):
 q=records[key]; m=q['steps'][-1]['model']; im=Image.new('RGB',(W-8,H-8),'white'); d=ImageDraw.Draw(im,'RGBA'); d.text((12,8),key,fill='#1c1917',font=font)
 def project(p):
  if not m['threeD']:return p[0],p[1]
  x,y,z=p;return .789*x+.614*y, -.386*x+.497*y+.777*z
 if m['threeD']:
  ps=[project(p) for l in m['lines']+m['surfaces'] for p in l['points']]+[project(v['at']) for v in m['dots']]
  a,b=min(v[0] for v in ps),max(v[0] for v in ps); c,e=min(v[1] for v in ps),max(v[1] for v in ps)
  a-=.6;b+=.6;c-=.6;e+=.6
 else:a,b,c,e=m['range']
 sx=(W-45)/(b-a);sy=(H-68)/(e-c)
 if m.get('equalAspect') or m['threeD']:sx=sy=min(sx,sy)
 def xy(p):
  x,y=project(p);return ((W-8)/2+(x-(a+b)/2)*sx,(H+28)/2-(y-(c+e)/2)*sy)
 for s in m['surfaces']:
  color=tuple(int(s['color'][i:i+2],16) for i in (1,3,5))+(int(255*s['opacity']),)
  if s.get('triangulation')=='strip-to-axis':
   for i in range(1,len(s['points'])-2):
    u,v=s['points'][i:i+2];d.polygon([xy([u[0],0,0]),xy(u),xy(v),xy([v[0],0,0])],fill=color)
  else:d.polygon([xy(p) for p in s['points']],fill=color)
 if not m['threeD']:
  d.line([xy([a,0,0]),xy([b,0,0])],fill='#d6d3d1');d.line([xy([0,c,0]),xy([0,e,0])],fill='#d6d3d1')
 for l in m['lines']:d.line([xy(p) for p in l['points']],fill=l['color'],width=2)
 for v in m['dots']:
  x,y=xy(v['at']);r=3 if len(m['dots'])<300 else 1.5;d.ellipse([x-r,y-r,x+r,y+r],fill='white' if v.get('open') else v['color'],outline=v['color'])
 d.text((12,H-32),f"step {len(q['steps'])} / result {q['result']}",fill='#57534e',font=font)
 sheet.paste(im,((idx%3)*W,(idx//3)*H))
out=root.parent/'research-cache/model-contact.png';sheet.save(out);print(out)
