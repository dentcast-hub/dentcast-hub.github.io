// DentCast Plus - client config and shared constants.
// Progressive enhancement only: nothing here runs for anonymous visitors until
// they choose the workbench or the homepage card. No em dashes in Persian copy.

// --- API base with failover -------------------------------------------------
// Final hostnames are set at deploy. The client tries the primary, falls back
// to the secondary (health-checked). Override in a page via window.DENTCAST_PLUS.
const OVERRIDE = (typeof window !== 'undefined' && window.DENTCAST_PLUS) || {};

function defaultBases() {
  const h = location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '') {
    return ['http://localhost:8787'];
  }
  // Each site talks to its OWN api host FIRST, so the session cookie stays
  // same-site (SameSite=Lax). Order is critical: if .ir picked api.dentcast.org
  // first (once that host exists behind a Cloudflare Worker), it would be
  // cross-site and the cookie would be dropped — breaking .ir login. The other
  // host is only a fallback for read-only resilience (same container behind both).
  if (h.indexOf('dentcast.org') !== -1) return ['https://api.dentcast.org', 'https://api.dentcast.ir'];
  return ['https://api.dentcast.ir', 'https://api.dentcast.org'];
}

export const API_BASES = OVERRIDE.apiBases || defaultBases();

// --- .org gate (RETIRED) ----------------------------------------------------
// api.dentcast.org is now wired: a Cloudflare Worker on api.dentcast.org proxies
// to the same container, so .org has a same-site API and the SameSite=Lax session
// cookie works (the API sets a host-only cookie). .org therefore runs the NATIVE
// OTP flow exactly like .ir. isOrgHost() returns false so every .org gate below
// becomes a no-op in one place; the now-dead openOrgNotice / irMirrorUrl paths and
// their call sites can be deleted later. Flip this back to the ORG_HOSTS check
// only if api.dentcast.org is ever down.
export const ORG_HOSTS = ['dentcast.org', 'www.dentcast.org'];

export function isOrgHost() {
  return false;
}

// The same path on the .ir host, so the reader is not thrown out of their
// article (only the hostname changes; path + query + hash are preserved).
export function irMirrorUrl() {
  return 'https://dentcast.ir' + location.pathname + location.search + location.hash;
}

// --- never cross the mirror boundary ----------------------------------------
// The two sites are mirrors of the same content with SEPARATE sessions: the API
// sets a host-only cookie and each site talks to its own api host (see
// defaultBases above). So a link naming the OTHER mirror does not merely change
// the domain, it signs the reader out for the page it lands on.
//
// 2026-08-10 is why this exists. An اطلاعیه linked
// https://dentcast.ir/plus/pricing.html; every reader signed in on .org who
// followed it arrived anonymous, and the pricing page's discounts are personal
// — so they were quoted the public price with nothing on screen saying it was
// not theirs. The founder found it on their own announcement.
//
// Any link pointing at either mirror is therefore re-aimed at the mirror the
// reader is already on; path, query and hash are preserved. Anything else — a
// DOI, a Drive folder, any external site — is returned untouched. The point is
// not to rewrite links, it is to never throw somebody across a session
// boundary without telling them.
const MIRROR_HOSTS = ['dentcast.ir', 'www.dentcast.ir', 'dentcast.org', 'www.dentcast.org'];

export function sameMirrorUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url, location.href);
    if (MIRROR_HOSTS.indexOf(u.hostname) === -1) return url;
    return location.origin + u.pathname + u.search + u.hash;
  } catch (_) {
    return url; // not parseable as a URL: hand it back rather than lose the link
  }
}

