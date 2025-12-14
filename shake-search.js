/* shake-search.js */
(function () {
  if (!("DeviceMotionEvent" in window)) return;

  let last = 0, hits = 0, lastTime = 0;

  window.addEventListener("devicemotion", (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;

    const mag = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
    const delta = Math.abs(mag - last);
    const now = Date.now();

    if (delta > 16) {
      hits = (now - lastTime < 500) ? hits + 1 : 1;
      lastTime = now;

      if (hits >= 2 && window.dcSearch) {
        window.dcSearch.open();
        hits = 0;
      }
    }

    last = mag;
  }, { passive: true });
})();
