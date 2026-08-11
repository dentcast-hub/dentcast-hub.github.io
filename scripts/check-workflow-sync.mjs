#!/usr/bin/env node
/**
 * check-workflow-sync.mjs — drift detector for the two instruction SIDES.
 *
 *   claude side  →  CLAUDE.md, AGENTS.md
 *   cursor side  →  .cursor/rules/*.mdc
 *
 * They are written INDEPENDENTLY — neither is generated from the other, and that
 * stays true. The point is that Cursor must be able to publish at the same
 * quality as Claude, which only holds while both sides say the same thing.
 *
 * `.dentcast/workflows/*.md` is deliberately NOT tracked: it is shared canon that
 * both sides read (the .mdc files point straight into it), so editing a workflow
 * implies no Cursor edit. The asymmetry this guards is narrower — Claude Code gets
 * CLAUDE.md in context on every turn, while Cursor only gets its own rule files.
 *
 * A side "moved" if any of its files changed, appeared, or disappeared. Drift is
 * exactly one side moving. Both moved = a reconciled edit; neither = nothing to do.
 *
 * The report exists so you never have to open the files to decide: it names the
 * changed files, prints the actual diff, and lists concrete tokens (`paths.py`,
 * «trigger phrases») the edit introduced that the other side has never heard of.
 *
 * .workflow-sync.json stores the SHA-256 of every file on each side as of the last
 * time you declared them reconciled, plus each side's glob patterns — so a new
 * .mdc file is picked up automatically instead of being silently untracked.
 * No config framework, no dependencies; node stdlib only.
 *
 * Usage:
 *   node scripts/check-workflow-sync.mjs             check the working tree
 *   node scripts/check-workflow-sync.mjs --staged    check staged content (pre-commit)
 *   node scripts/check-workflow-sync.mjs --ack       "I reviewed both sides; they agree now"
 *   node scripts/check-workflow-sync.mjs --ack --staged
 *
 * Exit codes:
 *   0  no drift (both sides moved, or neither did)
 *   1  drift — exactly one side moved
 *   2  cannot check (missing/unreadable state file, bad usage)
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, posix } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATE_PATH = join(ROOT, '.workflow-sync.json');
const STATE_REL = '.workflow-sync.json';
const SELF_REL = 'scripts/check-workflow-sync.mjs';

/** Most diff lines shown per file — a big edit must not flood a commit hook. */
const MAX_DIFF_LINES = 24;
/** Most "the other side never mentions this" tokens listed. */
const MAX_TOKENS = 12;

// ── output helpers (before any use: fail() is hoisted, these consts are not) ──

const COLOR = process.stderr.isTTY && !process.env.NO_COLOR;
const bold = (s) => (COLOR ? `\x1b[1m${s}\x1b[0m` : s);
const yellow = (s) => (COLOR ? `\x1b[33m${s}\x1b[0m` : s);
const green = (s) => (COLOR ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s) => (COLOR ? `\x1b[31m${s}\x1b[0m` : s);
const dim = (s) => (COLOR ? `\x1b[2m${s}\x1b[0m` : s);

function fail(msg) {
  process.stderr.write(`\n  ${bold('workflow-sync:')} ${msg}\n\n`);
  process.exit(2);
}

// ── argv ────────────────────────────────────────────────────────────────────

const flags = new Set(process.argv.slice(2));
const ACK = flags.delete('--ack');
const STAGED = flags.delete('--staged');
const HELP = flags.delete('--help') || flags.delete('-h');

function usage() {
  return [
    'Usage:',
    `  node ${SELF_REL}                 check the working tree`,
    `  node ${SELF_REL} --staged        check staged content (pre-commit)`,
    `  node ${SELF_REL} --ack           record both sides as reconciled`,
    `  node ${SELF_REL} --ack --staged  record staged content as reconciled`,
    '',
  ].join('\n');
}

if (HELP) {
  process.stdout.write(usage());
  process.exit(0);
}
if (flags.size) fail(`unknown argument(s): ${[...flags].join(', ')}\n\n${usage()}`);

// ── git + fs helpers ────────────────────────────────────────────────────────

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', ['-C', ROOT, ...args], {
      maxBuffer: 64 * 1024 * 1024,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    if (allowFail) return null;
    throw err;
  }
}

