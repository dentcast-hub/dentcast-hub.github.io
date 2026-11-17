/* ============================================================
   DentCast Global Search — v6 (tabs · filter sheet · rich results)
   ------------------------------------------------------------
   One engine for the three places #dcGlobalBox lives: the bottom
   sheet every page carries, the homepage's full-screen overlay
   (body.dc-search-mode) and /search.html. The box markup is static
   on ~1100 pages, so everything new is built HERE at runtime and
   the static scope chips (.dc-filter-list) are only hidden — never
   deleted from a page (founder mockup, 2026-11-15):

     • one row: the input + a filter button carrying the count of
       active filters;
     • one scrolling row of type TABS (single choice) with a count
       of matches per type for the current query;
     • the active filters as removable pills, then «N نتیجه» and the
       sort (مرتبط‌ترین / تازه‌ترین);
     • results as rows: a type tag, the title with the query marked,
       and two lines of the caption;
     • a bottom sheet for the filters: topic (pillar) and publish
       time. Pillar names come from plus/pillar-subtopics.json and
       dates from up-board/index.json — both fetched only when a
       filter or the «newest» sort first needs them.

   The search sponsor (spot.js) is seated after the THIRD result: this
   file leaves an empty .dc-gs-spot-anchor there on every render and
   announces it with the `dc:search-rendered` event.

   Papers from the library («کتابخانهٔ دنت‌کست») — a PREMIUM button
   (founder, 1405/08/26). Next to the filter button sits «مقاله‌ها»: amber
   with a lock for anyone not confirmed premium (the button itself is the
   showcase); a tap asks /me — premium toggles the papers on/off (off by
   default, remembered per device), anyone else gets the library's own gate
   card, and an unreachable /me does nothing (never an offer). Only a
   premium reader with the button ON fetches plus/cabinet-search.json. With
   it off, a premium reader sees one quiet row under the results that turns
   it on. A Persian query reaches the English papers through the site
   hashtags it names (`fa`, built by tools/build_cabinet_papers.py); an
   English one through the paper's title, tags, journal and authors. A
   paper opens the cabinet page on its title. Papers come after site
   content in «همه».

   Hashtag aliases (founder, 1405/08/26): a query that is the name, an
   alias or a variant of a hashtag concept in dentcast-hashtag-reference.json
   («تریتمنت پلن», «اکلوزیون», «occlusion») also finds what carries that
   hashtag — site content for everyone, and (button on) the papers mapped to
   it. A name inside a longer query, or a query inside a longer name, counts
   only where it starts a word; spaces, ZWNJ, hyphens, slashes and dots inside
   a name do not matter («فایبرپست» = «فایبر پست», "cad/cam" = "cadcam"); of
   two names one inside the other only the longer is meant («کراون لنتنینگ»
   is not روکش); a concept's co_tags come with it; and a query word listed in
   the reference's `manual_aliases` is also tried in that spelling. All of it
   is in the shared helpers below (dcFold … dcPaperHits), used by both
   engines. The reference is fetched once, on the first query. No model
   involved.

   Deliberately NOT here: a DES filter. Bands are comparable only
   inside one question_type and are never shown apart from it
   (global rules, DES display), so «band B or better» across the
   whole site would compare what the scale says cannot be compared.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (!window.matchMedia("(max-width:1023px)").matches) { dcLegacySearch(); return; }

  /* ------------ DOM ------------- */
  const globalBox   = document.getElementById("dcGlobalBox");
  const searchInput = document.getElementById("dcSearch");
  const resultsBox  = document.getElementById("dcResults");
  if (!globalBox || !searchInput || !resultsBox) return;

  /* ------------ helpers --------------- */
  const foldFa = dcFold;   // matching only, never display (see dcFold)
  const faDigits = (s) => String(s).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const enDigits = (s) => String(s).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
  const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const svg = (p, cls) => '<svg class="dc-svg-icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>";

  /* ------------ مپ نوع‌ها --------------- */
  /* A brain `type` → the GROUP it answers to. DentAI and PhotoCast are
     closed sections whose pages answer to Share Hub («مرور منابع») on
     every reader surface (founder, 1405/07/15) — folded here, URLs and
     `type` untouched. Glossary terms are not in the brain; they come
     from glossary/glossary.json and answer to «دانشنامه». */
  const TYPE_MAP = {
    notecast:       "notecast",
    clinical:       "clinical",
    dentcast_plus:  "dentcast_plus",
    dentai:         "sharehub",
    photocast:      "sharehub",
    promptologist:  "promptologist",
    plak_sefr:      "plak_sefr",
    taraz:          "taraz",
    meta:           "meta",
    chairside:      "chairside",
    sharehub:       "sharehub"
  };

  /* Tab order and the reader-facing names (founder renames 1405/08/17). The
     tag colour family per group: audio blue, glossary green, written teal,
     series slate — never amber (amber means «what a subscription buys»). */
  const GROUPS = [
    ["dentcast",      "اپیزود",              "ep"],
    ["notecast",      "خلاصهٔ اپیزودها",     "ep"],
    ["clinical",      "نکات کلینیکی",        "wr"],
    ["glossary",      "دانشنامه",            "gl"],
    ["sharehub",      "مرور منابع",          "wr"],
    ["chairside",     "ویزیت",               "wr"],
    ["meta",          "ایده‌ها",             "wr"],
    ["dentcast_plus", "ویدیوها",             "sr"],
    ["promptologist", "آموزش هوش مصنوعی",   "sr"],
    ["plak_sefr",     "آموزش ساخت سایت",    "sr"],
    ["taraz",         "آموزش نقد مقاله",    "sr"],
    ["library",       "کتابخانه",            "wr"]
  ];
  /* The tag on a result names ONE item, so it is singular. */
  const TAG = {
    dentcast: "اپیزود", notecast: "خلاصهٔ اپیزود", clinical: "نکتهٔ کلینیکی",
    glossary: "دانشنامه", sharehub: "مرور منابع", chairside: "ویزیت", meta: "ایده",
    dentcast_plus: "ویدیو", promptologist: "پرامپتولوژیست", plak_sefr: "پلاک صفر",
    taraz: "تراز شواهد", library: "مقاله"
  };
  const GROUP_HUE = {};
  GROUPS.forEach((g) => { GROUP_HUE[g[0]] = g[2]; });

  /* ------------ state --------------- */
  let DB = [];
  const state = { tab: "all", pillars: new Set(), years: 0, sort: "rel" };
  let lastResults = [];      // after every filter, sorted — what is shown
  let lastQuery = "";

  /* ------------ the new controls (built once) --------------- */
  const filterList = globalBox.querySelector(".dc-filter-list");
  if (filterList) filterList.style.display = "none";

  const row = document.createElement("div");
  row.className = "dc-gs-row";
  searchInput.parentNode.insertBefore(row, searchInput);
  row.appendChild(searchInput);
  const fbtn = document.createElement("button");
  fbtn.type = "button";
  fbtn.className = "dc-gs-fbtn";
  fbtn.setAttribute("aria-label", "فیلتر");
  fbtn.innerHTML = svg('<path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/>') + '<em class="dc-gs-fcount" hidden></em>';
  row.appendChild(fbtn);
  const pbtn = document.createElement("button");
  pbtn.type = "button";
  pbtn.className = "dc-gs-pbtn";
  pbtn.setAttribute("aria-pressed", "false");
  pbtn.innerHTML = svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>') +
    "<span>مقاله‌ها</span>" + '<em class="dc-gs-plock" aria-hidden="true">🔒</em>';
  pbtn.title = "جستجو در مقاله‌های کتابخانه (پریمیوم)";
  row.appendChild(pbtn);

  const tabs = document.createElement("div");
  tabs.className = "dc-gs-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "نوع محتوا");
  const pills = document.createElement("div");
  pills.className = "dc-gs-pills";
  const meta = document.createElement("div");
  meta.className = "dc-gs-meta";
  meta.innerHTML = '<span class="dc-gs-count"></span>' +
    '<label class="dc-gs-sort">مرتب‌سازی: <select aria-label="مرتب‌سازی">' +
    '<option value="rel">مرتبط‌ترین</option><option value="new">تازه‌ترین</option></select></label>';
  row.after(tabs);
  tabs.after(pills);
  pills.after(meta);
  const sortSel = meta.querySelector("select");

  /* ------------ lazy side data --------------- */
  let pillarNames = null;   // { slug: title_fa } in taxonomy order
  let pillarP = null;
  function loadPillars() {
    if (!pillarP) {
      pillarP = fetch("/plus/pillar-subtopics.json")
        .then((r) => (r.ok ? r.json() : {}))
        .then((j) => {
          const names = {};
          Object.keys(j || {}).forEach((k) => { names[k] = (j[k] && j[k].title_fa) || k; });
          /* That file holds the clinical pillars only. A pillar the index
             still uses (ابزار و زیرساخت) is named by its own pillar page's
             sidecar; one with no pillar page at all is left out of the
             filter rather than shown as a raw slug. */
          const missing = Array.from(new Set(DB.map((i) => i._p).filter(Boolean))).filter((k) => !names[k]);
          return Promise.all(missing.map((k) =>
            fetch("/pillar/" + encodeURIComponent(k) + "/structure.json")
              .then((r) => (r.ok ? r.json() : null))
              .then((x) => { if (x && x.title_fa) names[k] = x.title_fa; })
              .catch(() => {})
          )).then(() => {
            pillarNames = names;
            if (!DB.length) pillarP = null;   // index not in yet: ask again next time
            return names;
          });
        })
        .catch(() => { pillarNames = {}; return pillarNames; });
    }
    return pillarP;
  }

  const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  /* «۲۴ آبان ۱۴۰۵» → a day ordinal on a 372-day year (12×31). Only ever
     compared with another ordinal from the same function, so the
     over-counted short months cost nothing. */
  function dayOrd(y, m, d) { return y * 372 + m * 31 + d; }
  function parseFaDate(s) {
    const p = enDigits(String(s || "")).trim().split(/\s+/);
    if (p.length !== 3) return null;
    const d = parseInt(p[0], 10), m = MONTHS.indexOf(p[1]), y = parseInt(p[2], 10);
    if (!(d > 0) || m < 0 || !(y > 0)) return null;
    return dayOrd(y, m, d);
  }
  function todayOrd() {
    try {
      const parts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
      const get = (t) => parseInt((parts.find((x) => x.type === t) || {}).value, 10);
      const y = get("year"), m = get("month"), d = get("day");
      if (y > 0 && m > 0 && d > 0) return dayOrd(y, m - 1, d);
    } catch (_) { /* no persian calendar → no time filter */ }
    return null;
  }
  let dates = null;         // { "/path.html": ordinal }
  let datesP = null;
  function loadDates() {
    if (!datesP) {
      datesP = fetch("/up-board/index.json")
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((j) => {
          dates = {};
          (j.items || []).forEach((it) => { const o = parseFaDate(it.d); if (it.u && o) dates[it.u] = o; });
          return dates;
        })
        .catch(() => { dates = {}; return dates; });
    }
    return datesP;
  }

  /* ------------ لود دیتابیس ---------------- */
  function itemUrl(item) {
    let url = item.page_url || item.url || "";
    if (!url && item._group === "dentcast" && item.episode) {
      url = "/episodes/episode-" + String(item.episode).replace(".", "-") + ".html";
    }
    return url;
  }
  function detectGroup(item) {
    if (item.episode && !item.type) return "dentcast";
    if (item.type && TYPE_MAP[item.type]) return TYPE_MAP[item.type];
    return null;
  }
  function prepare(item, group) {
    item._group = group;
    item._url = itemUrl(item);
    item._path = item._url.replace(/^https?:\/\/[^/]+/, "");
    item._t = foldFa((item.title || "") + " " + (item._en || ""));
    item._k = foldFa((item.keywords || []).join(" ") + " " + (item.hashtags || []).join(" "));
    item._c = foldFa(item.caption || "");
    item._p = (item.pillar && item.pillar.primary) || null;
    item._h = dcItemTags(item, foldFa);
    return item;
  }

  async function loadDB() {
    try {
      const [brain, gloss] = await Promise.all([
        fetch("/dentcast-brain.json", { cache: "no-store" }).then((r) => {
          if (!r.ok) throw new Error("Search index HTTP " + r.status);
          return r.json();
        }),
        /* The glossary is a bonus tab: if it fails, search still works. */
        fetch("/glossary/glossary.json").then((r) => (r.ok ? r.json() : null)).catch(() => null)
      ]);
      if (!Array.isArray(brain)) throw new Error("Invalid search index");
      const out = [];
      brain.forEach((it) => { const g = detectGroup(it); if (g) out.push(prepare(it, g)); });
      const terms = gloss && Array.isArray(gloss.glossary) ? gloss.glossary : [];
      terms.forEach((g) => {
        if (!g || !g.url) return;
        out.push(prepare({
          title: g.fa_title || g.title || "",
          _en: g.title || "",
          caption: g.fa_title && g.title ? g.title : "",
          keywords: g.synonyms || [],
          hashtags: g.hashtags || [],
          page_url: g.url,
          pillar: g.pillar || null
        }, "glossary"));
      });
      DB = out;
      dcAliasForms(foldFa).then((f) => {
        ALIAS = f;
        if (f.forms.length && searchInput.value.trim()) performSearch(searchInput.value.trim());
      });
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
      resultsBox.style.display = "block";
      resultsBox.textContent = "بارگذاری اطلاعات جست‌وجو ناموفق بود. صفحه را دوباره بارگذاری کنید.";
    }
  }

  /* ------------ the library's papers (premium button) ------------ */
  let LIB_FA = [];
  let ALIAS = null;         // the hashtag vocabulary (dcAliasForms)
  let papersOn = false;     // the button is ON and the papers are loaded
  let libLoaded = false;
  let isPremium = dcPremiumHint() ? null : false;   // null = hint says premium, not yet confirmed
  function paintPbtn() {
    pbtn.classList.toggle("on", papersOn);
    pbtn.setAttribute("aria-pressed", String(papersOn));
    pbtn.querySelector(".dc-gs-plock").hidden = isPremium !== false;
  }
  paintPbtn();
  function papersOnNow() {
    return dcPaperLibrary().then((data) => {
      if (!data) return;
      if (!libLoaded) {
        const lib = dcPaperRows(data, foldFa);
        LIB_FA = lib.fa;
        DB = DB.concat(lib.items);
        libLoaded = true;
      }
      papersOn = true;
      dcPapersSetWanted(true);
      paintPbtn();
      performSearch(searchInput.value.trim());
    });
  }
  function papersOff() {
    papersOn = false;
    dcPapersSetWanted(false);
    if (state.tab === "library") state.tab = "all";
    paintPbtn();
    performSearch(searchInput.value.trim());
  }
  let meAsked = null;
  function askMe() {
    if (!meAsked) {
      meAsked = dcMe().then((r) => {
        if (r.status !== "error") isPremium = !!(r.u && r.u.tier === "premium");
        paintPbtn();
        if (isPremium && dcPapersWanted() && !papersOn) papersOnNow();
        else if (isPremium && searchInput.value.trim()) performSearch(searchInput.value.trim());   // the hint row
        return r;
      });
    }
    return meAsked;
  }
  function tapPapers() {
    if (papersOn) { papersOff(); return; }
    dcMe().then((r) => {
      if (r.u && r.u.tier === "premium") { isPremium = true; papersOnNow(); return; }
      if (r.status === "error") return;          // could not ask: never an offer
      isPremium = false;
      paintPbtn();
      dcPaperGate();
    });
  }
  pbtn.addEventListener("click", tapPapers);
  if (dcPapersWanted()) askMe();

  /* ------------ the pipeline ------------ */
  /* The text match: title 3 (4 when it opens with the query), keywords and
     hashtags 2, caption 1 — the best of the query's spellings. On top of it
     a hashtag the query names adds its weight (dcAliasKeys): 2 when a whole
     name is in the query, 1 when the query is only a piece of a longer name
     or the hashtag is a co_tag of a concept named in full — so «ایمپلنت» lists what is
     tagged ایمپلنت above what is only tagged پری ایمپلنتیتیس. Papers come
     after site content whatever they score (sortResults). */
  function score(item, q) {
    if (!q) return 0;
    let s = 0;
    if (dcTextHas(item._t, q)) s += item._t.startsWith(q) ? 4 : 3;
    if (dcTextHas(item._k, q)) s += 2;
    if (dcTextHas(item._c, q)) s += 1;
    return s;
  }
  /* Every filter EXCEPT the tab — the tab counts are read off this. */
  function baseMatches(q) {
    const out = [];
    let cutoff = null;
    if (state.years && dates) {
      const now = todayOrd();
      if (now != null) cutoff = now - state.years * 372;
    }
    const qs = dcSpellings(ALIAS, q);
    const ak = dcAliasKeys(ALIAS, qs);
    const fa = dcPaperHits(LIB_FA, qs, ak);
    for (const item of DB) {
      if (item._pid && !papersOn) continue;
      let text = 0;
      for (const x of qs) text = Math.max(text, score(item, x));
      const sc = text + (item._pid ? fa.get(item._pid) || 0 : 0) + dcTagWeight(ak, item);
      if (!sc) continue;
      if (state.pillars.size && !state.pillars.has(item._p)) continue;
      if (cutoff != null) {
        const d = dates[item._path];
        if (!d || d < cutoff) continue;   // no date → cannot be shown as «recent»
      }
      item._s = sc;
      out.push(item);
    }
    return out;
  }
  function sortResults(list) {
    if (state.sort === "new" && dates) {
      return list.slice().sort((a, b) => (dates[b._path] || 0) - (dates[a._path] || 0) || b._s - a._s);
    }
    /* Stable: equal scores keep the index order. Papers after site content. */
    return list.map((it, i) => [it, i]).sort((a, b) => (!!a[0]._pid - !!b[0]._pid) || b[0]._s - a[0]._s || a[1] - b[1]).map((x) => x[0]);
  }

  /* ------------ ساخت یک آیتم HTML ---------- */
  function markTitle(title, rawQ) {
    const safe = escHtml(title);
    if (!rawQ) return safe;
    const re = new RegExp(rawQ.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const m = title.match(re);
    if (!m) return safe;
    const i = m.index;
    return escHtml(title.slice(0, i)) + "<mark>" + escHtml(m[0]) + "</mark>" + escHtml(title.slice(i + m[0].length));
  }
  function buildItem(item, rawQ) {
    const g = item._group;
    const title = (item.title || "").trim();
    const num = g === "dentcast" && item.episode ? '<span class="dc-gs-n">قسمت ' + faDigits(item.episode) + "</span>"
      : g === "library" && item._year ? '<span class="dc-gs-n">' + faDigits(item._year) + "</span>" : "";
    const cap = (item.caption || "").trim();
    return '<div class="dc-result-item dc-gs-res" role="button" tabindex="0" data-url="' + escHtml(item._url) + '" data-title="' + escHtml(title) + '"' + (item._pid ? ' data-paper="1"' : "") + ">" +
      '<div class="dc-gs-tg"><span class="dc-gs-tp dc-gs-tp--' + (GROUP_HUE[g] || "wr") + '">' + TAG[g] + "</span>" + num + "</div>" +
      '<div class="dc-gs-ti"' + (g === "glossary" || g === "library" ? ' dir="auto"' : "") + ">" + markTitle(title, rawQ) + "</div>" +
      (cap ? '<div class="dc-gs-cap" dir="auto">' + escHtml(cap) + "</div>" : "") +
      "</div>";
  }

  const CLOSE_BTN = '<button class="dc-close-results" aria-label="بستن">' + svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>') + "</button>";
  const SPOT_ANCHOR = '<div class="dc-gs-spot-anchor"></div>';
  const ANCHOR_AFTER = 3;

  function listHtml(list, rawQ) {
    let html = "";
    list.forEach((it, i) => {
      html += buildItem(it, rawQ);
      if (i === ANCHOR_AFTER - 1) html += SPOT_ANCHOR;
    });
    if (list.length && list.length < ANCHOR_AFTER) html += SPOT_ANCHOR;
    return html;
  }
  function announce() {
    try { document.dispatchEvent(new CustomEvent("dc:search-rendered")); } catch (_) { /* old browser */ }
  }

  /* ------------ tabs, pills, meta ------------ */
  function renderTabs(counts) {
    const hasQ = !!counts;
    let html = "";
    const all = hasQ ? Object.keys(counts).reduce((a, k) => a + counts[k], 0) : null;
    const tab = (key, label, n) => {
      const on = state.tab === key;
      return '<button type="button" role="tab" class="dc-gs-tab' + (on ? " on" : "") + '" aria-selected="' + on + '" data-tab="' + key + '">' +
        escHtml(label) + (n != null ? " <small>" + faDigits(n) + "</small>" : "") + "</button>";
    };
    html += tab("all", "همه", all);
    GROUPS.forEach(([key, label]) => {
      const n = hasQ ? counts[key] || 0 : null;
      /* With a query, an empty type is noise — unless it is the one chosen. */
      if (hasQ && !n && state.tab !== key) return;
      html += tab(key, label, n);
    });
    tabs.innerHTML = html;
  }
  function renderPills() {
    let html = "";
    state.pillars.forEach((p) => {
      const name = (pillarNames && pillarNames[p]) || p;
      html += '<button type="button" class="dc-gs-pill" data-pillar="' + escHtml(p) + '">' + escHtml(name) + " ✕</button>";
    });
    if (state.years) html += '<button type="button" class="dc-gs-pill" data-years="1">' + faDigits(state.years) + " سال اخیر ✕</button>";
    pills.innerHTML = html;
    pills.style.display = html ? "" : "none";
    const n = state.pillars.size + (state.years ? 1 : 0);
    const em = fbtn.querySelector(".dc-gs-fcount");
    em.textContent = n ? faDigits(n) : "";
    em.hidden = !n;
    fbtn.classList.toggle("on", !!n);
  }

  /* ------------ الگوریتم اصلی سرچ ------------ */
  function performSearch(q) {
    lastQuery = q;
    /* The bottom sheet grows to hold rich results only while there is a query. */
    globalBox.classList.toggle("dc-gs-q", q.length >= 2);
    renderPills();
    if (q.length < 2) {
      renderTabs(null);
      meta.style.display = "none";
      lastResults = [];
      resultsBox.style.display = "none";
      resultsBox.innerHTML = "";
      syncSheetCount();
      announce();   // the sponsor card goes back above the (empty) results
      return;
    }

    askMe();
    const query = foldFa(q);
    const base = baseMatches(query);
    const counts = {};
    base.forEach((it) => { counts[it._group] = (counts[it._group] || 0) + 1; });
    renderTabs(counts);
    const results = sortResults(state.tab === "all" ? base : base.filter((it) => it._group === state.tab));
    lastResults = results;
    syncSheetCount();

    meta.style.display = "";
    meta.querySelector(".dc-gs-count").textContent = faDigits(results.length) + " نتیجه";

    resultsBox.style.display = "block";
    /* A premium reader with the button off: one quiet way to turn it on. */
    const hint = isPremium === true && !papersOn
      ? '<div class="dc-result-item dc-gs-phint" role="button" tabindex="0">جستجو در مقاله‌های کتابخانه ›</div>' : "";
    if (!results.length) {
      resultsBox.innerHTML = CLOSE_BTN +
        '<div class="dc-result-item dc-no-results" role="status">نتیجه‌ای برای «' + escHtml(q) + "» پیدا نشد.</div>" + hint;
      announce();
      return;
    }

    /* --- نمایش ۳۰ تای اول --- */
    const more = results.length > 30;
    resultsBox.innerHTML = CLOSE_BTN + listHtml(results.slice(0, 30), q) +
      (more ? '<div class="dc-more-btn" role="button" tabindex="0">مشاهده ادامه نتایج… (' + faDigits(results.length) + ")</div>" : "") + hint;
    announce();
  }

  /* ------------ wiring ------------ */
  searchInput.addEventListener("input", () => performSearch(searchInput.value.trim()));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch(searchInput.value.trim());
  });

  /* /search.html?q=… arrives with the query already typed; loadDB() runs it. */
  if (/\/search(\.html)?$/.test(location.pathname)) {
    const qp = new URLSearchParams(location.search).get("q");
    if (qp && !searchInput.value) searchInput.value = qp;
  }

  function openResult(item) {
    let url = item.getAttribute("data-url") || "";
    if (!url) return;
    if (!/^https?:/.test(url)) url = location.origin + url;
    /* A paper opens the cabinet page itself, never inside col-C. */
    if (item.hasAttribute("data-paper")) { window.location.href = url; return; }
    /* On the desktop shell, open content in col-C via dcdOpen (which also
       dismisses the search overlay); on mobile navigate directly. Keyed off
       the actual UI mode (body.dc-desktop-ui), not a px threshold. */
    if (document.body.classList.contains("dc-desktop-ui") && window.dcdOpen) {
      window.dcdOpen(url, item.getAttribute("data-title") || "");
    } else {
      window.location.href = url;
    }
  }
  resultsBox.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(".dc-close-results")) {
      resultsBox.style.display = "none";
      resultsBox.innerHTML = "";
      announce();
      return;
    }
    if (t.closest(".dc-more-btn")) {
      resultsBox.innerHTML = CLOSE_BTN + listHtml(lastResults, lastQuery);
      announce();
      return;
    }
    if (t.closest(".dc-gs-phint")) { papersOnNow(); return; }
    const item = t.closest(".dc-gs-res");
    if (item) openResult(item);
  });
  /* Results are role=button: Enter/Space open them like a click does. */
  resultsBox.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(".dc-more-btn")) { e.preventDefault(); t.closest(".dc-more-btn").click(); return; }
    if (t.closest(".dc-gs-phint")) { e.preventDefault(); papersOnNow(); return; }
    const item = t.closest(".dc-gs-res");
    if (!item) return;
    e.preventDefault();
    openResult(item);
  });

  tabs.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".dc-gs-tab");
    if (!b) return;
    state.tab = b.getAttribute("data-tab");
    performSearch(searchInput.value.trim());
    b.scrollIntoView && b.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  pills.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".dc-gs-pill");
    if (!b) return;
    if (b.hasAttribute("data-pillar")) state.pillars.delete(b.getAttribute("data-pillar"));
    if (b.hasAttribute("data-years")) state.years = 0;
    performSearch(searchInput.value.trim());
    renderSheet();
  });
  sortSel.addEventListener("change", () => {
    state.sort = sortSel.value;
    if (state.sort === "new" && !dates) loadDates().then(() => performSearch(searchInput.value.trim()));
    else performSearch(searchInput.value.trim());
  });

  /* ------------ the filter sheet ------------ */
  let sheetWrap = null;
  let pillarsOpen = false;
  const PILLAR_FOLD = 8;
  function buildSheet() {
    sheetWrap = document.createElement("div");
    sheetWrap.className = "dc-gs-sheet-wrap";
    sheetWrap.hidden = true;
    sheetWrap.innerHTML =
      '<div class="dc-gs-sheet-dim"></div>' +
      '<div class="dc-gs-sheet" role="dialog" aria-modal="true" aria-label="فیلتر">' +
        '<div class="dc-gs-grab" aria-hidden="true"></div>' +
        '<div class="dc-gs-sth"><b>فیلتر</b><button type="button" class="dc-gs-clear">پاک کردن همه</button></div>' +
        '<div class="dc-gs-sb">' +
          '<div class="dc-gs-grp"><h4>حوزهٔ موضوعی <small class="dc-gs-pcount"></small></h4><div class="dc-gs-chips dc-gs-pchips"></div></div>' +
          '<div class="dc-gs-grp"><h4>زمان انتشار</h4><div class="dc-gs-seg" role="radiogroup" aria-label="زمان انتشار">' +
            '<button type="button" role="radio" data-years="0">همه</button>' +
            '<button type="button" role="radio" data-years="2">۲ سال</button>' +
            '<button type="button" role="radio" data-years="5">۵ سال</button>' +
          "</div></div>" +
        "</div>" +
        '<button type="button" class="dc-gs-done">اعمال</button>' +
      "</div>";
    document.body.appendChild(sheetWrap);
    sheetWrap.querySelector(".dc-gs-sheet-dim").addEventListener("click", closeSheet);
    sheetWrap.querySelector(".dc-gs-done").addEventListener("click", closeSheet);
    sheetWrap.querySelector(".dc-gs-clear").addEventListener("click", () => {
      state.pillars.clear();
      state.years = 0;
      performSearch(searchInput.value.trim());
      renderSheet();
    });
    sheetWrap.querySelector(".dc-gs-pchips").addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-more")) { pillarsOpen = true; renderSheet(); return; }
      const p = b.getAttribute("data-pillar");
      if (state.pillars.has(p)) state.pillars.delete(p); else state.pillars.add(p);
      performSearch(searchInput.value.trim());
      renderSheet();
    });
    sheetWrap.querySelector(".dc-gs-seg").addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest("button");
      if (!b) return;
      state.years = parseInt(b.getAttribute("data-years"), 10) || 0;
      const go = () => { performSearch(searchInput.value.trim()); renderSheet(); };
      if (state.years && !dates) loadDates().then(go); else go();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sheetWrap && !sheetWrap.hidden) closeSheet();
    });
  }
  function renderSheet() {
    if (!sheetWrap) return;
    const box = sheetWrap.querySelector(".dc-gs-pchips");
    const keys = Object.keys(pillarNames || {});
    sheetWrap.querySelector(".dc-gs-pcount").textContent = keys.length ? faDigits(keys.length) + " حوزه" : "";
    /* A chosen pillar is never folded away out of sight. */
    const shown = pillarsOpen ? keys : keys.filter((k, i) => i < PILLAR_FOLD || state.pillars.has(k));
    let html = shown.map((k) => {
      const on = state.pillars.has(k);
      return '<button type="button" class="dc-gs-c' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-pillar="' + escHtml(k) + '">' + escHtml(pillarNames[k]) + "</button>";
    }).join("");
    if (shown.length < keys.length) html += '<button type="button" class="dc-gs-c" data-more="1">+' + faDigits(keys.length - shown.length) + "</button>";
    box.innerHTML = html || '<span class="dc-gs-c">…</span>';
    sheetWrap.querySelectorAll(".dc-gs-seg button").forEach((b) => {
      const on = (parseInt(b.getAttribute("data-years"), 10) || 0) === state.years;
      b.classList.toggle("on", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
    syncSheetCount();
  }
  function syncSheetCount() {
    if (!sheetWrap) return;
    const done = sheetWrap.querySelector(".dc-gs-done");
    done.textContent = lastQuery.length >= 2 ? "نمایش " + faDigits(lastResults.length) + " نتیجه" : "اعمال";
  }
  function openSheet() {
    if (!sheetWrap) buildSheet();
    sheetWrap.hidden = false;
    renderSheet();
    loadPillars().then(() => { renderSheet(); renderPills(); });
    requestAnimationFrame(() => sheetWrap.classList.add("open"));
    const first = sheetWrap.querySelector(".dc-gs-done");
    if (first) first.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (!sheetWrap) return;
    sheetWrap.classList.remove("open");
    setTimeout(() => { if (!sheetWrap.classList.contains("open")) sheetWrap.hidden = true; }, 220);
    fbtn.focus({ preventScroll: true });
  }
  fbtn.addEventListener("click", openSheet);

  /* ------------ اجرای سیستم ---------------- */
  injectStyle();
  renderTabs(null);
  renderPills();
  meta.style.display = "none";
  loadDB();

  /* Styles live here, not in global-search.css: index.html loads no shared
     stylesheet, and this file is the one thing every search surface runs. */
  function injectStyle() {
    if (document.getElementById("dc-gs2-style")) return;
    const st = document.createElement("style");
    st.id = "dc-gs2-style";
    st.textContent = [
      "#dcGlobalBox .dc-gs-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;}",
      "#dcGlobalBox .dc-gs-row .dc-search-input{flex:1;min-width:0;margin:0!important;}",
      "#dcGlobalBox .dc-gs-fbtn{position:relative;flex:none;width:44px;height:44px;border-radius:12px;border:1px solid var(--border,rgba(2,35,96,.12));background:var(--card-bg,#fff);color:var(--pr,#022360);display:grid;place-items:center;cursor:pointer;padding:0;}",
      "#dcGlobalBox .dc-gs-fbtn .dc-svg-icon{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;}",
      "#dcGlobalBox .dc-gs-fbtn.on{border-color:var(--ac,#0b5fff);color:var(--ac,#0b5fff);}",
      /* «مقاله‌ها»: amber, the colour of what a subscription buys. */
      "#dcGlobalBox .dc-gs-pbtn{flex:none;height:44px;display:inline-flex;align-items:center;gap:5px;padding:0 11px;border-radius:12px;border:1px solid rgba(201,146,43,.55);background:rgba(201,146,43,.08);color:#8a6414;font:inherit;font-size:13px;font-weight:600;cursor:pointer;}",
      "#dcGlobalBox .dc-gs-pbtn .dc-svg-icon{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;}",
      "#dcGlobalBox .dc-gs-pbtn em{font-style:normal;font-size:11px;}",
      "#dcGlobalBox .dc-gs-pbtn.on{background:#c9922b;border-color:#c9922b;color:#fff;}",
      "[data-theme=\"dark\"] #dcGlobalBox .dc-gs-pbtn{color:#e3b849;border-color:rgba(227,184,73,.5);background:rgba(227,184,73,.08);}",
      "[data-theme=\"dark\"] #dcGlobalBox .dc-gs-pbtn.on{background:#e3b849;border-color:#e3b849;color:#1b1406;}",
      "#dcGlobalBox .dc-gs-phint{color:#8a6414;font-size:13px;text-align:center;}",
      "[data-theme=\"dark\"] #dcGlobalBox .dc-gs-phint{color:#e3b849;}",
      "#dcGlobalBox .dc-gs-fcount{position:absolute;top:-6px;left:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--ac,#0b5fff);color:#fff;font-style:normal;font-size:10px;font-weight:800;display:grid;place-items:center;line-height:1;}",
      "#dcGlobalBox .dc-gs-fcount[hidden]{display:none;}",
      "#dcGlobalBox .dc-gs-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0 8px;margin:0 0 2px;-webkit-overflow-scrolling:touch;}",
      "#dcGlobalBox .dc-gs-tabs::-webkit-scrollbar{display:none;}",
      "#dcGlobalBox .dc-gs-tab{flex:none;white-space:nowrap;font:inherit;font-size:12.5px;padding:6px 12px;border-radius:20px;border:1px solid transparent;background:var(--surface2,#f4f6fb);color:var(--txt2,#4a5f85);cursor:pointer;}",
      "#dcGlobalBox .dc-gs-tab small{opacity:.7;margin-right:2px;font-size:11px;}",
      "#dcGlobalBox .dc-gs-tab.on{background:var(--pr,#022360);color:#fff;font-weight:700;}",
      "[data-theme=\"dark\"] #dcGlobalBox .dc-gs-tab.on{background:#2b5278;}",
      "#dcGlobalBox .dc-gs-pills{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px;}",
      "#dcGlobalBox .dc-gs-pill{font:inherit;font-size:11.5px;font-weight:600;background:rgba(var(--ac-rgb,11,95,255),.1);color:var(--ac,#0b5fff);border:0;border-radius:8px;padding:4px 9px;cursor:pointer;}",
      "#dcGlobalBox .dc-gs-meta{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--txt3,#62779a);margin:0 2px 2px;}",
      "#dcGlobalBox .dc-gs-sort{display:flex;align-items:center;gap:2px;}",
      "#dcGlobalBox .dc-gs-sort select{font:inherit;font-size:11.5px;color:var(--txt2,#4a5f85);background:transparent;border:0;padding:2px;cursor:pointer;}",
      "#dcGlobalBox .dc-gs-res{padding:11px 4px!important;cursor:pointer;}",
      "#dcResults .dc-gs-res:hover,#dcResults .dc-gs-res:focus-visible{background:rgba(var(--ac-rgb,11,95,255),.06)!important;}",
      "#dcGlobalBox .dc-gs-tg{display:flex;align-items:center;gap:6px;margin-bottom:3px;}",
      "#dcGlobalBox .dc-gs-tp{font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:6px;}",
      "#dcGlobalBox .dc-gs-tp--ep{background:rgba(11,95,255,.1);color:#0b5fff;}",
      "#dcGlobalBox .dc-gs-tp--gl{background:rgba(26,127,75,.11);color:#1a7f4b;}",
      "#dcGlobalBox .dc-gs-tp--wr{background:rgba(13,128,128,.11);color:#0d7373;}",
      "#dcGlobalBox .dc-gs-tp--sr{background:rgba(74,95,133,.12);color:#4a5f85;}",
      "[data-theme=\"dark\"] #dcGlobalBox .dc-gs-tp--ep{color:#7fb0ff;}",
      "[data-theme=\"dark\"] #dcGlobalBox .dc-gs-tp--gl{color:#6fd3a0;}",
      "[data-theme=\"dark\"] #dcGlobalBox .dc-gs-tp--wr{color:#6fd0d0;}",
      "[data-theme=\"dark\"] #dcGlobalBox .dc-gs-tp--sr{color:#a9b8d4;}",
      "#dcGlobalBox .dc-gs-n{font-size:10.5px;color:var(--txt3,#62779a);}",
      "#dcGlobalBox .dc-gs-ti{font-size:14px;font-weight:700;line-height:1.75;color:var(--txt,#0a1a33);}",
      "#dcGlobalBox .dc-gs-ti mark{background:rgba(var(--ac-rgb,11,95,255),.14);color:inherit;border-radius:3px;padding:0;}",
      "#dcGlobalBox .dc-gs-cap{font-size:12px;line-height:1.8;color:var(--txt2,#4a5f85);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
      "#dcGlobalBox .dc-gs-spot-anchor:empty{display:none;}",
      /* The bottom sheet: with a query the results ARE the sheet. */
      "body:not(.dc-search-mode) #dcGlobalBox.dc-global-filter-box.open.dc-gs-q{max-height:88vh;max-height:88dvh;}",
      "body:not(.dc-search-mode) #dcGlobalBox.dc-gs-q #dcResults.dc-results-box{max-height:none;}",
      /* Filter sheet */
      ".dc-gs-sheet-wrap{position:fixed;inset:0;z-index:100010;font-family:inherit;}",
      ".dc-gs-sheet-wrap[hidden]{display:none;}",
      ".dc-gs-sheet-dim{position:absolute;inset:0;background:rgba(10,20,40,.45);opacity:0;transition:opacity .2s ease;}",
      ".dc-gs-sheet{position:absolute;left:0;right:0;bottom:0;max-height:86vh;max-height:86dvh;display:flex;flex-direction:column;background:var(--card-bg,#fff);color:var(--txt,#0a1a33);border-radius:22px 22px 0 0;transform:translateY(100%);transition:transform .22s cubic-bezier(.4,0,.2,1);box-shadow:0 -8px 30px rgba(0,0,0,.18);max-width:640px;margin:0 auto;}",
      ".dc-gs-sheet-wrap.open .dc-gs-sheet-dim{opacity:1;}",
      ".dc-gs-sheet-wrap.open .dc-gs-sheet{transform:none;}",
      ".dc-gs-grab{width:40px;height:4px;border-radius:2px;background:var(--surface3,#eaecf5);margin:8px auto 0;}",
      ".dc-gs-sth{display:flex;justify-content:space-between;align-items:center;padding:10px 18px 12px;border-bottom:1px solid var(--border,rgba(2,35,96,.1));}",
      ".dc-gs-sth b{font-size:16px;}",
      ".dc-gs-clear{font:inherit;font-size:12.5px;color:var(--ac,#0b5fff);background:none;border:0;cursor:pointer;padding:4px;}",
      ".dc-gs-sb{padding:4px 18px;overflow-y:auto;flex:1;}",
      ".dc-gs-grp{padding:14px 0;border-bottom:1px solid var(--border,rgba(2,35,96,.1));}",
      ".dc-gs-grp:last-child{border-bottom:0;}",
      ".dc-gs-grp h4{margin:0 0 10px;font-size:13.5px;display:flex;justify-content:space-between;align-items:center;}",
      ".dc-gs-grp h4 small{font-weight:400;color:var(--txt3,#62779a);font-size:11.5px;}",
      ".dc-gs-chips{display:flex;flex-wrap:wrap;gap:7px;}",
      ".dc-gs-c{font:inherit;font-size:12.5px;padding:7px 12px;border-radius:10px;border:0;background:var(--surface2,#f4f6fb);color:var(--txt2,#4a5f85);cursor:pointer;}",
      ".dc-gs-c.on{background:rgba(var(--ac-rgb,11,95,255),.12);color:var(--ac,#0b5fff);font-weight:700;box-shadow:inset 0 0 0 1px rgba(var(--ac-rgb,11,95,255),.4);}",
      ".dc-gs-seg{display:flex;background:var(--surface2,#f4f6fb);border-radius:11px;padding:3px;}",
      ".dc-gs-seg button{flex:1;font:inherit;font-size:12.5px;padding:7px 0;border-radius:8px;border:0;background:transparent;color:var(--txt2,#4a5f85);cursor:pointer;}",
      ".dc-gs-seg button.on{background:var(--card-bg,#fff);color:var(--pr,#022360);font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.1);}",
      "[data-theme=\"dark\"] .dc-gs-seg button.on{color:var(--txt,#fff);}",
      ".dc-gs-done{font:inherit;margin:10px 18px calc(16px + env(safe-area-inset-bottom,0px));background:var(--ac,#0b5fff);color:#fff;border:0;border-radius:14px;padding:13px;font-size:14.5px;font-weight:700;cursor:pointer;}"
    ].join("\n");
    (document.head || document.documentElement).appendChild(st);
  }
});

/* ============================================================
   DESKTOP (≥1024px): the previous engine, byte-for-byte in behaviour —
   scope chips, plain result lines, sponsor above the results. The founder
   asked that the desktop stay exactly as it was (2026-11-15); the v6 UI
   below runs only at the site's mobile width (max-width:1023px, the same
   test index.html's isMob() uses to decide the desktop shell).
   ============================================================ */

/* ============================================================
   The library's papers in site search — PREMIUM ONLY
   ------------------------------------------------------------
   Shared by both engines below. Nothing is fetched until /me answers,
   and only a confirmed premium reader fetches plus/cabinet-search.json
   (an unreachable API means no papers, never a lock or an offer).
============================================================ */
const DC_PAPERS_KEY = "dc-gs-papers";
function dcPapersWanted() { try { return localStorage.getItem(DC_PAPERS_KEY) === "1"; } catch (_) { return false; } }
function dcPapersSetWanted(on) {
  try { if (on) localStorage.setItem(DC_PAPERS_KEY, "1"); else localStorage.removeItem(DC_PAPERS_KEY); } catch (_) { /* no storage */ }
}
/* The badge only: spot.js stores this device's last CONFIRMED viewer class. */
function dcPremiumHint() { try { return localStorage.getItem("dcAds.vc") === "premium"; } catch (_) { return false; } }
/* The answer AND why: "confirmed not premium" and "could not ask" differ. */
function dcMe() {
  return import('/plus/js/api.js?v=251')
    .then((m) => m.currentUser().then((u) => ({ u, status: m.meStatus() })))
    .catch(() => ({ u: null, status: "error" }));
}
/* The library's own gate card (plus/js/library-gate.js), with its own ?from=. */
function dcPaperGate() {
  return Promise.all([import('/plus/js/sheet.js?v=251'), import('/plus/js/premium-cta.js?v=251')])
    .then(([sheet, cta]) => {
      sheet.openSheet(sheet.gateCard({
        title: "جستجو در مقاله‌های کتابخانه ویژه‌ی پریمیوم است",
        sub: "با «مقاله‌ها» نتیجه‌ی جستجو مقاله‌های کتابخانهٔ دنت‌کست را هم می‌آورد — بیش از ۲۱۰۰ مقالهٔ دندان‌پزشکی، با جستجوی فارسی و انگلیسی.",
        cta: cta.premiumCta("gate-search-papers"),
      }));
    })
    .catch(() => { window.location.href = "/plus/pricing.html?from=gate-search-papers"; });
}
/* Fetched only for a confirmed premium reader who turned the button on. */
function dcPaperLibrary() {
  if (!dcPaperLibrary.p) {
    dcPaperLibrary.p = dcMe()
      .then((r) => (r.u && r.u.tier === "premium"
        ? fetch("/plus/cabinet-search.json").then((res) => (res.ok ? res.json() : null))
        : null))
      .then((d) => (d && d.p && d.fa ? d : null))
      .catch(() => null);
    dcPaperLibrary.p.then((d) => { if (!d) dcPaperLibrary.p = null; });
  }
  return dcPaperLibrary.p;
}
/* Rows in the shape the engines search: _t title, _k English words. */
function dcPaperRows(data, fold) {
  const items = [];
  Object.keys(data.p).forEach((id) => {
    const r = data.p[id];
    items.push({
      title: r[0], caption: r[3] || "", _year: r[1] || 0, _pid: id, _group: "library",
      _url: "/dentcast_cabinet_search.html?q=" + encodeURIComponent(r[0]).replace(/'/g, "%27"),
      _path: "", _t: fold(r[0]), _k: fold(r[4]), _c: fold(r[3] || ""), _p: null
    });
  });
  const fa = Object.keys(data.fa).map((k) => [fold(k), data.fa[k]]);
  return { items, fa };
}
/* Matching only, never display — applied to items and query alike, so it is
   symmetric. Arabic ي/ى/ك typed on an Arabic keyboard and ZWNJ/zero-width
   marks would otherwise miss the Persian spelling («كراون» found nothing
   where «کراون» found 13); the same goes for آ/أ/إ/ٱ and ا («امالگام» ↔
   «آمالگام»), ؤ and و, ة/ۀ/هٔ and ه, and Persian or Arabic-Indic digits and
   Latin ones («دندان 6» ↔ «دندان ۶»). A hashtag is matched as its words:
   `#` goes and `_` is a space, in the query too. A superset of
   plus/js/hl-view.js foldFa. */
function dcFold(s) {
  return String(s || "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/[ةۀ]/g, "ه")
    .replace(/[​-‏ً-ٕـ]/g, "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/#/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}
/* The text match. One word is found anywhere, as it always was; a query of
   several words must start where a word starts, or «ای آی» (folded «ای ای»)
   would be found in every «…های ایمپلنت». */
function dcTextHas(hay, q) {
  let i = hay.indexOf(q);
  if (i === -1 || !q.includes(" ")) return i !== -1;
  for (; i !== -1; i = hay.indexOf(q, i + 1)) {
    if (i === 0 || !/[\p{L}\p{N}]/u.test(hay[i - 1])) return true;
  }
  return false;
}
/* A folded name as its words: `s` the letters and digits with everything
   between them squeezed out, `b` where each word starts in `s`, `n` its
   length written with single spaces. Two names that differ only in spaces,
   ZWNJ (the fold deletes it), hyphens, slashes, dots or `&` have the same
   `s`: «پری‌ایمپلنتیتیس» = «پری ایمپلنتیتیس», "cad/cam" = "cadcam",
   "e.max" = "emax". */
function dcWords(str) {
  const w = String(str || "").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const b = [];
  let n = 0;
  for (const x of w) { b.push(n); n += x.length; }
  return { s: w.join(""), b, n: n + Math.max(0, w.length - 1) };
}
/* The hashtag vocabulary, read once: the reference is its single source.
     forms   every name a concept answers to (key, tag, aliases, variants, and
             a co_tag that is not a concept of its own), as dcWords plus `k`,
             the concept's folded key with spaces. The key is built from the
             concept's `tag` exactly as dcItemTags builds an item's tags: the
             reference's `key` turns ZWNJ into a space while the fold deletes
             it, so a key from `key` never met «#درمان_محافظه‌کارانه» on a page.
     co      concept key → the keys of its co_tags: tags deliberately carried
             alongside it, two doors to one concept (`#debonding` ↔
             `#افتادن_روکش`).
     manual  `manual_aliases`: spellings of one word («اکلوژال» → «اکلوزال»,
             «اسمارت» → "smart"), longest first. An entry whose target repeats
             a word or contains its own key is ignored. */
function dcAliasForms(fold) {
  if (!dcAliasForms.p) {
    dcAliasForms.p = fetch("/dentcast-hashtag-reference.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const forms = [], co = new Map(), manual = [], seen = new Set();
        const concepts = ((j && j.concepts) || []).filter((c) => c && c.key);
        const keyOf = (c) => fold(String(c.tag || c.key));
        const own = new Set(concepts.map(keyOf));
        concepts.forEach((c) => {
          const k = keyOf(c);
          const cos = (c.co_tags || []).map((t) => fold(t)).filter((t) => t && t !== k);
          if (cos.length) co.set(k, cos);
          [c.key, c.tag].concat(c.aliases || [], c.variants || [], cos.filter((t) => !own.has(t))).forEach((n) => {
            const f = dcWords(fold(n));
            const id = f.s + "|" + f.b.join(",") + "|" + k;
            if (f.n < 2 || seen.has(id)) return;
            seen.add(id);
            f.k = k;
            forms.push(f);
          });
        });
        const m = (j && j.manual_aliases) || {};
        Object.keys(m).forEach((from) => {
          const a = fold(from), t = fold(m[from]), tw = t.split(" ");
          if (!a || !t || t.includes(a) || new Set(tw).size !== tw.length) return;
          manual.push([a, t]);
        });
        manual.sort((x, y) => y[0].length - x[0].length);
        return { forms, co, manual };
      })
      .catch(() => ({ forms: [], co: new Map(), manual: [] }));
  }
  return dcAliasForms.p;
}
/* The spellings a query is tried in: itself, and itself with every whole
   word that `manual_aliases` knows replaced. Both are used for the text match
   and for naming concepts. */
function dcSpellings(ix, q) {
  if (!ix || !ix.manual.length || !q) return [q];
  let s = " " + q + " ";
  for (const [a, t] of ix.manual) if (s.includes(" " + a + " ")) s = s.split(" " + a + " ").join(" " + t + " ");
  s = s.trim();
  return s === q ? [q] : [q, s];
}
/* Does the name `needle` sit in `hay` at offset `i` of the squeezed letters?
   Never mid-word: it must start where a word of `hay` starts («اپیزود» does
   not name پیزو, «اطمینان» not مینای دندان). Then either the two are cut
   into words the same way over that stretch — the end is free, so «ایمپلنتی»
   and "implants" still match — or they differ only in how they are spaced
   («فایبرپست» / «فایبر پست»), and then the name must also END a word of `hay`,
   give or take a two-letter suffix: «پست کوتاه» does not name a «پستک». */
function dcNameAt(hay, needle, i) {
  if (!hay.b.includes(i)) return false;
  const e = i + needle.s.length;
  let same = needle.b.every((x) => !x || hay.b.includes(i + x));
  if (same) same = hay.b.every((x) => x <= i || x >= e || needle.b.includes(x - i));
  if (same) return true;
  let end = hay.s.length;
  for (const x of hay.b) if (x >= e) { end = x; break; }
  return end - e <= 2;
}
/* The concepts a query names, as Map(key → weight); `qs` are its spellings.
     2  a whole name is in the query: the query IS a name (spacing aside), or
        a name of 4+ letters starts a word inside a longer query;
     1  the query (4+ letters) is only a piece of a longer name, starting one
        of its words — someone typing «ایمپلنت» still reaches «پری ایمپلنتیتیس»
        and «روکش ایمپلنت»; and the co_tags of a concept named with weight 2
        (one hop, never from a piece of a name and never onward).
   The longest name wins: a name lying inside a longer name found in the same
   query is not named — «کراون لنتنینگ» is افزایش طول تاج and not روکش,
   «روکش ایمپلنتی» is روکش ایمپلنت and not روکش plus ایمپلنت — and when the
   whole query is a piece of a longer name, a name covering only some of its
   words is not either («پری ایمپلنتیت» is پری ایمپلنتیتیس, not ایمپلنت).
   «ایمپلنت و سیگار» still names both. `.dropped` holds the keys set aside
   this way, so the papers' plain text match does not bring them back. */
function dcAliasKeys(ix, qs) {
  const keys = new Map();
  keys.dropped = new Set();
  if (!ix || !ix.forms.length) return keys;
  const lost = new Set();
  const put = (k, w) => { if ((keys.get(k) || 0) < w) keys.set(k, w); };
  for (const q of [].concat(qs || [])) {
    const Q = dcWords(q), len = Q.s.length;
    if (!len) continue;
    const found = [];   // [start, end, key] of each name inside the query
    const part = [];
    for (const F of ix.forms) {
      const fl = F.s.length;
      if (fl === len) { if (F.s === Q.s) found.push([0, len, F.k]); continue; }
      if (fl < len) {
        if (F.n < 4) continue;
        for (let i = Q.s.indexOf(F.s); i !== -1; i = Q.s.indexOf(F.s, i + 1)) {
          if (dcNameAt(Q, F, i)) found.push([i, i + fl, F.k]);
        }
      } else if (Q.n >= 4) {
        for (let i = F.s.indexOf(Q.s); i !== -1; i = F.s.indexOf(Q.s, i + 1)) {
          if (dcNameAt(F, Q, i)) { part.push(F.k); break; }
        }
      }
    }
    const last = Q.b[Q.b.length - 1];
    for (const m of found) {
      const inside = found.some((o) => o[0] <= m[0] && o[1] >= m[1] && o[1] - o[0] > m[1] - m[0]) ||
        (part.length && !(m[0] === 0 && m[1] > last));
      if (inside) lost.add(m[2]); else put(m[2], 2);
    }
    part.forEach((k) => put(k, 1));
  }
  for (const [k, w] of Array.from(keys)) if (w === 2) (ix.co.get(k) || []).forEach((c) => put(c, 1));
  lost.forEach((k) => { if (!keys.has(k)) keys.dropped.add(k); });
  return keys;
}
/* An item's own hashtags, folded the same way as the keys. */
function dcItemTags(item, fold) {
  return (item.hashtags || []).map((h) => fold(h));
}
/* How strongly the query names one of an item's hashtags (0 = it does not). */
function dcTagWeight(ak, item) {
  let w = 0;
  if (ak.size && item._h) for (const h of item._h) { const x = ak.get(h) || 0; if (x > w) w = x; }
  return w;
}
/* A Persian query names site hashtags; each brings its papers, best first.
   `ak` is the set of concepts the query names through an alias. */
function dcPaperHits(fa, qs, ak) {
  const hits = new Map();
  if (!fa || !fa.length) return hits;
  for (const [k, ids] of fa) {
    if (!(ak && ak.has(k)) && !(!(ak && ak.dropped.has(k)) &&
      qs.some((q) => q && (k.includes(q) || (q.length >= 3 && k.length >= 3 && q.includes(k)))))) continue;
    ids.forEach((id, i) => {
      const b = 3 + 0.5 * (1 - i / ids.length);
      if (b > (hits.get(id) || 0)) hits.set(id, b);
    });
  }
  return hits;
}

function dcLegacySearch() {

  /* ------------ DOM ------------- */
  const searchInput = document.getElementById("dcSearch");
  const resultsBox  = document.getElementById("dcResults");
  const filterBtns  = document.querySelectorAll(".dc-filter-btn");

  /* ------------ DB --------------- */
  let DB = [];
  let LIB = [], LIB_FA = [];   // premium only: the library's papers
  let ALIAS = null;            // the hashtag vocabulary (dcAliasForms)

  const foldFa = dcFold;   // matching only, never display (see dcFold)
  const faDigits = (s) => String(s).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const _lib = '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>';

  /* ------------ فیلترهای فعال -------------- */
 let activeFilters = new Set([
  "dentcast",
  "notecast",
  "clinical",
  "dentcast_plus",
  "promptologist",
  "plak_sefr",
  "taraz",
  "meta",
  "chairside",
  "sharehub"
]);


  /* ------------ مپ نوع‌ها --------------- */
/* A brain `type` → the filter GROUP it answers to. Two types answer to a
   group that is not their own name, since 1405/07/15 (founder decision):
   DentAI and PhotoCast are closed sections — their 35 + 3 pages keep their
   URLs and their `type`, but on every reader surface they are Share Hub («مرور منابع») now. Folding them here (rather than deleting the chip from the
   983 pages that carry it) keeps every article byte-identical; the chip
   itself is removed at runtime below. */
const TYPE_MAP = {
  notecast:       "notecast",
  clinical:       "clinical",
  dentcast_plus:  "dentcast_plus",
  dentai:         "sharehub",
  photocast:      "sharehub",
  promptologist:  "promptologist",
  plak_sefr:      "plak_sefr",
  taraz:          "taraz",
  meta:           "meta",
  chairside:      "chairside",
  sharehub:       "sharehub"
};


  /* ------------ لود دیتابیس ---------------- */
  async function loadDB() {
    try {
      const res = await fetch("/dentcast-brain.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Search index HTTP " + res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid search index");
      DB = data;
      DB.forEach((it) => {
        it._h = dcItemTags(it, foldFa);
        it._b = foldFa((it.title || "") + " " + (it.caption || "") + " " +
          (it.keywords || []).join(" ") + " " + (it.hashtags || []).join(" "));
      });
      dcAliasForms(foldFa).then((f) => {
        ALIAS = f;
        if (f.forms.length && searchInput.value.trim()) performSearch(searchInput.value.trim());
      });
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
      resultsBox.style.display = "block";
      resultsBox.textContent = "بارگذاری اطلاعات جست‌وجو ناموفق بود. صفحه را دوباره بارگذاری کنید.";
    }
  }

  /* ------------ مدیریت فیلترها -------------- */
  /* The «مقالات» (dentai) chip is still in the static markup of every page
     built before the fold; its group no longer exists, so it goes. The
     template in tools/build_pillar.py no longer emits it. */
  filterBtns.forEach(btn => { if (btn.dataset.type === "dentai") btn.remove(); });
  /* Section rename (founder, 1405/08/17): Share Hub reads «مرور منابع» and
     Chairside «ویزیت», NoteCast «خلاصهٔ اپیزودها» and MetaNote «ایده‌ها»
     on every reader surface. The chip label sits in the static markup of every page, so
     it is renamed here at runtime for the same reason the DentAI chip is
     removed above — every article stays byte-identical. */
  filterBtns.forEach(btn => { if (btn.dataset.type === "sharehub") btn.textContent = "مرور منابع";
    if (btn.dataset.type === "chairside") btn.textContent = "ویزیت";
    if (btn.dataset.type === "notecast") btn.textContent = "خلاصهٔ اپیزودها";
    if (btn.dataset.type === "meta") btn.textContent = "ایده‌ها";
    if (btn.dataset.type === "litecast") btn.textContent = "پرسش‌های بیماران"; });
  filterBtns.forEach(btn => {
    if (!btn.isConnected) return;
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

  /* ------------ «مقاله‌ها»: the premium button (see the mobile engine) ------------ */
  let papersOn = false;
  let isPremium = dcPremiumHint() ? null : false;
  const pbtn = document.createElement("button");
  pbtn.type = "button";
  pbtn.className = "dc-filter-btn dc-gs-pbtn-d";
  pbtn.setAttribute("aria-pressed", "false");
  pbtn.title = "جستجو در مقاله‌های کتابخانه (پریمیوم)";
  const host = filterBtns.length && filterBtns[0].parentNode;
  if (host) host.appendChild(pbtn);
  else if (searchInput && searchInput.parentNode) searchInput.after(pbtn);
  function paintPbtn() {
    pbtn.textContent = "مقاله‌ها" + (isPremium === false ? " 🔒" : "");
    pbtn.setAttribute("aria-pressed", String(papersOn));
    const on = papersOn;
    pbtn.style.cssText = "border:1px solid #c9922b;color:" + (on ? "#fff" : "#8a6414") + ";background:" + (on ? "#c9922b" : "rgba(201,146,43,.08)") + ";";
  }
  paintPbtn();
  function papersOnNow() {
    return dcPaperLibrary().then((lib) => {
      if (!lib) return;
      if (!LIB.length) { const rows = dcPaperRows(lib, foldFa); LIB = rows.items; LIB_FA = rows.fa; }
      papersOn = true;
      dcPapersSetWanted(true);
      paintPbtn();
      performSearch(searchInput.value.trim());
    });
  }
  let meAsked = null;
  function askMe() {
    if (!meAsked) {
      meAsked = dcMe().then((r) => {
        if (r.status !== "error") isPremium = !!(r.u && r.u.tier === "premium");
        paintPbtn();
        if (isPremium && dcPapersWanted() && !papersOn) papersOnNow();
        else if (isPremium && searchInput.value.trim()) performSearch(searchInput.value.trim());   // the hint row
      });
    }
    return meAsked;
  }
  pbtn.addEventListener("click", () => {
    if (papersOn) {
      papersOn = false; dcPapersSetWanted(false); paintPbtn();
      performSearch(searchInput.value.trim());
      return;
    }
    dcMe().then((r) => {
      if (r.u && r.u.tier === "premium") { isPremium = true; papersOnNow(); return; }
      if (r.status === "error") return;
      isPremium = false; paintPbtn();
      dcPaperGate();
    });
  });
  if (dcPapersWanted()) askMe();

  /* ------------ سرچ زنده ----------------- */
  searchInput.addEventListener("input", () => {
    performSearch(searchInput.value.trim());
  });

  /* Results are role=button: Enter/Space open them like a click does. */
  resultsBox.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest && e.target.closest(".dc-result-item[role='button']");
    if (!item) return;
    e.preventDefault();
    item.click();
  });

  /* /search.html?q=… arrives with the query already typed; loadDB() runs it. */
  if (/\/search(\.html)?$/.test(location.pathname)) {
    const qp = new URLSearchParams(location.search).get("q");
    if (qp && !searchInput.value) searchInput.value = qp;
  }

  /* ------------ Enter key --------------- */
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch(searchInput.value.trim());
  });

  /* ------------ تشخیص گروه ---------------- */
  function detectGroup(item) {
    if (item.episode && !item.type) return "dentcast";
    if (item.type && TYPE_MAP[item.type]) return TYPE_MAP[item.type];
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
 const _iSpark = _ic('<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>');
 const _iPin = _ic('<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>');
 const _iScale = _ic('<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>');
 /* «بخش — عنوان», unless the title already opens with the section's own name:
    every پرامپتولوژیست, پلاک صفر and تراز شواهد title is written «سری — قسمت»,
    and prefixing it again printed «پرامپتولوژیست — پرامپتولوژیست — …». */
 const named = (name) => title.trim().startsWith(name) ? " " + title.trim() : " " + name + " — " + title;
 const labelMap = {
  dentcast:      _iMic  + " دنت‌کست — اپیزود " + faDigits(item.episode) + (title.trim() ? " · " + title.trim() : ""),
  notecast:      _iNote + named("خلاصهٔ اپیزود"),
  clinical:      _iBulb + named("نکتهٔ کلینیکی"),
  dentcast_plus: _iPlay + named("ویدیو"),
  promptologist: _iSpark + named("پرامپتولوژیست"),
  plak_sefr:     _iPin   + named("پلاک صفر"),
  taraz:         _iScale + named("تراز شواهد"),
  meta:          _iPuzz + named("ایده"),
  chairside:     _iToot + named("ویزیت"),
  sharehub:      _iLink + named("مرور منابع")
};


  let url = item.page_url || item.url || "";
  if (!url && group === "dentcast" && item.episode) {
    const slug = String(item.episode).replace(".", "-");
    url = `/episodes/episode-${slug}.html`;
  }
  if (!url.startsWith("http")) url = location.origin + url;

  /* On the desktop shell, open content in col-C via dcdOpen (which also dismisses
     the search overlay); on mobile navigate directly. Keyed off the actual UI
     mode (body.dc-desktop-ui) instead of a raw px threshold so every desktop
     width routes through dcdOpen, not just ≥1024px. */
  const escapedTitle = title.replace(/'/g, "\\'");
  const clickHandler = `(document.body.classList.contains('dc-desktop-ui')&&window.dcdOpen ? window.dcdOpen('${url}','${escapedTitle}') : (window.location.href='${url}'))`;

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

    const qs = dcSpellings(ALIAS, foldFa(q));
    const ak = dcAliasKeys(ALIAS, qs);
    let results = [];

    for (const item of DB) {
      const group = detectGroup(item);
      if (!group) continue;

      item._group = group;

      if (!activeFilters.has(group)) continue;

      if (qs.some((x) => x && dcTextHas(item._b, x)) || dcTagWeight(ak, item)) results.push(item);
    }

    /* The library's papers, after site content (premium, button on). */
    askMe();
    const faHits = dcPaperHits(LIB_FA, qs, ak);
    const papers = [];
    for (const it of (papersOn ? LIB : [])) {
      const sc = (qs.some((x) => x && dcTextHas(it._t, x)) ? 4 : 0) + (qs.some((x) => x && dcTextHas(it._k, x)) ? 2 : 0) + (faHits.get(it._pid) || 0);
      if (sc) papers.push([sc, it]);
    }
    papers.sort((a, b) => b[0] - a[0]);
    const paperRow = (it) => '<div class="dc-result-item" role="button" tabindex="0" dir="auto" onclick="window.location.href=\'' + it._url + '\'">' +
      _lib + " مقاله — " + escHtml(it.title) + (it._year ? " (" + it._year + ")" : "") + "</div>";
    const papersHtml = isPremium === true && !papersOn
      ? '<div class="dc-result-item" role="button" tabindex="0" style="color:#8a6414;text-align:center" onclick="this.closest(\'#dcResults\') && document.querySelector(\'.dc-gs-pbtn-d\').click()">جستجو در مقاله‌های کتابخانه ›</div>'
      : papers.length
      ? '<div class="dc-result-item dc-no-results" role="presentation">کتابخانه — ' + faDigits(papers.length) + " مقاله</div>" +
        papers.slice(0, 30).map((x) => paperRow(x[1])).join("") +
        (papers.length > 30 ? '<div class="dc-result-item" role="button" tabindex="0" onclick="window.location.href=\'/dentcast_cabinet_search.html?q=' + encodeURIComponent(q).replace(/'/g, "%27") + '\'">همهٔ مقاله‌ها در کتابخانه ›</div>' : "")
      : "";

    if (!results.length && !papers.length && !papersHtml) {
      resultsBox.style.display = "block";
      resultsBox.innerHTML = `
      <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      <div class="dc-result-item dc-no-results" role="status">نتیجه‌ای برای «${escHtml(q)}» پیدا نشد.</div>
    `;
      resultsBox.querySelector(".dc-close-results").onclick = () => {
        resultsBox.style.display = "none";
        resultsBox.innerHTML = "";
      };
      return;
    }


    /* --- نمایش ۳۰ تای اول --- */
    const more = results.length > 30;
    const visible = results.slice(0, 30);

    resultsBox.style.display = "block";
    resultsBox.innerHTML = `
      <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      ${visible.map(buildItem).join("")}
      ${more ? `<div class="dc-more-btn">مشاهده ادامه نتایج… (${results.length})</div>` : ""}
      ${papersHtml}
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
          results.map(buildItem).join("") + papersHtml;

        resultsBox.querySelector(".dc-close-results").onclick = () => {
          resultsBox.style.display = "none";
          resultsBox.innerHTML = "";
        };
      };
    }
  }

  /* ------------ اجرای سیستم ---------------- */
  loadDB();

}

/* ============================================================
   BOTTOM-SHEET KEYBOARD HANDLING — visualViewport (Issue 2)
   ------------------------------------------------------------
   The bottom sheet (#dcGlobalBox) is position:fixed; bottom:0 and, on iOS,
   sits BEHIND the on-screen keyboard once the input is focused. This module
   lifts the sheet above the keyboard and re-caps #dcResults to the space that
   remains visible, reacting live to visualViewport resize/scroll.

   It hooks the sheet by OBSERVING the `.open` class, so every open path —
   dc-nav.js (tap, breeds B & C), global-search-ui.js (shake, breed C) — is
   covered by one implementation, with no per-controller wiring.

   GUARDS:
   - Homepage runs a full-screen overlay (body.dc-search-mode) with flex,
     full-height results; its layout is unaffected, so we skip repositioning
     whenever dc-search-mode is set.
   - When window.visualViewport is undefined (older Android), we do nothing and
     leave the existing static behavior — no crash.
============================================================ */
(function () {
  function init() {
    var box = document.getElementById("dcGlobalBox");
    if (!box) return;
    var vv = window.visualViewport; /* may be undefined — graceful fallback */
    var input = document.getElementById("dcSearch");

    /* Bottom-sheet layout only; the homepage overlay manages itself. */
    function isSheet() {
      return !document.body.classList.contains("dc-search-mode");
    }

    function reposition() {
      if (!vv || !box.classList.contains("open") || !isSheet()) return;
      /* Keyboard height ≈ layout viewport − visible viewport (− any offset). */
      var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      box.style.transform = "translateY(-" + kb + "px)"; /* GPU-smooth lift */
      box.style.maxHeight = vv.height + "px";
      var r = document.getElementById("dcResults");
      if (r) {
        /* Cap results to the gap between their top and the keyboard's top,
           keeping them scrollable within the visible viewport. */
        var rect = r.getBoundingClientRect();
        var avail = (vv.offsetTop + vv.height) - rect.top - 12;
        r.style.maxHeight = Math.max(80, avail) + "px";
      }
    }

    function attach() {
      if (!vv || !isSheet()) return;
      /* Identical listener refs → repeated attach() calls are no-ops. */
      vv.addEventListener("resize", reposition, { passive: true });
      vv.addEventListener("scroll", reposition, { passive: true });
      /* Re-cap #dcResults as the user types (results appear/grow after the
         keyboard has already settled, so no viewport event would fire). */
      if (input) input.addEventListener("input", reposition);
      reposition();
    }

    function detach() {
      if (vv) {
        vv.removeEventListener("resize", reposition);
        vv.removeEventListener("scroll", reposition);
      }
      if (input) input.removeEventListener("input", reposition);
      box.style.transform = "";
      box.style.maxHeight = "";
      var r = document.getElementById("dcResults");
      if (r) r.style.maxHeight = "";
    }

    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].attributeName === "class") {
          if (box.classList.contains("open")) attach();
          else detach();
        }
      }
    });
    obs.observe(box, { attributes: true, attributeFilter: ["class"] });

    if (box.classList.contains("open")) attach();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
