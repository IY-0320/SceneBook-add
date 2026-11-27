const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const dir=process.argv[2];const src=fs.readFileSync(dir+'/post.html','utf8');
 const styleEnd=src.indexOf('</style>')+8;const css=src.slice(0,styleEnd);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:800,height:900}});
 await p.setContent('<!doctype html><meta charset=utf-8><body>'+src,{waitUntil:'load'});
 const html=await p.evaluate(()=>{
   const hex=c=>{const m=c.match(/\d+(\.\d+)?/g).map(Number);const h=m.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');return '#'+h;};
   const root=document.querySelector('.sbp');let n=0;
   for(const el of [root,...root.querySelectorAll('*')]){
     const own=[...el.childNodes].some(c=>c.nodeType===3&&c.textContent.trim());
     if(!own)continue;
     const c=hex(getComputedStyle(el).color);
     el.setAttribute('style',(el.getAttribute('style')?el.getAttribute('style').replace(/;?\s*$/,';'):'')+`color:${c} !important;-webkit-text-fill-color:${c} !important;`);n++;
   }
   return {n,out:root.outerHTML};
 });
 fs.writeFileSync(dir+'/post2.html',css+'\n\n'+html.out+'\n');console.log('인라인 색을 넣은 요소',html.n);await b.close();})();
