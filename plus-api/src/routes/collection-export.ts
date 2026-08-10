import type { FastifyInstance } from 'fastify';
import {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel, AlignmentType, ShadingType,
} from 'docx';
// pptxgenjs ships CJS with ESM-style types that NodeNext models as a plain
// namespace — unusable as a constructor type. At runtime the namespace's
// `default` IS the constructor (verified by hand), so we type only the small
// surface this file actually touches and cast once at the import boundary.
import * as pptxgenjsModule from 'pptxgenjs';
interface PptxTextOptions { [key: string]: unknown }
interface PptxSlide {
  addText(text: string | { text: string; options: PptxTextOptions }[], options?: PptxTextOptions): void;
}
interface PptxPresentation {
  rtlMode: boolean;
  layout: string;
  addSlide(): PptxSlide;
  write(options: { outputType: 'nodebuffer' }): Promise<Buffer>;
}
// The interop shape differs by loader: plain node/vitest hand the constructor
// as `default`, while tsx (which `npm run dev` runs) double-wraps it as
// `default.default`. Resolve whichever is the function — at import time, once,
// so a loader change can never 500 the export route at request time.
const pptxNs = pptxgenjsModule as unknown as { default: unknown };
const Pptxgen = (
  typeof pptxNs.default === 'function' ? pptxNs.default : (pptxNs.default as { default: unknown }).default
) as new () => PptxPresentation;
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { pool } from '../db.js';
import { ITEM_SELECT, resolveItem, type ItemRow } from './collections.js';
import { getContentInfo } from '../content-index.js';

// Board export: a Word handout (docx) or a slide skeleton (pptx) built
// server-side, IN MEMORY, streamed — both are just zipped XML, tiny CPU, and
// no temp file may touch the ephemeral container disk. Board order (position
// asc nulls last, created_at desc, the same query GET /collections/:id uses)
// becomes the export's order: the existing چیدمانِ دستی feature IS the
// slide/handout order, no separate step.
//
// pptx passed the handoff §4.3 acceptance gate on 2026-08-10: the founder
// opened a mixed fa/en sample deck and ruled the text intact («حروف به هم
// نریختن»). Known blemish, accepted: Google's Docs/Slides viewers ignore the
// per-paragraph rtl flag (bullets render on the left there); real PowerPoint
// honors it. The slide XML is also verified mechanically in tests
// (per-paragraph rtl="1" + algn="r", LTR Latin citations).

const SITE_ORIGIN = 'https://dentcast.ir';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number | string): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
const JALALI = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });

// Mirrors plus/js/hl-view.js's looksLatin — kept in sync by eye, not by
// import, since this is server code and that module is browser-only.
function looksLatin(s: string | null | undefined): boolean {
  return !/[؀-ۿ]/.test(String(s ?? ''));
}

function rtlParagraph(text: string, extra: Record<string, unknown> = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun(text)], bidirectional: true, alignment: AlignmentType.RIGHT, ...extra,
  });
}
// A Latin-only line (an English citation, a bare DOI) reads left-to-right and
// carries none of the RTL paragraph properties a Persian line needs.
function ltrParagraph(text: string, extra: Record<string, unknown> = {}): Paragraph {
  return new Paragraph({ children: [new TextRun(text)], alignment: AlignmentType.LEFT, ...extra });
}
function autoParagraph(text: string, extra: Record<string, unknown> = {}): Paragraph {
  return looksLatin(text) ? ltrParagraph(text, extra) : rtlParagraph(text, extra);
}

// «Breschi L, et al.» already ends in its own period — appending another
// blindly would double it (same guard as the client's copy-citation button).
function withDot(s: string, sep = '.'): string {
  return /[.!?]$/.test(s) ? s : s + sep;
}
function vancouverCitation(item: ReturnType<typeof resolveItem>): string {
  const parts: string[] = [];
  if (item.authors) parts.push(withDot(item.authors));
  parts.push(withDot(item.title || ''));
  if (item.venue) parts.push(withDot(item.venue, item.year ? ';' : '.'));
  if (item.year) parts.push(item.year + '.');
  if (item.doi) parts.push('doi:' + item.doi);
  return parts.join(' ');
}

