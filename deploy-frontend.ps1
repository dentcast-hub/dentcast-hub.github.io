<#
.SYNOPSIS
  DentCast — ONE command that ships everywhere: git push (-> GitHub -> .org
  via GitHub Pages) AND a direct sync to ArvanCloud Object Storage (-> .ir),
  with no GitHub Actions run required for the .ir half.

  PowerShell twin of deploy-frontend.sh — same guards, same push, same sync,
  same cache-control stamping. Use this one when running natively in Windows
  PowerShell (deploy-frontend.sh needs Git Bash).

.PARAMETER DryRun
  Print what would change, push/upload nothing.

.PARAMETER Force
  Also deploy with uncommitted changes present (they still never get synced —
  only committed HEAD is).

.PARAMETER SkipPush
  Sync to Arvan only, don't touch GitHub.

.EXAMPLE
  ./deploy-frontend.ps1
.EXAMPLE
  ./deploy-frontend.ps1 -DryRun
#>
param(
  [switch]$DryRun,
  [switch]$Force,
  [switch]$SkipPush
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Say($msg) { Write-Host "-> $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "OK $msg" -ForegroundColor Green }
function Die($msg) { Write-Host "`nX $msg" -ForegroundColor Red; exit 1 }
function CheckExit($what) { if ($LASTEXITCODE -ne 0) { Die "$what failed (exit $LASTEXITCODE)" } }

$root = (git rev-parse --show-toplevel 2>$null)
if (-not $root) { Die "run this from inside the dentcast repo." }
Set-Location $root

$branch = 'main'

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
if (-not (Test-Path '.deploy-frontend.env')) {
  Die ".deploy-frontend.env not found. Copy the access key + secret key from the ArvanCloud panel (Object Storage -> dentcast bucket -> Access Keys) into that gitignored file:`n`n  ARVAN_ACCESS_KEY=...`n  ARVAN_SECRET_KEY=...`n  ARVAN_BUCKET=dentcast`n  ARVAN_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir"
}

$cfg = @{}
Get-Content '.deploy-frontend.env' | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k, $v = $_ -split '=', 2
  $cfg[$k.Trim()] = $v.Trim()
}
foreach ($k in 'ARVAN_ACCESS_KEY', 'ARVAN_SECRET_KEY', 'ARVAN_BUCKET', 'ARVAN_ENDPOINT') {
  if (-not $cfg[$k]) { Die "$k is not set in .deploy-frontend.env" }
}

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
  Die "AWS CLI is not installed. Run: pip install awscli"
}

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
Say "checking the working copy"

if (-not $Force) {
  $status = git status --porcelain
  if ($status) { Die "uncommitted changes. Commit/stash them, or pass -Force to deploy the working tree anyway:`n`n$status" }

  $current = git rev-parse --abbrev-ref HEAD
  if ($current -ne $branch) { Die "on branch '$current', not '$branch'. Run: git checkout $branch (or pass -Force)" }

  Ok "clean $branch"
} else {
  Say "-Force: skipping the clean-working-copy check -- deploying $(git rev-parse --short HEAD) as-is"
}

# ---------------------------------------------------------------------------
# Push to GitHub. This is the "one file" half that reaches .org (GitHub
# Pages) and keeps origin/main as the record of what's live. Only a plain
# fast-forward push -- never force-push, never rewrite. If origin has commits
# this branch doesn't, stop and ask for a pull rather than guessing.
# ---------------------------------------------------------------------------
if (-not $SkipPush) {
  Say "checking origin/$branch"
  git fetch --quiet origin $branch
  CheckExit "git fetch"
  $local = git rev-parse $branch
  $remote = git rev-parse "origin/$branch"

  if ($local -eq $remote) {
    Ok "origin/$branch already up to date"
  } else {
    $base = git merge-base $branch "origin/$branch"
    if ($base -eq $remote) {
      $count = git rev-list --count "origin/$branch..$branch"
      if ($DryRun) {
        Say "dry run: would push $count commit(s) to origin/$branch"
      } else {
        Say "pushing $count commit(s) to origin/$branch"
        git push origin $branch
        CheckExit "git push"
        Ok "pushed -- .org (GitHub Pages) will update from this"
      }
    } else {
      Die "origin/$branch has commits this branch doesn't (diverged, or you're behind) -- pull first:`n`n  git pull origin $branch"
    }
  }
} else {
  Say "-SkipPush: not touching GitHub, deploying local $branch as-is"
}

