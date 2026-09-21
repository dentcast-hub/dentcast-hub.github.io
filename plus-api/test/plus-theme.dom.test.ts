// @vitest-environment node
// Every /plus page loads no dc-nav.js, so nothing stamped `data-theme` on it and
// every one of them was light in every theme. Each now carries the same
// bootstrap dc-nav.js runs (stored choice, else OS), inline in <head> BEFORE
// the stylesheets — that order is the difference between a dark page and a
// white flash. Pinned here so a new /plus page cannot ship without it.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('/plus pages follow the site theme', () => {
  it('every plus/*.html stamps data-theme in <head> before its first stylesheet, from the same key dc-nav.js uses', () => {
    const dir = path.join(root, 'plus');
    const pages = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
    expect(pages.length).toBeGreaterThan(10);
    const nav = fs.readFileSync(path.join(root, 'dc-nav.js'), 'utf8');
    expect(nav).toContain("localStorage.getItem('dc-theme')");
    for (const f of pages) {
      const html = fs.readFileSync(path.join(dir, f), 'utf8');
      const boot = html.indexOf("localStorage.getItem('dc-theme')");
      const css = html.search(/<link[^>]+rel="stylesheet"/);
      expect(boot, f).toBeGreaterThan(-1);
      expect(css, f).toBeGreaterThan(-1);
      expect(boot, f + ': bootstrap must precede the stylesheets').toBeLessThan(css);
      expect(html, f).toMatch(/setAttribute\('data-theme',\s*d\s*\?\s*'dark'\s*:\s*'light'\)/);
      expect(html, f).toContain("prefers-color-scheme:dark");
    }
  });
});
