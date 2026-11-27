const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:900}});
 const errs=[];p.on('pageerror',e=>{if(!/Internal S/.test(e.message))errs.push(e.message)});
 await p.route('**/api/plugins/autopic2/health',r=>r.fulfill({json:{version:'0.5.1',models:{},hasKey:true}}));
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(1500);
 await p.evaluate(async()=>{await SillyTavern.getContext().selectCharacterById(0);});await p.waitForTimeout(1500);
 await p.evaluate(async()=>{await SillyTavern.getContext().executeSlashCommandsWithOptions('/scenebook');});await p.waitForTimeout(800);
 const d=p.locator('dialog.ap2-studio');
 const tabs=await d.locator('.ap2-nav .ap2-nav-item').allTextContents();console.log('탭',tabs);
 for(const t of tabs){await d.locator('.ap2-nav .ap2-nav-item',{hasText:t}).first().click();await p.waitForTimeout(500);
   const heads=await d.locator('.ap2-page:not([hidden]) :is(h3,summary,.ap2-field > span,.ap2-field > label)').allTextContents();
   console.log('['+t+']',heads.map(x=>x.trim()).filter(Boolean).slice(0,40).join(' | ').slice(0,700));}
 console.log('errors',errs);await b.close();})();
