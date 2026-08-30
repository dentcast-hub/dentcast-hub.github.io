#!/usr/bin/env bash
#
# DentCast — ONE command that ships everywhere: git push (→ GitHub → .org via
# GitHub Pages) AND a direct sync to ArvanCloud Object Storage (→ .ir), with
# no GitHub Actions run required for the .ir half.
#
# Same bucket, same sync flags, same cache-control stamping as
# .github/workflows/deploy-arvan.yml. .org's dependency on GitHub is inherent
# (GitHub Pages IS GitHub) — this script pushes to it, it just doesn't sit
# around waiting for Actions to notice.
#
#   ./deploy-frontend.sh                # commit, push to origin/main, sync to Arvan
#   ./deploy-frontend.sh --dry-run      # print what would change, push/upload nothing
#   ./deploy-frontend.sh --force        # also deploy with uncommitted changes present
#   ./deploy-frontend.sh --skip-push    # sync to Arvan only, don't touch GitHub
#
# One-time setup: copy the Object Storage access key + secret key from the
# ArvanCloud panel (Object Storage → the `dentcast` bucket → Access Keys) into
# a gitignored config file at the repo root:
#
#   cat > .deploy-frontend.env <<'EOF'
#   ARVAN_ACCESS_KEY=...
#   ARVAN_SECRET_KEY=...
#   ARVAN_BUCKET=dentcast
#   ARVAN_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
#   EOF
#
# Needs the AWS CLI (same tool the GitHub workflow uses):
#   pip install awscli

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  printf '\033[31m✗ run this from inside the dentcast repo.\033[0m\n' >&2
  exit 1
}
cd "$ROOT"

BRANCH=main

die() { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
say() { printf '\033[36m→\033[0m %s\n' "$*"; }
ok()  { printf '\033[32m✓\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------
DRY_RUN=0
FORCE=0
SKIP_PUSH=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)   DRY_RUN=1; shift ;;
    --force)     FORCE=1; shift ;;
    --skip-push) SKIP_PUSH=1; shift ;;
    -h|--help) sed -n "3,$(( $(grep -n '^set -euo' "$0" | cut -d: -f1) - 2 ))p" "$0" \
                 | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)         die "unknown option: $1" ;;
  esac
done

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
[ -f .deploy-frontend.env ] || die \
  ".deploy-frontend.env not found. See the header of this script for the format."
# shellcheck disable=SC1091
. .deploy-frontend.env
for v in ARVAN_ACCESS_KEY ARVAN_SECRET_KEY ARVAN_BUCKET ARVAN_ENDPOINT; do
  [ -n "${!v:-}" ] || die "$v is not set in .deploy-frontend.env"
done

command -v aws >/dev/null 2>&1 || die \
  "AWS CLI is not installed. Run: pip install awscli"

# ---------------------------------------------------------------------------
# Preflight — what gets deployed must be traceable to a commit. Skippable
# with --force for a deliberate test (e.g. --dry-run while mid-edit), never
# by default.
# ---------------------------------------------------------------------------
say "checking the working copy"

if [ "$FORCE" != 1 ]; then
  [ -z "$(git status --porcelain)" ] || die \
    "uncommitted changes. Commit/stash them, or pass --force to deploy the working tree anyway:

$(git status --short)"

  CURRENT="$(git rev-parse --abbrev-ref HEAD)"
  [ "$CURRENT" = "$BRANCH" ] || die "on branch '$CURRENT', not '$BRANCH'. Run: git checkout $BRANCH (or pass --force)"

  ok "clean $BRANCH"
else
  say "--force: skipping the clean-working-copy check — deploying $(git rev-parse --short HEAD) as-is"
fi

# ---------------------------------------------------------------------------
# Push to GitHub. This is the "one file" half that reaches .org (GitHub
# Pages) and keeps origin/main as the record of what's live. Only a plain
# fast-forward push — never force-push, never rewrite. If origin has commits
# this branch doesn't (someone else pushed, a PR merged there), stop and ask
# for a pull rather than guessing which side should win.
# ---------------------------------------------------------------------------
if [ "$SKIP_PUSH" != 1 ]; then
  say "checking origin/$BRANCH"
  git fetch --quiet origin "$BRANCH"
  LOCAL="$(git rev-parse "$BRANCH")"
  REMOTE="$(git rev-parse "origin/$BRANCH")"

  if [ "$LOCAL" = "$REMOTE" ]; then
    ok "origin/$BRANCH already up to date"
  elif [ "$(git merge-base "$BRANCH" "origin/$BRANCH")" = "$REMOTE" ]; then
    if [ "$DRY_RUN" = 1 ]; then
      say "dry run: would push $(git rev-list --count "origin/$BRANCH..$BRANCH") commit(s) to origin/$BRANCH"
    else
      say "pushing $(git rev-list --count "origin/$BRANCH..$BRANCH") commit(s) to origin/$BRANCH"
      git push origin "$BRANCH"
      ok "pushed — .org (GitHub Pages) will update from this"
    fi
  else
    die "origin/$BRANCH has commits this branch doesn't (diverged, or you're behind) — pull first:

  git pull origin $BRANCH"
  fi