/** Exact bytes that would enter the commit (--staged) or sit on disk (default). */
function readTracked(rel) {
  if (STAGED) {
    return execFileSync('git', ['-C', ROOT, 'show', `:${rel}`], {
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  }
  return readFileSync(join(ROOT, rel));
}

/**
 * Expand a side's patterns. Supports a literal path or a single-directory
 * `dir/*.ext` glob — enough for these two sides, and no glob dependency.
 * In --staged mode the file list comes from the index, so a newly staged rule
 * file is seen and a staged deletion is not resurrected from disk.
 */
let indexFiles = null;
function expand(patterns) {
  const found = new Set();
  for (const pattern of patterns) {
    if (!pattern.includes('*')) {
      found.add(pattern);
      continue;
    }
    const dir = posix.dirname(pattern);
    const base = posix.basename(pattern);
    const re = new RegExp('^' + base.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
    if (STAGED) {
      if (indexFiles === null) {
        indexFiles = (git(['ls-files', '--cached'], { allowFail: true }) ?? '').split('\n').filter(Boolean);
      }
      for (const f of indexFiles) {
        if (posix.dirname(f) === dir && re.test(posix.basename(f))) found.add(f);
      }
    } else {
      let listing = [];
      try {
        listing = readdirSync(join(ROOT, dir), { withFileTypes: true });
      } catch {
        listing = [];
      }
      for (const d of listing) if (d.isFile() && re.test(d.name)) found.add(posix.join(dir, d.name));
    }
  }
  return [...found].sort();
}

/**
 * Concrete, language-independent tokens worth cross-checking: `code/paths.py`
 * and «quoted trigger phrases». Prose is deliberately NOT extracted — only
 * things that would be copied verbatim from one side to the other.
 */
function tokensIn(text) {
  const out = new Set();
  for (const m of text.matchAll(/`([^`\n]{3,80})`/g)) {
    const tok = m[1].trim();
    if (/[/._]/.test(tok) && !/\s{2,}/.test(tok)) out.add(tok);
  }
  for (const m of text.matchAll(/«([^»\n]{2,60})»/g)) out.add(m[1].trim());
  return out;
}

// ── state file ──────────────────────────────────────────────────────────────

let state;
try {
  state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
} catch (err) {
  fail(
    `cannot read ${STATE_REL} (${err.code === 'ENOENT' ? 'not found' : err.message}).\n` +
      `  Recreate it with the two sides, then run:  node ${SELF_REL} --ack`
  );
}
if (!state || typeof state.sides !== 'object' || state.sides === null || Array.isArray(state.sides)) {
  fail(`${STATE_REL} has no "sides" object. Expected two sides, each with "patterns" and "files".`);
}

const sideKeys = Object.keys(state.sides);
if (sideKeys.length !== 2) {
  fail(`${STATE_REL} defines ${sideKeys.length} side(s); this check compares exactly 2.`);
}

// ── read both sides ─────────────────────────────────────────────────────────

const sides = sideKeys.map((key) => {
  const def = state.sides[key];
  if (!def || !Array.isArray(def.patterns) || !def.patterns.length) {
    fail(`side "${key}" in ${STATE_REL} has no "patterns" array.`);
  }
  const storedFiles = def.files && typeof def.files === 'object' ? def.files : null;
  const paths = expand(def.patterns);
  if (!paths.length) fail(`side "${key}" matched no files (patterns: ${def.patterns.join(', ')}).`);

  const files = new Map();
  for (const rel of paths) {
    try {
      files.set(rel, readTracked(rel));
    } catch {
      // A pattern match that cannot be read (staged deletion mid-expansion) is
      // simply absent from this side's snapshot — the file-set diff reports it.
    }
  }
  const now = Object.fromEntries([...files].map(([rel, buf]) => [rel, sha256(buf)]));

  let status;
  let changed = [];
  let added = [];
  let removed = [];
  if (!storedFiles) {
    status = 'new';
  } else {
    for (const [rel, h] of Object.entries(now)) {
      if (!(rel in storedFiles)) added.push(rel);
      else if (storedFiles[rel] !== h) changed.push(rel);
    }
    for (const rel of Object.keys(storedFiles)) if (!(rel in now)) removed.push(rel);
    status = changed.length || added.length || removed.length ? 'moved' : 'same';
  }
  return {
    key,
    label: def.label || key,
    patterns: def.patterns,
    paths,
    text: [...files.values()].map((b) => b.toString('utf8')).join('\n'),
    now,
    status,
    changed,
    added,
    removed,
  };
});

// ── --ack ───────────────────────────────────────────────────────────────────

if (ACK) {
  const head = git(['rev-parse', 'HEAD'], { allowFail: true });
  const next = {
    ...state,
    version: 2,
    acknowledged_at: new Date().toISOString(),
    // Diff baseline for the next run's "what changed" report. Hashes stay the
    // authority on WHETHER something moved; this only makes it SHOWABLE.
    acknowledged_commit: head ? head.trim() : null,
    sides: Object.fromEntries(
      sides.map((s) => [s.key, { ...state.sides[s.key], label: s.label, patterns: s.patterns, files: s.now }])
    ),
  };
  writeFileSync(STATE_PATH, `${JSON.stringify(next, null, 2)}\n`);

  const movedSides = sides.filter((s) => s.status !== 'same');
  process.stdout.write(
    `\n  ${bold('workflow-sync:')} reconciled${STAGED ? ' from the git index' : ''} — ` +
      `${sides.map((s) => `${s.label} (${s.paths.length})`).join(' + ')}.\n` +
      (movedSides.length
        ? movedSides.map((s) => `      updated  ${s.label}`).join('\n') + '\n'
        : `      ${dim('(nothing had moved since the last reconcile)')}\n`) +
      `\n  Commit ${STATE_REL} alongside the instruction files.\n\n`
  );
  process.exit(0);
}

// ── drift rule: exactly one side moved ──────────────────────────────────────

const movedSides = sides.filter((s) => s.status === 'moved' || s.status === 'new');

if (movedSides.length === 2 && sides.every((s) => s.status === 'new')) {
  process.stdout.write(
    `\n  ${bold('workflow-sync:')} no baseline recorded yet.\n` +
      `  Review both sides, then run:  node ${SELF_REL} --ack\n\n`
  );
  process.exit(0);
}

if (movedSides.length !== 1) {
  const what = movedSides.length === 0 ? 'neither side moved' : 'both sides moved together';
  process.stdout.write(`  ${bold('workflow-sync:')} ok — ${what}.\n`);
  process.exit(0);
}

// ── drift: report it ────────────────────────────────────────────────────────

const from = movedSides[0];
const to = sides.find((s) => s !== from);

/** Real diff hunks since the acknowledged commit — best effort, display only. */
function diffLines(rel) {
  const base = state.acknowledged_commit;
  if (!base) return null;
  if (git(['cat-file', '-e', `${base}^{commit}`], { allowFail: true }) === null) return null;
  const args = ['diff', '--unified=0', '--no-color'];
  if (STAGED) args.push('--cached');
  args.push(base, '--', rel);
  const out = git(args, { allowFail: true });
  if (out === null) return null;
  return out
    .split('\n')
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))
    .filter((l) => l.slice(1).trim() !== '');
}

const out = [];
out.push('');
out.push(`  ${yellow(bold('ONE SIDE MOVED, THE OTHER DID NOT'))}`);
out.push('');
out.push(`  ${bold(from.label)} changed:`);
for (const rel of from.changed) out.push(`      ${yellow('~')} ${rel}`);
for (const rel of from.added) out.push(`      ${green('+')} ${rel}  ${dim('(new file)')}`);
for (const rel of from.removed) out.push(`      ${red('-')} ${rel}  ${dim('(gone)')}`);

const addedLines = [];
for (const rel of [...from.changed, ...from.added]) {
  const lines = diffLines(rel);
  if (!lines || !lines.length) continue;
  addedLines.push(...lines.filter((l) => l.startsWith('+')).map((l) => l.slice(1)));
  out.push('');
  out.push(`  ${dim(`what changed in ${rel}:`)}`);
  for (const l of lines.slice(0, MAX_DIFF_LINES)) {
    const clipped = l.length > 160 ? l.slice(0, 160) + '…' : l;
    out.push(`      ${l.startsWith('+') ? green(clipped) : red(clipped)}`);
  }
  if (lines.length > MAX_DIFF_LINES) {
    out.push(`      ${dim(`… ${lines.length - MAX_DIFF_LINES} more — git diff ${String(state.acknowledged_commit).slice(0, 8)} -- ${rel}`)}`);
  }
}

out.push('');
out.push(`  ${bold(to.label)} did NOT change:`);
for (const rel of to.paths) out.push(`      ${dim(rel)}`);

// Concrete tokens the edit introduced that the untouched side has never heard of.
const source = addedLines.length ? addedLines.join('\n') : from.text;
const missing = [...tokensIn(source)].filter((t) => !to.text.includes(t));
if (missing.length) {
  out.push('');
  out.push(`  ${bold(`Nothing on the ${to.label} side mentions:`)}`);
  for (const t of missing.slice(0, MAX_TOKENS)) out.push(`      ${t}`);
  if (missing.length > MAX_TOKENS) out.push(`      ${dim(`… and ${missing.length - MAX_TOKENS} more`)}`);
  out.push(`  ${dim('  (concrete paths/triggers only — prose is never compared)')}`);
}

out.push('');
out.push(`  ${bold(`Should this change apply to ${to.label} too?`)}`);
out.push(`  ${dim('The two sides are hand-written, so only you can answer. If yes, the prompt is:')}`);
out.push('');
out.push(`      ${dim(`"${from.label} changed — see the diff. Apply the same change to`)}`);
out.push(`      ${dim(`${to.patterns.join(', ')}, conceptually not verbatim."`)}`);
out.push('');
out.push(`  If it does NOT concern ${to.label}, record that and move on:`);
out.push('');
out.push(`      ${bold(`node ${SELF_REL} --ack${STAGED ? ' --staged' : ''} && git add ${STATE_REL}`)}`);
out.push('');

process.stderr.write(out.join('\n') + '\n');
process.exit(1);
