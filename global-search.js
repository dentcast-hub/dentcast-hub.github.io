/* ============================================================
   DentCast Global Search Engine — Final Stable Version v4.1
   Author: ChatGPT (for Dr. Fouad Shahabian)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------ ۱) المنت‌ها ------------------ */
  const searchInput = document.getElementById("dcSearch");
  const resultsBox  = document.getElementById("dcResults");
  const filterBtns  = document.querySelectorAll(".dc-filter-btn");

  /* ------------------ ۲) دیتابیس ------------------ */
  let DB = [];

  /* ------------------ ۳) فیلترهای فعال ------------------ */
  let activeFilters = new Set([
    "dentcast",
    "notecast",
    "clinical",
    "litecast",
    "photocast",
    "dentcast_plus",
    "dentai"
  ]);

  /* ------------------ ۴) مپ نوع‌ها (قطعی و نهایی) ------------------ */
  const TYPE_MAP = {
    notecast:       "notecast",
    clinical:       "clinical",
    litecast:       "litecast",
    photocast:      "photocast",
    dentcast_plus:  "dentcast_plus",
    dentai:         "dentai"
  };

  /* ------------------ ۵) لود دیتابیس از فایل اصلی ------------------ */
  async function loadDB() {
    try {
      const res = await fetch("/Dentcast-brain.txt", { cache: "no-store" });
      DB = await res.json();
      // در صورت موفقیت، هیچ چاپ در کنسول (پاکیزگی کامل)
    } catch (err) {
      console.error("❌ Cannot load Dentcast-brain.txt", err);
    }
  }

  /* ------------------ ۶) مدیریت فیلترها ------------------ */
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

  /* ------------------ ۷) سرچ زنده ------------------ */
  searchInput.addEventListener("input", () =>
    performSearch(searchInput.value.trim())
  );

  /* ------------------ ۸) تعیین گروه هر آیتم ------------------ */
  function detectGroup(item) {
    if (item.episode && !item.type) return "dentcast";
    if (item.type && TYPE_MAP[item.type]) return item.type;
    return null;
  }

  /* ------------------ ۹) ساخت آیتم HTML ------------------ */
  function buildItem(item) {

    const group = item._group;
    const title = item.title || "";

    let label = "";

    const labelMap = {
      dentcast:      "🎙️ دنت‌کست — اپیزود " + item.episode,
      notecast:      "📝 نوت‌کست — " + title,
      clinical:      "💡 نکته کلینیکی — " + title,
      litecast:      "✨ لایت‌کست — " + title,
      photocast:     "📸 فوتوکست — " + title,
      dentcast_plus: "🎬 دنت‌کست+ — " + title,
      dentai:        "📚 مقاله — " + title
    };

    label = labelMap[group] || title;

    let url = item.page_url || item.url || "";

    if (!url && group === "dentcast") url = "/episodes.html";
    if (!url.startsWith("http")) url = "https://dentcast.ir" + url;

    return `
      <a class="dc-result-item" href="${url}" target="_blank">
        ${label}
      </a>
    `;
  }

  /* ------------------ ۱۰) الگوریتم سرچ ------------------ */
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

      // ترکیب کامل قابل جستجو
      const blob = (
        (item.title || "") + " " +
        (item.caption || "") + " " +
        (item.keywords || []).join(" ") + " " +
        (item.hashtags || []).join(" ")
      ).toLowerCase();

      if (blob.includes(query)) results.push(item);
    }

    /* نمایش فقط ۳۰ آیتم اول */
    const more = results.length > 30;
    const visible = results.slice(0, 30);

    resultsBox.style.display = "block";
    resultsBox.innerHTML = `
      <button class="dc-close-results">✖</button>
      ${visible.map(buildItem).join("")}
      ${more ? `<div class="dc-more-btn">مشاهده ادامه نتایج… (${results.length})</div>` : ""}
    `;

    /* بستن */
    document.querySelector(".dc-close-results").onclick = () => {
      resultsBox.style.display = "none";
      resultsBox.innerHTML = "";
    };
  }

  /* ------------------ ۱۱) اجرای اولیه ------------------ */
  loadDB();

});