// RFC 5987 ext-value encoding for the Persian filename*= — content-disposition
// needs both an ASCII fallback (the id-based name) and the real Persian title.
function rfc5987(str: string): string {
  return encodeURIComponent(str).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

type ResolvedItem = ReturnType<typeof resolveItem>;
interface BoardInfo { title: string; description: string | null }

// The workbench label vocabulary (plus/js/config.js LABELS) — a highlight
// slide's best title is the reader's own label when they gave it one.
const LABEL_FA: Record<string, string> = { important: 'مهم', unclear: 'مبهم', clinical_pearl: 'نکته بالینی' };

function buildDocx(board: BoardInfo, items: ResolvedItem[]): Promise<Buffer> {
  const body: Paragraph[] = [];
  body.push(new Paragraph({
    text: board.title, heading: HeadingLevel.HEADING_1, bidirectional: true, alignment: AlignmentType.RIGHT,
  }));
  if (board.description) body.push(rtlParagraph(board.description));
  body.push(rtlParagraph(toFa(items.length) + ' پین — ' + JALALI.format(new Date())));

  // References are collected as they're walked, then rendered once at the
  // end under «منابع» — never in-flow with the rest of the board.
  const references: ResolvedItem[] = [];
  for (const item of items) {
    if (item.kind === 'highlight') {
      body.push(rtlParagraph(item.exact || '', {
        indent: { start: 720 }, shading: { fill: 'F4F6FB', type: ShadingType.CLEAR },
      }));
      if (item.note) body.push(rtlParagraph('یادداشت: ' + item.note));
      const info = item.content_id ? getContentInfo(item.content_id) : null;
      body.push(rtlParagraph('از: ' + (info?.title ?? item.content_id ?? '')));
    } else if (item.kind === 'text') {
      if (item.title) {
        body.push(new Paragraph({
          text: item.title, heading: HeadingLevel.HEADING_2, bidirectional: true, alignment: AlignmentType.RIGHT,
        }));
      }
      for (const line of String(item.body || '').split(/\r?\n/)) {
        if (line.trim()) body.push(rtlParagraph(line));
      }
    } else if (item.kind === 'page') {
      const absUrl = SITE_ORIGIN + (item.url || '');
      body.push(new Paragraph({
        children: [new ExternalHyperlink({
          link: absUrl, children: [new TextRun({ text: item.title || absUrl, style: 'Hyperlink' })],
        })],
        bidirectional: true, alignment: AlignmentType.RIGHT,
      }));
    } else if (item.kind === 'reference') {
      references.push(item);
    }
  }

  if (references.length) {
    body.push(new Paragraph({
      text: 'منابع', heading: HeadingLevel.HEADING_1, bidirectional: true, alignment: AlignmentType.RIGHT,
    }));
    references.forEach((ref, i) => {
      body.push(autoParagraph((i + 1) + '. ' + vancouverCitation(ref)));
      if (ref.body) body.push(autoParagraph(ref.body, { indent: { start: 720 } }));
    });
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Vazirmatn' } } } },
    sections: [{ children: body }],
  });
  return Packer.toBuffer(doc);
}

