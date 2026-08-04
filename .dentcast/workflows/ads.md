# DentCast Ad-Publishing Router

Sibling to `README.md` (the «متن جدید دارم» publishing router) and
`en-version.md`. That router publishes **content**; this one publishes
**advertisements**. An ad is NOT content: it gets **no** page, **no**
`dentcast-brain.json` entry, **no** Pulse line, **no** pillar, **no** en
mirror. The entire ad system lives in **one file**: `spot/spot-config.json`.

**Trigger (registered in `CLAUDE.md`):** the user says they have an ad to
publish — **«تبلیغ دارم»**, «آگهی دارم», «اسپانسر گرفتیم», «یه تبلیغ جدید»,
or any equivalent. Also covers ad *management*: «تبلیغ X رو خاموش/روشن کن»,
«تبلیغات رو کلاً خاموش کن», «سهم اسپانسر رو بیشتر کن». Any of these enters
THIS workflow — never the publishing router, even if the user also pastes
متن (ad copy is creative text, not a متن to publish).

---

## Hard rules

1. **`spot/spot-config.json` is the only home of ads.** Never hardcode ad
   markup into any HTML page, template, or builder. The loader hook in
   `dc-nav.js` + `spot/spot.js` render everything from the config. Both
   legacy hardcoded ads are GONE at the user's request — the «معرفی برند»
   card in `episodes.html` and the دیونت box inside the homepage Pulse
   card — do not bring either back. **The Pulse card is news-only: it
   never carries an ad of any kind.** The homepage's ad placement is the
   separate `home` slot card that renders after the Pulse card.
2. **Sponsor vs. internal decides Google compliance — get it right, it is
   not cosmetic.** `spot/spot.js` emits `rel="sponsored noopener"` +
   `target="_blank"` for every `creatives.sponsors` entry with an external
   `http(s)` url, and does NOT for the internal `creatives.premium` house
   ad (non-web urls like `mailto:` never get a `rel` — there is nothing
   for Google to crawl). Therefore: **any paid placement, barter, or
   external business goes under `sponsors` — never under `premium`.**
   Putting a paid link where it renders without `rel="sponsored"` is a
   Google policy violation (link scheme). When in doubt whether something
   counts as sponsored, it does — or ask. (The `brand-invite` entry in
   `sponsors` is an exception by design: an internal placeholder shown to
   signed-in users via `audience: ["plus"]` — unpaid, `mailto:` link. A
   real sponsor replacing it later must follow the normal rules.)
3. **Schema is sacred.** A new sponsor entry copies the exact field shape
   of the existing entries in `creatives.sponsors` (`id`, `enabled`,
   `badge`, `title`, `text`, `cta`, `url`, `image`, `weight`, optional
   `slots`, optional `audience`). Free-text human notes may go in an extra
   `note` field (the engine ignores unknown fields) — nothing else new.
   Append new sponsors at the END of the array.
4. **Ask, don't guess (Hard Rule 13 of the publishing router applies
   verbatim).** URLs, ad copy the user didn't supply, image choice, slot
   placement, rotation share, and contract dates are never invented. Copy
   you draft yourself is a **proposal shown for confirmation**, never
   silently shipped. Auto-derive only the mechanical: `id` (kebab-case
   from the brand name, unique against existing ids), `badge` default
   («حمایت‌شده» for sponsors), `weight` default `1`.
5. **Turning things off leaves zero trace but never destroys history.**
   Off = `"enabled": false` (per-ad, per-slot, or master). Never delete a
   sponsor entry unless the user explicitly says delete — a disabled entry
   is the record of a past campaign.
6. **Rotation is never guessed — it is ASKED, every time an ad is added.**
   `rotation.sequence` is a row of **زمان‌ها** (beats) and an ad renders only
   in the beats it occupies, so "leave it as is" is not a safe default: it
   means the new ad shows to nobody. Phase B question 6 asks how many of
   the زمان‌ها this ad takes and what fills the rest, then Phase C writes
   the literal cyclic array the user picked
   (e.g. `["premium","premium","sponsor-x","sponsor-x"]`). Only the user
   changes the NUMBER of beats. **The unit of that array is
   `rotation.advance`** — `"view"` (current setting) means one step per
   ad-showing page view, so a four-entry array = «هر زمان یک بازدیدِ صفحه»
   (چهار بار ریفرش = یک دور کامل); `"session"` means one step per visit.
   Always echo the pattern in the unit that is actually configured — «هر ۴
   بار» is ambiguous until you say بار = بازدید or بار = سشن.
