const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7']});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>{if(!/Internal S/.test(e.message))errs.push(e.message)});
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(1500);
 await p.evaluate(async()=>{const c=SillyTavern.getContext();await c.selectCharacterById(0);await new Promise(r=>setTimeout(r,1500));
   const {sourceKey}=await import('/scripts/extensions/third-party/SceneBook-add/plugin/core.mjs');
   const m=c.chat[0];const job=(id,u,seed)=>({id,url:`/user/images/autopic2/${u}.png`,status:'done',created:new Date().toISOString(),scene:{title:'',prompt:'p'},config:{model:'nai-diffusion-4-5-full',width:832,height:1216},seed});
   m.extra={autopic2:{views:{[sourceKey(m.mes,m.swipe_id??0)]:{source:m.mes,draft:[],slots:[{id:'s1',anchor:{index:0,quote:'',source:m.mes},versions:[job('v1','11111111-1111-4111-8111-111111111111',1),job('v2','22222222-2222-4222-8222-222222222222',2),job('v3','33333333-3333-4333-8333-333333333333',3)],selected:2}]}}}};
   c.extensionSettings.autopic2.placement='end';await c.saveChat();await c.reloadCurrentChat();});
 await p.waitForTimeout(2000);
 // 채팅 저장을 3초 늦춤 (긴 채팅·휴대폰 흉내)
 await p.route('**/api/chats/save',async r=>{await new Promise(x=>setTimeout(x,3000));await r.continue();});
 const src=()=>p.locator('#chat .ap2-figure img').first().getAttribute('src');
 const count=()=>p.locator('#chat .ap2-version-count').textContent();
 console.log('처음',await count(),(await src()).slice(-14));
 const t0=Date.now();await p.locator('#chat .ap2-image-navigation button[aria-label="이전 그림"]').tap();
 await p.waitForFunction(()=>document.querySelector('#chat .ap2-version-count')?.textContent==='2/3',null,{timeout:10000});
 console.log('‹ 누른 뒤',await count(),'걸린 시간',Date.now()-t0,'ms',(await src()).slice(-14));
 // 큰 그림: 옆으로 밀기
 await p.waitForTimeout(500);
 await p.locator('#chat .ap2-image-open').first().tap();await p.waitForTimeout(150);await p.locator('#chat .ap2-image-open').first().tap();await p.waitForTimeout(600);
 const v=p.locator('dialog.ap2-viewer');console.log('큰 그림',await v.count(),await v.locator('.ap2-header-title p').textContent());
 const box=await v.locator('.ap2-body').boundingBox();const cx=box.x+box.width/2,cy=box.y+box.height/2;
 const cdp=await ctx.newCDPSession(p);const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],i)=>({x,y,id:i}))});
 const swipe=async dir=>{await touch('touchStart',[[cx+dir*120,cy]]);for(let i=1;i<=8;i++)await touch('touchMove',[[cx+dir*120-dir*i*30,cy]]);await touch('touchEnd',[]);await p.waitForTimeout(900);};
 const sub=()=>v.locator('.ap2-header-title p').textContent().then(t=>t.split('·').pop().trim());
 const seen=[await sub()];for(let i=0;i<4;i++){await swipe(1);seen.push(await sub());}
 console.log('왼쪽으로 계속 밀기:',seen.join(' → '));
 const back=[await sub()];for(let i=0;i<4;i++){await swipe(-1);back.push(await sub());}
 console.log('오른쪽으로 계속 밀기:',back.join(' → '));
 await p.keyboard.press('ArrowLeft');await p.waitForTimeout(300);console.log('← 키:',await sub());
 console.log(errs);await b.close();})();