Say "deploying $(git rev-parse --short HEAD)"

# ---------------------------------------------------------------------------
# Build a clean tree from HEAD via a zip archive. Never sync the working
# directory directly -- it has node_modules, .env files (real DATABASE_URL,
# API secrets), tmp/ scratch, and this very credentials file, none of which
# the GitHub Actions checkout ever had.
# ---------------------------------------------------------------------------
$tmpRoot = Join-Path $env:TEMP ("dcdeploy-" + [guid]::NewGuid().ToString('N'))
$tmpZip = "$tmpRoot.zip"
New-Item -ItemType Directory -Path $tmpRoot -Force | Out-Null

try {
  Say "exporting tracked files at $(git rev-parse --short HEAD) to a clean tree"
  git archive --format=zip -o $tmpZip HEAD
  CheckExit "git archive"
  Expand-Archive -Path $tmpZip -DestinationPath $tmpRoot -Force
  Ok "clean tree ready"

  $env:AWS_ACCESS_KEY_ID = $cfg['ARVAN_ACCESS_KEY']
  $env:AWS_SECRET_ACCESS_KEY = $cfg['ARVAN_SECRET_KEY']
  $env:AWS_EC2_METADATA_DISABLED = 'true'
  $bucket = $cfg['ARVAN_BUCKET']
  $endpoint = $cfg['ARVAN_ENDPOINT']

  $syncArgs = @(
    "$tmpRoot/", "s3://$bucket",
    '--endpoint-url', $endpoint,
    '--delete',
    '--exclude', '.git/*',
    '--exclude', '.github/*'
  )
  if ($DryRun) { $syncArgs += '--dryrun' }

  Say "syncing to s3://$bucket $(if ($DryRun) { '(dry run)' })"
  aws s3 sync @syncArgs
  CheckExit "aws s3 sync"
  Ok "sync done"

  if ($DryRun) {
    Say "dry run -- no cache-control stamping performed, nothing was uploaded"
    exit 0
  }

  # -------------------------------------------------------------------------
  # Cache-control stamping -- identical to deploy-arvan.yml's job.
  # -------------------------------------------------------------------------
  function Stamp($key, $contentType) {
    aws s3 cp "s3://$bucket/$key" "s3://$bucket/$key" `
      --endpoint-url $endpoint `
      --cache-control "no-cache" `
      --content-type $contentType `
      --metadata-directive REPLACE
    CheckExit "stamp $key"
  }
  function StampTree($pattern, $contentType) {
    aws s3 cp "s3://$bucket/plus/" "s3://$bucket/plus/" `
      --endpoint-url $endpoint `
      --recursive --exclude "*" --include $pattern `
      --cache-control "no-cache" `
      --content-type $contentType `
      --metadata-directive REPLACE
    CheckExit "stamp_tree $pattern"
  }

  Say "forcing revalidation on the cache-sensitive files"
  Stamp "dc-nav.js"             "application/javascript; charset=utf-8"
  Stamp "spot/spot.js"          "application/javascript; charset=utf-8"
  Stamp "spot/spot-config.json" "application/json; charset=utf-8"
  StampTree "*.js"          "application/javascript; charset=utf-8"
  StampTree "*.css"         "text/css; charset=utf-8"
  StampTree "*.html"        "text/html; charset=utf-8"
  StampTree "*.json"        "application/json; charset=utf-8"
  StampTree "*.webmanifest" "application/manifest+json; charset=utf-8"
  Ok "revalidation stamps applied"

  Say "fixing Content-Type for vCard files"
  aws s3 cp "$tmpRoot/card/dr-foad-shahabian.vcf" `
    "s3://$bucket/card/dr-foad-shahabian.vcf" `
    --endpoint-url $endpoint `
    --content-type "text/vcard; charset=utf-8" `
    --metadata-directive REPLACE
  CheckExit "vcard stamp"
  Ok "vCard content-type fixed"

  Write-Host "`nOK deployed $(git rev-parse --short HEAD) to s3://$bucket (.ir) -- no GitHub Actions run involved." -ForegroundColor Green
}
finally {
  Remove-Item -Recurse -Force $tmpRoot -ErrorAction SilentlyContinue
  Remove-Item -Force $tmpZip -ErrorAction SilentlyContinue
}
