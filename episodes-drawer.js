// episodes-drawer.js
document.addEventListener('DOMContentLoaded', function () {
  const body = document.body;
  const trigger = document.getElementById('dc-episodes-trigger');
  const sidebar = document.getElementById('dc-episodes-sidebar');
  const overlay = document.getElementById('dc-episodes-overlay');
  const closeBtn = document.getElementById('dc-episodes-close');
  const listContainer = document.getElementById('dc-episodes-list');
  const searchInput = document.getElementById('dc-episodes-search-input');

  if (!trigger || !sidebar || !overlay || !closeBtn || !listContainer) {
    return;
  }

  /* ---------------- Drawer کنترل ---------------- */
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
    if (event.key === 'Escape') closeDrawer();
  });

  /* ---------------- 1) لود JSON از فایل ---------------- */
  async function loadEpisodes() {
    try {
      const res = await fetch('/Dentcast-brain.txt');
      const text = await res.text();
      return JSON.parse(text); // چون کل فایل JSON خالصه
    } catch (err) {
      console.error("Error loading Dentcast-brain.txt", err);
      listContainer.innerHTML = `<p style="color:#f88; text-align:center;">خطا در لود اپیزودها</p>`;
      return [];
    }
  }

  /* ---------------- 2) ساخت کارت اپیزودها (آکاردئون) ---------------- */
  function renderEpisodes(episodes) {
    listContainer.innerHTML = '';

    episodes.forEach(ep => {
      const item = document.createElement('div');
      item.className = 'dc-episode-item';
      item.style.cssText = `
        background: rgba(255,255,255,0.08);
        border-radius: 12px;
        margin-bottom: 10px;
        padding: 12px;
        cursor: pointer;
      `;

      item.innerHTML = `
        <div class="dc-episode-header" style="display:flex; justify-content:space-between; color:#fff; font-weight:700;">
          <span style="color:#ffd54f;">اپیزود ${ep.episode}</span>
          <span>${ep.title}</span>
        </div>

        <div class="dc-episode-body" style="display:none; margin-top:10px; color:#d8d8d8; line-height:1.8; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
          <div class="dc-ep-caption" style="margin-bottom:10px;">
            ${ep.caption}
          </div>

          <div class="dc-ep-tags">
            ${ep.hashtags.map(tag => `<span style="
              display:inline-block;
              background:rgba(11,95,255,0.25);
              color:#b6d5ff;
              padding:4px 8px;
              border-radius:6px;
              margin-left:4px;
              font-size:.78rem;
            ">${tag}</span>`).join('')}
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

  /* ---------------- 3) سرچ زنده ---------------- */
  function setupSearch(allEpisodes) {
    searchInput.addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();

      if (q.length < 2) {
        renderEpisodes(allEpisodes);
        return;
      }

      const filtered = allEpisodes.filter(ep => {
        const bigText = (
          ep.title + ' ' +
          ep.caption + ' ' +
          ep.keywords.join(' ') + ' ' +
          ep.hashtags.join(' ')
        ).toLowerCase();

        return bigText.includes(q);
      });

      renderEpisodes(filtered);
    });
  }

  /* ---------------- 4) اجرای نهایی ---------------- */
  loadEpisodes().then(episodes => {
    window.DC_EPISODES = episodes; // اگر بعداً لازم شد
    renderEpisodes(episodes);
    setupSearch(episodes);
  });

});
