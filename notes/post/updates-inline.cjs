// 업데이트 글꾸(updates-src.html)에 글자마다 인라인 색을 넣어 kkangtong-updates.html로 저장합니다.
// 사용: node notes/post/updates-inline.cjs notes/post
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const dir=process.argv[2];const src=fs.readFileSync(dir+'/updates-src.html','utf8');
 const styleEnd=src.indexOf('</style>')+8;const css=src.slice(0,styleEnd);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:800,height:900}});
 await p.setContent('<!doctype html><meta charset=utf-8><body style="background:#f4f4f5">'+src,{waitUntil:'load'});
 const r=await p.evaluate(()=>{
   const hex=c=>'#'+c.match(/\d+(\.\d+)?/g).map(Number).slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
   const root=document.querySelector('.sbpu');let n=0;
   for(const el of [root,...root.querySelectorAll('*')]){
     if(![...el.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))continue;
     const c=hex(getComputedStyle(el).color);
     el.setAttribute('style',(el.getAttribute('style')?el.getAttribute('style').replace(/;?\s*$/,';'):'')+`color:${c};color:${c} !important;-webkit-text-fill-color:${c} !important;`);n++;
   }
   return {n,out:root.outerHTML};
 });
 fs.writeFileSync(dir+'/kkangtong-updates.html',css+'\n\n'+r.out.replace(/<!--[\s\S]*?-->\s*/g,'')+'\n');console.log('인라인 색을 넣은 요소',r.n);await b.close();})();
