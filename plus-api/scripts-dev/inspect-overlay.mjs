// Dev-only: why isn't the dashboard/profile overlay visible? Measure its real
// geometry, its offsetParent, ancestor transforms (which break position:fixed),
// and what element is actually on top at the viewport center.
import { chromium } from 'playwright';
const SITE = 'http://localhost:5500', API = 'http://localhost:8787';

async function cookieFor(phone) {
  const r = await fetch(`${API}/auth/otp/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) });
  const v = await fetch(`${API}/auth/otp/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, code: (await r.json()).dev_code }) });
  return v.headers.get('set-cookie').split(';')[0].split('=').slice(1).join('=');
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const PAGE of ['/chairside/chairside-25.html', '/', '/episodes.html']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([{ name: 'dcp_session', value: await cookieFor('09120000001'), domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
  const p = await ctx.newPage();
  await p.goto(SITE + PAGE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  await p.click('.dcp-person-btn.is-user').catch(() => {});
  await p.waitForTimeout(200);
  await p.click('.dcp-person-menu .dcp-person-item:nth-child(1)').catch(() => {});
  await p.waitForTimeout(600);

  const info = await p.evaluate(() => {
    const o = document.querySelector('.dcp-overlay');
    if (!o) return { present: false };
    const r = o.getBoundingClientRect();
    const cs = getComputedStyle(o);
    // ancestor transforms/filters that would make position:fixed relative to them
    const badAncestors = [];
    for (let n = o.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.transform !== 'none' || s.filter !== 'none' || s.perspective !== 'none' || s.willChange.includes('transform') || s.contain.includes('paint') || s.contain.includes('layout')) {
        badAncestors.push(n.tagName + '.' + (n.className || '').toString().split(' ')[0] + ' {transform:' + s.transform + ', filter:' + s.filter + ', contain:' + s.contain + '}');
      }
    }
    const cx = Math.round(r.left + r.width / 2), cy = Math.round(window.innerHeight / 2);
    const topEl = document.elementFromPoint(cx, cy);
    return {
      present: true, viewport: { w: window.innerWidth, h: window.innerHeight },
      rect: { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) },
      position: cs.position, inset: cs.inset || (cs.top + '/' + cs.right + '/' + cs.bottom + '/' + cs.left), zIndex: cs.zIndex,
      offsetParent: o.offsetParent ? (o.offsetParent.tagName + '.' + (o.offsetParent.className || '').toString().split(' ')[0]) : null,
      appendedTo: o.parentElement ? o.parentElement.tagName : null,
      badAncestors,
      topElementAtCenter: topEl ? (topEl.tagName + '.' + (topEl.className || '').toString().split(' ').slice(0, 2).join('.')) : null,
      overlayContainsTopEl: topEl ? o.contains(topEl) : null,
    };
  });
  console.log(`\n=== ${PAGE} ===`);
  console.log(JSON.stringify(info, null, 1));
  await ctx.close();
}
await browser.close();
