<#
.SYNOPSIS
  DentCast Plus API — build the container image and push it to the registry.

.DESCRIPTION
  The Windows twin of deploy.sh. Same checks, same build, same output; it exists
  because the founder's working copy is on Windows and PowerShell cannot run a
  .sh file — and `bash` there resolves to WSL's stub, not to Git Bash, which
  fails in a way that names neither problem.

  Everything up to the registry, in one command. The last step stays manual and
  always will: the image tag is changed in the ArvanCloud panel by a human, so
  nothing here can deploy to production by accident.

    .\plus-api\deploy.ps1                # next tag, read from the live /health
    .\plus-api\deploy.ps1 -Tag v52       # a tag you choose
    .\plus-api\deploy.ps1 -DryRun        # print the build command, run nothing
    .\plus-api\deploy.ps1 -Verify v52    # poll /health until that tag is serving

  One-time setup: point it at your registry repository. Copy the address from
  the panel rather than typing one that looks right — Arvan issues a per-account
  registry host, so it is NOT a shared registry.arvancloud.ir path. The shortcut
  is Cloud Container -> the API app -> the Image field, which already shows the
  running image; drop the ":vNN" off the end and that is the value.

    'DENTCAST_REGISTRY=<that address, no tag>' | Set-Content plus-api\.deploy.env
    docker login <the host only — everything before the first slash>

  See DEPLOY.md for the container's environment variables, the database, and
  everything else that is not the image itself.
#>

[CmdletBinding()]
param(
  [string] $Tag,
  [string] $Verify,
  [switch] $DryRun
)

$ErrorActionPreference = 'Stop'

# Windows PowerShell 5.1 still negotiates TLS 1.0 by default, which /health
# refuses. Harmless on PowerShell 7, where this is already the default.
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$HealthHosts = @('https://api.dentcast.ir', 'https://api.dentcast.org')
$Branch = 'main'

function Die($msg) { Write-Host "`n[X] $msg" -ForegroundColor Red; exit 1 }
function Say($msg) { Write-Host "-> $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "[ok] $msg" -ForegroundColor Green }

# The build context MUST be the repo root, never plus-api\: the image bakes in
# plus/content-index.json, plus/pathways.json, plus/badges.json and
# plus/flashcards-index.json, which live outside this directory. Deriving the
# root from git rather than from the current directory is what makes the script
# safe to run from anywhere.
$root = & git rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or -not $root) {
  Die 'run this from inside the dentcast repo (it builds from the repo root).'
}
Set-Location $root

# ---------------------------------------------------------------------------
# What /health is serving right now.
#
# The only trustworthy source for "which version is live". The panel shows the
# tag it was ASKED to run; /health is the image that actually answered, which is
# the thing a deploy can silently fail to change.
# ---------------------------------------------------------------------------
function Get-LiveVersion {
  foreach ($h in $HealthHosts) {
    try {
      $r = Invoke-RestMethod -Uri "$h/health" -TimeoutSec 15
      if ($r.version) { return [string]$r.version }
    } catch { }
  }
  return $null
}

# ---------------------------------------------------------------------------
# -Verify: wait for a tag to actually be serving.
#
# Its own mode because the panel step sits between push and proof, and this is
# the half people skip. A change that is internal — a query, a default, an SMS
# parameter — looks identical on the site whether it deployed or not, so the tag
# in /health is the only evidence there is.
# ---------------------------------------------------------------------------
if ($Verify) {
  Say "waiting for $Verify to answer on /health (Ctrl-C to stop)"
  $deadline = (Get-Date).AddMinutes(15)
  while ((Get-Date) -lt $deadline) {
    $seen = Get-LiveVersion
    if ($seen -eq $Verify) {
      Ok "live: $Verify"
      try { Invoke-RestMethod -Uri "$($HealthHosts[0])/health" -TimeoutSec 15 | ConvertTo-Json -Compress } catch {}
      exit 0
    }
    $shown = if ($seen) { $seen } else { '<unreachable>' }
    Write-Host "   serving $shown, waiting..."
    Start-Sleep -Seconds 15
  }
  Die "$Verify never appeared. Check the panel applied the change, and the container logs."
}

# ---------------------------------------------------------------------------
# Where the image goes
# ---------------------------------------------------------------------------
$registry = $env:DENTCAST_REGISTRY
$envFile = Join-Path $root 'plus-api\.deploy.env'
if (-not $registry -and (Test-Path $envFile)) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*DENTCAST_REGISTRY\s*=\s*(.+?)\s*$') { $registry = $Matches[1].Trim('"').Trim("'") }
  }
}
if (-not $registry) {
  Die @"
DENTCAST_REGISTRY is not set.

  Copy the address from the ArvanCloud panel — Cloud Container -> the API app ->
  the Image field shows the image running right now. Drop the ':vNN' off the end:

  'DENTCAST_REGISTRY=<that address, no tag>' | Set-Content plus-api\.deploy.env
"@
}

