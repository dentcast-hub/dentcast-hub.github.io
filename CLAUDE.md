# DentCast Repo — Publishing Protocol

This repo powers DentCast. When the user brings new content to publish:

1. Read `.dentcast/workflows/README.md` and follow it strictly.
2. `dentcast-brain.json` is the source of truth for every content type's structure, schema, and category. Always use the most recent entry of the SAME category as the template for any new entry.
3. Never mix categories. NoteCast stays in NoteCast. Insight stays in Insight. Each category's entries go to their own section/array in the brain and their own directory on disk.
4. The "latest content" widget on the homepage reads the LAST entries from `dentcast-brain.json`. Therefore, every new entry MUST be appended at the END of its category in the brain — never inserted mid-list.
5. Auto-discover whatever you can. Ask the user only for things you genuinely cannot determine.
6. Brain entry schema is sacred. Never add new fields to a brain entry that don't exist on previous same-category entries. Match the existing shape exactly.

## English-version protocol (trigger)

There is a **second** workflow alongside the publishing router. When the user
asks to produce the **English (en) version of an existing page** — trigger
phrase **«… رو انگلیسی کن»** (e.g. «پرامپتولوژیست ۱ رو انگلیسی کن»,
«نسخه‌ی انگلیسیِ متانوت ۳») — do **not** use the «متن جدید دارم» publishing
router. Instead read `.dentcast/workflows/en-version.md` and follow it
strictly. That workflow mirrors one existing page into
`/{type}/en/{same-filename}.html`: English chrome cloned from
`metanotes/en/meta-1.html`, body/schema inherited and translated from the
source's own type, a real per-document fa↔en toggle on both sides, and
disk-discovered hreflang pairing. en pages are standalone translations — they
get **no** `dentcast-brain.json` entry, **no** Pulse line, and **no**
specialist cross-linking.

## Repo conventions

- `dentcast-brain.json` — central data file, has separate sections/arrays per content type.
- `tools/` — Python scripts including the main index builder.
- `index.html` — homepage with Pulse section + latest-content widget.
- Each content type has its own directory at the repo root (e.g., `/notecast/`, `/insight/`, `/litecast/`, etc.). Confirm exact paths from the URLs stored in brain entries.
- `.dentcast/workflows/` — publishing workflows.

## Site-wide invariants

- **Google Analytics 4 (deferred) on every page.** Every HTML page MUST carry the deferred GA4 snippet (measurement ID `G-GMM0WC8X3M`) inside `<head>`. It is lazy-loaded — `gtag.js` is appended only after the `load` event so it never blocks first paint. Do NOT use Google's default async snippet; use the deferred pattern below. Because new pages are cloned from the most recent same-category page, the tag propagates automatically — but always confirm it survived the clone.
  - The canonical injector is `.github/scripts/inject_ga.py` (idempotent; skips pages that already have it, and pages without a `<head>`). To backfill/verify the whole site: `python3 .github/scripts/inject_ga.py` (or `--check` to fail if any page is missing it).
  - The build templates emit it too: `GA_DEFERRED_SNIPPET` in `tools/build_episodes.py` and `tools/build_pillar.py` (and the glossary head literal). Keep all of these in sync if the snippet ever changes.
  - The `.org` and `.ir` codebases are mirrors; the same tag intentionally deploys to both. Do NOT add per-domain logic.
  - The exact deferred snippet (place inside `<head>`):
    ```html
    <!-- Google Analytics (deferred: loads only after the page is fully rendered) -->
    <script>
      window.addEventListener('load', function () {
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', 'G-GMM0WC8X3M');
        var ga = document.createElement('script');
        ga.async = true;
        ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-GMM0WC8X3M';
        document.head.appendChild(ga);
      });
    </script>
    ```
  - If a Content-Security-Policy is ever added, it must allow `script-src https://www.googletagmanager.com` and `connect-src https://*.google-analytics.com https://*.analytics.google.com`. (No CSP currently exists in this repo.)
