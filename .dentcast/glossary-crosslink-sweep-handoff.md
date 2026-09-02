# Handoff — the one-time glossary cross-link sweep

> **SPENT — run to completion 1405/06/10.** All 68 candidates from that run
> got a settled disposition (37 AUTO + 1 resolved quoted false positive + 18
> founder-approved density anchors applied · 1 structural skip, tag-boundary
> span · 4 density holds on notecast/episode-5–8 by founder decision · 6 glued
> · 1 reported-speech quote). Commits:
> `5328ca354`, `21918d086`, `0cbc5647c`, `1e7e0f8c2`.
> The durable half — `cross-link.md` + step 4.7-ب — keeps running per-term on
> every future glossary publish. This file stays only as the record of that
> one run; do not treat it as a live to-do list.

---

**This is a job, not a rule.** The rules live in
`.dentcast/workflows/cross-link.md`; read that file end to end first. This file
is the brief for running its **unscoped backlog sweep** once, and it stops being
useful the moment that run is committed.

**Why a one-time sweep exists at all.** Publishing links forward only, so every
term ever published carries whatever inbound links it happened to accumulate
from articles written *after* it — and nothing else. Step **4.7-ب** of the
publishing workflow now closes that at the moment a new term is born (it runs
the same machine with `--slug <the new slug>`). This sweep is the other half:
the backlog those 107 terms accumulated before that step existed. **After this
run, 4.7-ب keeps it current one term at a time and this file is done.**

---

## State at handoff (regenerate before trusting it)

Measured 1405/06/10, after `glossary/dental-implant` was published and its own
17 AUTO anchors applied by 4.7-ب:

| | |
|---|---:|
| candidates | **68** on **59** pages |
| · AUTO — apply directly | **37** |
| · ASK — founder verdict | **31** |
| of which: density over the site p90 | 24 |
| of which: every occurrence glued to a suffix | 6 |
| of which: only quoted occurrences exist | 2 |

Nine of those AUTO rows are anchored on a **later** occurrence because the first
was glued — the generator resolves that itself; do not go looking for it.

Regenerate before you start; the numbers move whenever anything is published:

```bash
python3 tools/cross_link_candidates.py --json /tmp/cl.json > /tmp/cl.md
```

---

## Run it in five steps

**1. Read the report.** `/tmp/cl.md` groups by verdict and then by page, with the
signal that found each candidate and 80 characters of context either side.
Read the AUTO rows too — the generator is mechanical, and a mechanically valid
anchor can still be the wrong concept. Anything that reads wrong, move to ASK by
leaving it out of step 2 and raising it in step 3.

**2. Apply the AUTO rows, one term at a time.**

```bash
python3 tools/cross_link_apply.py /tmp/cl.json --slug <term> --dry-run
python3 tools/cross_link_apply.py /tmp/cl.json --slug <term>
```

`--slug` is not required, but a term-at-a-time pass keeps each diff about one
concept, so a bad judgement is one `git checkout` rather than an unpicking job.
Start with the largest: `dental-implant` (15), `abutment` (5), `post-and-core`
(5), `group-function` (4). The applier writes nothing for a file whose rendered
text would change, and exits non-zero if any row fails — read stderr, do not
paper over it.

**3. Take every ASK to the founder in ONE message**, grouped by class, each with
the page, the context line, and the numbers. Never decide these alone:

- **density** (24) — the page would pass 12 in-body links per 1000 words. Give
  the before/after count and word count. On a terminology digest a high number
  is the content; on ordinary prose it is clutter; the script cannot tell.
- **glued** (6) — *every* occurrence on the page is suffixed («ایمپلنتی»,
  «ایمپلنت‌محور»). There is nothing to wrap without cutting a word in half, so
  the honest options are skip-the-page or the founder rewriting a sentence
  himself. **You never rewrite it.**
- **quoted** (2) — the only occurrences sit inside «…». Say whether it reads as
  reported speech (skip) or as scare-quotes around the concept (wrap), and let
  him confirm.

Apply whatever he approves with `--approve <content_id>:<slug>`.

**4. Gate, then commit.** The gate is not optional and not visual:

```bash
for f in $(git diff --name-only -- '*.html'); do
  a=$(git show "HEAD:$f" | python3 -c "import sys,re;print(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',sys.stdin.read())).strip())" | sha256sum)
  b=$(python3 -c "import sys,re,io;print(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',io.open('$f',encoding='utf-8').read())).strip())" | sha256sum)
  [ "$a" = "$b" ] && echo "OK   $f" || echo "FAIL $f"
done
python3 tools/stamp-version.py                      # must say "unchanged"
python3 tools/cross_link_candidates.py | head -12   # applied rows must be gone
```

A `FAIL` row is reverted whole (`git checkout -- <file>`), never patched. One
commit per term is fine; one commit for the whole sweep is fine. No builder, no
brain write, no version bump — article pages are not in the content hash.

**5. Report** per `cross-link.md` Phase E, and say explicitly which ASK rows the
founder approved, which he declined, and which pages were skipped entirely.

---

## Things that will bite

- **Do not re-derive the matcher.** Scanning whole documents instead of the
  per-type body boxes produced 74 false positives on the first run — matches in
  `<title>`, in the hashtag chip row, inside JSON-LD. Both scripts already
  handle it; use them.
- **Do not "fix" a Persian word to make an anchor fit.** The text is the
  founder's (publishing Hard Rule 16). If it does not fit, it is an ASK.
- **Do not touch «کاوش بیشتر».** That section belongs to publishing steps
  2.5/4.7/4.9 and has its own 5-link cap. This pass writes only into prose.
- **`episodes/` is out of scope** and so are LiteCast, `/en/` mirrors and the
  glossary's own pages — the generator already excludes them; do not add them
  back because a page looks like it deserves a link.
- **A term with zero candidates is a normal outcome**, not a failure to
  investigate: every tagged page already links it, or none of them says the word
  in prose. 107 skipped rows were exactly that on the first run.

## When this file is done

Once the sweep is committed, delete this handoff or mark it spent. The durable
half — `cross-link.md`, both scripts, and step 4.7-ب — stays.