# ---------------------------------------------------------------------------
# Preflight. Every check here is a mistake that is cheap to catch now and
# expensive to catch after the image is live.
# ---------------------------------------------------------------------------
Say 'checking the working copy'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Die 'docker is not installed.' }
& docker info *> $null
if ($LASTEXITCODE -ne 0) { Die 'the docker daemon is not running — start Docker Desktop.' }

# Building from a branch, or from uncommitted edits, produces an image whose
# GIT_SHA names a commit nobody else can check out. The stamp has to mean
# something for a later rollback to be possible at all.
$dirty = & git status --porcelain
if ($dirty) {
  Die "uncommitted changes. Commit or stash them — the image is stamped with the commit it was built from:`n`n$($dirty -join "`n")"
}

$current = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($current -ne $Branch) { Die "on branch '$current', not '$Branch'. Run: git checkout $Branch" }

& git fetch --quiet origin $Branch
if ((& git rev-parse HEAD).Trim() -ne (& git rev-parse "origin/$Branch").Trim()) {
  Die "$Branch is not level with origin/$Branch — you would ship the wrong code. Run: git pull"
}

Ok "clean $Branch, level with origin"

# ---------------------------------------------------------------------------
# Pick the tag
#
# A tag is never reused. The registry would accept the overwrite and the panel,
# seeing the same string it is already running, has no reason to pull anything —
# so the deploy silently does nothing and /health keeps telling the truth about
# an image you thought you replaced.
# ---------------------------------------------------------------------------
$live = Get-LiveVersion

if (-not $Tag) {
  if ($live -match '^v(\d+)$') {
    $Tag = 'v' + ([int]$Matches[1] + 1)
    Say "live is $live — building $Tag"
  } elseif (-not $live) {
    Die 'could not reach /health to work out the next tag. Pass one: -Tag v52'
  } else {
    Die "/health reports version '$live', which is not a vNN tag. Pass one: -Tag v52"
  }
} else {
  if ($Tag -eq $live) { Die "$Tag is already the live version. Pick the next one." }
  $shown = if ($live) { $live } else { '<unreachable>' }
  Say "building $Tag (live is $shown)"
}

$image = "${registry}:${Tag}"

# Best-effort: if the tag is already in the registry, stop. Not every registry
# answers this without extra auth, so a failure here is not treated as an answer.
& docker manifest inspect $image *> $null
if ($LASTEXITCODE -eq 0) {
  Die "$image already exists in the registry. Never reuse a tag — pick the next one."
}

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
$gitSha = (& git rev-parse --short HEAD).Trim()
$builtAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

# --platform linux/amd64 is not optional on an ARM machine: without it docker
# builds an arm64 image, the registry accepts it happily, and the container then
# crash-loops on Arvan's amd64 hosts with nothing in the logs that names the
# real cause. On an amd64 machine the flag costs nothing.
#
# The three build args are what GET /health reports back. Without them the image
# answers "dev", and a container serving last week's build becomes
# indistinguishable from a fresh one.
$buildArgs = @(
  'build'
  '--platform', 'linux/amd64'
  '-f', 'plus-api/Dockerfile'
  '-t', $image
  '--build-arg', "BUILD_TAG=$Tag"
  '--build-arg', "GIT_SHA=$gitSha"
  '--build-arg', "BUILT_AT=$builtAt"
  '.'
)

if ($DryRun) {
  Write-Host "`ndocker $($buildArgs -join ' ')`n"
  Write-Host "docker push $image"
  exit 0
}

Say "building $image  (commit $gitSha)"
& docker @buildArgs
if ($LASTEXITCODE -ne 0) { Die 'docker build failed.' }
Ok 'built'

Say 'pushing to the registry'
& docker push $image
if ($LASTEXITCODE -ne 0) { Die 'docker push failed — are you logged in to the registry?' }
Ok 'pushed'

# ---------------------------------------------------------------------------
# The manual half
# ---------------------------------------------------------------------------
$prev = if ($live) { $live } else { 'the previous one' }
Write-Host @"

--------------------------------------------------------------
  Image is in the registry. Now, in the ArvanCloud panel:

    Cloud Container -> the API app -> set the image tag to:

        $Tag

    -> Apply / Deploy

  Then prove it actually happened:

        .\plus-api\deploy.ps1 -Verify $Tag

  Rollback, if it goes wrong: set the tag back to $prev and Apply.
  Migrations are additive, so the database is unaffected.
--------------------------------------------------------------
"@
