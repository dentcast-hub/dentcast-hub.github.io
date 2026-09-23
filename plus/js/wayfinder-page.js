// /plus/wayfinder.html — مسیریاب. Open to everyone (guest, free, premium):
// the wizard and one real recommendation are the whole point of a discovery
// tool, so unlike pathways.html this page never gates itself outright.
// Only how FAR the resulting flowchart goes depends on tier — handled inside
// wayfinder.js, not here.
import { currentUser, meStatus } from './api.js?v=141';
import { renderWayfinder } from './wayfinder.js?v=141';
import { registerSW } from './pwa.js?v=141';
import { wirePageBack } from './page-back.js?v=141';

async function main() {
  registerSW();
  wirePageBack();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const user = await currentUser();
  // «We could not ask» is its own answer, and it is NOT «premium» (founder
  // decision, 2026-09-18). This page used to assume premium when /me failed,
  // borrowing premium-cta.js's reasoning that an outage must not cap a paying
  // subscriber. That reasoning is right where the server still guards the data
  // — every other premium surface fetches from a `requirePremium` route, so a
  // wrong guess in the browser costs a subscriber a few minutes and gives a
  // stranger nothing. مسیریاب is the one premium feature computed ENTIRELY in
  // the browser, from three public JSON files, with no server call to refuse
  // it. Here the same guess hands the whole flowchart to anyone whose /me does
  // not get a clean answer — an unreachable API, a filtered network, an
  // adblocker, a 5xx — signed out included. So this page fails CLOSED, and the
  // gate says which of the two happened rather than selling a subscription to
  // someone who may already own one.
  const unreachable = !user && meStatus() === 'error';

  await renderWayfinder(root, user, { unreachable });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
