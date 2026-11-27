const {chromium,devices}=require('playwright');const fs=require('fs');
(async()=>{const dir=process.argv[2],file=process.argv[3];const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7']});const p=await ctx.newPage();
 // 깡통처럼: 글 바로 아래에 짧은 '좋아요' 영역만 있고 페이지가 끝나는 경우
 const post=fs.readFileSync(dir+'/'+file,'utf8').replace('body{background:#f4f4f5;}','.glitch-body{background:#f4f4f5;}');
 await p.setContent('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:0"><div class="glitch-body">'+post+'</div><div style="height:90px;text-align:center">♡ 0</div>',{waitUntil:'load'});
 await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(600);
 const r=await p.evaluate(()=>[...document.querySelectorAll('.sbp .sbp-reveal')].slice(-4).map(n=>n.className.split(' ')[0]+':'+(+getComputedStyle(n).opacity).toFixed(2)));
 console.log(file,'맨 아래까지 내렸을 때 불투명도',r.join('  '));await b.close();})();
