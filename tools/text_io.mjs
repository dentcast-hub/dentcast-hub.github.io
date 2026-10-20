import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export function writeText(path, text) {
  const old = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const crlf = (old.match(/\r\n/g) || []).length;
  if ((crlf && (old.match(/\n/g) || []).length !== crlf) || old.replace(/\r\n/g, '').includes('\r')) {
    throw new Error(`MIXED_LINE_ENDINGS: ${path}; use a byte-preserving scoped edit`);
  }
  let next = text.replace(/\r\n/g, '\n');
  if (crlf) next = next.replace(/\n/g, '\r\n');
  if (next !== old || !existsSync(path)) writeFileSync(path, next, 'utf8');
}
