const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:360,height:760},deviceScaleFactor:1});
 await p.goto('file://'+process.argv[2]+'/test.html');await p.waitForTimeout(500);
 const H=await p.evaluate(()=>document.documentElement.scrollHeight);const shots=[];
 for(let y=0,i=0;y<H;y+=700,i++){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(350);await p.screenshot({path:`${process.argv[2]}/s${i}.png`});shots.push(i);}
 // 안 보이는(투명) 글자가 남았는지: 모든 섹션을 한 번씩 화면 가운데로
 const hidden=await p.evaluate(async()=>{const out=[];for(const n of document.querySelectorAll('#sbp .sbp-reveal')){n.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,250));if(parseFloat(getComputedStyle(n).opacity)<0.95)out.push(n.className);}return out;});
 console.log('스크린샷',shots.length,'| 화면 가운데에서도 흐린 섹션',hidden);await b.close();})();