// One slide per non-reference pin (title = label/title/source, body = the
// text), first slide = board title + description, last slide = «منابع».
// Every Persian text frame carries rtlMode + right alignment PER PARAGRAPH —
// that is what puts rtl="1"/algn="r" on each a:pPr, which is what PowerPoint
// actually reads for bullet direction and mixed fa/en line order.
function buildPptx(board: BoardInfo, items: ResolvedItem[]): Promise<Buffer> {
  const pres = new Pptxgen();
  pres.rtlMode = true;
  pres.layout = 'LAYOUT_16x9';
  const FONT = 'Vazirmatn';
  const rtlText = (opts: Record<string, unknown> = {}) => ({
    align: 'right' as const, rtlMode: true, fontFace: FONT, ...opts,
  });

  const title = pres.addSlide();
  title.addText(board.title, rtlText({ x: 0.5, y: 1.6, w: 9, h: 1.2, fontSize: 32, bold: true }));
  if (board.description) {
    title.addText(board.description, rtlText({ x: 0.5, y: 2.9, w: 9, h: 0.9, fontSize: 16, color: '4A5F85' }));
  }
  title.addText(toFa(items.length) + ' پین — ' + JALALI.format(new Date()),
    rtlText({ x: 0.5, y: 4.6, w: 9, h: 0.5, fontSize: 12, color: '8AAAC8' }));

  const references: ResolvedItem[] = [];
  for (const item of items) {
    if (item.kind === 'reference') { references.push(item); continue; }
    const slide = pres.addSlide();

    let heading = '';
    const bodyLines: { text: string; options: Record<string, unknown> }[] = [];
    const bullet = (text: string, opts: Record<string, unknown> = {}) => {
      bodyLines.push({ text, options: rtlText({ bullet: true, breakLine: true, ...opts }) });
    };

    if (item.kind === 'highlight') {
      const info = item.content_id ? getContentInfo(item.content_id) : null;
      heading = (item.label && LABEL_FA[item.label]) || info?.title || item.content_id || '';
      bullet(item.exact || '');
      if (item.note) bullet('یادداشت: ' + item.note);
      if (info?.title) bullet('از: ' + info.title, { fontSize: 12, color: '8AAAC8' });
    } else if (item.kind === 'text') {
      heading = item.title || 'متن خودم';
      for (const line of String(item.body || '').split(/\r?\n/)) {
        if (line.trim()) bullet(line);
      }
    } else if (item.kind === 'page') {
      heading = item.title || '';
      bullet(SITE_ORIGIN + (item.url || ''), { rtlMode: false, align: 'left' });
    }

    slide.addText(heading, rtlText({ x: 0.5, y: 0.4, w: 9, h: 0.9, fontSize: 24, bold: true }));
    if (bodyLines.length) {
      slide.addText(bodyLines, { x: 0.5, y: 1.5, w: 9, h: 3.6, fontSize: 16, fontFace: FONT });
    }
  }

  if (references.length) {
    const slide = pres.addSlide();
    slide.addText('منابع', rtlText({ x: 0.5, y: 0.4, w: 9, h: 0.9, fontSize: 24, bold: true }));
    const lines = references.map((ref, i) => {
      const citation = (i + 1) + '. ' + vancouverCitation(ref);
      // A Latin citation is a plain LTR paragraph; a Persian (manual-entry)
      // reference keeps the RTL treatment like every other Persian line.
      return looksLatin(citation)
        ? { text: citation, options: { align: 'left' as const, breakLine: true } }
        : { text: citation, options: rtlText({ breakLine: true }) };
    });
    slide.addText(lines, { x: 0.5, y: 1.5, w: 9, h: 3.6, fontSize: 14, fontFace: FONT });
  }

  return pres.write({ outputType: 'nodebuffer' }) as Promise<Buffer>;
}

export async function collectionExportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  // GET /collections/:id/export?format=docx|pptx - a Word handout or a slide
  // skeleton, in the board's own display order. Omitted format = docx.
  app.get('/collections/:id/export', async (request, reply) => {
    const { id } = request.params as { id: string };
    const format = (request.query as { format?: string }).format || 'docx';
    const userId = request.user!.id;

    if (format !== 'docx' && format !== 'pptx') return reply.code(400).send({ error: 'unsupported_format' });

    const col = await pool.query<BoardInfo>(
      `select title, description from collections where id = $1 and user_id = $2`,
      [id, userId],
    );
    if (col.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    const board = col.rows[0];

    const itemsRes = await pool.query<ItemRow>(
      `${ITEM_SELECT} where ci.collection_id = $1
       order by ci.position asc nulls last, ci.created_at desc`,
      [id],
    );
    const items = itemsRes.rows.map(resolveItem);

    const buffer = format === 'pptx' ? await buildPptx(board, items) : await buildDocx(board, items);

    const id8 = id.slice(0, 8);
    const asciiName = 'dentcast-board-' + id8 + '.' + format;
    const faName = rfc5987((board.title || 'board').trim()) + '.' + format;
    const contentType = format === 'pptx'
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    reply.header('content-type', contentType);
    reply.header('content-disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${faName}`);
    return reply.send(buffer);
  });
}
