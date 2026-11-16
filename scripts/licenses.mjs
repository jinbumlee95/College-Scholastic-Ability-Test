import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const sections=['Third-party software notices\n수학 문제와 공식 해설의 출처는 별도의 수록 기준 페이지를 참고하세요.'];
for(const [directory,pkg] of Object.entries(lock.packages)){
 if(!directory||pkg.dev)continue;
 const base=path.join(root,directory);if(!base.startsWith(path.join(root,'node_modules')))throw Error(directory);
 for(const name of ['LICENSE','LICENSE.md','LICENSE.txt','license','license.md','LICENSE-MIT']){
  const file=path.join(base,name);if(fs.existsSync(file)){sections.push(directory.replace(/^node_modules\//,'')+' '+pkg.version+'\n\n'+fs.readFileSync(file,'utf8'));break;}
 }
}
sections.push('shadcn/ui\n\n'+fs.readFileSync(path.join(root,'licenses/shadcn-ui.txt'),'utf8'));
fs.writeFileSync(path.join(root,'public/third-party-notices.txt'),sections.join('\n\n'+'='.repeat(64)+'\n\n'));
console.log(`${sections.length-1} dependency notices included`);
