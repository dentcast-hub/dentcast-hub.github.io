// @vitest-environment jsdom
// Drives the REAL shipped wall (/plus/js/certificates.js) and the image
// renderer behind its download button (/plus/js/certificate-image.js).
//
// Three rules the wall rests on, and each of them was a decision:
//   · EVERY full pathway is a disc, not only the earned ones — a shelf that
//     shows only what you have says nothing about what there is to earn.
//   · The green tick marks a LIVE certificate. A revoked one leaves its
//     pathway un-ticked (the wall shows what stands today) while staying in
//     the API's `certificates` record.
//   · A disc opens a sheet: the held one carries the downloads and the
//     LinkedIn fields, the unearned one carries how it is earned.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('/plus/js/certificate-image.js', () => ({
  downloadCertificate: (...args: unknown[]) => { downloads.push(args); return Promise.resolve(new Blob()); },
  CERT_TEXT: {},
}));

let downloads: unknown[][] = [];

const CERT = {
  id: 'c1',
  pathway_id: 'ceramics',
  pathway_title_fa: 'سرامیک دندانی: از انتخاب ماده تا سمان',
  verify_code: 'DC-K4M-7QA',
  holder_name: 'دکتر مهسا رضایی',
  issued_at: '2026-09-12T10:00:00.000Z',
  revoked_at: null,
  verify_url: '/plus/certificate.html?c=DC-K4M-7QA',
};

const DATA = {
  certificates: [CERT],
  pathways: [
    { id: 'ceramics', title_fa: 'سرامیک دندانی: از انتخاب ماده تا سمان', short_fa: 'سرامیک دندانی', glyph: 'icon-ceramic', certificate: CERT },
    { id: 'digital', title_fa: 'دندانپزشکی دیجیتال: اسکن، CAD/CAM و ورک‌فلو', short_fa: 'دیجیتال', glyph: 'icon-scan', certificate: null },
    // no short_fa: the wall must fall back to the full title rather than blank
    { id: 'esthetic', title_fa: 'زیبایی و طراحی لبخند', glyph: 'icon-smile', certificate: null },
  ],
};

const settle = () => new Promise((r) => setTimeout(r, 0));

async function mountWall(data: unknown) {
  document.body.innerHTML = '<div id="root"></div>';
  const { certificatesBody } = await import('/plus/js/certificates.js');
  const body = certificatesBody(data);
  if (body) document.getElementById('root')!.appendChild(body);
  return body;
}

const tiles = () => Array.from(document.querySelectorAll('.dcp-bg-tile'));
const sheet = () => document.querySelector('.dcp-sheet');

beforeEach(() => {
  vi.resetModules();
  downloads = [];
  document.body.innerHTML = '';
  Object.assign(navigator, { clipboard: { writeText: () => Promise.resolve() } });
});

describe('the certificate wall', () => {
  it('draws a disc for every full pathway, earned or not', async () => {
    await mountWall(DATA);
    expect(tiles()).toHaveLength(3);
  });

  it('labels a disc with the SHORT name, and falls back to the full title', async () => {
    await mountWall(DATA);
    const names = tiles().map((t) => t.querySelector('.dcp-bg-name')!.textContent);
    // short where there is one — a full title under a 56px disc wraps to four lines
    expect(names).toContain('سرامیک دندانی');
    expect(names).toContain('دیجیتال');
    expect(names).not.toContain('سرامیک دندانی: از انتخاب ماده تا سمان');
    // and the full title where there is not, rather than an empty caption
    expect(names).toContain('زیبایی و طراحی لبخند');
  });

  it('keeps the FULL title in the aria-label — a screen reader is not short of room', async () => {
    await mountWall(DATA);
    const labels = tiles().map((t) => t.getAttribute('aria-label'));
    expect(labels).toContain('گواهی‌نامهٔ مسیر سرامیک دندانی: از انتخاب ماده تا سمان');
  });

  it('ticks only the earned disc, and dims the rest', async () => {
    await mountWall(DATA);
    const ticked = tiles().filter((t) => t.querySelector('.dcp-cert-tick'));
    expect(ticked).toHaveLength(1);
    expect(ticked[0].querySelector('.dcp-bg-name')!.textContent).toContain('سرامیک');
    expect(ticked[0].querySelector('.dcp-cert-disc')!.classList.contains('is-on')).toBe(true);
    const unearned = tiles().find((t) => !t.querySelector('.dcp-cert-tick'))!;
    expect(unearned.querySelector('.dcp-cert-disc')!.classList.contains('is-off')).toBe(true);
  });

  it('uses each pathway\'s own glyph', async () => {
    await mountWall(DATA);
    const hrefs = Array.from(document.querySelectorAll('.dcp-cert-disc use'))
      .map((u) => u.getAttribute('href'));
    expect(hrefs).toEqual([
      '/assets/icons/icons.svg#icon-ceramic',
      '/assets/icons/icons.svg#icon-scan',
      '/assets/icons/icons.svg#icon-smile',
    ]);
  });

  it('counts what is held', async () => {
    await mountWall(DATA);
    expect(document.querySelector('.dcp-cert-tally')!.textContent).toContain('۱');
  });

  it('invites rather than scolds when nothing is held yet', async () => {
    await mountWall({ pathways: DATA.pathways.map((p) => ({ ...p, certificate: null })) });
    const tally = document.querySelector('.dcp-cert-tally')!.textContent!;
    expect(tally).toContain('گواهی‌نامه‌اش این‌جا می‌نشیند');
    expect(document.querySelectorAll('.dcp-cert-tick')).toHaveLength(0);
  });

  it('renders nothing at all with no pathways — the section is dropped', async () => {
    expect(await mountWall({ certificates: [], pathways: [] })).toBeNull();
    expect(await mountWall(null)).toBeNull();
  });

  it('leaves a revoked certificate un-ticked', async () => {
    const revoked = { ...CERT, revoked_at: '2026-10-01T00:00:00.000Z' };
    // The API only puts LIVE certificates on a pathway; this is the shape it
    // sends once one is revoked.
    await mountWall({
      certificates: [revoked],
      pathways: [{ ...DATA.pathways[0], certificate: null }],
    });
    expect(document.querySelectorAll('.dcp-cert-tick')).toHaveLength(0);
  });
});

