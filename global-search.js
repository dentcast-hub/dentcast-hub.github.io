document.addEventListener("DOMContentLoaded", () => {

  const searchInput = document.getElementById("dcSearch");
  const resultsBox  = document.getElementById("dcResults");
  const filterBtns  = document.querySelectorAll(".dc-filter-btn");

  let DB = [];
  let activeFilters = new Set([
    "dentcast","notecast","insight","litecast","photocast","video","article"
  ]);

  /* ------------------ ۱) مپ نوع‌ها ------------------ */
  const typeMap = {
    dentcast:      "episode",       // اپیزودهای اصلی
    notecast:      "notecast",
    insight:       "clinical",
    litecast:      "litecast",
    photocast:     "photocast",
    video:         "dentcast_plus",
    article:       "dentai"
  };

  /* ------------------ ۲) لود دیتابیس ------------------ */
  async function loadDB() {
    try {
      const res = await fetch("/Dentcast-brain.txt");
      DB = await res.json();
    } catch (err) {
      console.error("Error loading Dentcast-brain.txt", err);
    }
  }

  /* ------------------ ۳) فعال/غیرفعال کردن فیلتر ------------------ */
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.type;

      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        activeFilters.delete(t);
      } else {
        btn.classList.add("active");
        activeFilters.add(t);
      }

      performSearch(searchInput.value.trim());
    });
  });

  /* ------------------ ۴) سرچ زنده ------------------ */
  searchInput.addEventListener("input", () => {
    performSearch(searchInput.value.trim());
  });

  /* ------------------ ۵) ساخت HTML آیتم ------------------ */
  function buildItem(item) {

    // تعیین نوع فارسی
    let label = "";
    switch (item._group) {
      case "dentcast": label = "🎙️ دنت‌کست — اپیزود " + item.episode; break;
      case "notecast": label = "📝 نوت‌کست — " + item.title; break;
      case "insight":  label = "💡 نکته کلینیکی — " + item.title; break;
      case "litecast": label = "✨ لایت‌کست — " + item.title; break;
      case "photocast": label = "📸 فوتوکست — " + item.title; break;
      case "video": label = "🎬 دنت‌کست+ — " + item.title; break;
      case "article": label = "📚 مقاله — " + item.title; break;
    }

    // لینک‌دهی هوشمند
    let url = item.page_url || item.url || "";
    if (!url) {
      if (item._group === "dentcast") {
        url = "/episodes.html";
      }
    }

    if (!url.startsWith("http")) {
      url = "https://dentcast.ir" + url;
    }

    return `
      <a class="dc-result-item" href="${url}" target="_blank">
        ${label}
      </a>
    `;
  }

  /* ------------------ ۶) الگوریتم سرچ ------------------ */
  function performSearch(q) {

    if (q.length < 2) {
      resultsBox.style.display = "none";
      resultsBox.innerHTML = "";
      return;
    }

    q = q.toLowerCase();

    let results = [];

    DB.forEach(item => {

      /** تشخیص دسته */
      let group = null;

      // اپیزودهای اصلی
      if (item.episode && !item.type) group = "dentcast";
      else {
        for (let k in typeMap) {
          if (item.type === typeMap[k]) group = k;
        }
      }

      if (!group) return;
      item._group = group;

      // اگر فیلتر خاموش شده، حذف کن
      if (!activeFilters.has(group)) return;

      // متن قابل جستجو
      const text = (
        (item.title || "") + " " +
        (item.caption || "") + " " +
        (item.keywords || []).join(" ") + " " +
        (item.hashtags || []).join(" ")
      ).toLowerCase();

      if (text.includes(q)) results.push(item);
    });

    /* محدود به ۳۰ نتیجه */
    const more = results.length > 30;
    const visible = results.slice(0, 30);

    /* ساخت HTML */
    resultsBox.style.display = "block";
    resultsBox.innerHTML = `
      <button class="dc-close-results">✖</button>
      ${visible.map(buildItem).join("")}
      ${more ? `<div class="dc-more-btn">مشاهده ادامه نتایج… (${results.length})</div>` : ""}
    `;

    /* بستن نتایج */
    document.querySelector(".dc-close-results").onclick = () => {
      resultsBox.style.display = "none";
      resultsBox.innerHTML = "";
    };
  }

  /* ------------------ ۷) اجرای اولیه ------------------ */
  loadDB();

});
