// 이미지 읽기 → 프리셋 빠른 저장 (PNG 파일 이름 그대로 사용 / 직접 입력). 인자: PNG 경로, 스크린샷 경로(.png)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});
 const errs=[];p.on('pageerror',e=>{if(!/Internal S/.test(e.message))errs.push(e.message)});
 await p.route('**/api/plugins/autopic2/health',r=>r.fulfill({json:{version:'0.5.1',models:{},hasKey:true}}));
 await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});await p.waitForTimeout(2000);
 await p.evaluate(async()=>{const c=SillyTavern.getContext();c.extensionSettings.autopic2.presets=[];await c.selectCharacterById(0);});await p.waitForTimeout(1500);
 await p.evaluate(async()=>{await SillyTavern.getContext().executeSlashCommandsWithOptions('/scenebook');});await p.waitForTimeout(800);
 const openImport=async()=>{await p.locator('dialog.ap2-studio').getByRole('button',{name:'이미지에서 설정 읽기'}).click();await p.waitForTimeout(500);return p.locator('dialog',{has:p.locator('h2',{hasText:'이미지 읽기'})}).last();};
 let d=await openImport();
 console.log('읽기 전 버튼 보임',await d.getByRole('button',{name:'프리셋 빠른 저장'}).isVisible());
 console.log('파일칸',await d.locator('input[type=file]').count());await d.locator('input[type=file]').setInputFiles({name:require('path').basename(process.argv[2]),mimeType:'image/png',buffer:require('fs').readFileSync(process.argv[2])});await p.waitForTimeout(300);console.log('상태',await d.locator('p[role]').allTextContents(),errs);await p.waitForTimeout(800);
 console.log('읽은 뒤 버튼 보임',await d.getByRole('button',{name:'프리셋 빠른 저장'}).isVisible());
 await p.screenshot({path:process.argv[3]});
 await d.getByRole('button',{name:'프리셋 빠른 저장'}).click();await p.waitForTimeout(400);
 const q=p.locator('dialog',{has:p.locator('h2',{hasText:'프리셋 빠른 저장'})}).last();
 await q.screenshot({path:process.argv[3].replace('.png','-ask.png')});
 console.log('체크 기본',await q.locator('input[type=checkbox]').isChecked(),'이름칸 보임',await q.locator('label',{hasText:'프리셋 이름'}).last().isVisible());
 await q.getByRole('button',{name:'예',exact:true}).click();await p.waitForTimeout(500);
 const presets=()=>p.evaluate(()=>SillyTavern.getContext().extensionSettings.autopic2.presets.map(x=>({name:x.name,style:x.config.style,negative:x.config.negative,steps:x.config.steps,model:x.config.model})));
 console.log('저장 1',JSON.stringify(await presets()));
 // 직접 이름
 await d.getByRole('button',{name:'프리셋 빠른 저장'}).click();await p.waitForTimeout(400);
 await q.locator('input[type=checkbox]').evaluate(n=>n.click());await p.waitForTimeout(200);console.log('체크 끈 뒤 이름칸 보임',await q.locator('label',{hasText:'프리셋 이름'}).last().isVisible());await q.locator('label',{hasText:'프리셋 이름'}).last().locator('input').fill('내 오렌지');
 await q.getByRole('button',{name:'예',exact:true}).click();await p.waitForTimeout(500);
 // 아니오
 await d.getByRole('button',{name:'프리셋 빠른 저장'}).click();await p.waitForTimeout(400);await q.getByRole('button',{name:'아니오'}).click();await p.waitForTimeout(300);
 console.log('저장 2',JSON.stringify((await presets()).map(x=>x.name)));
 console.log('지금 설정 그대로인지 style',await p.evaluate(()=>SillyTavern.getContext().extensionSettings.autopic2.style));
 console.log(errs);await b.close();})();
