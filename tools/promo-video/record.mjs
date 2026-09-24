// DentCast promo: «کانتکت بین ۶ و ۷ هی باز میشه» → search → MetaNote 12 → highlight.
//
// usage (repo root):  npx http-server -p 8080 -s -c-1 .
//          then, in a scratch dir:  node /path/to/repo/tools/promo-video/record.mjs
// writes frames/ + list.txt there; README.md has the ffmpeg line that makes the mp4.
//
// The site is driven for real inside a phone frame (stage.tpl, served by this script
// under /__promo/ on the site's own origin). The Plus API is answered by a tiny mock
// below — a signed-in premium reader with an empty highlight list — so میز کار and
// the highlight toolbar are the real modules, not a drawing of them.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SITE = process.env.SITE || 'http://localhost:8080';
const API = process.env.API || 'http://localhost:8787';     // plus/js/config.js on localhost
const W = 540, H = 960, OUT = 'frames', SB = 47;             // SB: fake status bar above the iframe
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fa-IR' });
await ctx.addInitScript(() => {
  if (location.pathname.startsWith('/__promo')) return;
  try { localStorage.setItem('dc-tos-v2', JSON.stringify({ hello2: 1 })); } catch (e) {}
  const css = `#dcSearchOverlay,#dcSearchOverlay *:not(svg):not(path){font-family:'Vazirmatn',sans-serif!important}
  [class*="dc-spot"],#dc-float-search{display:none!important}
  ::-webkit-scrollbar{display:none}
  html{scroll-behavior:auto!important}`;
  const add = () => { const s = document.createElement('style'); s.textContent = css; (document.head || document.documentElement).appendChild(s); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
});
await ctx.route(SITE + '/__promo/**', r => {
  const u = new URL(r.request().url()).pathname.replace('/__promo', '');
  if (u === '/stage.html') return r.fulfill({ path: path.join(HERE, 'stage.tpl'), contentType: 'text/html; charset=utf-8' });
  if (u === '/logo-v2.png') return r.fulfill({ path: path.join(ROOT, 'logo-v2.png') });
  if (u === '/vazir.woff2') return r.fulfill({ path: path.join(ROOT, 'fonts/Vazirmatn[wght].woff2'), contentType: 'font/woff2' });
  return r.fulfill({ status: 404 });
});
// Mock Plus API: premium reader, no highlights yet; everything else answers {}.
let hid = 0;
await ctx.route(API + '/**', async r => {
  const req = r.request(), u = new URL(req.url()), m = req.method();
  const headers = { 'access-control-allow-origin': SITE, 'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
  if (m === 'OPTIONS') return r.fulfill({ status: 204, headers });
  let body = {};
  if (u.pathname === '/me') body = { id: 'demo', display_name: 'دکتر', tier: 'premium', settings: { tour_seen: 1 } };
  else if (u.pathname === '/highlights' && m === 'GET') body = { highlights: [] };
  else if (u.pathname === '/highlights' && m === 'POST') body = { highlight: { id: 'h' + (++hid), ...JSON.parse(req.postData()), note: null, created_at: new Date().toISOString() } };
  return r.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) });
});
await ctx.route('**/spot/spot.js*', r => r.abort());
await ctx.route('**/*googletagmanager*', r => r.abort());

const page = await ctx.newPage();
await page.goto(SITE + '/__promo/stage.html');
await page.evaluate(s => document.getElementById('f').src = s + '/', SITE);
const fr = () => page.frames().find(f => f !== page.mainFrame() && f.url().startsWith(SITE));
await page.waitForTimeout(3500);

