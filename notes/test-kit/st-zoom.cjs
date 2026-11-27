const {chromium,devices}=require('playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7']});const p=await ctx.newPage();
 const logs=[];p.on('pageerror',e=>{if(!/Internal S/.test(e.message))logs.push('PAGEERROR '+e.message)});
 const job=(i,u)=>({id:'srv'+i,url:`/user/images/autopic2/${u}.png`,status:'done',created:new Date(Date.now()-i*1000).toISOString(),scene:{title:'',prompt:'p'+i},config:{model:'nai-diffusion-4-5-full',width:832,height:1216},seed:i});
 await p.route('**/api/plugins/autopic2/jobs',r=>r.fulfill({json:{jobs:[job(1,'11111111-1111-4111-8111-111111111111'),job(2,'22222222-2222-4222-8222-222222222222')]}}));
 await p.goto('http://127.0.0.1:8000/');
 await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(2000);
 await p.evaluate(async()=>{await SillyTavern.getContext().selectCharacterById(0);});await p.waitForTimeout(1500);
 await p.tap('#extensions-settings-button .drawer-toggle');await p.waitForTimeout(600);
 const drawerOpen=()=>p.evaluate(()=>document.querySelector('#rm_extensions_block')?.classList.contains('openDrawer'));
 const host=p.locator('#ap2-settings');await host.locator('.inline-drawer-toggle').first().tap();await p.waitForTimeout(800);
 await host.getByRole('tab',{name:'갤러리'}).tap();await p.waitForTimeout(1500);
 console.log('갤러리 카드',await host.locator('.ap2-gallery-item').count(),'확장 칸 열림',await drawerOpen());
 await host.locator('.ap2-gallery-item').first().tap();await p.waitForTimeout(600);
 const v=p.locator('dialog.ap2-viewer');const img=v.locator('img.ap2-full');
 const tf=()=>img.evaluate(n=>n.style.transform||'none');
 const sub=()=>v.locator('.ap2-header-title p').textContent();
 console.log('뷰어 열림',await v.count(),await sub(),'확장 칸 열림',await drawerOpen());
 const box=await v.locator('.ap2-body').boundingBox();const cx=box.x+box.width/2,cy=box.y+box.height/2;
 await p.touchscreen.tap(cx,cy);await p.waitForTimeout(80);await p.touchscreen.tap(cx,cy);await p.waitForTimeout(400);
 console.log('두 번 톡톡 →',await tf());
 // 확대 상태에서 옆으로 밀기: 넘어가면 안 됨 (CDP 터치)
 const cdp=await ctx.newCDPSession(p);
 const touch=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],i)=>({x,y,id:i}))});
 await touch('touchStart',[[cx+100,cy]]);for(let i=1;i<=8;i++)await touch('touchMove',[[cx+100-i*25,cy]]);await touch('touchEnd',[]);await p.waitForTimeout(900);
 console.log('확대 중 끌기 →',await tf(),'|',await sub());
 await v.getByRole('button',{name:'원래 크기'}).tap();await p.waitForTimeout(300);
 console.log('원래 크기 →',await tf());
 // 두 손가락 벌리기
 await touch('touchStart',[[cx-40,cy],[cx+40,cy]]);for(let i=1;i<=8;i++)await touch('touchMove',[[cx-40-i*15,cy],[cx+40+i*15,cy]]);await touch('touchEnd',[]);await p.waitForTimeout(900);
 console.log('두 손가락 벌리기 →',await tf());
 await v.getByRole('button',{name:'축소'}).tap();await p.waitForTimeout(300);console.log('축소 버튼 →',await tf());
 await v.getByRole('button',{name:'원래 크기'}).tap().catch(()=>{});await p.waitForTimeout(300);
 await v.getByRole('button',{name:'확대'}).tap();await p.waitForTimeout(300);console.log('확대 버튼 →',await tf());
 await v.getByRole('button',{name:'원래 크기'}).tap();await p.waitForTimeout(300);
 // 원래 크기에서 밀기: 다음 그림
 await touch('touchStart',[[cx+120,cy]]);for(let i=1;i<=8;i++)await touch('touchMove',[[cx+120-i*30,cy]]);await touch('touchEnd',[]);await p.waitForTimeout(900);
 console.log('원래 크기에서 밀기 →',await sub());
 await p.screenshot({path:process.argv[2]});
 await v.getByRole('button',{name:'닫기'}).tap();await p.waitForTimeout(600);
 console.log('X 누른 뒤: 뷰어',await p.locator('dialog.ap2-viewer').count(),'확장 칸 열림',await drawerOpen(),'갤러리 보임',await host.locator('.ap2-gallery-item').first().isVisible());
 console.log(logs.join('\n'));await b.close();
})();