7. **Config edits are live instantly; engine edits need a version bump.**
   `spot-config.json` is fetched `no-store` — publish is commit+push, done.
   Only if `spot/spot.js` itself changes, bump `SPOT_V` in the ads loader
   at the end of `dc-nav.js`. The card CSS lives INSIDE `spot.js` (the
   `SPOT_CSS` constant, injected as a `<style>` tag) — never split it back
   into a standalone .css file: the Arvan CDN on the `.ir` mirror mangled
   the separate stylesheet (minified it and served it so the browser
   refused to apply it) and every card rendered unstyled.
8. **Images are self-hosted.** An attached image goes to
   `spot/img/<id>.webp` (convert to webp when tooling allows; otherwise
   keep the original extension), referenced root-relative in `image`.
   Never hotlink an external image URL — if the user gives one, download
   it into `spot/img/`. Keep it small (this is a 44px-square thumb slot).
9. **Verify before commit.** `python3 -m json.tool spot/spot-config.json`
   must pass, and the report must state — per slot — what the visitor
   will actually see after this change. If anything about the outcome is
   surprising (e.g. sponsor added but sequence still `["premium"]` means
   it never shows), SAY SO — that is exactly the kind of silent surprise
   rule 6's echo exists to catch.
10. **Adblock-neutral naming — never "ad" in anything the browser sees.**
   The system is named "Spot" because adblock filter lists (EasyList — the
   basis of Opera's built-in blocker, uBlock, ABP, AdGuard) carry a generic
   `##.dc-ad` hide rule and readily match "ad/ads" URL paths; the previous
   `/ads/` + `dc-ad` naming made every card invisible to adblock users.
   Therefore: no "ad/ads" in file names, URL paths, CSS classes, ids, or
   data attributes anywhere in this system (`dc-spot` prefix, `/spot/`
   path). Any NEW browser-visible name (a class, an image filename, a new
   config file) must be checked against current EasyList (network rules +
   `##` cosmetic rules) before shipping. Exceptions that stay as-is:
   localStorage keys (`dcAds.*`) and GA event names
   (`ad_impression`/`ad_click`) — invisible to blockers, and renaming them
   breaks rotation/analytics continuity.

---

## Phase A — Read the current state

Read `spot/README.md` and `spot/spot-config.json`. Note: master switch, which
slots are enabled, the current `rotation.sequence`, existing sponsor ids
(for id uniqueness), and whether the premium house ad is on. If the
request is management-only (toggle/share change), apply it directly —
Phase B collapses to confirming the one thing being changed.

**Read the rotation as a numbered map of زمان‌ها before asking anything.**
`rotation.advance` is `"view"` and `rotation.sequence` currently has four
entries — four **زمان** (beats), one per ad-showing page view. Write the map
down for yourself, because Phase B question 6 quotes it back to the user:

```
زمان ۱ = idc-welcome   زمان ۲ = premium   زمان ۳ = idc-platform   زمان ۴ = idc-launch
```

Never assume the array is still four long or still all-`premium` — re-read it
every time; earlier ads may already own beats.

## Phase B — Interview (one message, only the gaps)

Auto-discover first; then ask everything still missing in a **single**
combined question message, with concrete options where possible:

1. **نوع تبلیغ** — اسپانسر (کسب‌وکار بیرونی/پولی) یا داخلی (پریمیوم/خانگی)؟
   If it is obviously an external business, don't ask — state that it will
   be filed as a sponsor with `rel="sponsored"` (rule 2) and move on.
2. **لینک** — the exact destination URL.
3. **متن‌ها** — `title` (brand/offer line), `text` (one supporting line),
   `cta` (button label, default «بازدید»). If the user supplied raw
   material, draft the three fields and show them for confirmation.
4. **عکس** — attached file, an image they'll send, or none (`image: null`).
5. **کجا نمایش داده بشه** — which slots: مقاله / صفحهٔ اصلی / آرشیو
   اپیزودها / پلیر / پیشخوان / پروفایل / جستجوی سراسری / تب آرشیو، یا
   همه‌جا (= omit the `slots` field). Offer the currently-enabled slots as the default.
   If they name a disabled slot, ask whether to enable it (that switch
   affects ALL ads in that slot — say so).
5b. **کی ببینه** — audience targeting is OPTIONAL and defaults to everyone;
   do NOT ask about it unless the user brings it up. Two independent
   layers, both `["anon"]` (signed-out) / `["plus"]` (signed-in
   non-premium), missing = both:
   - **per-creative** `audience` — which campaign fills a placement
     («لاگین‌نشده‌ها اینو ببینن» → set it on the creative);
   - **per-slot** `audience` — whether the placement exists for that
     viewer at all («جایگاه اپیزودها فقط برای لاگین‌نشده‌ها» → set it on
     the slot in `slots`).
   Premium users never see ads regardless of either layer.
6. **سهم چرخش — «کدام زمان‌ها؟» (ALWAYS ASK when an ad is added)** — this is
   not optional and not inferable: a new ad that nobody assigns to a beat
   renders **never**. Quote the current beat map from Phase A, then ask
   **both** halves in one question:
   - **چند تا از ۴ زمان مال این تبلیغ باشد، و کدام‌ها؟** («هر چهار زمان» /
     «دو زمان» / «یک زمان» / «سه زمان»)
   - **بقیهٔ زمان‌ها چه پر شود؟** (پریمیوم، یک اسپانسر دیگر با id مشخص، یا
     `"sponsor"` برای چرخش وزنی بین اسپانسرهای روشن)

   Offer concrete arrays as options so the answer is one word, e.g. for a new
   `sponsor-x` on a four-beat rotation:

   ```jsonc
   ["sponsor-x","sponsor-x","sponsor-x","sponsor-x"]  // هر ۴ بازدید همین تبلیغ
   ["premium","premium","sponsor-x","sponsor-x"]      // دو زمان این، دو زمان پریمیوم
   ["premium","premium","premium","sponsor-x"]        // فقط یک زمان از چهار
   ["premium","sponsor-x","sponsor-x","sponsor-x"]    // سه زمان این، یکی پریمیوم
   ```

   Say plainly what the chosen array means: «از هر ۴ بازدیدِ صفحه، ۲ بازدید
   این تبلیغ را می‌بیند و ۲ بازدید پریمیوم را» — بار here means بازدیدِ صفحه,
   not سشن (rule 6). Ask about **beat ORDER** only if the user cares; otherwise
   place the new ad in the LAST beats of the array (a first-visit ad is the
   pushiest slot — don't hand it over without being asked). Changing the
   NUMBER of زمان‌ها (سه‌زمانه، پنج‌زمانه…) is a separate, explicit request:
   never resize the array to make an ad's share come out even — pick the
   closest split on the existing length and say so.

   If the user declines to decide («فعلاً کاری نداشته باش»), leave `sequence`
   untouched and state in the report — loudly — that the ad is filed but
   **shows to nobody** until a beat is assigned (rule 9's silent-surprise
   catch).
7. **مدت/قرارداد** — start/end date if any → recorded in `note` (the
   engine has no scheduler; expiry is a manual `enabled: false` later —
   tell the user that plainly, and that they can just say «تبلیغ X رو
   خاموش کن» when the time comes).
8. **قیمت** — pricing questions are answered ONLY from `spot/PRICING.md`
   (per-slot ratios of the bundle price X, combination-discount ladder,
   rotation-share proration, contract-length discounts). Never invent
   numbers; if the rial value of X is unknown, quote the ratios and ask
   the user for X.

## Phase C — Apply

1. Sponsor: append the new entry (rule 3 shape) at the end of
   `creatives.sponsors`, `enabled: true`. Internal ad: edit
   `creatives.premium` fields in place.
2. Image (if any): save to `spot/img/`, set `image`.
3. Slots: set the per-creative `slots` array (or omit for everywhere);
   flip per-slot `enabled` only with explicit confirmation (Phase B.5).
4. Rotation: write the array the user picked in Phase B question 6 —
   same length as before unless they explicitly asked to change the number
   of زمان‌ها. `advance` and `session_minutes` are NOT touched by an ad
   publish (they are the cadence of the whole system, not one campaign).

## Phase D — Verify, report, ship

1. `python3 -m json.tool spot/spot-config.json` (must pass).
2. Report in Persian: the final entry as written, where it will appear,
   the rel="sponsored" status, and any note/expiry recorded — plus the
   **new beat map**, written out زمان-by-زمان and then translated into
   visits:

   ```
   زمان ۱ = premium   زمان ۲ = premium   زمان ۳ = sponsor-x   زمان ۴ = sponsor-x
   → از هر ۴ بازدیدِ صفحه: ۲ بازدید پریمیوم، ۲ بازدید sponsor-x
   ```

   Always state the unit as **بازدیدِ صفحه** (not «سشن») while
   `advance: "view"` is set. If audience/slot targeting means a viewer
   class never actually reaches this ad's beat (e.g. the ad is
   `audience: ["plus"]` and the beat falls back for anon), say so — that is
   the exact silent surprise rule 9 exists to catch.
3. Commit + push. No builders, no version stamps, no brain — an ad publish
   touches `spot/spot-config.json` (and `spot/img/` if an image) only.
