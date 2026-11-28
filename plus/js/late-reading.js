import { currentUser, meStatus } from './api.js?v=266';

// Late start for the reading tracker (plus.js setupWorkbench).
//
// The reading tracker starts only for a reader /me has confirmed, and the page
// asks /me once. When that one answer is «could not ask» — a slow or dropped
// mobile connection, the API mirror failover, the two-minute «API was just
// down» memory — the page looks signed in (the header remembers) while the read
// is never counted, and nothing tells anyone (user report: two articles read in
// the afternoon, the 20:00 streak reminder said no activity). So a page that
// could not ask keeps asking, a few times with backoff and whenever the tab
// comes back or the network returns, and starts the tracker the moment a profile
// arrives. Any later /me refresh on the page (a sign-in, a settings PATCH)
// announces `dcp:me` and starts it too. A definite 401 is not retried: that
// reader is signed out and only a sign-in — which announces — changes it.
export const LATE_ME_DELAYS_MS = [5000, 15000, 45000, 120000];
export function armLateReading(startReading, alive) {
  let done = false;
  let timer = null;
  let step = 0;
  const live = () => !done && (!alive || alive());
  const stop = () => {
    done = true;
    if (timer !== null) clearTimeout(timer);
    document.removeEventListener('dcp:me', onMe);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onOnline);
  };
  const got = (user) => {
    if (!live()) { stop(); return; }
    if (user) { stop(); startReading(); }
  };
  function onMe(e) { got(e && e.detail); }
  const ask = () => {
    if (!live()) { stop(); return; }
    if (meStatus() === 'anon') return; // signed out: wait for a sign-in's dcp:me
    currentUser({ refresh: true }).then(got); // refresh announces dcp:me → onMe too
  };
  const schedule = () => {
    if (!live() || step >= LATE_ME_DELAYS_MS.length) return;
    timer = setTimeout(() => { timer = null; ask(); schedule(); }, LATE_ME_DELAYS_MS[step]);
    step += 1;
  };
  function onVisible() { if (!document.hidden) ask(); }
  function onOnline() { ask(); }
  document.addEventListener('dcp:me', onMe);
  if (meStatus() !== 'error') return; // signed out or unknown: only a sign-in starts it
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);
  schedule();
}