// The price list, mirrored client-side.
//
// The server is the authority and its answer always wins — but the page must be
// READABLE before that answer arrives, and still readable if it never does.
// Everything a visitor came here to learn (what it costs, what the terms are,
// what they get) is static; only "can we take money today" and "does this plan
// still fit under this month's ceiling" genuinely need the API. Gating the whole
// page on that call meant a visitor saw an error instead of a price whenever the
// API was slow, down, or simply not deployed yet.
//
// The table is the price list, not a rate to multiply: since 2026-08-07 a longer
// term costs LESS per month (1,200,000 / 1,100,000 / 1,000,000 toman a month), so
// there is no single monthly figure the three prices can be derived from. Mirrors
// PAYMENT_PLAN_PRICES on the API — keep the two in step.
export const PLAN_PRICES_RIAL = {
  1: 12000000, // 1,200,000 toman
  3: 33000000, // 3,300,000 toman  (1,100,000 a month)
  6: 60000000, // 6,000,000 toman  (1,000,000 a month)
};

export const PLAN_MONTHS = Object.keys(PLAN_PRICES_RIAL).map(Number).sort((a, b) => a - b);

// The cheapest per-month rate on the list — what «از ماهی … تومان» quotes. NOT
// the one-month price, and nothing is priced from it.
export const FROM_MONTHLY_RIAL = Math.min(
  ...PLAN_MONTHS.map((m) => PLAN_PRICES_RIAL[m] / m),
);

// The out-of-country route, mirrored for the same reason as the prices above:
// the section must be READABLE before the API answers, and still readable if it
// never does. Every value here is configuration, not state — the server's copy
// wins whenever it is reachable, and this is what the page shows meanwhile.
//
// It matters more here than for the rial plans: somebody abroad has no other
// route at all, so a section that renders nothing until an API call succeeds
// renders nothing at all for the exact person it was built for.
export const GIFT_CARD = {
  months: 10,
  amount_usd: 100,
  kind: 'apple_us',
  recipient_email: 'foad.shahabian@gmail.com',
};

// --- payments are .ir-only --------------------------------------------------
// NOT the same question as isOrgHost() above, which gates the whole .org site
// and is currently off. This one is a fact about the payment gateway rather
// than a policy we chose: the Zibal merchant is registered to dentcast.ir, its
// e-namad is issued for that domain, and the callback URL it will accept lives
// there. A purchase begun on .org cannot be completed, whatever the .org gate
// is set to — so it has to move BEFORE the customer picks a plan, not after.
export function paymentsHost() {
  return 'https://dentcast.ir';
}

/** True when a purchase started here could not be finished. */
export function paymentsNeedIrHost() {
  // The dev/localhost default is "fine": a local build has no gateway anyway,
  // and bouncing a developer to production would be absurd.
  const h = location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '') return false;
  return h.indexOf('dentcast.ir') === -1;
}

/** Where to send them: the same page, on the host that can take the money. */
export function paymentsIrUrl(path) {
  return paymentsHost() + (path || location.pathname + location.search + location.hash);
}

// --- Web Push (VAPID) -------------------------------------------------------
// Public application-server key for browser push. Safe to embed (it is public).
// Override via window.DENTCAST_PLUS.vapidPublicKey; if left empty, the client
// fetches it from the API (/push/public-key) at subscribe time.
export const VAPID_PUBLIC_KEY = OVERRIDE.vapidPublicKey || '';

// --- Telegram Login ---------------------------------------------------------
// Each site uses its OWN bot, because a bot's /setdomain binds it to exactly ONE
// domain: @Dentcast_bot -> dentcast.org, @Dentcast_irbot -> dentcast.ir. The
// widget only renders on its bot's domain, so we pick the username by host. The
// bot username is public. The Telegram USER id is global (same across bots), so
// the same person is ONE account across both sites. The widget redirects to the
// API's /auth/telegram/callback, which verifies the payload against either bot's
// SECRET token server-side.
const TELEGRAM_BOT_USERNAME_ORG = OVERRIDE.telegramBotUsername || 'Dentcast_bot';
const TELEGRAM_BOT_USERNAME_IR = OVERRIDE.telegramBotUsernameIr || 'Dentcast_irbot';

