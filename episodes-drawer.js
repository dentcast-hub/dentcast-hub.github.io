// episodes-drawer.js
document.addEventListener('DOMContentLoaded', function () {
  const body = document.body;
  const trigger = document.getElementById('dc-episodes-trigger');
  const sidebar = document.getElementById('dc-episodes-sidebar');
  const overlay = document.getElementById('dc-episodes-overlay');
  const closeBtn = document.getElementById('dc-episodes-close');

  if (!trigger || !sidebar || !overlay || !closeBtn) {
    // اگر به هر دلیلی المنت‌ها پیدا نشدن، بی‌صدا خارج شو
    return;
  }

  function openDrawer() {
    body.classList.add('dc-episodes-open');
    sidebar.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    body.classList.remove('dc-episodes-open');
    sidebar.setAttribute('aria-hidden', 'true');
  }

  trigger.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // بستن با دکمه Esc
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeDrawer();
    }
  });
});
