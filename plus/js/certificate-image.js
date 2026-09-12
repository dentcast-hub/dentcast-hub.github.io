// The certificate as a downloadable image.
//
// WHY CANVAS AND NOT A LIBRARY. Two other roads were open and both are worse
// here. html2canvas (or any DOM rasteriser) is an external script, and this
// site loads none but GA — adding one for a download button is a bad trade.
// A server-rendered PNG needs an image stack in plus-api plus Persian text
// shaping in Node, which is a project, not a feature. The browser already
// has a Persian text shaper and it is reachable from ctx.fillText: set
// `direction = 'rtl'` and it shapes and orders the run exactly as the page
// does. So the drawing is by hand, and it costs no dependency at all.
//
// THE PRICE, STATED: this file is a SECOND rendering of the certificate,
// beside the DOM one in certificate-page.js. They must be changed together.
// It is deliberately the same small set of strings and the same navy/blue,
// pulled from one place (CERT_TEXT below, which certificate-page.js imports)
// so at least the WORDS cannot drift — only the layout is duplicated, and
// the layout is a dozen lines of text on a white field.
//
// Fonts are loaded by this module rather than assumed from the host page's
// CSS: the profile draws certificates too, and it has no @font-face for
// Amiri. FontFace + document.fonts.add is the whole mechanism, and a failed
// load falls back to Vazirmatn rather than to a Latin default — a certificate
// with tofu on it is worse than one in the wrong Persian face.

const NAVY = '#022360';
const NAVY_SOFT = '#1c3560';
const MUTED = '#5b6f92';
const FAINT = '#8a9bb8';
const HAIR = 'rgba(2,35,96,.14)';
const BLUE = '#0b5fff';

/** Every word on the certificate, shared with the DOM renderer. */
export const CERT_TEXT = {
  brand: 'دنت‌کست',
  kicker: 'گواهی‌نامهٔ تکمیل مسیر یادگیری',
  revoked: 'باطل شده',
  lead1: 'مسیر یادگیریِ',
  lead2: 'را با موفقیت به پایان رسانده و آزمون پایانی آن را گذرانده است.',
  offered: 'یک مسیر یادگیری در دنت‌کست — جامع‌ترین منبع فارسی پروتز',
  signer: 'دکتر فواد شهابیان',
  signerRole: 'بنیان‌گذار دنت‌کست',
  verified: 'گواهی تأییدشده',
  host: 'dentcast.ir/plus/certificate.html',
  fine: 'دنت‌کست تکمیل این مسیر و قبولی در آزمون پایانی آن را تأیید می‌کند. این گواهی امتیاز بازآموزی یا مدرک رسمی محسوب نمی‌شود.',
};

const FA_DATE = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const when = (iso) => { try { return FA_DATE.format(new Date(iso)); } catch (_) { return ''; } };

/* ------------------------------------------------------------- assets -- */

let assetsPromise = null;

/** Load the two faces and the mark once, and never fail the caller over it. */
function loadAssets() {
  if (assetsPromise) return assetsPromise;
  const face = async (family, url, weight) => {
    try {
      const f = new FontFace(family, `url('${url}')`, { weight });
      await f.load();
      document.fonts.add(f);
      return true;
    } catch (_) { return false; }
  };
  const logo = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = '/logo-v2.png';
  });
  assetsPromise = Promise.all([
    face('Vazirmatn', '/fonts/Vazirmatn[wght].woff2', '400'),
    face('Amiri', '/fonts/Amiri-Bold-arabic.woff2', '700'),
    logo,
  ]).then(([, amiri, mark]) => ({ amiri, mark }));
  return assetsPromise;
}

/* ------------------------------------------------------------ drawing -- */

/**
 * Text helper. Everything on this document is right-aligned (RTL) except the
 * Latin code and URL, which are drawn left-to-right at a left edge.
 */
