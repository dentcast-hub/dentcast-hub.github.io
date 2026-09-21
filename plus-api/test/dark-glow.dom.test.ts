// @vitest-environment node
// The dark-mode depth glow (dc-theme.css + index.html) and the one rule it
// rests on: NEVER under a column of prose. Every reading page — article,
// episode, glossary term, LiteCast, en mirror — is a `main.article-content-wrap`,
// and the CSS excludes exactly that marker, so the test pins both halves: the
// rule names the marker, and the marker is on every reading page.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('dark-mode depth glow', () => {
  it('is dark-only, glow-only, and excludes every reading page by its marker', () => {
    const css = read('dc-theme.css');
    const rule = css.match(/\[data-theme="dark"\] body:not\(:has\(main\.article-content-wrap\)\) \{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toContain('radial-gradient');
    expect(rule![1]).not.toMatch(/url\(/);           // a glow, never a picture, on the shared rule
    expect(rule![1]).not.toMatch(/201,146,43|227,184,73|c9922b|e3b849/i); // never amber
    expect(css.match(/\[data-theme="dark"\] body:not\(:has\(main\.article-content-wrap\)\)/g)).toHaveLength(1);
  });

  it('the homepage mirrors it (it loads no shared CSS) on the phone body and the desktop column', () => {
    const html = read('index.html');
    expect(html).toMatch(/\[data-theme="dark"\] body\{\s*background-image:/);
    expect(html).toMatch(/\[data-theme="dark"\] \.dcd-col-c\{\s*background-image:/);
    // the mark is the brand microphone, as a background layer, and only in the dark
    const marks = html.match(/data:image\/svg\+xml[^"]*M12 14a4 4 0 0 0 4-4V6/g) || [];
    expect(marks.length).toBe(2);
    expect(html).not.toMatch(/\[data-theme="light"\][^{]*\{[^}]*svg\+xml/);
  });

  it('every reading page carries the marker the rule excludes', () => {
    const dirs = ['insight', 'dentai', 'notecast', 'metanotes', 'chairside', 'sharehub', 'episodes', 'glossary', 'litecast', 'dentcast-plus', 'plak-sefr', 'photocast'];
    const missing: string[] = [];
    let checked = 0;
    for (const d of dirs) {
      const dir = path.join(root, d);
      if (!fs.existsSync(dir)) continue;
      const walk = (p: string) => {
        for (const f of fs.readdirSync(p)) {
          const fp = path.join(p, f);
          if (fs.statSync(fp).isDirectory()) { walk(fp); continue; }
          if (!f.endsWith('.html') || f === 'index.html' || f === 'about.html') continue; // a section's about page is not a reading page
          checked += 1;
          const main = fs.readFileSync(fp, 'utf8').match(/<main[^>]*>/);
          if (!main || !/\barticle-content-wrap\b/.test(main[0])) missing.push(path.relative(root, fp));
        }
      };
      walk(dir);
    }
    expect(checked).toBeGreaterThan(500);
    expect(missing).toEqual([]);
  });
});
