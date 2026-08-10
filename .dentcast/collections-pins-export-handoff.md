# Handoff — Collections: پین «متن خودم»، پین «رفرنس»، خروجی Word/اسلاید

> **Who this is for.** An implementing agent. Every architectural decision in
> this document is ALREADY MADE and grounded in the current codebase — do not
> re-litigate them; implement them. Where this document says "ask the founder",
> ask; everywhere else, do not invent alternatives. Follow
> `.dentcast/workflows/agent-parity.md` for behavior (conversation language,
> git protocol, gates) as always.
>
> **What this is.** Premium collections (boards) grow two new pin kinds and an
> export: (1) a **text pin** («متن خودم») — any text the user writes/pastes;
> (2) a **reference pin** («رفرنس») — a cited paper, auto-filled from a DOI via
> Crossref *in the user's browser* or entered manually; (3) **board export** —
> a Word handout (docx) and, behind a verification gate, a slide skeleton
> (pptx), in the board's manual arrangement order. No file uploads, no object
> storage, no PDF hosting — that was evaluated and deliberately cut.
>
> **Approved interactive mockup** (the UI contract — copy its Persian strings
> verbatim, Hard Rule 16 applies to them):
> https://claude.ai/code/artifact/fd94c46c-aa7f-4450-b7a8-0fab497e861c

---

## 0. Decisions already made (the "why" ledger — do not reopen)

