/* ============================================================
   DentCast Global Search Engine — Final Stable Version v5.0
   Author: ChatGPT for Dr. Fouad Shahabian
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ------------ DOM ------------- */
  const searchInput = document.getElementById("dcSearch");
  const resultsBox  = document.getElementById("dcResults");
  const filterBtns  = document.querySelectorAll(".dc-filter-btn");

  /* ------------ DB --------------- */
  let DB = [];

  /* ------------ فیلترهای فعال -------------- */
 let activeFilters = new Set([
  "dentcast",
  "notecast",
  "clinical",
  "dentcast_plus",
  "dentai",
  "meta",
  "chairside",
  "sharehub"
]);


  /* ------------ مپ نوع‌ها --------------- */
const TYPE_MAP = {
  notecast:       "notecast",
  clinical:       "clinical",
  dentcast_plus:  "dentcast_plus",
  dentai:         "dentai",
  meta:           "meta",
  chairside:      "chairside",
  sharehub:       "sharehub"
};


  /* ------------ لود دیتابیس ---------------- */
  async function loadDB() {
    try {
      const res = await fetch("/dentcast-brain.json", { cache: "no-store" });
      DB = await res.json();
      /* اگه کاربر قبل از لود دیتابیس سرچ کرده بود (مثلاً از URL) */
      if (searchInput.value.trim()) {
        performSearch(searchInput.value.trim());
      } else {
        /* DB خیلی سریع لود شد (مثلاً Chrome) — صبر کن شاید openS هنوز نرسیده */
        setTimeout(() => {
          if (searchInput.value.trim()) performSearch(searchInput.value.trim());
        }, 150);
      }
    } catch (err) {
      console.error("Error loading dentcast-brain.json", err);
    }
  }

  /* ------------ مدیریت فیلترها -------------- */
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.type;

      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        activeFilters.delete(key);
      } else {
        btn.classList.add("active");
        activeFilters.add(key);
      }

      performSearch(searchInput.value.trim());
    });
  });

  /* ------------ سرچ زنده ----------------- */
  searchInput.addEventListener("input", () => {
    performSearch(searchInput.value.trim());
  });

  /* ------------ Enter key --------------- */
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch(searchInput.value.trim());
  });

  /* ------------ تشخیص گروه ---------------- */
  function detectGroup(item) {
    if (item.episode && !item.type) return "dentcast";
    if (item.type && TYPE_MAP[item.type]) return item.type;
    return null;
  }

  /* ------------ ساخت یک آیتم HTML ---------- */
  function buildItem(item) {
  const group = item._group;
  const title = item.title || "";

 const _ic = (p) => '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block">' + p + '</svg>';
 const _iMic  = _ic('<path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4z"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 17v4"/><path d="M8 21h8"/>');
 const _iNote = _ic('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>');
 const _iBulb = _ic('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.8.8 1 1.5 1 2.3h6c0-.8.2-1.5 1-2.3A7 7 0 0 0 12 2z"/>');
 const _iPlay = _ic('<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>');
 const _iBook = _ic('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>');
 const _iPuzz = _ic('<path d="M8 3h4v4h3a2 2 0 1 1 0 4h-3v3h3a2 2 0 1 1 0 4h-3v3H8v-3H5a2 2 0 1 1 0-4h3v-3H5a2 2 0 1 1 0-4h3z"/>');
 const _iToot = _ic('<path d="M8.5 3.5c1.2 0 2 .6 3.5.6s2.3-.6 3.5-.6c2 0 3.5 1.6 3.5 4 0 2.8-1.5 4.4-2.2 7.4-.7 3-1.4 5.6-3 5.6-1.2 0-1.1-3.5-1.8-3.5s-.6 3.5-1.8 3.5c-1.6 0-2.3-2.6-3-5.6C6.5 11.9 5 10.3 5 7.5c0-2.4 1.5-4 3.5-4z"/>');
 const _iLink = _ic('<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/>');
 const labelMap = {
  dentcast:      _iMic  + " دنت‌کست — اپیزود " + item.episode,
  notecast:      _iNote + " نوت‌کست — " + title,
  clinical:      _iBulb + " نکته کلینیکی — " + title,
  dentcast_plus: _iPlay + " دنت‌کست+ — " + title,
  dentai:        _iBook + " مقاله — " + title,
  meta:          _iPuzz + " متانوت — " + title,
  chairside:     _iToot + " چرساید — " + title,
  sharehub:      _iLink + " Share Hub — " + title
};


  let url = item.page_url || item.url || "";
  if (!url && group === "dentcast" && item.episode) {
    const slug = String(item.episode).replace(".", "-");
    url = `/episodes/episode-${slug}.html`;
  }
  if (!url.startsWith("http")) url = "https://dentcast.org" + url;

  /* On desktop (≥1024px), open content in col-C via dcdOpen; on mobile navigate directly */
  const escapedTitle = title.replace(/'/g, "\\'");
  const clickHandler = `(window.innerWidth>=1024&&window.dcdOpen ? window.dcdOpen('${url}','${escapedTitle}') : (window.location.href='${url}'))`;

  return `
    <div class="dc-result-item"
         role="button"
         tabindex="0"
         onclick="${clickHandler}">
      ${labelMap[group] || title}
    </div>
  `;
}


  /* ------------ الگوریتم اصلی سرچ ------------ */
  function performSearch(q) {

    if (q.length < 2) {
      resultsBox.style.display = "none";
      resultsBox.innerHTML = "";
      return;
    }

    const query = q.toLowerCase();
    let results = [];

    for (const item of DB) {
      const group = detectGroup(item);
      if (!group) continue;

      item._group = group;

      if (!activeFilters.has(group)) continue;

      const blob = (
        (item.title || "") + " " +
        (item.caption || "") + " " +
        (item.keywords || []).join(" ") + " " +
        (item.hashtags || []).join(" ")
      ).toLowerCase();

      if (blob.includes(query)) results.push(item);
    }

    /* --- نمایش ۳۰ تای اول --- */
    const more = results.length > 30;
    const visible = results.slice(0, 30);

    resultsBox.style.display = "block";
    resultsBox.innerHTML = `
      <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      ${visible.map(buildItem).join("")}
      ${more ? `<div class="dc-more-btn">مشاهده ادامه نتایج… (${results.length})</div>` : ""}
    `;

    /* ------------ بستن نتایج ------------- */
    resultsBox.querySelector(".dc-close-results").onclick = () => {
      resultsBox.style.display = "none";
      resultsBox.innerHTML = "";
    };

    /* ------------ دکمه ادامه نتایج ----------- */
    const moreBtn = resultsBox.querySelector(".dc-more-btn");
    if (moreBtn) {
      moreBtn.onclick = () => {
        resultsBox.innerHTML =
          `<button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` +
          results.map(buildItem).join("");

        resultsBox.querySelector(".dc-close-results").onclick = () => {
          resultsBox.style.display = "none";
          resultsBox.innerHTML = "";
        };
      };
    }
  }

  /* ------------ اجرای سیستم ---------------- */
  loadDB();

});
