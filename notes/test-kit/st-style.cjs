// 씬북 창에서 프리셋을 고른 뒤 재생성하면 그 그림체로 그려지는지, 연필에서 고른 프리셋이 고정되는지 확인
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const sent=[];
 await p.route('**/api/plugins/autopic2/health',r=>r.fulfill({json:{version:'0.5.1',models:{},hasKey:true}}));
 await p.route('**/api/plugins/autopic2/generate',async r=>{const body=r.request().postDataJSON();sent.push(body.config);await r.fulfill({json:{id:body.id,url:'/user/images/autopic2/22222222-2222-4222-8222-222222222222.png',status:'done',created:new Date().toISOString(),scene:body.scene,config:body.config,seed:9}});});
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(2500);
 await p.evaluate(async()=>{const c=SillyTavern.getContext();const s=c.extensionSettings.autopic2;
   s.presets=[{name:'당쓰',config:{model:'nai-diffusion-4-5-full',style:'dang style',negative:'bad hands',steps:28}},{name:'존연',config:{model:'nai-diffusion-4-5-curated',style:'zon style',negative:'lowres',steps:23,scale:6}}];
   Object.assign(s,{style:'dang style',negative:'bad hands',model:'nai-diffusion-4-5-full',steps:28});localStorage.removeItem('scenebook-active-style');
   await c.selectCharacterById(0);});
 await p.waitForTimeout(2500);
 const show=()=>{const c=sent.at(-1);return JSON.stringify({model:c?.model,steps:c?.steps,style:c?.style,negative:c?.negative});};
 const regen=async()=>{await p.locator('#chat .ap2-figure').first().getByRole('button',{name:'재생성'}).evaluate(n=>n.click());await p.waitForTimeout(2500);};
 // 1) 씬북 창 프리셋 빠른 선택 → 존연
 await p.evaluate(async()=>{await SillyTavern.getContext().executeSlashCommandsWithOptions('/scenebook');});await p.waitForTimeout(800);
 const st=p.locator('dialog.ap2-studio');
 const tab=st.getByRole('button',{name:/그림/}).first();await tab.click().catch(()=>{});await p.waitForTimeout(500);
 const sel=st.locator('label',{hasText:'적용할 프리셋'}).locator('select');
 console.log('빠른 선택 칸',await sel.count());
 await sel.selectOption({label:'존연'});await p.waitForTimeout(600);
 console.log('설정',JSON.stringify(await p.evaluate(()=>{const s=SillyTavern.getContext().extensionSettings.autopic2;return{style:s.style,model:s.model,active:localStorage.getItem('scenebook-active-style')};})));
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
 await regen();console.log('씬북 창 존연 → 재생성',show());
 // 2) 연필에서 당쓰 고르고 다시 그리기 → 고정되는지
 await p.locator('#chat .ap2-figure').first().getByRole('button',{name:'수정'}).evaluate(n=>n.click());await p.waitForTimeout(700);
 const d=p.locator('dialog.ap2-quick-edit');
 await d.locator('section.ap2-edit-block',{has:p.locator('h3',{hasText:'그림체 프리셋'})}).locator('select').selectOption({label:'당쓰'});await p.waitForTimeout(300);
 await d.getByRole('button',{name:'다시 그리기'}).click();await p.waitForTimeout(2500);
 console.log('연필 당쓰 → 다시 그리기',show());
 console.log('연필 뒤 설정',JSON.stringify(await p.evaluate(()=>{const s=SillyTavern.getContext().extensionSettings.autopic2;return{style:s.style,model:s.model,active:localStorage.getItem('scenebook-active-style')};})));
 await regen();console.log('그다음 재생성',show());
 // 3) 씬북 창에서 그림체(look)만 바꾸고 재생성
 await p.evaluate(()=>{const s=SillyTavern.getContext().extensionSettings.autopic2;s.look='sketch';});
 await regen();console.log('씬북 창 그림체 연필 스케치 → 재생성',show());
 // 4) 연필에서 그림체만 바꾸고 다시 그리기 → 기본 설정에 저장되는지
 await p.locator('#chat .ap2-figure').first().getByRole('button',{name:'수정'}).evaluate(n=>n.click());await p.waitForTimeout(700);
 const d2=p.locator('dialog.ap2-quick-edit');
 console.log('연필 그림체 처음 값',await d2.locator('label:has(> span:text-is("그림체")) select, label:has(span:text-is("그림체")) select').first().inputValue());
 await d2.locator('label:has(> span:text-is("그림체")) select, label:has(span:text-is("그림체")) select').first().selectOption('pixel');
 await d2.getByRole('button',{name:'다시 그리기'}).click();await p.waitForTimeout(2500);
 console.log('연필 도트 → 다시 그리기',show());
 console.log('설정 look',await p.evaluate(()=>SillyTavern.getContext().extensionSettings.autopic2.look));
 await regen();console.log('그다음 재생성',show());
 console.log(errs);await b.close();})();
