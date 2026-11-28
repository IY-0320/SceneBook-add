// 씬북 창 탭을 누른 순간부터 다음 화면 그리기(검은 표시가 보이는 때)까지 걸린 시간(ms), 휴대폰 속도(CPU 6배 느리게)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});
 await p.route('**/api/plugins/autopic2/health',r=>r.fulfill({json:{version:'0.5.1',models:{},hasKey:true}}));
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(2000);
 await p.evaluate(async()=>{await SillyTavern.getContext().selectCharacterById(0);});await p.waitForTimeout(1500);
 await p.evaluate(async()=>{await SillyTavern.getContext().executeSlashCommandsWithOptions('/scenebook');});await p.waitForTimeout(800);
 await p.evaluate(()=>{window.__paint=[];new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.name==='click'||e.name==='pointerup')window.__paint.push(Math.round(e.duration));}).observe({type:'event',durationThreshold:16,buffered:false});});
 const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});
 const out={};const d=p.locator('dialog.ap2-studio');
 for(const round of [1,2])for(const t of ['그림 설정','갤러리','프롬프트','인물','작업','시작']){
   await p.evaluate(()=>window.__paint=[]);
   await d.locator('.ap2-nav .ap2-nav-item',{hasText:t}).first().click();await p.waitForTimeout(1500);
   out[`${round}회 ${t}`]=await p.evaluate(()=>Math.max(0,...window.__paint));}
 console.log(JSON.stringify(out));
 console.log('탭 색 전환 효과',await p.evaluate(()=>getComputedStyle(document.querySelector('dialog.ap2-studio .ap2-nav .ap2-nav-item')).transitionDuration));
 await b.close();})();
