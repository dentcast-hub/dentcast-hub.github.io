// Register the /plus service worker (app shell only; no offline content claims).
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/plus/sw.js', { scope: '/plus/' }).catch(() => {});
  });
}
