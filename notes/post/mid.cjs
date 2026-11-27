const {chromium,devices}=require('playwright');const fs=require('fs');
(async()=>{const dir=process.argv[2];const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7']});const p=await ctx.newPage();
 const post=fs.readFileSync(dir+'/post2.html','utf8').replace('body{background:#f4f4f5;}','.glitch-body{background:#f4f4f5;}');
 await p.setContent('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:0"><div class="glitch-body">'+post+'</div><div style="height:90px">♡ 0</div>',{waitUntil:'load'});
 // 각 부분의 윗부분이 화면 아래쪽에 조금 들어왔을 때(위 35%) 이미 선명한지
 const r=await p.evaluate(async()=>{const out=[];for(const n of document.querySelectorAll('.sbp .sbp-reveal')){const top=n.getBoundingClientRect().top+scrollY;scrollTo(0,Math.max(0,top-innerHeight+Math.min(n.offsetHeight*0.5,innerHeight*0.5)));await new Promise(r=>setTimeout(r,120));out.push(+getComputedStyle(n).opacity);}return{n:out.length,min:Math.min(...out)};});
 console.log('등장 효과가 있는 부분',r.n,'| 반쯤 들어왔을 때 가장 흐린 불투명도',r.min.toFixed(2));await b.close();})();
