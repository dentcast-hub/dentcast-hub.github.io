#!/usr/bin/env bash
#
# DentCast Plus API — build the container image and push it to the registry.
#
# Everything up to the registry, in one command. The last step stays manual and
# always will: the image tag is changed in the ArvanCloud panel by a human, so
# nothing here can deploy to production by accident.
#
#   ./plus-api/deploy.sh              # next tag, read from the live /health
#   ./plus-api/deploy.sh --tag v52    # a tag you choose
#   ./plus-api/deploy.sh --dry-run    # print the build command, run nothing
#   ./plus-api/deploy.sh --verify v52 # poll /health until that tag is serving
#
# One-time setup: point it at your registry repository, from the ArvanCloud
# panel's Container Registry page.
#
#   echo 'DENTCAST_REGISTRY=registry.arvancloud.ir/<namespace>/dentcast-plus-api' \
#     > plus-api/.deploy.env
#   docker login registry.arvancloud.ir
#
# See DEPLOY.md for the container's environment variables, the database, and
# everything else that is not the image itself.

set -euo pipefail

# The build context MUST be the repo root, never plus-api/: the image bakes in
# plus/content-index.json, plus/pathways.json, plus/badges.json and
# plus/flashcards-index.json, which live outside this directory. Deriving the
# root from git rather than from $PWD is what makes the script safe to run from
# anywhere — building from the wrong directory is the failure this removes.
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

HEALTH_HOSTS=(https://api.dentcast.ir https://api.dentcast.org)
BRANCH=main

die() { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
say() { printf '\033[36m→\033[0m %s\n' "$*"; }
ok()  { printf '\033[32m✓\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
# What /health is serving right now.
#
# This is the only trustworthy source for "which version is live". The panel
# shows the tag it was ASKED to run; /health is the image that actually
# answered, which is the thing a deploy can silently fail to change.
# ---------------------------------------------------------------------------
live_version() {
  local host body
  for host in "${HEALTH_HOSTS[@]}"; do
    body="$(curl -fsS --max-time 15 "$host/health" 2>/dev/null || true)"
    if [ -n "$body" ]; then
      printf '%s' "$body" | sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
      return 0
    fi
  done
  return 1
}

# ---------------------------------------------------------------------------
# --verify: wait for a tag to actually be serving.
#
# Its own mode because the panel step sits between push and proof, and this is
# the half people skip. A change that is internal — a query, a default, an SMS
# parameter — looks identical on the site whether it deployed or not, so the
# tag in /health is the only evidence there is.
# ---------------------------------------------------------------------------
verify() {
  local want="$1" seen deadline=$(( $(date +%s) + 900 ))
  say "waiting for $want to answer on /health (Ctrl-C to stop)"
  while [ "$(date +%s)" -lt "$deadline" ]; do
    seen="$(live_version || true)"
    if [ "$seen" = "$want" ]; then
      ok "live: $want"
      curl -fsS --max-time 15 "${HEALTH_HOSTS[0]}/health" 2>/dev/null || true
      printf '\n'
      return 0
    fi
    printf '  serving %s, waiting…\n' "${seen:-<unreachable>}"
    sleep 15
  done
  die "$want never appeared. Check the panel applied the change, and the container logs."
}

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------
TAG=""
DRY_RUN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --tag)     TAG="${2:-}"; shift 2 ;;
    --verify)  verify "${2:?--verify needs a tag, e.g. --verify v52}"; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) sed -n '3,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)         die "unknown option: $1" ;;
  esac
done

# ---------------------------------------------------------------------------
# Where the image goes
# ---------------------------------------------------------------------------
if [ -f plus-api/.deploy.env ]; then
  # shellcheck disable=SC1091
  . plus-api/.deploy.env
fi
[ -n "${DENTCAST_REGISTRY:-}" ] || die \
  "DENTCAST_REGISTRY is not set. From the ArvanCloud panel → Container Registry:

  echo 'DENTCAST_REGISTRY=registry.arvancloud.ir/<namespace>/dentcast-plus-api' > plus-api/.deploy.env"