// The bot username for the current host (.ir -> the .ir bot; else the .org bot).
export function telegramBotUsername() {
  return location.hostname.indexOf('dentcast.ir') !== -1
    ? TELEGRAM_BOT_USERNAME_IR
    : TELEGRAM_BOT_USERNAME_ORG; // .org hosts and the dev default
}

// Telegram login is shown ONLY on .org. On .ir it is deliberately hidden:
// Telegram is filtered in Iran and the widget loads from telegram.org /
// oauth.telegram.org, so the button would be broken for non-VPN users — exactly
// the .ir audience. .ir uses phone/OTP now and gets "Login with Bale" (domestic,
// unfiltered) later. The .ir bot (@Dentcast_irbot) and the multi-token backend
// stay wired, so re-enabling .ir Telegram is just widening the check below.
// Set window.DENTCAST_PLUS.forceTelegramLogin = true to preview it anywhere.
export function telegramLoginEnabled() {
  if (OVERRIDE.forceTelegramLogin) return true;
  return location.hostname.indexOf('dentcast.org') !== -1;
}

// The absolute auth-url the widget redirects to. It is a top-level navigation
// (not a fetch), so we target the primary same-site API base directly rather
// than the health-checked failover list. `origin` + `return_to` tell the
// callback where to send the browser back after it sets the session cookie.
export function telegramCallbackUrl(returnTo) {
  const qs = new URLSearchParams({
    origin: location.origin,
    return_to: returnTo || '/plus/',
  });
  return API_BASES[0] + '/auth/telegram/callback?' + qs.toString();
}

// --- Bale (بله) notifications -----------------------------------------------
// Bale is a NOTIFICATION channel only — there is NO login widget and no "Login
// with Bale". A user connects it from their profile: the connect button asks the
// API for a one-time token, opens the Bale bot deep link `ble.ir/<bot>?start=<token>`,
// and once the user presses Start the bot webhook links their chat_id. The bot
// username is public. Unlike Telegram login (which is .org-only because Telegram
// is filtered in Iran), Bale is the DOMESTIC, unfiltered channel and is shown on
// BOTH sites. Override the username via window.DENTCAST_PLUS.baleBotUsername.
const BALE_BOT_USERNAME = OVERRIDE.baleBotUsername || 'dentcast_bot';

export function baleBotUsername() {
  return BALE_BOT_USERNAME;
}

// Bale is available everywhere. Kept as a function for symmetry with
// telegramLoginEnabled(), so a page can force it off via the override if needed.
export function baleEnabled() {
  return OVERRIDE.baleEnabled !== false;
}

// The deep link the connect button opens. Pressing Start in Bale sends
// `/start <token>` to the bot, whose webhook links this account to the chat_id.
export function baleDeepLink(token) {
  return 'https://ble.ir/' + baleBotUsername() + '?start=' + encodeURIComponent(token);
}

// --- content_id from the canonical URL --------------------------------------
// content_id = page path without leading slash and without ".html".
// e.g. /chairside/chairside-25.html -> "chairside/chairside-25". Unique across
// content types and reversible to the canonical URL for the tree/archive map.
export function detectContentId() {
  let path;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && canonical.href) {
    try { path = new URL(canonical.href).pathname; } catch (_) { path = location.pathname; }
  } else {
    path = location.pathname;
  }
  return path.replace(/^\/+/, '').replace(/\.html$/i, '') || 'index';
}

// The prose container a user highlights inside. First match wins.
// .ep-box is the episode/promptologist shell. It's included so the workbench can
// mount on text promptologist pages; audio episode pages (which also use .ep-box)
// are excluded separately by the #ep-audio gate in plus.js (podcasts get the
// "seen" tick, not the workbench).
export const PROSE_SELECTORS = ['.text-box', '.glass-box', '.content-box', '.ep-box'];