const S = (fn, ...a) => page.evaluate(([fn, a]) => window.S[fn](...a), [fn, a]);
const sleep = ms => page.waitForTimeout(ms);
// iframe coords → cam coords (the finger lives in the cam, under the status bar)
const centerOf = loc => loc.evaluate((e, sb) => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2 + sb]; }, SB);
const tapAt = async (x, y, from = [60, 240], pressMs = 140) => {
  await S('fingerShow', x + from[0], y + from[1]); await sleep(180);
  await S('fingerMove', x, y, 750); await sleep(820);
  await S('press', true); await S('ripple'); await sleep(pressMs);
};
const release = async () => { await S('press', false); await sleep(250); await S('fingerHide'); };
// eased scroll inside the site so the move reads as a thumb, not a jump
const glide = (y, ms) => fr().evaluate(([y, ms]) => new Promise(res => {
  const y0 = scrollY, t0 = performance.now();
  const f = t => { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    scrollTo(0, y0 + (y - y0) * e); k < 1 ? requestAnimationFrame(f) : res(); };
  requestAnimationFrame(f);
}), [y, ms]);

// ── screencast
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => { frames.push({ data, ts: metadata.timestamp }); cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 94, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });

// 0 — hook
await S('unblack');
await S('hook');
await S('hookOut'); await sleep(900);

// 1 — بپرس
await S('step', 0); await S('cap', 'قدم اول', 'تو <b>دنت‌کست</b> جستجو کن');
await sleep(1300);
const hero = fr().locator('#panel-studio .dc-exa-search');
let [x, y] = await centerOf(hero);
await tapAt(x + 30, y);
await fr().evaluate(() => document.querySelector('#panel-studio .dc-exa-search').click());
await release();
await S('camera', 1.1, 195, 150, 900); await sleep(600);

// 2 — بنویس
await S('step', 1); await S('cap', 'قدم دوم', 'فقط بنویس: <b>کانتکت</b>');
await sleep(500);
const word = 'کانتکت', gaps = [230, 180, 270, 160, 240, 200];
for (let i = 0; i < word.length; i++) { await fr().locator('#dcSearch').pressSequentially(word[i]); await sleep(gaps[i]); }
await sleep(700);
await S('camera', .86, 195, 0, 1000);

// 3 — پیدا کن
await S('step', 2); await S('cap', 'قدم سوم', 'هر چی درباره‌ش گفتیم، <b>یک‌جا</b>');
await sleep(1900);
const res = fr().locator('#dcSearchOverlay').getByText('یه نکته ی مهم در مدیریت کانتکت').first();
await res.scrollIntoViewIfNeeded();
[x, y] = await centerOf(res);
await S('cap', 'قدم سوم', 'این همون سؤال منه! <b>متانوت ۱۲</b>');
await tapAt(x + 20, y, [-40, 200], 260);
await res.evaluate(e => { const row = e.closest('a,li,div'); row.style.transition = 'background .3s'; row.style.background = 'rgba(37,99,235,.14)'; });
await sleep(250);
await S('veil', 1); await sleep(350);
await res.evaluate(e => (e.closest('a') || e).click());
await release();
await fr().waitForLoadState('load').catch(() => {});
await sleep(700);

// 4 — بخوان
await S('veil', 0);
await S('step', 3); await S('cap', 'قدم چهارم', 'مشکل فقط <b>اکلوژن</b> نیست…');
await sleep(1600);
const yOf = (text, off) => fr().evaluate(([t, off]) => {
  const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (n.data.includes(t)) { const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().top + scrollY - off; }
  return 0;
}, [text, off]);
await glide(await yOf('آیا فقط اکلوژن', 90), 1800);
await sleep(1500);
await S('cap', 'قدم چهارم', 'نیروی <b>وج‌مانند</b> بین ۶ و ۷');
await glide(await yOf('تفاوت حضور و عدم حضور', 110), 1800);
await sleep(1500);

// 5 — هایلایت کن
await S('step', 4); await S('cap', 'قدم پنجم', 'میز کار رو باز کن و <b>هایلایت کن</b>');
await glide(0, 900); await sleep(300);
const wbBtn = fr().locator('#dcActionRow .dc-act-primary').first();
[x, y] = await centerOf(wbBtn);
await tapAt(x, y, [80, 220]);
await wbBtn.evaluate(e => e.click());
await release();
await sleep(900);

