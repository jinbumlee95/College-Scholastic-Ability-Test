"""Package the static subtree and reproducible source, only inside this workspace."""
import json,zipfile,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent.parent
workspace=root.parent
release=workspace/'release'
release.mkdir(exist_ok=True)
coverage=json.loads((root/'dist/data/visual-coverage.json').read_text(encoding='utf8'))
assert coverage['implemented']==coverage['total']==329 and not coverage['missing']
files=list((root/'dist').rglob('*'))
assert not any(p.suffix.lower() in ('.pdf','.jpg','.jpeg') for p in files if p.is_file())
def create_zip(name,entries):
 out=release/name
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
  for file,name in entries:
   assert file.resolve().is_relative_to(workspace.resolve())
   archive.write(file,name)
 return {'file':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
manifest=[]
manifest.append(create_zip('csat-math-github-pages.zip',[(f,'notes/math/'+f.relative_to(root/'dist').as_posix()) for f in files if f.is_file()]))
excluded={'node_modules','dist','.taste-skill','shots','.git','__pycache__'}
entries=[]
for f in root.rglob('*'):
 rel=f.relative_to(root)
 if f.is_file() and not any(part in excluded for part in rel.parts) and f.suffix not in ('.log','.tsbuildinfo','.zip'):
  entries.append((f,'math-visual/'+rel.as_posix()))
for f in (workspace/'docs/research').glob('*visual-review.md'):
 entries.append((f,'math-visual/research-reviews/'+f.name))
manifest.append(create_zip('csat-math-source.zip',entries))
(release/'manifest.json').write_text(json.dumps({'coverage':coverage,'archives':manifest},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(manifest,ensure_ascii=False))
