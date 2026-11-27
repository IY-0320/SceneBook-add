const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const w of [360,800]){const p=await b.newPage({viewport:{width:w,height:900}});
 await p.goto('file://'+process.argv[2]+'/test.html');await p.waitForTimeout(800);
 const r=await p.evaluate(()=>{const bad=[];for(const n of document.querySelectorAll('#sbp *')){if(!n.childNodes.length||![...n.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))continue;const s=getComputedStyle(n);const fill=s.webkitTextFillColor;if(s.color==='rgb(255, 0, 0)'||fill==='rgb(255, 0, 0)')bad.push(n.tagName+'.'+n.className+':'+n.textContent.trim().slice(0,12));}
  return{bad,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};});
 console.log(w+'px','빨간 글자',r.bad.length,r.bad.slice(0,5),'| 가로 넘침',r.overflow);
 await p.screenshot({path:`${process.argv[2]}/shot-${w}.png`,fullPage:true});await p.close();}
await b.close();})();
