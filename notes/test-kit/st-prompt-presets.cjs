// 저장한 지시문(지시문 편집 창 안) · 지시문 세트(바깥 칸) 확인. 인자: 스크린샷(.png)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});
 const errs=[];p.on('pageerror',e=>{if(!/Internal S/.test(e.message))errs.push(e.message)});
 await p.route('**/api/plugins/autopic2/health',r=>r.fulfill({json:{version:'0.5.1',models:{},hasKey:true}}));
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(2000);
 await p.evaluate(async()=>{const c=SillyTavern.getContext();delete c.extensionSettings.autopic2_prompt_presets;delete c.extensionSettings.autopic2_output_rules;Object.assign(c.extensionSettings.autopic2,{leanPrompt:false,analysisPrompt:'',injectionPrompt:''});await c.selectCharacterById(0);});await p.waitForTimeout(1500);
 p.on('dialog',()=>{});
 const st=p.locator('dialog.ap2-studio');
 const promptTab=async()=>{await st.locator('.ap2-nav .ap2-nav-item',{hasText:'프롬프트'}).first().click();await p.waitForTimeout(500);await st.locator('details.ap2-group',{has:p.locator('summary',{hasText:'AI 지시문'})}).evaluate(n=>n.open=true);await p.waitForTimeout(200);};
 const openEditor=async()=>{await promptTab();await st.getByRole('button',{name:'지시문 편집 · 공유'}).click();await p.waitForTimeout(600);return p.locator('dialog',{has:p.locator('h2',{hasText:/^프롬프트$/})}).last();};
 const cur=()=>p.locator('dialog',{has:p.locator('h2',{hasText:/^프롬프트$/})}).last().locator(':scope > div > div:not([hidden]), .ap2-dialog-body > div:not([hidden])').filter({has:p.locator('summary',{hasText:'저장한 지시문'})}).first();
 const confirm=async()=>{const c=p.locator('dialog.ap2-compact').last();if(await c.count()&&await c.isVisible())await c.getByRole('button').last().click();await p.waitForTimeout(300);};
 const state=()=>p.evaluate(()=>{const c=SillyTavern.getContext(),s=c.extensionSettings.autopic2;return{inj:s.injectionPrompt.slice(0,30),an:s.analysisPrompt.slice(-12),rules:c.extensionSettings.autopic2_output_rules,store:JSON.stringify(c.extensionSettings.autopic2_prompt_presets??{}).slice(0,160)};});
 await p.evaluate(async()=>{await SillyTavern.getContext().executeSlashCommandsWithOptions('/scenebook');});await p.waitForTimeout(800);
 let d=await openEditor();
 // 삽화 탭: 지시문+규칙 고쳐 'A'로 저장
 await d.getByRole('button',{name:'삽화 지시문'}).click();await p.waitForTimeout(200);
 let tab=cur();await tab.locator('details').evaluateAll(ns=>ns.forEach(n=>n.open=true));
 const injBox=tab.locator('label',{hasText:'삽화 주입 프롬프트'}).locator('textarea');
 await injBox.fill('A-INJ <!--scenebook {{data}}');
 await tab.locator('details',{has:p.locator('summary',{hasText:'출력 규칙'})}).locator('textarea').fill('A-RULES');
 await tab.locator('label',{hasText:'저장할 이름'}).locator('input').fill('A');await tab.getByRole('button',{name:'지금 내용 저장'}).click();await p.waitForTimeout(400);
 // 기본으로 되돌리고 A 불러오기
 await d.getByRole('button',{name:'기본 지시문'}).click();await tab.getByRole('button',{name:'기본 규칙으로'}).click();
 console.log('되돌린 뒤 지시문 앞',JSON.stringify((await injBox.inputValue()).slice(0,20)));
 await tab.locator('label',{hasText:'불러오기'}).locator('select').selectOption({label:'A'});await p.waitForTimeout(200);
 console.log('A 불러온 뒤',JSON.stringify(await injBox.inputValue()),JSON.stringify(await tab.locator('details',{has:p.locator('summary',{hasText:'출력 규칙'})}).locator('textarea').inputValue()));
 // 분석 탭: 'B'
 await d.getByRole('button',{name:'수동 분석 지시문'}).click();await p.waitForTimeout(200);
 tab=cur();await tab.locator('details').evaluateAll(ns=>ns.forEach(n=>n.open=true));
 await tab.locator('label',{hasText:'장면 분석 지시문'}).locator('textarea').fill('B-AN {{data}}');
 await tab.locator('label',{hasText:'저장할 이름'}).locator('input').fill('B');await tab.getByRole('button',{name:'지금 내용 저장'}).click();await p.waitForTimeout(400);
 await p.screenshot({path:process.argv[2].replace('.png','-editor.png')});
 await d.getByRole('button',{name:'적용',exact:true}).click();await p.waitForTimeout(800);
 console.log('적용 뒤',JSON.stringify(await state()));
 // 바깥: 세트 S1 저장
 await promptTab();
 await st.locator('label',{hasText:'새 세트 이름'}).locator('input').fill('S1');await st.getByRole('button',{name:'지금 지시문을 세트로 저장'}).click();await p.waitForTimeout(700);
 console.log('S1 저장 뒤 적용 중',await st.locator('.ap2-plus-prompt-sets .ap2-preset-row',{hasText:'S1'}).locator('.ap2-active-badge').count());
 // 지시문 바꾸기(기본으로) 후 S1 고르기
 await p.evaluate(()=>{const c=SillyTavern.getContext();Object.assign(c.extensionSettings.autopic2,{analysisPrompt:'',injectionPrompt:''});c.extensionSettings.autopic2_output_rules={analysis:'',injection:''};});
 await promptTab();
 console.log('바꾼 뒤 적용 중',await st.locator('.ap2-plus-prompt-sets .ap2-active-badge').count());
 await st.locator('label',{hasText:'지시문 세트 빠른 선택'}).locator('select').selectOption({label:'S1'});await p.waitForTimeout(800);
 console.log('S1 고른 뒤',JSON.stringify(await state()));
 console.log('S1 적용 중',await st.locator('.ap2-plus-prompt-sets .ap2-preset-row',{hasText:'S1'}).locator('.ap2-active-badge').count(),'칸 펼침 유지',await st.locator('details.ap2-group',{has:p.locator('summary',{hasText:'AI 지시문'})}).evaluate(n=>n.open));
 console.log('실제 전달',JSON.stringify(await p.evaluate(async()=>{const base='/scripts/extensions/third-party/SceneBook-add/src/';const inj=await import(base+'injection.mjs');const t=inj.renderInjection(SillyTavern.getContext().extensionSettings.autopic2);return{A:t.includes('A-INJ'),rules:t.includes('A-RULES')};})));
 await st.screenshot({path:process.argv[2]});
 // 같은 이름 덮어쓰기 + 삭제
 await st.locator('label',{hasText:'새 세트 이름'}).locator('input').fill('S1');await st.getByRole('button',{name:'지금 지시문을 세트로 저장'}).click();await p.waitForTimeout(400);
 console.log('덮어쓰기 확인 창',await p.locator('dialog.ap2-compact h2').last().textContent());await confirm();await p.waitForTimeout(400);
 await st.locator('.ap2-plus-prompt-sets .ap2-preset-row',{hasText:'S1'}).getByRole('button',{name:'삭제'}).click();await p.waitForTimeout(300);await confirm();await p.waitForTimeout(500);
 console.log('삭제 뒤 세트 수',await p.evaluate(()=>SillyTavern.getContext().extensionSettings.autopic2_prompt_presets.sets.length));
 console.log(errs);await b.close();})();
