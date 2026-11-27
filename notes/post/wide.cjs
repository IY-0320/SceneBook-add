const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const w of [320,360,414,800]){const p=await b.newPage({viewport:{width:w,height:900}});
 await p.goto('file://'+process.argv[2]+'/test.html');await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const W=document.documentElement.clientWidth;const out=[];for(const n of document.querySelectorAll('#sbp *')){const rc=n.getBoundingClientRect();if(rc.right>W+0.5||rc.left<-0.5)out.push(n.className||n.tagName);}return{over:document.documentElement.scrollWidth-W,out:[...new Set(out)].slice(0,6)};});
 console.log(w+'px 가로 넘침',r.over,r.out);await p.close();}
await b.close();})();
