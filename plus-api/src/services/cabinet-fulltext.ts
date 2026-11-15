import { pool } from '../db.js';

/**
 * Full-text search inside the cabinet's PDFs (migration 0075).
 *
 * Writing is the founder's upload tool (tools/cabinet_fulltext.py → the two
 * admin routes); reading is one premium route that answers «which papers say
 * this, and where». The reader never receives a paper's text, only a fragment
 * of at most FRAGMENT_WORDS words around the match.
 */

// A tsvector holds at most 1 MB; a full journal issue or a book can pass
// that. The body is cut here, on a line break, so one oversized PDF can never
// make a whole upload batch fail — its first MAX_BODY_CHARS stay searchable.
export const MAX_BODY_CHARS = 400_000;
export const MAX_RESULTS = 60;
const FRAGMENT_WORDS = 32;
// Match markers inside a fragment: control characters a PDF's text never
// carries after extraction (cleanBody strips them), so the client can escape
// the fragment and then turn exactly these into <mark>.
export const MARK_START = '\u0002';
export const MARK_END = '\u0003';

export const PAPER_ID_RE = /^P[0-9]{4,6}$/;

export interface FulltextUpload {
  id: string;
  text: string;
  pages?: number | null;
  sha256: string;
}

export function cleanBody(text: string): string {
  // NUL is not storable in a Postgres text column; the other C0 controls are
  // what the fragment markers are made of.
  let body = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ');
  if (body.length > MAX_BODY_CHARS) {
    const cut = body.lastIndexOf('\n', MAX_BODY_CHARS);
    body = body.slice(0, cut > MAX_BODY_CHARS * 0.9 ? cut : MAX_BODY_CHARS);
  }
  return body;
}

export async function upsertFulltexts(papers: FulltextUpload[]): Promise<{ written: number }> {
  let written = 0;
  for (const p of papers) {
    const r = await pool.query(
      `insert into cabinet_fulltext (paper_id, body, pages, text_sha256)
       values ($1, $2, $3, $4)
       on conflict (paper_id) do update
         set body = excluded.body, pages = excluded.pages, text_sha256 = excluded.text_sha256, updated_at = now()
         where cabinet_fulltext.text_sha256 is distinct from excluded.text_sha256`,
      [p.id, cleanBody(p.text), p.pages ?? null, p.sha256],
    );
    written += r.rowCount ?? 0;
  }
  return { written };
}

export async function deleteFulltexts(ids: string[]): Promise<{ deleted: number }> {
  const r = await pool.query(`delete from cabinet_fulltext where paper_id = any($1::text[])`, [ids]);
  return { deleted: r.rowCount ?? 0 };
}

export async function fulltextInventory(): Promise<{ count: number; papers: Array<{ id: string; sha256: string; pages: number | null }> }> {
  const r = await pool.query<{ id: string; sha256: string; pages: number | null }>(
    `select paper_id as id, text_sha256 as sha256, pages from cabinet_fulltext order by paper_id`,
  );
  return { count: r.rows.length, papers: r.rows };
}

export async function indexedCount(): Promise<number> {
  const r = await pool.query<{ n: string }>(`select count(*)::text as n from cabinet_fulltext`);
  return Number(r.rows[0]?.n ?? 0);
}

/**
 * The reader's words, in web-search syntax (quoted phrases, OR, -word), as
 * Postgres reads them. Ranked by cover density; the fragment is computed only
 * for the rows returned, because ts_headline re-parses the whole body.
 */
export async function searchFulltext(q: string, limit = MAX_RESULTS): Promise<Array<{ id: string; snippet: string; rank: number }>> {
  const r = await pool.query<{ id: string; snippet: string; rank: number }>(
    `with q as (select websearch_to_tsquery('english', $1) as query),
     hits as (
       select f.paper_id, f.body, ts_rank_cd(f.tsv, q.query) as rank
         from cabinet_fulltext f, q
        where f.tsv @@ q.query
        order by rank desc, f.paper_id
        limit $2
     )
     select h.paper_id as id, h.rank::float8 as rank,
            ts_headline('english', h.body, q.query, $3) as snippet
       from hits h, q
      order by h.rank desc, h.paper_id`,
    [q, limit, `StartSel=${MARK_START}, StopSel=${MARK_END}, MaxWords=${FRAGMENT_WORDS}, MinWords=12, MaxFragments=1, ShortWord=2`],
  );
  return r.rows.map((row) => ({ ...row, snippet: row.snippet.replace(/\s+/g, ' ').trim() }));
}
