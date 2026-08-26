// /plus/wayfinder.html — مسیریاب. Open to everyone (guest, free, premium):
// the wizard and one real recommendation are the whole point of a discovery
// tool, so unlike pathways.html this page never gates itself outright.
// Only how FAR the resulting flowchart goes depends on tier — handled inside
// wayfinder.js, not here.
import { currentUser, meStatus } from './api.js?v=29';
import { renderWayfinder } from './wayfinder.js?v=29';
import { registerSW } from './pwa.js?v=29';

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const user = await currentUser();
  // An unreachable API must not silently cap a paying subscriber's session —
  // treat it as "can't tell", not "not premium" (same reasoning premium-cta.js
  // documents for unreachableGate, applied here as fail-open instead of a
  // blocking retry screen, since the wizard itself needs no account at all).
  const meForGating = user || (meStatus() === 'error' ? { tier: 'premium' } : null);

  await renderWayfinder(root, meForGating);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
