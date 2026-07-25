# DentCast Ad-Publishing Router

Sibling to `README.md` (the «متن جدید دارم» publishing router) and
`en-version.md`. That router publishes **content**; this one publishes
**advertisements**. An ad is NOT content: it gets **no** page, **no**
`dentcast-brain.json` entry, **no** Pulse line, **no** pillar, **no** en
mirror. The entire ad system lives in **one file**: `ads/ads-config.json`.

**Trigger (registered in `CLAUDE.md`):** the user says they have an ad to
publish — **«تبلیغ دارم»**, «آگهی دارم», «اسپانسر گرفتیم», «یه تبلیغ جدید»,
or any equivalent. Also covers ad *management*: «تبلیغ X رو خاموش/روشن کن»,
«تبلیغات رو کلاً خاموش کن», «سهم اسپانسر رو بیشتر کن». Any of these enters
THIS workflow — never the publishing router, even if the user also pastes
متن (ad copy is creative text, not a متن to publish).

---

## Hard rules

1. **`ads/ads-config.json` is the only home of ads.** Never hardcode ad
   markup into any HTML page, template, or builder. The loader hook in
   `dc-nav.js` + `ads/ads.js` render everything from the config. (One
   legacy hardcoded ad predates this system — the دیونت box inside the
   homepage Pulse card; leave it alone unless the user explicitly asks to
   migrate it. The old «معرفی برند» card in `episodes.html` has been
   removed at the user's request — do not bring it back.)
2. **Sponsor vs. internal decides Google compliance — get it right, it is
   not cosmetic.** `ads/ads.js` emits `rel="sponsored noopener"` +
   `target="_blank"` for every entry in `creatives.sponsors`, and does NOT
   for the internal `creatives.premium` house ad. Therefore: **any paid
   placement, barter, or external business goes under `sponsors` — never
   under `premium`.** Putting a paid link where it renders without
   `rel="sponsored"` is a Google policy violation (link scheme). When in
   doubt whether something counts as sponsored, it does — or ask.
3. **Schema is sacred.** A new sponsor entry copies the exact field shape
   of the existing entries in `creatives.sponsors` (`id`, `enabled`,
   `badge`, `title`, `text`, `cta`, `url`, `image`, `weight`, optional
   `slots`). Free-text human notes may go in an extra `note` field (the
   engine ignores unknown fields) — nothing else new. Append new sponsors
   at the END of the array.
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
6. **Rotation is only touched when the user asks for a share.** Default
   for a new sponsor: leave `rotation.sequence` unchanged and tell the
   user what that means in practice. When they do want a share («هر ۴ بار
   اسپانسر یه بار پریمیوم»), write the literal cyclic array (e.g.
   `["sponsor","sponsor","sponsor","sponsor","premium"]`) and echo the
   resulting pattern back in the report.
7. **Config edits are live instantly; engine edits need a version bump.**
   `ads-config.json` is fetched `no-store` — publish is commit+push, done.
   Only if `ads/ads.js` or `ads/ads.css` themselves change, bump `ADS_V`
   in the ads loader at the end of `dc-nav.js`.
8. **Images are self-hosted.** An attached image goes to
   `ads/img/<id>.webp` (convert to webp when tooling allows; otherwise
   keep the original extension), referenced root-relative in `image`.
   Never hotlink an external image URL — if the user gives one, download
   it into `ads/img/`. Keep it small (this is a 44px-square thumb slot).
9. **Verify before commit.** `python3 -m json.tool ads/ads-config.json`
   must pass, and the report must state — per slot — what the visitor
   will actually see after this change. If anything about the outcome is
   surprising (e.g. sponsor added but sequence still `["premium"]` means
   it never shows), SAY SO — that is exactly the kind of silent surprise
   rule 6's echo exists to catch.

---

## Phase A — Read the current state

Read `ads/README.md` and `ads/ads-config.json`. Note: master switch, which
slots are enabled, the current `rotation.sequence`, existing sponsor ids
(for id uniqueness), and whether the premium house ad is on. If the
request is management-only (toggle/share change), apply it directly —
Phase B collapses to confirming the one thing being changed.

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
   اپیزودها / پلیر، یا همه‌جا (= omit the `slots` field). Offer the
   currently-enabled slots as the default. If they name a disabled slot,
   ask whether to enable it (that switch affects ALL ads in that slot —
   say so).
6. **سهم چرخش** — فعلاً طبق همین چرخش موجود، یا سهم مشخص؟ (rule 6; only
   relevant when a sponsor is being added or a share is requested).
7. **مدت/قرارداد** — start/end date if any → recorded in `note` (the
   engine has no scheduler; expiry is a manual `enabled: false` later —
   tell the user that plainly, and that they can just say «تبلیغ X رو
   خاموش کن» when the time comes).

## Phase C — Apply

1. Sponsor: append the new entry (rule 3 shape) at the end of
   `creatives.sponsors`, `enabled: true`. Internal ad: edit
   `creatives.premium` fields in place.
2. Image (if any): save to `ads/img/`, set `image`.
3. Slots: set the per-creative `slots` array (or omit for everywhere);
   flip per-slot `enabled` only with explicit confirmation (Phase B.5).
4. Rotation: only per rule 6.

## Phase D — Verify, report, ship

1. `python3 -m json.tool ads/ads-config.json` (must pass).
2. Report in Persian: the final entry as written, where it will appear,
   the effective rotation pattern (e.g. «از هر ۵ نمایش، ۴ تا این اسپانسر،
   ۱ پریمیوم»), the rel="sponsored" status, and any note/expiry recorded.
3. Commit + push. No builders, no version stamps, no brain — an ad publish
   touches `ads/ads-config.json` (and `ads/img/` if an image) only.
