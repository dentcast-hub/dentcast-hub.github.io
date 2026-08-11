#!/usr/bin/env node
/**
 * check-workflow-sync.mjs — drift detector for the hand-maintained instruction files.
 *
 * CLAUDE.md, AGENTS.md and .cursor/rules/dentcast-router.mdc are written
 * INDEPENDENTLY — none is generated from another, and that is deliberate. So
 * nothing here can prove they agree; only a human can. What a machine *can*
 * notice is the reliable smell: one of them moved and the others did not.
 *
 * .workflow-sync.json stores the SHA-256 of each tracked file as of the last
 * time you declared them reconciled. Its `files` keys ARE the tracked list —
 * to start tracking another file, add a key with a null value and run --ack.
 * There is no config file and no dependencies; node stdlib only.
 *
 * Usage:
 *   node scripts/check-workflow-sync.mjs             check the working tree
 *   node scripts/check-workflow-sync.mjs --staged    check staged content (pre-commit)
 *   node scripts/check-workflow-sync.mjs --ack       "I reviewed both sides; they agree now"
 *   node scripts/check-workflow-sync.mjs --ack --staged
 *
 * Exit codes:
 *   0  no drift (all tracked files changed together, or none changed)
 *   1  drift — some moved, some did not
 *   2  cannot check (missing/unreadable state file, missing tracked file, bad usage)
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATE_PATH = join(ROOT, '.workflow-sync.json');
const STATE_REL = '.workflow-sync.json';
const SELF_REL = 'scripts/check-workflow-sync.mjs';

// ── output helpers ──────────────────────────────────────────────────────────
// Declared before any use: fail() is hoisted, but these consts are not.

const COLOR = process.stderr.isTTY && !process.env.NO_COLOR;
const bold = (s) => (COLOR ? `\x1b[1m${s}\x1b[0m` : s);
const yellow = (s) => (COLOR ? `\x1b[33m${s}\x1b[0m` : s);
const dim = (s) => (COLOR ? `\x1b[2m${s}\x1b[0m` : s);

function fail(msg) {
  process.stderr.write(`\n  ${bold('workflow-sync:')} ${msg}\n\n`);
  process.exit(2);
}

// ── argv ────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const flags = new Set(argv);
const ACK = flags.delete('--ack');
const STAGED = flags.delete('--staged');
const HELP = flags.delete('--help') || flags.delete('-h');

if (HELP) {
  process.stdout.write(usage());
  process.exit(0);
}
if (flags.size) {
  fail(`unknown argument(s): ${[...flags].join(', ')}\n\n${usage()}`);
}

function usage() {
  return [
    'Usage:',
    `  node ${SELF_REL}                 check the working tree`,
    `  node ${SELF_REL} --staged        check staged content (pre-commit)`,
    `  node ${SELF_REL} --ack           record current hashes as reconciled`,
    `  node ${SELF_REL} --ack --staged  record staged hashes as reconciled`,
    '',
  ].join('\n');
}

// ── state file ──────────────────────────────────────────────────────────────

let state;
try {
  state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
} catch (err) {
  fail(
    `cannot read ${STATE_REL} (${err.code === 'ENOENT' ? 'not found' : err.message}).\n` +
      `  Create it with the tracked files, then run:  node ${SELF_REL} --ack`
  );
}

if (!state || typeof state.files !== 'object' || state.files === null || Array.isArray(state.files)) {
  fail(`${STATE_REL} has no "files" object. Expected { "files": { "<path>": "<sha256>|null" } }.`);
}

const tracked = Object.keys(state.files);
if (tracked.length < 2) {
  fail(`${STATE_REL} tracks ${tracked.length} file(s); drift detection needs at least 2.`);
}

// ── hashing ─────────────────────────────────────────────────────────────────

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Exact bytes that would enter the commit (--staged) or sit on disk (default). */
function readTracked(rel) {
  if (STAGED) {
    // `git show :path` reads the index — the bytes the commit will actually carry.
    return execFileSync('git', ['-C', ROOT, 'show', `:${rel}`], {
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  }
  return readFileSync(join(ROOT, rel));
}

const entries = tracked.map((rel) => {
  const stored = state.files[rel];
  let current = null;
  let unreadable = null;
  try {
    current = sha256(readTracked(rel));
  } catch (err) {
    unreadable = STAGED ? 'not in the git index' : (err.code === 'ENOENT' ? 'not found on disk' : err.message);
  }
  let status;
  if (unreadable) status = 'unreadable';
  else if (stored === null || stored === undefined) status = 'new';
  else if (stored === current) status = 'same';
  else status = 'changed';
  return { rel, stored, current, status, unreadable };
});

const unreadable = entries.filter((e) => e.status === 'unreadable');
if (unreadable.length) {
  fail(
    `tracked file(s) could not be read:\n` +
      unreadable.map((e) => `      ${e.rel} — ${e.unreadable}`).join('\n') +
      `\n  Fix the path in ${STATE_REL}, or restore the file.`
  );
}

// ── --ack ───────────────────────────────────────────────────────────────────

if (ACK) {
  const next = {
    ...state,
    acknowledged_at: new Date().toISOString(),
    files: Object.fromEntries(entries.map((e) => [e.rel, e.current])),
  };
  writeFileSync(STATE_PATH, `${JSON.stringify(next, null, 2)}\n`);

  const moved = entries.filter((e) => e.status !== 'same');
  process.stdout.write(
    `\n  ${bold('workflow-sync:')} reconciled — recorded ${entries.length} hash(es)` +
      `${STAGED ? ' from the git index' : ''}.\n` +
      (moved.length
        ? moved.map((e) => `      updated  ${e.rel}`).join('\n') + '\n'
        : `      ${dim('(nothing had moved since the last reconcile)')}\n`) +
      `\n  Commit ${STATE_REL} alongside the instruction files.\n\n`
  );
  process.exit(0);
}

// ── check ───────────────────────────────────────────────────────────────────

// A never-acknowledged entry counts as moved: it has no baseline to agree with.
const moved = entries.filter((e) => e.status === 'changed' || e.status === 'new');
const still = entries.filter((e) => e.status === 'same');

// Bootstrap: nothing has a baseline yet. Not drift — there is nothing to drift from.
if (moved.length === entries.length && moved.every((e) => e.status === 'new')) {
  process.stdout.write(
    `\n  ${bold('workflow-sync:')} no baseline recorded yet for any tracked file.\n` +
      `  Review them, then run:  node ${SELF_REL} --ack\n\n`
  );
  process.exit(0);
}

// No drift: everything moved together, or nothing moved at all.
if (moved.length === 0 || still.length === 0) {
  const what = moved.length === 0 ? 'unchanged since the last reconcile' : 'all moved together';
  process.stdout.write(
    `  ${bold('workflow-sync:')} ok — ${entries.length} tracked file(s), ${what}.\n`
  );
  process.exit(0);
}

// Drift: some moved, some did not.
const label = (e) => (e.status === 'new' ? `${e.rel}  ${dim('(never reconciled)')}` : e.rel);
const ackCmd = `node ${SELF_REL} --ack${STAGED ? ' --staged' : ''} && git add ${STATE_REL}`;

process.stderr.write(
  [
    '',
    `  ${yellow(bold('INSTRUCTION FILES OUT OF SYNC'))}`,
    '',
    `  Moved since the last reconcile:`,
    ...moved.map((e) => `      ${bold(label(e))}`),
    '',
    `  Did NOT move — now suspect, does the same edit belong here?`,
    ...still.map((e) => `      ${e.rel}`),
    '',
    `  These files are maintained by hand, so this is a prompt to look, not a verdict.`,
    `  Once you have reviewed them and they say the same thing:`,
    '',
    `      ${bold(ackCmd)}`,
    '',
  ].join('\n') + '\n'
);
process.exit(1);
