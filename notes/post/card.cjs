const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7'],deviceScaleFactor:1});const p=await ctx.newPage();
 await p.goto('file://'+process.argv[2]+'/test.html');await p.waitForTimeout(400);
 const card=p.locator('.sbp .sbp-card').nth(1);await card.scrollIntoViewIfNeeded();await p.waitForTimeout(500);
 await card.tap();await p.waitForTimeout(900);
 await card.screenshot({path:process.argv[2]+'/card-open.png'});
 console.log('열린 카드 글자색',await card.locator('.sbp-list li').first().evaluate(n=>getComputedStyle(n).color));
 await b.close();})();
