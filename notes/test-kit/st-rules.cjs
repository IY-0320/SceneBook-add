// 지시문 편집 · 공유: 출력 규칙(삽화·수동 분석)을 고쳐 적용 → 저장·실제 전달 글에 반영, 기본 규칙으로 되돌리기. 인자: 스크린샷(.png)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});
 const errs=[];p.on('pageerror',e=>{if(!/Internal S/.test(e.message))errs.push(e.message)});
 await p.route('**/api/plugins/autopic2/health',r=>r.fulfill({json:{version:'0.5.1',models:{},hasKey:true}}));
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(2000);
 await p.evaluate(async()=>{const c=SillyTavern.getContext();delete c.extensionSettings.autopic2_output_rules;c.extensionSettings.autopic2.leanPrompt=false;await c.selectCharacterById(0);});await p.waitForTimeout(1500);
 const openEditor=async()=>{await p.evaluate(async()=>{await SillyTavern.getContext().executeSlashCommandsWithOptions('/scenebook');});await p.waitForTimeout(800);
   const st=p.locator('dialog.ap2-studio');await st.locator('.ap2-nav .ap2-nav-item',{hasText:'프롬프트'}).first().click();await p.waitForTimeout(400);
   await st.locator('details').evaluateAll(ns=>ns.forEach(n=>n.open=true));await p.waitForTimeout(200);await st.getByRole('button',{name:'지시문 편집 · 공유'}).click();await p.waitForTimeout(600);return p.locator('dialog',{has:p.locator('h2',{hasText:/^프롬프트$/})}).last();};
 const rulesBox=(d)=>d.locator('div:not([hidden]) > details.ap2-guide-topic textarea').first();
 let d=await openEditor();
 // 삽화 지시문 탭(처음 열린 탭이 삽화 지시문)
 await d.getByRole('button',{name:'삽화 지시문'}).click();await p.waitForTimeout(200);
 await d.locator('div:not([hidden]) > details.ap2-guide-topic').evaluate(n=>n.open=true);
 const box=rulesBox(d);console.log('삽화 규칙 칸 고칠 수 있음',await box.isEditable());
 await box.fill('MY INJECTION RULE');await p.waitForTimeout(100);
 console.log('상태',await d.locator('div:not([hidden]) > details.ap2-guide-topic p[role=status]').textContent());
 await d.getByRole('button',{name:'수동 분석 지시문'}).click();await p.waitForTimeout(200);
 await d.locator('div:not([hidden]) > details.ap2-guide-topic').evaluate(n=>n.open=true);
 const abox=rulesBox(d);console.log('분석 기본 규칙 앞부분',JSON.stringify((await abox.inputValue()).slice(0,40)));
 await abox.fill((await abox.inputValue())+'\nMY ANALYSIS RULE');
 await d.screenshot({path:process.argv[2]});
 await d.getByRole('button',{name:'적용',exact:true}).click();await p.waitForTimeout(600);
 const check=()=>p.evaluate(async()=>{const base='/scripts/extensions/third-party/SceneBook-add/src/';const inj=await import(base+'injection.mjs'),pr=await import(base+'prompts.mjs');const c=SillyTavern.getContext(),s=c.extensionSettings.autopic2;
   const injText=inj.renderInjection(s),an=pr.renderAnalysis({world:'',library:[],direction:'',messages:[]},s);
   return{saved:c.extensionSettings.autopic2_output_rules,injHasMine:injText.includes('MY INJECTION RULE'),injHasDefault:injText.includes('VISIBLE DETAIL'),anHasMine:an.includes('MY ANALYSIS RULE')};});
 console.log('적용 뒤',JSON.stringify(await check()));
 await p.keyboard.press('Escape');await p.waitForTimeout(300);
 // 기본 규칙으로 되돌리기
 d=await openEditor();
 for(const tab of ['삽화 지시문','수동 분석 지시문']){await d.getByRole('button',{name:tab}).click();await p.waitForTimeout(200);await d.locator('div:not([hidden]) > details.ap2-guide-topic').evaluate(n=>n.open=true);console.log(tab,'다시 열었을 때',JSON.stringify((await rulesBox(d).inputValue()).slice(-20)));await d.locator('div:not([hidden]) > details.ap2-guide-topic').getByRole('button',{name:'기본 규칙으로'}).click();}
 await d.getByRole('button',{name:'적용',exact:true}).click();await p.waitForTimeout(600);
 console.log('되돌린 뒤',JSON.stringify(await check()));
 console.log(errs);await b.close();})();
