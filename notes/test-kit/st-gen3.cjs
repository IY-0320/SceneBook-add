const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});
 const logs=[];p.on('pageerror',e=>logs.push('PAGEERROR '+e.message));
 let generated=0;
 await p.route('**/api/plugins/autopic2/health',r=>r.fulfill({json:{version:'0.5.1',models:{},hasKey:true}}));
 await p.route('**/api/plugins/autopic2/generate',async r=>{const body=r.request().postDataJSON();generated++;await r.fulfill({json:{id:body.id,url:'/user/images/autopic2/22222222-2222-4222-8222-222222222222.png',status:'done',created:new Date().toISOString(),scene:body.scene,config:body.config,seed:7}});});
 await p.goto('http://127.0.0.1:8000/');
 await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});
 await p.waitForTimeout(2000);
 const out=await p.evaluate(async()=>{
   const orig=SillyTavern.getContext.bind(SillyTavern);
   window.prompts=[];
   SillyTavern.getContext=()=>{const c=orig();c.generateRaw=async({prompt,responseLength})=>{window.prompts.push(prompt);window.lengths=(window.lengths??[]).concat(responseLength);if(responseLength<16000)return '';return JSON.stringify({scenes:[{camera:'from side, upper body',size:'portrait',prompt:'forest cottage, warm light',after:2,evidence:'Second paragraph: she pours the tea',characters:[]}]});};return c;};
   const c=SillyTavern.getContext();
   await c.selectCharacterById(0);await new Promise(r=>setTimeout(r,2000));
   const m=c.chat[0];m.mes='First paragraph: you wake up in a cottage.\n\nSecond paragraph: she pours the tea and smiles.\n\nThird paragraph: rain starts outside.';delete m.extra?.autopic2;
   c.extensionSettings.autopic2={...c.extensionSettings.autopic2,placement:'auto'};
   await c.saveChat();await c.reloadCurrentChat();await new Promise(r=>setTimeout(r,1500));
   await SillyTavern.getContext().executeSlashCommandsWithOptions('/scenegen mode=ai');
   await new Promise(r=>setTimeout(r,4000));
   const text=document.querySelector('#chat .mes[mesid="0"] .mes_text');
   const kids=[...text.children].map(n=>n.tagName==='FIGURE'?'[FIGURE '+(n.querySelector('img')?.naturalWidth??'noimg')+']':n.textContent.slice(0,25));
   return {lengths:window.lengths,toasts:[...document.querySelectorAll('#toast-container .toast-message')].map(t=>t.textContent.slice(0,60)),kids,hasAutoRule:window.prompts.some(x=>x.includes('For EVERY scene include "after"'))};
 });
 console.log(JSON.stringify(out,null,1),'generate calls:',generated);
 await p.screenshot({path:process.argv[2]});
 console.log(logs.join('\n'));await b.close();
})();
