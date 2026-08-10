import type { FastifyInstance } from 'fastify';
import {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel, AlignmentType, ShadingType,
} from 'docx';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { pool } from '../db.js';
import { ITEM_SELECT, resolveItem, type ItemRow } from './collections.js';
import { getContentInfo } from '../content-index.js';

// Board export: a Word handout built server-side, IN MEMORY, streamed — docx
// is just zipped XML, tiny CPU, and no temp file may touch the ephemeral
// container disk. Board order (position asc nulls last, created_at desc, the
// same query GET /collections/:id uses) becomes the handout's order: the
// existing چیدمانِ دستی feature IS the export order, no separate step.
//
// pptx (Phase E) is gated behind a manual real-PowerPoint RTL check and is not
// built yet — only `format=docx` is accepted here.

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

export async function collectionExportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  // GET /collections/:id/export?format=docx - a Word handout, in the board's
  // own display order. `format` currently accepts only `docx` (or omitted).
  app.get('/collections/:id/export', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { format } = request.query as { format?: string };
    const userId = request.user!.id;

    if (format && format !== 'docx') return reply.code(400).send({ error: 'unsupported_format' });

    const col = await pool.query<{ title: string; description: string | null }>(
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

    const body: Paragraph[] = [];
    body.push(new Paragraph({
      text: board.title, heading: HeadingLevel.HEADING_1, bidirectional: true, alignment: AlignmentType.RIGHT,
    }));
    if (board.description) body.push(rtlParagraph(board.description));
    body.push(rtlParagraph(toFa(items.length) + ' پین — ' + JALALI.format(new Date())));

    // References are collected as they're walked, then rendered once at the
    // end under «منابع» — never in-flow with the rest of the board.
    const references: typeof items = [];
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
    const buffer = await Packer.toBuffer(doc);

    const id8 = id.slice(0, 8);
    const asciiName = 'dentcast-board-' + id8 + '.docx';
    const faName = rfc5987((board.title || 'board').trim()) + '.docx';

    reply.header('content-type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    reply.header('content-disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${faName}`);
    return reply.send(buffer);
  });
}