// select a sentence the way a thumb would — the finger rides the end of the range
const highlight = async (text, first, last, pick) => {
  await glide(await yOf(first, 70), 1400); await sleep(300);
  const pts = await fr().evaluate(([first, last, sb]) => {
    const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (n.data.includes(first)) break;
    window.__n = n; window.__s = n.data.indexOf(first); window.__e = n.data.indexOf(last) + last.length;
    const out = [];
    for (let i = __s + 1; i <= __e; i += 2) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i); const b = r.getBoundingClientRect(); out.push([b.left, b.top + b.height / 2 + sb]); }
    return out;
  }, [first, last, SB]);
  await S('fingerShow', pts[0][0] + 6, pts[0][1] + 60); await sleep(150);
  await S('fingerMove', pts[0][0] + 6, pts[0][1], 500); await sleep(600);
  await S('press', true);
  const steps = 34;
  for (let k = 1; k <= steps; k++) {
    const i = Math.round((pts.length - 1) * k / steps);
    await fr().evaluate(i => { getSelection().setBaseAndExtent(__n, __s, __n, Math.min(__s + 1 + i * 2, __e)); }, i);
    await S('fingerMove', pts[i][0], pts[i][1], 55); await sleep(55);
  }
  await fr().evaluate(() => { getSelection().setBaseAndExtent(__n, __s, __n, __e); document.dispatchEvent(new Event('touchend', { bubbles: true })); });
  await S('press', false); await sleep(450);
  const tool = pick(fr());
  [x, y] = await centerOf(tool);
  await S('fingerMove', x, y, 650); await sleep(720);
  await S('press', true); await S('ripple'); await sleep(140);
  await tool.evaluate(e => e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })));  // the toolbar arms on pointerdown
  await release();
};
await S('cap', 'قدم پنجم', 'جمله‌ی کلیدی رو <b>نگه دار</b>');
await highlight('', 'پیشنهاد میشود وقتی دندان ۶', 'روکش موقت جایگزین شود.',
  f => f.getByRole('button', { name: 'هایلایت' }).first());
await S('pop', '<i style="background:#fcd34d"></i>هایلایت شد · برچسب «مهم»');
await sleep(1600); await S('pop', '');
await S('cap', 'قدم پنجم', 'هر رنگ، <b>یک معنا</b>');
await highlight('', 'پس نکته', 'بین جلسات اصلاح است.',
  f => f.locator('.dcp-swatch[aria-label="رنگ سبز"]').first());
await S('pop', '<i style="background:#86efac"></i>همه‌ش توی دفترچه‌ت می‌مونه');
await sleep(1200);

// stay in the workbench (leaving it hides the marks): settle on both highlights, push in, outro
await fr().evaluate(() => getSelection().removeAllRanges());
await S('pop', '');
await glide(await yOf('پیشنهاد میشود وقتی دندان ۶', 110), 1200);
await S('camera', 1.16, 195, 260, 2600); await sleep(2800);
await S('camera', .86, 195, 0, 1000); await sleep(700);
await S('outro'); await sleep(3600);

await cdp.send('Page.stopScreencast');
await b.close();
frames.forEach((f, i) => fs.writeFileSync(`${OUT}/${String(i).padStart(5, '0')}.jpg`, Buffer.from(f.data, 'base64')));
let s = 'ffconcat version 1.0\n';
frames.forEach((f, i) => { const d = i + 1 < frames.length ? frames[i + 1].ts - f.ts : 0.5; s += `file ${OUT}/${String(i).padStart(5, '0')}.jpg\nduration ${d.toFixed(4)}\n`; });
s += `file ${OUT}/${String(frames.length - 1).padStart(5, '0')}.jpg\n`;
fs.writeFileSync('list.txt', s);
console.log(frames.length, 'frames,', (frames.at(-1).ts - frames[0].ts).toFixed(1) + 's');
