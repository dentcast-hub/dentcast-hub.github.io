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
    "litecast",
    "photocast",
    "dentcast_plus",
    "dentai"
  ]);

  /* ------------ مپ نوع‌ها --------------- */
  const TYPE_MAP = {
    notecast:       "notecast",
    clinical:       "clinical",
    litecast:       "litecast",
    photocast:      "photocast",
    dentcast_plus:  "dentcast_plus",
    dentai:         "dentai"
  };

  /* ------------ لود دیتابیس ---------------- */
  async function loadDB() {
    try {
      const res = await fetch("/Dentcast-brain.txt", { cache: "no-store" });
      DB = await res.json();
    } catch (err) {
      console.error("❌ Error loading Dentcast-brain.txt", err);
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

  const labelMap = {
    dentcast:      "🎙️ دنت‌کست — اپیزود " + item.episode,
    notecast:      "📝 نوت‌کست — " + title,
    clinical:      "💡 نکته کلینیکی — " + title,
    litecast:      "✨ لایت‌کست — " + title,
    photocast:     "📸 فوتوکست — " + title,
    dentcast_plus: "🎬 دنت‌کست+ — " + title,
    dentai:        "📚 مقاله — " + title
  };

  let url = item.page_url || item.url || "";
  if (!url && group === "dentcast") url = "/episodes.html";
  if (!url.startsWith("http")) url = "https://dentcast.ir" + url;

  return `
    <div class="dc-result-item"
         role="button"
         tabindex="0"
         onclick="window.location.href='${url}'">
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
      <button class="dc-close-results">✖</button>
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
          `<button class="dc-close-results">✖</button>` +
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
