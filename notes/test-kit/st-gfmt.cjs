// 갤러리 '그림 형식' 칸: 이 채팅 + 형식으로 걸러지는지. 인자: 스크린샷 경로(.png)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});
 const errs=[];p.on('pageerror',e=>{if(!/Internal S/.test(e.message))errs.push(e.message)});
 await p.route('**/api/plugins/autopic2/health',r=>r.fulfill({json:{version:'0.5.1',models:{},hasKey:true}}));
 // 서버 기록: 채팅에 없는 그림 1장(형식 표시 없음 → 삽화)
 await p.route('**/api/plugins/autopic2/jobs**',r=>r.fulfill({json:{jobs:[['srv-1','server pic'],['srv-manga','a two-panel black and white manga page, monochrome'],['srv-comic','a two-panel full color comic page, x'],['srv-strip','a vertical webtoon strip of two panels stacked'],['srv-recorded-cut','a vertical webtoon strip of three panels']].map(([id,prompt],i)=>({id,status:'done',url:'/user/images/autopic2/11111111-1111-4111-8111-111111111111.png',created:new Date(Date.now()-9e6-i*1000).toISOString(),scene:{title:'server',prompt},config:{}}))}}));
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(2000);
 const shape=await p.evaluate(async()=>{const c=SillyTavern.getContext();c.extensionSettings.autopic2_job_formats={'srv-recorded-cut':'cuts'};await c.selectCharacterById(0);await new Promise(r=>setTimeout(r,1500));
   const m=c.chat.find(x=>x.extra?.autopic2);if(!m)return 'no figure';
   const st=JSON.stringify(m.extra.autopic2);
   // 첫 job을 찾아 형식별로 복제해 버전으로 추가
   const walk=(o,f)=>{if(o&&typeof o==='object'){if(Array.isArray(o.versions))f(o);for(const v of Object.values(o))walk(v,f);}};
   let done=0;walk(m.extra.autopic2,slot=>{if(done++)return;const base=slot.versions[0];
     const mk=(id,extra)=>({...structuredClone(base),id,created:new Date(Date.now()-done*1000).toISOString(),...extra});
     slot.versions.push(mk('cut-1',{cut:true}),mk('cut-2',{cut:true}),mk('manga-1',{pageScene:{...base.scene,page:{panels:[]},pageFormat:'manga'}}),mk('webtoon-1',{pageScene:{...base.scene,page:{panels:[]},pageFormat:'webtoon'}}));});
   await c.saveChat();return done?'ok':'no slot '+st.slice(0,200);});
 console.log('준비',shape);
 await p.evaluate(async()=>{await SillyTavern.getContext().reloadCurrentChat();});await p.waitForTimeout(1500);
 console.log('채팅 열 때 기록',JSON.stringify(await p.evaluate(()=>SillyTavern.getContext().extensionSettings.autopic2_job_formats)));
 await p.evaluate(async()=>{await SillyTavern.getContext().executeSlashCommandsWithOptions('/scenebook');});await p.waitForTimeout(800);
 const d=p.locator('dialog.ap2-studio');
 await d.locator('.ap2-nav .ap2-nav-item',{hasText:'갤러리'}).first().click();await p.waitForTimeout(1200);
 const g=d.locator('.ap2-page:not([hidden])');
 const scope=g.locator('select[aria-label="갤러리 범위"]'),fmt=g.locator('select[aria-label="그림 형식"]');
 const count=async()=>(await g.locator('.ap2-gallery-toolbar + .ap2-muted').textContent());
 console.log('형식 선택지',JSON.stringify(await fmt.locator('option').allTextContents()));
 for(const sc of ['done','chat'])for(const f of ['all','single','cuts','manga','comic','webtoon']){await scope.selectOption(sc);await fmt.selectOption(f);await p.waitForTimeout(250);console.log(sc,f,'→',await count());}
 await scope.selectOption('chat');await fmt.selectOption('cuts');await p.waitForTimeout(300);
 await d.screenshot({path:process.argv[2]});
 console.log(errs);await b.close();})();