# ---------------------------------------------------------------------------
# Preflight. Every check here is a mistake that is cheap to catch now and
# expensive to catch after the image is live.
# ---------------------------------------------------------------------------
say "checking the working copy"

command -v docker >/dev/null 2>&1 || die "docker is not installed."
docker info >/dev/null 2>&1 || die "the docker daemon is not running — start Docker Desktop."

# Building from a branch, or from uncommitted edits, produces an image whose
# GIT_SHA names a commit nobody else can check out. The stamp has to mean
# something for a later rollback to be possible at all.
[ -z "$(git status --porcelain)" ] || die \
  "uncommitted changes. Commit or stash them — the image is stamped with the commit it was built from:

$(git status --short)"

CURRENT="$(git rev-parse --abbrev-ref HEAD)"
[ "$CURRENT" = "$BRANCH" ] || die "on branch '$CURRENT', not '$BRANCH'. Run: git checkout $BRANCH"

git fetch --quiet origin "$BRANCH"
[ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$BRANCH")" ] || die \
  "$BRANCH is not level with origin/$BRANCH — you would ship the wrong code. Run: git pull"

ok "clean $BRANCH, level with origin"

# ---------------------------------------------------------------------------
# Pick the tag
#
# A tag is never reused. The registry would accept the overwrite and the panel,
# seeing the same string it is already running, has no reason to pull anything —
# so the deploy silently does nothing and /health keeps telling the truth about
# an image you thought you replaced.
# ---------------------------------------------------------------------------
LIVE="$(live_version || true)"

if [ -z "$TAG" ]; then
  case "$LIVE" in
    v[0-9]*) TAG="v$(( ${LIVE#v} + 1 ))" ;;
    "")      die "could not reach /health to work out the next tag. Pass one: --tag v52" ;;
    *)       die "/health reports version '$LIVE', which is not a vNN tag. Pass one: --tag v52" ;;
  esac
  say "live is $LIVE — building $TAG"
else
  [ "$TAG" != "$LIVE" ] || die "$TAG is already the live version. Pick the next one."
  say "building $TAG (live is ${LIVE:-<unreachable>})"
fi

IMAGE="$DENTCAST_REGISTRY:$TAG"

# Best-effort: if the tag is already in the registry, stop. Not every registry
# answers this without extra auth, so a failure here is not treated as an answer.
if docker manifest inspect "$IMAGE" >/dev/null 2>&1; then
  die "$IMAGE already exists in the registry. Never reuse a tag — pick the next one."
fi

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
GIT_SHA="$(git rev-parse --short HEAD)"
BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# --platform linux/amd64 is not optional on an Apple Silicon machine: without
# it docker builds an arm64 image, the registry accepts it happily, and the
# container then crash-loops on Arvan's amd64 hosts with nothing in the logs
# that names the real cause. On an amd64 machine the flag costs nothing.
#
# The three build args are what GET /health reports back. Without them the
# image answers "dev", and a container serving last week's build becomes
# indistinguishable from a fresh one.
build=(
  docker build
    --platform linux/amd64
    -f plus-api/Dockerfile
    -t "$IMAGE"
    --build-arg "BUILD_TAG=$TAG"
    --build-arg "GIT_SHA=$GIT_SHA"
    --build-arg "BUILT_AT=$BUILT_AT"
    .
)

if [ "$DRY_RUN" = 1 ]; then
  printf '\n%s\n\ndocker push %s\n' "${build[*]}" "$IMAGE"
  exit 0
fi

say "building $IMAGE  (commit $GIT_SHA)"
"${build[@]}"
ok "built"

say "pushing to the registry"
docker push "$IMAGE"
ok "pushed"

# ---------------------------------------------------------------------------
# The manual half
# ---------------------------------------------------------------------------
cat <<EOF

──────────────────────────────────────────────────────────────
  Image is in the registry. Now, in the ArvanCloud panel:

    Cloud Container → the API app → set the image tag to:

        $TAG

    → Apply / Deploy

  Then prove it actually happened:

        ./plus-api/deploy.sh --verify $TAG

  Rollback, if it goes wrong: set the tag back to ${LIVE:-the previous one}
  and Apply. Migrations are additive, so the database is unaffected.
──────────────────────────────────────────────────────────────
EOF
