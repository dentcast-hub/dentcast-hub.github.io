#!/usr/bin/env node
// Advisory PostToolUse hook. It never edits rules or marks publication work done.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HANDOFF = '.dentcast/PUBLISH-HANDOFF.md';
const SKILL_COPIES = ['.claude/skills/', '.agents/skills/'];

export function sideOf(value) {
  if (typeof value !== 'string') return null;
  const path = value.replace(/\\/g, '/');
  if (/(^|\/)\.dentcast\/workflows\/legacy\//.test(path) || /\.legacy\.md$/.test(path)) return null;
  if (/(^|\/)(CLAUDE|AGENTS)\.md$/.test(path)) return 'entrypoint';
  if (/(^|\/)\.cursor\/rules\/[^/]+\.mdc$/.test(path)) return 'cursor';
  if (/(^|\/)\.dentcast\/workflows\/(?:global\/[^/]+|modules\/\d\d-[^/]+|[^/]+)\.md$/.test(path)) return 'canon';
  if (/(^|\/)\.(claude|agents)\/skills\/.+/.test(path)) return 'skill';
  if (/(^|\/)(\.claude\/settings\.json|\.codex\/hooks\.json|\.cursor\/hooks\.json)$/.test(path)) return 'hooks';
  return null;
}

// The two skill trees are byte-identical copies; return the copy that differs.
export function skillDivergence(value) {
  const path = String(value).replace(/\\/g, '/');
  const m = path.match(/^(?:(.*)\/)?\.(?:claude|agents)\/skills\/(.+)$/);
  if (!m) return null;
  const base = m[1] !== undefined ? m[1] + '/' : '';
  const read = p => { try { return readFileSync(p); } catch { return null; } };
  const [a, b] = SKILL_COPIES.map(dir => read(base + dir + m[2]));
  if (a && b && a.equals(b)) return null;
  return SKILL_COPIES.map(dir => dir + m[2]).join(' ↔ ');
}

function messagesFor(sides, divergent) {
  const messages = [];
  if (sides.has('canon')) messages.push('قاعدهٔ مشترک فعال تغییر کرد؛ ارجاع‌های همهٔ کلاینت‌ها و تست قرارداد را بررسی کن. منطق را در قواعد Cursor کپی نکن.');
  if (sides.has('entrypoint') || sides.has('cursor')) messages.push('مسیر مشترک تغییر کرد؛ AGENTS.md، CLAUDE.md و Cursor را در همین تغییر هماهنگ کن. مجوز موجود کاربر را دوباره نپرس.');
  if (divergent.length) messages.push('نسخه‌های مهارت باید عیناً یکی بمانند و الان فرق دارند: ' + divergent.join('، ') + ' — همین تغییر را در نسخهٔ دیگر هم بنویس.');
  if (sides.has('hooks')) messages.push('پیکربندی هوک تغییر کرد؛ .claude/settings.json، .codex/hooks.json و .cursor/hooks.json را هم‌ارز نگه دار و tests/test_dentcast_session_hooks.py را اجرا کن.');
  return messages;
}

function wrap(messages) {
  if (!messages.length) return null;
  return {systemMessage: 'بررسی قرارداد مشترک و هندآف انتشار', hookSpecificOutput: {
    hookEventName: 'PostToolUse', additionalContext: messages.join('\n'),
  }};
}

export function advisory(payload, root) {
  const value = payload?.tool_response?.filePath ?? payload?.tool_input?.file_path ?? payload?.file_path;
  const side = sideOf(value);
  const divergent = side === 'skill' ? [skillDivergence(value)].filter(Boolean) : [];
  const messages = messagesFor(new Set(side ? [side] : []), divergent);
  if (typeof value === 'string' && existsSync(resolve(root, HANDOFF))) messages.push(handoffMessage);
  return wrap(messages);
}

const handoffMessage = 'انتشار ناتمام فعال است: پس از این گام، هندآف ثابت را با ابزار step/record و شواهد واقعی به‌روز کن؛ این هوک هیچ گامی را انجام‌شده علامت نمی‌زند.';

// Bash edits (sed -i, heredocs, builders) carry no file path. Compare the
// working-tree changes against the snapshot taken after the previous call and
// advise only on paths that changed since then; otherwise stay silent.
export function changedPaths(root, statePath, run = gitStatus) {
  const entries = run(root);
  if (entries === null) return [];
  let previous = {};
  try { previous = JSON.parse(readFileSync(statePath, 'utf8')); } catch {}
  const current = {};
  for (const path of entries) {
    let sig = 'deleted';
    try { const s = statSync(join(root, path)); sig = `${s.size}:${s.mtimeMs}`; } catch {}
    current[path] = sig;
  }
  try { writeFileSync(statePath, JSON.stringify(current)); } catch {}
  return Object.keys(current).filter(p => previous[p] !== current[p]);
}

// A file-tool edit is advised directly; record it so the next Bash call
// does not repeat the same advice for that path.
export function noteEdit(payload, root, statePath) {
  const value = payload?.tool_response?.filePath ?? payload?.tool_input?.file_path;
  if (typeof value !== 'string') return;
  const abs = resolve(root, value);
  const rel = abs.startsWith(resolve(root) + '/') ? abs.slice(resolve(root).length + 1) : null;
  if (!rel) return;
  let state;
  try { state = JSON.parse(readFileSync(statePath, 'utf8')); } catch { return; } // no Bash snapshot yet
  try { const s = statSync(abs); state[rel] = `${s.size}:${s.mtimeMs}`; writeFileSync(statePath, JSON.stringify(state)); } catch {}
}

function gitStatus(root) {
  try {
    const out = execFileSync('git', ['-C', root, 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
      {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000});
    const parts = out.split('\0');
    const paths = [];
    for (let i = 0; i < parts.length; i++) {
      const entry = parts[i];
      if (entry.length < 4) continue;
      paths.push(entry.slice(3));
      if (entry[0] === 'R' || entry[0] === 'C') i++; // skip the rename source
    }
    return paths;
  } catch { return null; }
}

export function bashAdvisory(root, statePath, run = gitStatus) {
  const changed = changedPaths(root, statePath, run);
  if (!changed.length) return null;
  const sides = new Set(changed.map(sideOf).filter(Boolean));
  const divergent = changed.filter(p => sideOf(p) === 'skill')
    .map(p => skillDivergence(join(root, p))).filter(Boolean);
  const messages = messagesFor(sides, [...new Set(divergent)]);
  if (changed.some(p => p !== HANDOFF) && existsSync(resolve(root, HANDOFF))) messages.push(handoffMessage);
  return wrap(messages);
}

// The project root comes from the payload's own cwd: in worktree subagents
// CLAUDE_PROJECT_DIR may still name the main checkout.
export function projectRoot(payload, env = process.env) {
  const start = typeof payload?.cwd === 'string' && payload.cwd ? payload.cwd
    : env.CLAUDE_PROJECT_DIR || env.CODEX_PROJECT_DIR || process.cwd();
  for (let dir = resolve(start); ; dir = dirname(dir)) {
    if (existsSync(join(dir, '.git'))) return dir;
    if (dirname(dir) === dir) return resolve(start);
  }
}

export function statePathFor(root) {
  const key = createHash('sha256').update(resolve(root)).digest('hex').slice(0, 16);
  return join(tmpdir(), `dentcast-parity-notice-${key}.json`);
}

// Cursor `afterFileEdit` ({file_path, edits, workspace_roots}) accepts no
// output fields, so `--cursor` writes the same advice to stderr (Cursor's
// Hooks output channel) and keeps stdout empty; the always-on Cursor rules
// and the Stop guard remain the enforcing layers.
export function cursorRoot(payload, env = process.env) {
  const roots = payload?.workspace_roots;
  return env.CURSOR_PROJECT_DIR || (Array.isArray(roots) && typeof roots[0] === 'string' ? roots[0] : process.cwd());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cursor = process.argv.includes('--cursor');
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => { raw += d; });
  process.stdin.on('end', () => {
    let payload;
    try { payload = JSON.parse(raw || '{}'); } catch { return; }
    let message = null;
    try {
      if (cursor) message = advisory(payload, cursorRoot(payload));
      else {
        const root = projectRoot(payload);
        if (payload?.tool_name === 'Bash') message = bashAdvisory(root, statePathFor(root));
        else { message = advisory(payload, root); noteEdit(payload, root, statePathFor(root)); }
      }
    } catch { return; }
    if (!message) return;
    if (cursor) process.stderr.write(message.hookSpecificOutput.additionalContext + '\n');
    else process.stdout.write(JSON.stringify(message));
  });
}
