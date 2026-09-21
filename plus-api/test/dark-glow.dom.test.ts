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
    expect(rule![1]).toMatch(/data:image\/svg\+xml[^"]*<pattern id='p' width='28' height='28'/); // the grid
    expect(rule![1]).toMatch(/background-size:\s*100% 56rem/);   // bounded — never down a 5000px page
    expect(rule![1]).not.toMatch(/\.(png|jpe?g|webp|gif)/i);       // lines, never a picture
    expect(rule![1]).not.toMatch(/201,146,43|227,184,73|c9922b|e3b849/i); // never amber
    expect(css.match(/\[data-theme="dark"\] body:not\(:has\(main\.article-content-wrap\)\)/g)).toHaveLength(1);
  });

  it('the homepage mirrors it (it loads no shared CSS) on the phone scroll container and the desktop column', () => {
    const html = read('index.html');
        // the same grid, once, on a rule shared by the phone body and column C
    const grids = html.match(/data:image\/svg\+xml[^"]*<pattern id='p' width='28' height='28'/g) || [];
    expect(grids.length).toBe(1);
    expect(html).toMatch(/\[data-theme="dark"\] #mobile-body,\s*\n\s*\[data-theme="dark"\] \.dcd-col-c\{/);
    // never on body: #mobile-body paints its own opaque ground over it
    expect(html).not.toMatch(/\[data-theme="dark"\] body[,{]/);
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
