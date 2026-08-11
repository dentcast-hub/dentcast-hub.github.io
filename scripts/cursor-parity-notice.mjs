#!/usr/bin/env node
/**
 * cursor-parity-notice.mjs — Claude Code PostToolUse hook.
 *
 * Fires when an edit lands on either instruction side and reminds the session to
 * ASK whether the same change belongs on the other side. It exists because the
 * git pre-commit gate asks too late (and never at all in a web/CI session, which
 * has no terminal to ask on) — by then the thought that motivated the edit is gone.
 *
 * It only ever ASKS. It never writes to either side: the two rule sets are
 * hand-written on purpose, and generating one from the other is the thing this
 * whole setup exists to avoid.
 *
 * Why `.dentcast/workflows/*.md` counts as the Claude side even though BOTH
 * agents read it: `.cursor/rules/dentcast-publishing.mdc` restates the canon's
 * step chain and builder order as a summary. Cursor's behaviour follows the canon,
 * but that summary goes stale the moment a step is added — silently, because
 * nothing reads it but a human.
 *
 * Contract: reads the hook payload on stdin, writes hook JSON on stdout.
 * Emits nothing (exit 0, no output) when the edited file is on neither side —
 * a hook that speaks up for every file is a hook that gets ignored.
 */

import { basename } from 'node:path';

const CURSOR_GLOB = '.cursor/rules/*.mdc';

/** Which side does this path belong to? null = neither, stay silent. */
function sideOf(p) {
  if (!p) return null;
  const path = p.replace(/\\/g, '/');
  if (/(^|\/)CLAUDE\.md$/.test(path)) return 'claude';
  if (/(^|\/)AGENTS\.md$/.test(path)) return 'claude';
  if (/(^|\/)\.dentcast\/workflows\/[^/]+\.md$/.test(path)) return 'canon';
  if (/(^|\/)\.cursor\/rules\/[^/]+\.mdc$/.test(path)) return 'cursor';
  return null;
}

const MESSAGE = {
  claude: (f) =>
    `«${f}» ویرایش شد. قبل از پایان نوبت، از کاربر بپرس آیا همین تغییر باید روی ` +
    `${CURSOR_GLOB} هم اعمال شود — دو طرف دستی نگهداری می‌شوند و هدفشان این است که ` +
    `انتشار با Cursor همان کیفیت انتشار با Claude را داشته باشد. ` +
    `خودت سمت Cursor را بدون تأیید کاربر تغییر نده.`,
  canon: (f) =>
    `«${f}» (ورک‌فلوی کانونی) ویرایش شد. هر دو ایجنت این فایل را می‌خوانند، پس رفتار ` +
    `خودبه‌خود هماهنگ است — ولی .cursor/rules/dentcast-publishing.mdc فهرست گام‌ها و ` +
    `ترتیب بیلدرها را به‌صورت خلاصه تکرار کرده است. اگر گامی اضافه/حذف/جابه‌جا شده، ` +
    `آن خلاصه بی‌صدا بیات می‌شود. از کاربر بپرس آیا به‌روزش کنی.`,
  cursor: (f) =>
    `«${f}» (سمت Cursor) ویرایش شد. از کاربر بپرس آیا همین تغییر باید روی CLAUDE.md / ` +
    `AGENTS.md هم اعمال شود — قاعدهٔ نگهداری این ریپو می‌گوید این‌ها در یک کامیت با هم عوض می‌شوند.`,
};

const SUMMARY = {
  claude: 'سمت Claude عوض شد — Cursor را بپرس',
  canon: 'ورک‌فلوی کانونی عوض شد — خلاصهٔ گام‌ها در Cursor را بپرس',
  cursor: 'سمت Cursor عوض شد — CLAUDE.md/AGENTS.md را بپرس',
};

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let payload = {};
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    process.exit(0); // Never let a malformed payload break the turn.
  }
  const file =
    payload?.tool_response?.filePath ??
    payload?.tool_input?.file_path ??
    payload?.tool_input?.notebook_path ??
    null;

  const side = sideOf(file);
  if (!side) process.exit(0);

  const name = basename(String(file));
  process.stdout.write(
    JSON.stringify({
      systemMessage: SUMMARY[side],
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: MESSAGE[side](name),
      },
    })
  );
  process.exit(0);
});
