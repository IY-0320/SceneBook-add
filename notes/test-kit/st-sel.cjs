const {chromium,devices}=require('playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7']});const p=await ctx.newPage();
 const job=(i,u)=>({id:'srv'+i,url:`/user/images/autopic2/${u}.png`,status:'done',created:new Date(Date.now()-i*1000).toISOString(),scene:{title:'',prompt:'p'+i},config:{model:'nai-diffusion-4-5-full',width:832,height:1216},seed:i});
 await p.route('**/api/plugins/autopic2/jobs',r=>r.fulfill({json:{jobs:[job(1,'11111111-1111-4111-8111-111111111111'),job(2,'22222222-2222-4222-8222-222222222222')]}}));
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(1500);
 await p.addStyleTag({content:'*:focus,*:focus-visible{outline:none!important}'});
 await p.evaluate(async()=>{await SillyTavern.getContext().selectCharacterById(0);});await p.waitForTimeout(1500);
 // 채팅 그림 도구 아이콘 색
 const fig=p.locator('#chat .ap2-figure').first();
 await fig.locator('.ap2-image-open').tap();await p.waitForTimeout(400);
 console.log('icons',JSON.stringify(await fig.evaluate(f=>[...f.querySelectorAll('.ap2-image-actions .ap2-button')].map(b=>{const i=b.querySelector('i');return{btn:getComputedStyle(b).color,icon:getComputedStyle(i).color,bg:getComputedStyle(b).backgroundColor,op:getComputedStyle(b.parentElement).opacity};}))));
 await fig.screenshot({path:process.argv[2]+'-fig.png'});
 await p.tap('#extensions-settings-button .drawer-toggle');await p.waitForTimeout(600);
 const host=p.locator('#ap2-settings');await host.locator('.inline-drawer-toggle').first().tap();await p.waitForTimeout(800);
 await host.getByRole('tab',{name:'갤러리'}).tap();await p.waitForTimeout(1500);
 await host.locator('.ap2-gallery-toolbar .ap2-action-menu > button').tap();await host.locator('.ap2-action-panel').getByRole('button',{name:'삭제'}).tap();
 await host.getByRole('button',{name:'실리에서만 삭제'}).tap();await p.waitForTimeout(300);
 const cards=host.locator('.ap2-gallery-item');
 await cards.nth(0).tap();await p.waitForTimeout(200);await cards.nth(1).tap();await p.waitForTimeout(300);
 console.log('cards',JSON.stringify(await cards.evaluateAll(cs=>cs.map(c=>{const s=getComputedStyle(c);return{frame:!!c.querySelector('.ap2-pick-frame'),frameBorder:c.querySelector('.ap2-pick-frame')?getComputedStyle(c.querySelector('.ap2-pick-frame')).borderTopWidth:'',focus:c===document.activeElement,mark:!!c.querySelector('.ap2-pick-mark')};}))));
 await host.locator('.ap2-gallery').screenshot({path:process.argv[2]+'-gal.png'});
 await b.close();})();
