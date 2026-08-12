import { chromium } from 'playwright';
const SHOT='/tmp/claude-0/-home-user-dentcast-hub-github-io/e7e99354-0ce2-533d-aa38-b1755dd7d756/scratchpad/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:2 });
await ctx.route('**://api.dentcast.*/**', r => {
  const u=new URL(r.request().url());
  r.continue({ url:'http://127.0.0.1:8787'+u.pathname+u.search });
});
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem('dcp:prempopup:shown','1'); }catch(_){} });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));

await page.goto('http://127.0.0.1:8080/up-board/', { waitUntil:'networkidle' });
await page.waitForSelector('.ub-row'); await page.waitForTimeout(700);

console.log('list (free):', (await page.textContent('#ubCount')).trim());
console.log('tab locked :', await page.$eval('[data-sort="top"]', b => b.classList.contains('is-locked')));
await page.screenshot({ path: SHOT+'gate-tab.png' });

await page.evaluate(()=>document.querySelector('[data-sort="top"]').click());
await page.waitForTimeout(700);
const sheet = await page.$('.dcp-sheet');
console.log('\nsheet:\n' + (sheet ? (await page.textContent('.dcp-sheet')).replace(/\s+/g,' ').trim() : 'NONE'));
console.log('\nstill on تازه‌ترین:', await page.$eval('[data-sort="new"]', b=>b.getAttribute('aria-selected')));
await page.screenshot({ path: SHOT+'gate-sheet.png' });
// ── same page as a FREE signed-in reader ───────────────────────────────
const phone='09127777777';
const req=await fetch('http://127.0.0.1:8787/auth/otp/request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({phone})});
const {dev_code}=await req.json();
const ver=await fetch('http://127.0.0.1:8787/auth/otp/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({phone,code:dev_code})});
const raw=ver.headers.getSetCookie().find(c=>c.startsWith('dcp_session=')).split(';')[0];
console.log('\n— free signed-in (server view) —');
const free=await fetch('http://127.0.0.1:8787/votes/board',{headers:{cookie:raw}});
console.log('board:', free.status, (await free.text()).slice(0,60));

console.log('\n— premium (server view) —');
const { execSync } = await import('node:child_process');
execSync(`psql 'postgres://dentcast:dentcast@localhost:5432/dentcast_plus_test' -qc "update profiles set tier='premium' where phone='${phone}'"`);
const prem=await fetch('http://127.0.0.1:8787/votes/board',{headers:{cookie:raw}});
const body=await prem.json();
console.log('board:', prem.status, '| items:', body.items.length, '| cap:', body.engagement_cap,
            '| top:', body.items[0].content_id, body.items[0].hearts+'❤', body.items[0].engagement);
console.log('cache-control:', prem.headers.get('cache-control'));

console.log('\nerrors:', errs.length?errs:'none');
await browser.close();
