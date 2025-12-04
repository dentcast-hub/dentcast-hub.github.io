// episodes-drawer.js
document.addEventListener('DOMContentLoaded', function () {
  const body = document.body;
  const trigger = document.getElementById('dc-episodes-trigger');
  const sidebar = document.getElementById('dc-episodes-sidebar');
  const overlay = document.getElementById('dc-episodes-overlay');
  const closeBtn = document.getElementById('dc-episodes-close');
  const listContainer = document.getElementById('dc-episodes-list'); // جایی که لیست اپیزودها می‌نشیند

  if (!trigger || !sidebar || !overlay || !closeBtn || !listContainer) {
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

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeDrawer();
    }
  });


  // ─────────────────────────────────────────────
  // 1) لود دیتای اپیزودها از فایل Dentcast-brain.txt
  // ─────────────────────────────────────────────
  async function loadEpisodes() {
    try {
      const res = await fetch('/Dentcast-brain.txt');
      const text = await res.text();
      return JSON.parse(text);
    } catch (err) {
      console.error("Error loading Dentcast-brain.txt", err);
      return [];
    }
  }

  // ─────────────────────────────────────────────
  // 2) ساخت آکاردئون زیر هر اپیزود
  // ─────────────────────────────────────────────
  function renderEpisodes(episodes) {
    listContainer.innerHTML = '';

    episodes.forEach(ep => {
      const item = document.createElement('div');
      item.className = 'dc-episode-item';

      item.innerHTML = `
        <div class="dc-episode-header">
          <span class="dc-ep-number">اپیزود ${ep.episode}</span>
          <span class="dc-ep-title">${ep.title}</span>
        </div>

        <div class="dc-episode-body" style="display:none;">
          <div class="dc-ep-caption">${ep.caption}</div>

          <div class="dc-ep-tags">
            ${ep.hashtags.map(tag => `<span class="dc-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;

      const header = item.querySelector('.dc-episode-header');
      const body = item.querySelector('.dc-episode-body');

      header.addEventListener('click', () => {
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
      });

      listContainer.appendChild(item);
    });
  }


  // ─────────────────────────────────────────────
  // 3) اجرا: دیتارو لود کن → لیست رو رندر کن
  // ─────────────────────────────────────────────
  loadEpisodes().then(renderEpisodes);

});