// The FIRST prose box, in document order — what findProseRoot() used to return
// on its own. It stays exported because it is still the right ANCHOR: the
// میز کار bar goes immediately above the article's opening box, which is not
// necessarily the same element as the article's body (see findProseRoot below).
// `scope` is a container on the desktop shell, where the article is injected
// into the homepage and a document-wide query would find the homepage's own
// boxes first.
export function findProseBox(scope = document) {
  for (const sel of PROSE_SELECTORS) {
    const el = scope === document ? document.querySelector('main ' + sel + ', ' + sel) : scope.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// The readable body of the article, as ONE element — the scope every reading
// feature measures itself against (the workbench's selections and anchors, the
// reading tracker's length + end-of-article test, the sponsor card's placement).
//
// Most pages wrap their whole body in a single box, so that box IS the article.
// But the legacy NoteCast template splits the body across SIBLING boxes — one
// `<div class="glass-box">` per section, eight of them on notecast/episode-6 —
// and returning just the first of those made the other seven invisible to every
// one of those features. The workbench drops any selection whose range is not
// inside its root, silently (workbench.js _captureSelection), so on 26 NoteCast
// pages selecting text and pressing «هایلایت» did nothing at all, with no error
// to explain it: on episode-6 only 7% of the article could be highlighted, and
// on episode-23/24 the one reachable box is «منبع و اعتبار», so none of the body
// could (user report, 2026-08-11).
//
// So: when the first box has SIBLINGS of its own kind, the article is the parent
// that holds them. The widening is deliberately confined to that one shape —
// same selector, same parent, and never past the article shell — so a page whose
// body is a single box resolves to exactly the element it always did, which is
// every page on the site but those 26.
export function findProseRoot(scope = document) {
  const first = findProseBox(scope);
  if (!first) return null;
  const parent = first.parentElement;
  if (!parent) return first;
  // Never widen out of the article: on a document-wide lookup that bound is the
  // article shell (no shell → no widening at all), and in the shell it is the
  // container the article was injected into.
  const limit = scope === document ? document.querySelector('main.article-content-wrap') : scope;
  if (!limit || !limit.contains(parent)) return first;
  const sel = PROSE_SELECTORS.find((s) => first.matches(s));
  const siblings = Array.from(parent.children).filter((c) => c.matches(sel)).length;
  return siblings > 1 ? parent : first;
}

// --- Highlighter palette + labels (Persian) ---------------------------------
export const PALETTE = [
  { key: 'yellow', fa: 'زرد', css: '#ffe08a' },
  { key: 'green', fa: 'سبز', css: '#b7e4b0' },
  { key: 'blue', fa: 'آبی', css: '#a9d3f5' },
  { key: 'pink', fa: 'صورتی', css: '#f6b8cf' },
  { key: 'red', fa: 'قرمز', css: '#ff8080' },
];

export const LABELS = [
  { key: 'important', fa: 'مهم' },
  { key: 'unclear', fa: 'مبهم' },
  { key: 'clinical_pearl', fa: 'نکته بالینی' },
];

// --- reading completion -----------------------------------------------------
// The client emits `article_completed` (a qualifying streak + scoring action)
// only when BOTH hold: the reader reached the end of the prose AND spent enough
// *visible* time on the page. This is what makes plain reading — not just
// highlighting — earn a score, an active day and the streak.
//
// The dwell threshold scales with ARTICLE LENGTH: estimated full reading time =
// words / READ_WPM, and the reader must stay for READ_FRACTION of it, clamped
// between READ_MIN_MS and READ_MAX_MS. So a short note needs the floor while a
// long article needs proportionally more. Visible time only — a backgrounded tab
// or a locked phone does not count.
export const READ_WPM = 200;         // Persian words/minute (technical prose reads slower than casual)
export const READ_FRACTION = 0.5;    // must dwell at least half the estimated read time
export const READ_MIN_MS = 30000;    // floor: even a tiny stub needs 30s
export const READ_MAX_MS = 240000;   // cap: a very long article never demands > 4 min

// The LISTEN threshold is the audio analogue of READ: the listener must hear
// LISTEN_FRACTION of the episode's real duration, clamped between LISTEN_MIN_S
// and LISTEN_MAX_S. Only ACTUAL played seconds count (seeking to the end does
// not) — measured from real playback progress, so it is the audio twin of the
// visible-dwell rule for reading.
//
// Deliberately LOWER than READ_FRACTION (0.2 vs 0.5, changed 2026-08-10). The
// two look like the same knob and are not: a reader's dwell is continuous, but
// a podcast is listened to in pieces — every ±15s button and every scrub is a
// seek, which credits nothing, and playedS is not carried across page loads.
// At half an episode (median 21 min → 10.5 min of unbroken forward play) a
// listener who skipped the intro could not reach the threshold at all, however
// long they listened. A fifth is what an interrupted, skipping listener
// actually accumulates.
export const LISTEN_FRACTION = 0.2;  // must hear at least a fifth of the episode
export const LISTEN_MIN_S = 60;      // floor: even a short clip needs 60s of real play
export const LISTEN_MAX_S = 1200;    // cap: a very long episode never demands > 20 min

// --- storage keys -----------------------------------------------------------
// Mode choice is remembered per session only (never auto-enter across sessions).
export const SS_MODE = 'dcp:mode:'; // + contentId -> 'study'
export const SS_RETURN_STUDY = 'dcp:return-study'; // path to auto-enter after login
export const SS_READ_DONE = 'dcp:read:'; // + contentId -> '1' once article_completed fired this session
// Listening is the one signal that REPEATS: re-hearing an episode pays again
// (once per league week, decided server-side in score.ts / league.ts). So its
// key is a localStorage TIMESTAMP, not a session flag — a session flag both
// forgot too early (a new tab re-posts the same listen the same day) and
// remembered too long (a pinned mobile tab keeps one session alive for weeks,
// which is exactly the reader who re-listens and is told they earned nothing).
// The client only de-duplicates; what a repeat is WORTH is the server's call.
export const LS_LISTEN_AT = 'dcp:listen:'; // + contentId -> epoch ms of the last episode_listened
export const LISTEN_REPEAT_MS = 20 * 3600 * 1000; // don't re-post the same episode within 20h

// One-sentence invitation shown to anonymous users at the workbench button.
export const INVITE_LINE =
  'هایلایت، یادداشت و پیگیری پیشرفت، رایگان. برای شروع وارد شوید.';

// --- premium features (shared) -----------------------------------------------
// The five LIVE premium features' title + short hint. One place to edit so the
// dashboard's own sections, the "you won a week of premium" banner, and the
// league "stayed" teaser (league.js) never drift apart.
export const PREMIUM_FEATURES = [
  { title: 'برای مرور امروز', hint: 'هایلایت‌هایی که امروز نوبتِ مرورشونه.' },
  { title: 'مسیر یادگیری', hint: 'مسیرهای آماده، از پایه تا پیشرفته؛ فقط بخون.' },
  { title: 'کالکشن‌ها', hint: 'هایلایت‌ها و مقاله‌هاتو تو پوشه‌های دلخواهِ خودت بریز.' },
  { title: 'قطب‌نمای مطالعه', hint: 'وضعیت خواندن‌هایتان را نسبت به کل محتوای سایت و مسیرهای یادگیری می‌سنجد.' },
  { title: 'دستیار هوشمند', hint: 'شرایط بیمار را شرح بده؛ با چند گزینه به نزدیک‌ترین مقاله می‌رسیم.' },
  // Appended at the END on purpose: dashboard.js addresses entries 0..4 by
  // index and league.js shows slice(0, 3), so a new feature only ever goes
  // last. This one has no section of its own — it lives in the dashboard's
  // «هایلایت‌های اخیر» footer — but it belongs in every "what premium gives
  // you" list (the prize banner reads the whole array).
  { title: 'دفترچه‌ی هایلایت‌ها', hint: 'همه‌ی هایلایت‌هایت یکجا، با یادداشت‌ها و جستجو.' },
];
