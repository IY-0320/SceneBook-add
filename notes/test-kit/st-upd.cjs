const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('http://127.0.0.1:8000/');await p.waitForFunction(()=>window.SillyTavern?.getContext?.()?.characters?.length>0,null,{timeout:60000});
const r=await p.evaluate(async()=>{const h=SillyTavern.getContext().getRequestHeaders();const res=await fetch('/api/extensions/update',{method:'POST',headers:h,body:JSON.stringify({extensionName:'SceneBook-add',global:false})});return [res.status,await res.text()];});
console.log(JSON.stringify(r));await b.close();})();
