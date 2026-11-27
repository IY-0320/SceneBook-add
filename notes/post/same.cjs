const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const dir=process.argv[2];const b=await chromium.launch();
 const read=async f=>{const p=await b.newPage({viewport:{width:800,height:900}});await p.setContent('<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(dir+'/'+f,'utf8'),{waitUntil:'load'});
   const r=await p.evaluate(()=>[...document.querySelectorAll('.sbp *')].filter(e=>[...e.childNodes].some(c=>c.nodeType===3&&c.textContent.trim())).map(e=>getComputedStyle(e).color+'|'+getComputedStyle(e).webkitTextFillColor));await p.close();return r;};
 const a=await read('post.html'),c=await read('post2.html');
 let diff=0;a.forEach((v,i)=>{if(v!==c[i])diff++;});console.log('글자 요소',a.length,c.length,'| 색이 달라진 곳',diff);
 // 강한 공격: 사이트가 모든 글자를 빨간 채움색 !important로 덮는 경우
 const hostile='<style>.glitch-body .post *{color:#ff0000 !important;-webkit-text-fill-color:#ff0000 !important;}</style>';
 const post=fs.readFileSync(dir+'/post2.html','utf8').replace('body{background:#f4f4f5;}','.glitch-body{background:#f4f4f5;}');
 for(const [name,body] of [['강한 공격',post],['!important 제거 + 공격',post.replace(/[^{};"]*!important;?/g,'')]]){
  const p=await b.newPage({viewport:{width:360,height:800}});
  await p.setContent('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:0">'+(name==='강한 공격'?hostile:'<style>.glitch-body{color:#ff0000}.glitch-body p,.glitch-body span{color:#ff0000}</style>')+'<div class="glitch-body"><div class="post" style="color:#ff0000">'+body+'</div></div>',{waitUntil:'load'});
  const r=await p.evaluate(()=>({red:[...document.querySelectorAll('.sbp *')].filter(e=>[...e.childNodes].some(c=>c.nodeType===3&&c.textContent.trim())).filter(e=>{const s=getComputedStyle(e);return s.color==='rgb(255, 0, 0)'||s.webkitTextFillColor==='rgb(255, 0, 0)';}).length,over:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
  console.log(name,'→ 빨간 글자',r.red,'| 가로 넘침',r.over);await p.close();}
 await b.close();})();
