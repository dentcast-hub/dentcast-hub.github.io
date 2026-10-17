#!/usr/bin/env node
// Advisory PostToolUse hook. It never edits rules or marks publication work done.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function sideOf(value) {
  if (typeof value !== 'string') return null;
  const path = value.replace(/\\/g, '/');
  if (/(^|\/)\.dentcast\/workflows\/legacy\//.test(path) || /\.legacy\.md$/.test(path)) return null;
  if (/(^|\/)(CLAUDE|AGENTS)\.md$/.test(path)) return 'entrypoint';
  if (/(^|\/)\.cursor\/rules\/[^/]+\.mdc$/.test(path)) return 'cursor';
  if (/(^|\/)\.dentcast\/workflows\/(?:global\/[^/]+|modules\/\d\d-[^/]+|[^/]+)\.md$/.test(path)) return 'canon';
  return null;
}

export function advisory(payload, root) {
  const value = payload?.tool_response?.filePath ?? payload?.tool_input?.file_path ?? payload?.file_path;
  const side = sideOf(value);
  const active = existsSync(resolve(root, '.dentcast/PUBLISH-HANDOFF.md'));
  const messages = [];
  if (side === 'canon') messages.push('قاعدهٔ مشترک فعال تغییر کرد؛ ارجاع‌های همهٔ کلاینت‌ها و تست قرارداد را بررسی کن. منطق را در قواعد Cursor کپی نکن.');
  if (side === 'entrypoint' || side === 'cursor') messages.push('مسیر مشترک تغییر کرد؛ AGENTS.md، CLAUDE.md و Cursor را در همین تغییر هماهنگ کن. مجوز موجود کاربر را دوباره نپرس.');
  if (active && typeof value === 'string') messages.push('انتشار ناتمام فعال است: پس از این گام، هندآف ثابت را با ابزار step/record و شواهد واقعی به‌روز کن؛ این هوک هیچ گامی را انجام‌شده علامت نمی‌زند.');
  if (!messages.length) return null;
  return {systemMessage: 'بررسی قرارداد مشترک و هندآف انتشار', hookSpecificOutput: {
    hookEventName: 'PostToolUse', additionalContext: messages.join('\n'),
  }};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => { raw += d; });
  process.stdin.on('end', () => {
    let payload;
    try { payload = JSON.parse(raw || '{}'); } catch { return; }
    const root = process.env.CLAUDE_PROJECT_DIR || process.env.CODEX_PROJECT_DIR || process.cwd();
    const message = advisory(payload, root);
    if (message) process.stdout.write(JSON.stringify(message));
  });
}