describe('the sheet a disc opens', () => {
  it('gives a held certificate its downloads, its code and the LinkedIn fields', async () => {
    await mountWall(DATA);
    (tiles().find((t) => t.querySelector('.dcp-cert-tick')) as HTMLElement).click();
    await settle();

    expect(sheet()).not.toBeNull();
    expect(sheet()!.textContent).toContain('DC-K4M-7QA');
    expect(sheet()!.textContent).toContain('دکتر مهسا رضایی');
    expect(sheet()!.textContent).toContain('Credential ID');
    expect(sheet()!.textContent).toContain('Credential URL');

    const buttons = Array.from(sheet()!.querySelectorAll('button')).map((b) => b.textContent);
    expect(buttons).toContain('دانلود گواهی (PNG)');
    expect(buttons).toContain('نسخهٔ مربع برای استوری');
  });

  it('downloads the a4 and the square from their own buttons', async () => {
    await mountWall(DATA);
    (tiles()[0] as HTMLElement).click();
    await settle();

    const btn = (label: string) => Array.from(sheet()!.querySelectorAll('button'))
      .find((b) => b.textContent === label) as HTMLButtonElement;

    btn('دانلود گواهی (PNG)').click();
    await settle();
    btn('نسخهٔ مربع برای استوری').click();
    await settle();

    expect(downloads.map((d) => d[1])).toEqual(['a4', 'square']);
    expect((downloads[0][0] as { verify_code: string }).verify_code).toBe('DC-K4M-7QA');
  });

  it('gives an unearned pathway the way in, and no download', async () => {
    await mountWall(DATA);
    (tiles().find((t) => !t.querySelector('.dcp-cert-tick')) as HTMLElement).click();
    await settle();

    expect(sheet()!.textContent).toContain('هنوز صادر نشده');
    expect(sheet()!.querySelector('a[href^="/plus/pathway.html"]')).not.toBeNull();
    expect(sheet()!.textContent).not.toContain('دانلود');
  });

  it('offers an absolute Credential URL — LinkedIn cannot follow a relative one', async () => {
    await mountWall(DATA);
    (tiles()[0] as HTMLElement).click();
    await settle();
    const values = Array.from(sheet()!.querySelectorAll('.dcp-cert-field-v')).map((n) => n.textContent!);
    const url = values.find((t) => t.includes('certificate.html'))!;
    expect(url).toMatch(/^https?:\/\/.+\/plus\/certificate\.html\?c=DC-K4M-7QA$/);
  });
});

describe('the image renderer', () => {
  it('names the file after the code and the format', async () => {
    vi.resetModules();
    vi.doUnmock('/plus/js/certificate-image.js');
    const mod = await import('/plus/js/certificate-image.js');
    expect(mod.certificateFilename(CERT, 'a4')).toBe('dentcast-certificate-DC-K4M-7QA-a4.png');
    expect(mod.certificateFilename(CERT, 'square')).toBe('dentcast-certificate-DC-K4M-7QA-square.png');
    // an unknown format falls back rather than producing "undefined" in a filename
    expect(mod.certificateFilename(CERT, 'nope')).toContain('-a4.png');
  });

  it('keeps A4 landscape proportions and a square square', async () => {
    vi.resetModules();
    vi.doUnmock('/plus/js/certificate-image.js');
    const { FORMATS } = await import('/plus/js/certificate-image.js');
    expect(FORMATS.a4.w / FORMATS.a4.h).toBeCloseTo(297 / 210, 2);
    expect(FORMATS.square.w).toBe(FORMATS.square.h);
  });

  it('carries the same words as the document, and no step count', async () => {
    vi.resetModules();
    vi.doUnmock('/plus/js/certificate-image.js');
    const { CERT_TEXT } = await import('/plus/js/certificate-image.js');
    expect(CERT_TEXT.kicker).toBe('گواهی‌نامهٔ تکمیل مسیر یادگیری');
    expect(CERT_TEXT.offered).toContain('جامع‌ترین منبع فارسی پروتز');
    expect(CERT_TEXT.offered).not.toContain('پادکست');
    expect(Object.values(CERT_TEXT).join(' ')).not.toMatch(/قدم/);
  });
});