function text(ctx, str, x, y, { size, weight = '400', family = 'Vazirmatn', color = NAVY, align = 'right', ltr = false }) {
  ctx.save();
  ctx.direction = ltr ? 'ltr' : 'rtl';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${family}, sans-serif`;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** Break `str` into lines that fit `max` px, at the current font. */
function wrap(ctx, str, max, font) {
  ctx.save();
  ctx.font = font;
  const words = String(str).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) { lines.push(line); line = w; }
    else line = next;
  }
  if (line) lines.push(line);
  ctx.restore();
  return lines;
}

/**
 * Draw the certificate onto `ctx` at `w`×`h`, in the same proportions and the
 * same order as the DOM sheet: mark and kicker, date, name, the claim, the
 * pathway, the institution line, then signature / verification / fine print.
 *
 * `u` is one design unit — the DOM sheet's `font-size: 1.3cqw` — so every
 * number below is the same multiple of it that the CSS uses in `em`.
 */
function drawSheet(ctx, v, { w, h, mark, amiri, square }) {
  const u = square ? w * 0.030 : w * 0.013;
  const padX = square ? w * 0.08 : w * 0.07;
  const padTop = square ? w * 0.08 : h * 0.088;
  const padBottom = square ? w * 0.08 : h * 0.065;
  const right = w - padX;             // the RTL start edge
  const left = padX;
  const nameFamily = amiri ? 'Amiri' : 'Vazirmatn';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  /* ---- top: mark at the start, kicker at the end ---- */
  let y = padTop + u * 1.6;
  const markSize = u * 2.3;
  if (mark) ctx.drawImage(mark, right - markSize, y - markSize * 0.92, markSize, markSize * (mark.height / mark.width));
  text(ctx, CERT_TEXT.brand, right - markSize - u * 0.7, y, { size: u * 1.28, weight: '700' });

  const kick = v.revoked ? CERT_TEXT.revoked : CERT_TEXT.kicker;
  ctx.save();
  ctx.font = `500 ${u * 0.78}px Vazirmatn, sans-serif`;
  const kw = ctx.measureText(kick).width + u * 1.8;
  const kh = u * 1.9;
  ctx.strokeStyle = v.revoked ? '#8a2c2c' : HAIR;
  ctx.lineWidth = Math.max(1, u * 0.06);
  ctx.beginPath();
  ctx.roundRect(left, y - kh * 0.72, kw, kh, u * 0.3);
  ctx.stroke();
  ctx.restore();
  text(ctx, kick, left + kw / 2, y, {
    size: u * 0.78, weight: v.revoked ? '700' : '500',
    color: v.revoked ? '#8a2c2c' : MUTED, align: 'center',
  });

  /* ---- body, vertically centred like the DOM's 1fr row ---- */
  const bodyTop = padTop + u * 5.2;
  const bodyBottom = h - padBottom - (square ? u * 5.4 : u * 7.2);
  const maxText = w - padX * 2;

  const pathLines = wrap(ctx, v.pathway_title_fa, Math.min(maxText, u * 24), `700 ${u * 1.85}px Vazirmatn, sans-serif`);
  const blockH = u * (0.86 + 1.1) + u * 3.6 * 1.25 + u * 1.06 * 1.9 * 2
    + pathLines.length * u * 1.85 * 1.45 + u * 0.9 * 1.9;
  let by = bodyTop + Math.max(0, (bodyBottom - bodyTop - blockH) / 2);

  by += u * 0.86;
  text(ctx, when(v.issued_at), right, by, { size: u * 0.86, color: MUTED });

  by += u * 3.6 * 1.05;
  text(ctx, v.holder_name || '—', right, by, { size: u * 3.6, weight: '700', family: nameFamily });

  by += u * 1.06 * 1.9;
  text(ctx, CERT_TEXT.lead1, right, by, { size: u * 1.06, color: NAVY_SOFT });

  for (const line of pathLines) {
    by += u * 1.85 * 1.45;
    text(ctx, line, right, by, { size: u * 1.85, weight: '700' });
  }

  by += u * 1.06 * 1.9;
  text(ctx, CERT_TEXT.lead2, right, by, { size: u * 1.06, color: NAVY_SOFT });

  by += u * 0.9 * 1.9;
  text(ctx, CERT_TEXT.offered, right, by, { size: u * 0.9, color: MUTED });

  /* ---- foot: signature, verification, fine print ---- */
  const fineH = square ? 0 : u * 0.68 * 1.7 * 2;
  const footBase = h - padBottom - fineH;

  ctx.strokeStyle = HAIR;
  ctx.lineWidth = Math.max(1, u * 0.05);
  ctx.beginPath();
  ctx.moveTo(left, footBase - u * 4.4);
  ctx.lineTo(right, footBase - u * 4.4);
  ctx.stroke();

  // signature (start edge)
  const sigY = footBase - u * 2.1;
  ctx.save();
  ctx.strokeStyle = NAVY;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1, u * 0.05);
  ctx.beginPath();
  ctx.moveTo(right - u * 13, sigY - u * 1.5);
  ctx.lineTo(right, sigY - u * 1.5);
  ctx.stroke();
  ctx.restore();
  text(ctx, CERT_TEXT.signer, right, sigY, { size: u, weight: '600' });
  text(ctx, CERT_TEXT.signerRole, right, sigY + u * 1.25, { size: u * 0.8, color: MUTED });

  // verification (end edge)
  if (!square) {
    const bx = left + u * 0.68;
    ctx.save();
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(bx, sigY - u * 2.3, u * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    text(ctx, '✓', bx, sigY - u * 2.08, { size: u * 0.7, weight: '700', color: '#fff', align: 'center' });
    text(ctx, CERT_TEXT.verified, left + u * 1.55, sigY - u * 2.08, { size: u * 0.82, weight: '600', align: 'left' });
  }
  text(ctx, v.verify_code, left, sigY, { size: u * 0.9, weight: '600', align: 'left', ltr: true });
  text(ctx, CERT_TEXT.host, left, sigY + u * 1.25, { size: u * 0.76, color: MUTED, align: 'left', ltr: true });

  // fine print, full width, wrapped
  if (!square) {
    const fineLines = wrap(ctx, CERT_TEXT.fine, maxText, `400 ${u * 0.68}px Vazirmatn, sans-serif`);
    let fy = footBase + u * 0.68 * 1.7;
    for (const line of fineLines) {
      text(ctx, line, right, fy, { size: u * 0.68, color: FAINT });
      fy += u * 0.68 * 1.7;
    }
  }

  if (v.revoked) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.34)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/* -------------------------------------------------------------- public -- */

/** A4 landscape at ~150dpi, and the square for a story. */
export const FORMATS = {
  a4: { w: 1754, h: 1240, square: false, suffix: 'a4' },
  square: { w: 1400, h: 1400, square: true, suffix: 'square' },
};

/** Render the certificate to a canvas. Exported so a test can measure it. */
export async function certificateCanvas(v, format = 'a4') {
  const f = FORMATS[format] || FORMATS.a4;
  const { mark, amiri } = await loadAssets();
  const canvas = document.createElement('canvas');
  canvas.width = f.w;
  canvas.height = f.h;
  const ctx = canvas.getContext('2d');
  drawSheet(ctx, v, { w: f.w, h: f.h, mark, amiri, square: f.square });
  return canvas;
}

/** `certificate-DC-K4M-7QA-a4.png` — the code is what makes the file findable. */
export function certificateFilename(v, format = 'a4') {
  const f = FORMATS[format] || FORMATS.a4;
  return `dentcast-certificate-${v.verify_code}-${f.suffix}.png`;
}

/**
 * Download the certificate as a PNG.
 *
 * `toBlob` rather than a `toDataURL` href: a 1754×1240 data URL is a
 * multi-megabyte string in the DOM, and Safari has refused to navigate to
 * one. The object URL is revoked on the next frame, after the click has been
 * dispatched — revoking synchronously cancels the download in Firefox.
 */
export async function downloadCertificate(v, format = 'a4') {
  const canvas = await certificateCanvas(v, format);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('could_not_render');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = certificateFilename(v, format);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return blob;
}
