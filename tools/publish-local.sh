#!/usr/bin/env bash
# publish-local.sh — run, on this machine, what .github/workflows/sitemap_only.yml
# runs on GitHub after every merge to main: the sitemaps, the Plus content index
# and the site content stamp.
#
# Why this exists: during a cut of Iran's international link that workflow can
# neither run for a laptop in Iran nor reach it, so a page published offline
# would go up to dentcast.ir (tools/deploy-ir.sh) with a stale sitemap, a stale
# Plus index (the dashboard tree and «last read» card silently drop the new
# page) and a stale service-worker stamp. The three commands below are copied
# from the workflow, in its order; when the workflow changes, change this file
# in the same commit.
#
# It does NOT commit. It prints what changed and the exact git commands, so the
# commit stays a decision you make after looking.
#
# Usage:  tools/publish-local.sh
# Then:   tools/deploy-ir.sh --dry-run && tools/deploy-ir.sh
# Manual: .dentcast/offline-publish.md
set -euo pipefail

die() { echo "publish-local: $*" >&2; exit 1; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || die "run this inside the dentcast-hub clone"
cd "$ROOT"

command -v python3 >/dev/null 2>&1 || die "python3 is required"
command -v node    >/dev/null 2>&1 || die "node is required (22, the version the repo's tests use)"

# gen_sitemap.py dates every <lastmod> from git history; on a shallow clone it
# has none and every page would get the same date. The workflow checks out with
# fetch-depth: 0 for exactly this reason.
if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
  die "this clone is shallow — the sitemap needs full history.
  Fix it BEFORE a cut, while GitHub is reachable:  git fetch --unshallow"
fi

echo "publish-local: [1/3] sitemaps"
python3 .github/scripts/gen_sitemap.py

echo "publish-local: [2/3] Plus content index"
node tools/build_plus_index.mjs

echo "publish-local: [3/3] site content stamp"
python3 tools/stamp-version.py

echo
CHANGED="$(git status --porcelain -- sitemap.xml sitemap-ir.xml plus/content-index.json service-worker.js '*.html')"
if [ -z "$CHANGED" ]; then
  echo "publish-local: nothing changed — the indexes were already current."
  exit 0
fi
echo "publish-local: changed files:"
echo "$CHANGED"
cat <<'EOF'

To commit them exactly as the workflow does:

  git add sitemap.xml sitemap-ir.xml plus/content-index.json service-worker.js
  git add -u -- '*.html'
  git commit -m "chore: auto-generate sitemap + plus index + version stamp"

(Leave out the workflow's «[skip ci]»: when this commit reaches GitHub after
the cut, letting CI run again is harmless — it regenerates the same files.)
EOF