else
  say "--skip-push: not touching GitHub, deploying local $BRANCH as-is"
fi

say "deploying $(git rev-parse --short HEAD)"

# ---------------------------------------------------------------------------
# Build a clean tree from HEAD. NEVER sync the working directory directly —
# it has node_modules, .env files (real DATABASE_URL, API secrets), tmp/
# scratch, and this very credentials file lying around, none of which the
# GitHub Actions checkout ever had. `git archive` gives us exactly what CI
# would have synced: tracked files at this commit, nothing else.
# ---------------------------------------------------------------------------
TMPDIR="$(mktemp -d)"
cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

say "exporting tracked files at $(git rev-parse --short HEAD) to a clean tree"
git archive HEAD | (cd "$TMPDIR" && tar -x)
ok "clean tree ready"

SYNC_ARGS=(
  "$TMPDIR/" "s3://$ARVAN_BUCKET"
  --endpoint-url "$ARVAN_ENDPOINT"
  --delete
  --exclude ".git/*"
  --exclude ".github/*"
)
[ "$DRY_RUN" = 1 ] && SYNC_ARGS+=(--dryrun)

export AWS_ACCESS_KEY_ID="$ARVAN_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$ARVAN_SECRET_KEY"
export AWS_EC2_METADATA_DISABLED=true

say "syncing to s3://$ARVAN_BUCKET $( [ "$DRY_RUN" = 1 ] && echo '(dry run)' )"
aws s3 sync "${SYNC_ARGS[@]}"
ok "sync done"

if [ "$DRY_RUN" = 1 ]; then
  say "dry run — no cache-control stamping performed, nothing was uploaded"
  exit 0
fi

# ---------------------------------------------------------------------------
# Cache-control stamping — identical to deploy-arvan.yml's job. Arvan ignores
# _headers (that's Cloudflare-only), so these three files + the whole plus/
# tree are force-revalidated here or a returning .ir visitor can keep an old
# dc-nav.js / spot.js / spot-config.json / plus module indefinitely.
# ---------------------------------------------------------------------------
stamp() {
  aws s3 cp "s3://$ARVAN_BUCKET/$1" "s3://$ARVAN_BUCKET/$1" \
    --endpoint-url "$ARVAN_ENDPOINT" \
    --cache-control "no-cache" \
    --content-type "$2" \
    --metadata-directive REPLACE
}
stamp_tree() {
  aws s3 cp "s3://$ARVAN_BUCKET/plus/" "s3://$ARVAN_BUCKET/plus/" \
    --endpoint-url "$ARVAN_ENDPOINT" \
    --recursive --exclude "*" --include "$1" \
    --cache-control "no-cache" \
    --content-type "$2" \
    --metadata-directive REPLACE
}

say "forcing revalidation on the cache-sensitive files"
stamp "dc-nav.js"             "application/javascript; charset=utf-8"
stamp "spot/spot.js"          "application/javascript; charset=utf-8"
stamp "spot/spot-config.json" "application/json; charset=utf-8"
stamp_tree "*.js"          "application/javascript; charset=utf-8"
stamp_tree "*.css"         "text/css; charset=utf-8"
stamp_tree "*.html"        "text/html; charset=utf-8"
stamp_tree "*.json"        "application/json; charset=utf-8"
stamp_tree "*.webmanifest" "application/manifest+json; charset=utf-8"
ok "revalidation stamps applied"

say "fixing Content-Type for vCard files"
aws s3 cp "$TMPDIR/card/dr-foad-shahabian.vcf" \
  "s3://$ARVAN_BUCKET/card/dr-foad-shahabian.vcf" \
  --endpoint-url "$ARVAN_ENDPOINT" \
  --content-type "text/vcard; charset=utf-8" \
  --metadata-directive REPLACE
ok "vCard content-type fixed"

printf '\n\033[32m✓ deployed %s to s3://%s (.ir) — no GitHub Actions run involved.\033[0m\n' \
  "$(git rev-parse --short HEAD)" "$ARVAN_BUCKET"