| Decision | Why |
|---|---|
| No PDF/file upload, no object storage | API container disk is ephemeral (ArvanCloud); copyright exposure on publisher PDFs; competes with free Drive at a loss. Text + references + export deliver the presentation-prep value at ~10% of the cost. |
| New table is named `snippets`, NOT `notes` | `article_notes` already exists (migration 0003, the workbench یادداشت). A second table with "notes" in its name is a collision waiting to happen. |
| One table for both kinds (`kind in ('text','reference')`) | Same ownership, same pin mechanics, same lifecycle; two tables would duplicate every query and route. |
| Snippet body lives in its own table, pins reference it | A snippet can be pinned to several boards (same philosophy as highlights and pathway items: one item, many homes). Text stored on the pin row would make «انتقال» a copy+delete and break the idempotent-add pattern. |
| DOI metadata is fetched in the **browser**, never by the API | Crossref/PubMed are international hosts; the container's international egress is unreliable (2026-07-26 outage, `outbound.ts` history). `api.crossref.org` is CORS-open, the user's browser fetches it directly and POSTs the result. The API only stores. This is the user's own private data — client-supplied metadata is not an integrity concern. |
| Manual entry is a first-class path, not a fallback | Persian journals (SID/Magiran) mostly have no DOI. «DOI پیدا نشد» must never be a dead end. |
| Export is generated **server-side, in memory, streamed** | docx/pptx are just zipped XML — tiny CPU; no temp files may touch the ephemeral disk. The board's ≤2000-item cap bounds size. Client-side generation would need vendoring a heavy lib into the no-build static site. |
| docx ships first; pptx is gated on a manual RTL check | The `docx` package supports RTL properly (`bidirectional`); pptxgenjs RTL support is weaker, especially mixed fa/en bullets. See §6. |
| Export order = board manual arrangement | `position asc nulls last, created_at desc` — the existing چیدمانِ دستی feature becomes the slide/handout order. This synergy is a selling point; surface it in UI copy (mockup's «ترتیب خروجی = چیدمانِ دستی برد»). |
| No new XP action kinds | `PREMIUM_XP_ACTIONS` / `league-config.ts` FIELDS are a closed list. Pinning a snippet fires the existing `collection_item_added` (already premium-XP'd, weekly-capped). Creating a snippet fires no separate action. |
| «گنجینه» badge needs no change | It counts `collections` + `collection_items` (`services/achievements.ts` ~line 122); snippet pins are `collection_items` rows, so they count automatically. |
| Snippets ride the premium gate like all of collections | All routes under `requirePremium` (same preHandler pattern as `collections.ts`). Data ownership is honored by adding snippets to the any-plan `GET /export/highlights` dump (§4.5). |

**Out of scope (do not build):** file/PDF upload; sharing boards or snippets
with other users; a standalone "my snippets" library page; PubMed-URL parsing
(DOI string or doi.org URL only in v1); citation styles other than a simple
Vancouver-ish numbered list; en mirrors (Plus pages have none); brain entries,
Pulse lines (this is a product feature, not content — the publishing router is
not involved).

---

## 1. Database — migration `0035_snippets.cjs`

Follow the house style of `0018_collection_identity_order.cjs` (doc comment
explaining intent, `pgm.sql`, symmetric `down`).

```sql
-- up
create table snippets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       text not null check (kind in ('text','reference')),
  -- kind='text':      title optional, body required (the text itself)
  -- kind='reference': title required (article title), body optional (the
  --                   user's own annotation, rendered like a highlight note)
  title      text,
  body       text,
  -- reference-only columns (null for kind='text'):
  authors    text,
  venue      text,          -- journal + anything the user wrote, freeform
  year       integer,
  doi        text,          -- bare DOI, no URL prefix, e.g. 10.1016/j.dental.2017.11.005
  url        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index snippets_user_idx on snippets (user_id, created_at desc);

alter table collection_items add column snippet_id uuid references snippets(id) on delete cascade;
-- Third partial unique index, symmetric with migration 0012's two: pinning the
-- same snippet to the same board twice is a DB-level no-op.
create unique index collection_items_snippet_uniq
  on collection_items (collection_id, snippet_id) where snippet_id is not null;
-- A pin is exactly one shape: highlight XOR snippet XOR bare page.
alter table collection_items add constraint collection_items_one_kind
  check (not (highlight_id is not null and snippet_id is not null));
```

`down` drops in reverse order. Note `collection_items.content_id` is already
nullable (0001) — snippet pins leave it NULL.

**Orphan rule (implement in the route, §4.4):** deleting the LAST pin of a
snippet deletes the snippet row in the same transaction. There is no snippets
library page, so an unpinned snippet would be invisible-but-alive forever.
(Deleting a snippet directly via `DELETE /snippets/:id` cascades its pins —
that's the `on delete cascade` above.)

---

## 2. API — server routes

New file `plus-api/src/routes/snippets.ts` + edits to
`plus-api/src/routes/collections.ts`. Register in `server.ts` next to
`collectionRoutes`. Both files get the same two preHandlers
(`requireAuth`, `requirePremium`).

### 2.1 Validation limits (Fastify schema, like existing routes)

| field | rule |
|---|---|
| `kind` | `'text'` \| `'reference'` |
| `title` | ≤ 200 chars; required iff `kind='reference'`; for `kind='text'` optional |
| `body` | ≤ 10 000 chars; required iff `kind='text'` |
| `authors` | ≤ 300 |
| `venue` | ≤ 200 |
| `year` | integer 1000–2200 (accepts both calendars; no conversion) |
| `doi` | ≤ 120, must match `/^10\.\S+$/` after stripping an optional `https://doi.org/` prefix (strip server-side, store bare) |
| `url` | ≤ 300, must start `http://` or `https://` |

All well under the default Fastify bodyLimit — do not touch server config.

### 2.2 `POST /collections/:id/snippets` — create + pin, atomically

Body: `{ kind, title?, body?, authors?, venue?, year?, doi?, url? }`.
In one `withTransaction`: verify board ownership (404 otherwise), insert
`snippets` row, insert `collection_items (collection_id, snippet_id)` pin.
Then `recordActivity(userId, 'collection_item_added', null, { collection_id,
snippet_id, kind })` and `scheduleAchievementSync(userId)` — mirroring the
existing item-add path. Return `201 { item }` in resolved-item shape (§2.6).

### 2.3 `POST /collections/:id/items` — extend for re-pinning

Accept `{ snippet_id }` as a third alternative alongside `{ highlight_id }` /
`{ content_id }`. Verify the snippet belongs to the user (404
`snippet_not_found`), insert idempotently against
`collection_items_snippet_uniq` (same ON CONFLICT DO UPDATE trick already used
so RETURNING yields a row on replay). This is what «انتقال» and the picker use.

### 2.4 `PATCH /snippets/:id` and `DELETE /snippets/:id`

PATCH: any subset of the §2.1 fields, same optional-and-independently-clearable
pattern as `PATCH /collections/:id`; empty body → 400 `nothing_to_update`; set
`updated_at = now()`; kind is immutable (400 `kind_immutable` if sent).
DELETE: delete own row (pins cascade), 404 if not owner.

Pin removal: the existing `DELETE /collections/:id/items/:itemId` gains the
orphan rule — inside a transaction, after deleting a pin that carried a
`snippet_id`, if no other `collection_items` row references that snippet,
delete the snippet.

### 2.5 Reads

`GET /collections/:id` (and the order-write's re-select): extend the item
query with `left join snippets s on s.id = ci.snippet_id` and select
`ci.snippet_id, s.kind as snippet_kind, s.title as snippet_title, s.body as
snippet_body, s.authors, s.venue, s.year, s.doi, s.url`.

`GET /collections` board-cover preview: include snippet pins in the 3-item
`preview` with `kind` `'text'`/`'reference'` (no bodies, same as today).

`GET /export/highlights` (`routes/dashboard.ts`): add a `snippets` array (all
columns, `order by created_at asc`) to the dump. This endpoint stays any-plan —
it is the data-ownership guarantee for a lapsed premium user.

### 2.6 Resolved item shape (`resolveItem`)

`kind` becomes `'highlight' | 'page' | 'text' | 'reference'` (from
`highlight_id` → highlight; else `snippet_id` → the snippet's kind; else page).
For snippet items: `title` = snippet title, `url` = null (no content page),
plus `body, authors, venue, year, doi, url` fields for references. Existing
highlight/page shapes are unchanged — the client tests
(`collections.dom.test.ts`) guard that.

---

## 3. Client — board UI

Files: `plus/js/collection-page.js` (board page), `plus/js/collections.js`
(picker/move), `plus/js/hl-view.js` (shared card vocabulary — new builders go
HERE, per the standing rule), `plus/js/sheet.js` (reuse `openSheet`; do not
write a new sheet), `plus/plus-pages.css` (styles). No new HTML page, so no
GA/preconnect work.

Copy strings and layout from the mockup exactly. Key pieces:

1. **«افزودن پین» button** on the board header opens a chooser sheet with
   three options: «متن خودم» (new), «رفرنس» (new), «هایلایت» (disabled row
   explaining it's added from inside an article — the current flow).
2. **Text composer sheet**: optional title (placeholder «مثلاً: نکته‌ی بحث
   پایانی»), textarea (placeholder «بنویسید یا پیست کنید…»), live Persian-digit
   counter «۰ / ۱۰٬۰۰۰ حرف», actions «انصراف» / «پین کن». POSTs §2.2, prepends
   the returned card, toast «پین شد ✓».
3. **Reference sheet**: DOI input (LTR) + «دریافت مشخصات» button →
   `fetch('https://api.crossref.org/works/' + encodeURIComponent(doi))`
   directly from the browser (no API involvement). Map `message.title[0]`,
   `message.author` (first author + `et al.`), `message['container-title'][0]`,
   `message.issued['date-parts'][0][0]`, `message.DOI`. Show a preview card
   («✓ پیدا شد»), enable «افزودن به برد». On any fetch/parse failure show a
   calm inline message and auto-open the manual fields. A visible link «مقاله
   DOI ندارد؟ مشخصات را خودم می‌نویسم» toggles manual fields (عنوان مقاله /
   نویسندگان / مجله ـ سال) at any time. Toast «رفرنس پین شد ✓».
4. **Cards** (add builders to `hl-view.js`, build with DOM APIs /
   `textContent` — never innerHTML with user text):
   - text pin: gold accent border-inline-start, kind chip «✍️ متن خودم»,
     optional bold title, body, actions ویرایش (reuse `inlineEditor` pattern →
     `PATCH /snippets/:id`) / کپی / انتقال / حذف.
   - reference pin: purple accent, kind chip «🔗 رفرنس», title (add `dir=ltr`
     + left alignment when the title is Latin — test char range), authors/venue
     line, DOI chip linking `https://doi.org/<doi>` (rel noopener, target
     _blank), annotation rendered via `noteBlock`, actions کپی استناد (builds a
     Vancouver-ish one-liner, uses `copyToClipboard`) / انتقال / حذف.
5. **Filter chips** on the board page gain «متن من» and «رفرنس» (existing
   filter mechanism, kind strings `text`/`reference`).
6. **«انتقال» / picker**: `openCollectionPicker` and `openCollectionMove`
   accept `{ snippetId }` and post `{ snippet_id }` (§2.3). Move keeps the
   existing pattern: add to target, then remove here — idempotency makes the
   half-finished state safe, and the orphan rule doesn't fire because the
   target pin exists first. Keep that ORDER (add before remove) — it is what
   makes the orphan rule safe here.
7. **Colors**: reuse the mockup's tokens — gold = the existing `--dcp-gold`
   pair in `plus.css`; add a `--dcp-ref` purple pair (light `#6d28d9` /
   dark `#b79df5`) beside it, both themes.
8. Bump: `python3 tools/asset_version.py --bump` in the same commit as any
   shared-asset change.

---

## 4. Export — `GET /collections/:id/export?format=docx` (then pptx)

### 4.1 Server

New file `plus-api/src/routes/collection-export.ts` (registered with the same
auth+premium preHandlers) or a handler inside `collections.ts` — implementer's
choice, keep it one place. Steps: load board + items in display order (the
exact query from `GET /collections/:id`), build the document in memory, send
with:

- `content-type`: docx `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, pptx `…presentationml.presentation`
- `content-disposition`: `attachment; filename="dentcast-board-<id8>.docx"; filename*=UTF-8''<rfc5987-encoded board title>.docx` (ASCII fallback + real Persian name; `<id8>` = first 8 chars of the board id)

Dependencies: add `docx` (and later `pptxgenjs`) to `plus-api/package.json`.
Both are pure-JS, Node ≥20 compatible, no native deps — Dockerfile untouched.

### 4.2 docx composition (the Word handout)

Board order throughout. Structure:

1. **Title block**: board title (Heading 1), description, item count + date
   line (Persian digits fine as literal text).
2. **Per item, in order**:
   - highlight → the `exact` text as an indented, shaded quote paragraph; its
     note (if any) as a following paragraph prefixed «یادداشت: »; a small
     source line «از: <content title>» (resolve via `getContentInfo`).
   - text snippet → title (Heading 2, if present) + body paragraphs (split on
     newlines).
   - page pin → one line: title + absolute URL (`https://dentcast.ir` + url)
     as a hyperlink.
   - reference → NOT rendered in-flow; collected.
3. **«منابع» section** at the end: numbered list of reference pins in board
   order — `Authors. Title. Venue; Year. doi:<doi>` (skip missing fields
   gracefully); a reference's annotation (body) as an indented line under it.

RTL rules (this is the part that must not be improvised): every Persian
paragraph gets `bidirectional: true` and right alignment; Latin-only runs
(citation titles, DOIs) are plain LTR runs. Set the document default font to
`Vazirmatn` with a standard fallback — do NOT embed fonts; Word substitutes
cleanly when Vazirmatn is absent.

### 4.3 pptx (gated — build only after docx ships and passes)

One slide per non-reference pin (title = label/title/source, body = text),
first slide = board title + description, last slide = «منابع» list.
`rtlMode: true`, right-aligned text frames.

**Acceptance gate before exposing the pptx option in the UI:** generate a deck
from a board containing mixed fa/en pins, open it in real PowerPoint (or
LibreOffice at minimum), and verify Persian word order, bullet direction and
mixed-direction lines. If it fails and can't be fixed in pptxgenjs options,
FALL BACK (decision already made): drop the pptx option and instead add
`?format=outline` — a second docx built only of Heading 1/Heading 2 paragraphs
(title slide → H1, each pin → H1 + body H2s), which PowerPoint's
"Import Outline" turns into slides. UI copy then says «اسکلت اسلاید (فایل
Word سازگار با Import در پاورپوینت)». Ask the founder before shipping the
fallback, with a screenshot of the broken pptx.

### 4.4 Client

«خروجی» button on the board header opens the export sheet from the mockup
(two option cards + the «ترتیب خروجی = چیدمانِ دستی برد» note). Selecting one
navigates to the endpoint (a plain `location.href` / hidden anchor click is
fine — the session cookie rides along; no fetch+blob needed). Show the
progress state optimistically; there is no download-complete event to hook —
the mockup's "done" card is mockup-only, replace with a toast «در حال آماده
شدن…» and let the browser's own download UI take over.

---

## 5. Tests (vitest, existing patterns in `plus-api/test/`)

Extend `collections.test.ts`:
- create text snippet → 201, item kind `text`, appears in `GET /collections/:id`;
- create reference with `https://doi.org/10.x/y` input → stored bare `10.x/y`;
- reference without title → 400; text without body → 400; bad year/doi/url → 400;
- re-pin same snippet to same board → idempotent (one row); to a second board → two pins, one snippet;
- delete last pin → snippet row gone; delete one of two pins → snippet survives;
- `DELETE /snippets/:id` → both boards' pins gone;
- PATCH edits body/title; PATCH kind → 400; PATCH someone else's snippet → 404;
- free user → 403 on every new route (requirePremium);
- `GET /export/highlights` contains `snippets` for any plan;
- export endpoint: 200, correct content-type, non-empty buffer that starts with
  `PK` (zip magic), 404 on someone else's board, order follows `position`.

Extend `collections.dom.test.ts`: chooser sheet renders 3 options; composer
posts and prepends a card; ref form falls back to manual fields on fetch
failure (mock fetch); filter chips include the two new kinds; reference card
renders DOI link href `https://doi.org/…`; XSS probe — a snippet body
containing `<img onerror>` renders as text.

Run the whole suite (`npm test` in `plus-api/`), not just the new files.

---

## 6. Repo protocol — the gates that make this a DentCast change

1. Work on branch `claude/premium-cloud-storage-collections-537wvo`; commit in
   logical phases (§7); push with `git push -u origin <branch>`.
2. Any shared-asset edit (`plus/js/*`, `plus/plus-pages.css`) →
   `python3 tools/asset_version.py --bump` in the same commit. CI runs `--check`.
3. Documentation sweep, same commit as the feature it describes (CLAUDE.md
   maintenance rule): update the **Collections** bullet in `CLAUDE.md`, mirror
   in `AGENTS.md`, and touch `.cursor/rules/dentcast-router.mdc` if a trigger
   changes (it shouldn't — this adds no workflow trigger). Update
   `plus-api/README.md`'s API-surface list with the new routes.
4. No new HTML pages → no `inject_ga.py` / `inject_preconnect.py` /
   `verify_publish.py` involvement. Do not add anything to
   `dentcast-brain.json` — this is not content.
5. API deploy note for the founder (put it in the final report): this feature
   needs a **container image rebuild** (new npm deps + migration 0035) — it is
   a code change, not a content refresh.

---

## 7. Build order (each phase = one commit, green tests before the next)

| phase | scope | acceptance |
|---|---|---|
| **A** | migration 0035 + snippets/collections routes + export-dump addition + server tests | `npm test` green; manual curl round-trip in dev |
| **B** | client: chooser + text composer + text card + move/picker + filters + CSS + bump | dom tests green; board renders mixed pins |
| **C** | client: reference sheet (Crossref fetch + manual path) + reference card | dom tests green incl. fetch-failure fallback |
| **D** | export docx (server + client button) | file opens in Word, RTL correct, order = board order |
| **E** | pptx behind the §4.3 gate (or the outline fallback, founder-approved) | real-PowerPoint check |

Phases A–D need no founder input if this document is followed. Phase E has an
explicit ask-the-founder step. Anywhere else this document under-specifies:
«اگر جایی شک داشتی سوال کن، عمل نکن».
