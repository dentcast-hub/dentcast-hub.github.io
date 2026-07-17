// /plus/cards.html — the flashcard archive was removed for the free version.
// The review/flashcard system will return in the premium scheduled-review layer.
// This page now just explains that and points back to the dashboard.
import { el } from './util.js';
import { registerSW } from './pwa.js';

function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'مرور فلش‌کارت‌ها به‌زودی در «مرور فلش‌کارت زمان‌بندی‌شده»ی پریمیوم در دسترس خواهد بود.'),
    el('p', { class: 'dcp-muted' }, 'هایلایت‌های شما حفظ می‌شوند و در همان مقاله و در «هایلایت‌های اخیر» پیشخوان دیده می‌شوند.'),
    el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'رفتن به پیشخوان'),
  ]));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
