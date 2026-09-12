import type pg from 'pg';
import { config } from '../config.js';
import { pool, one, query, withTransaction, type Queryable } from '../db.js';
import { getPathwayById } from '../pathways.js';
import { mintReference, normalizeReference } from './reference.js';
import { insertGrant } from './discount-credits.js';
import { sendCapped } from './notify-policy.js';

/**
 * THE PATHWAY COMPLETION CERTIFICATE.
 *
 * What is WRITTEN is the founder's decision — one `certificates` row — and
 * everything a third party can check is derived from it. The same move
 * `badge_grants` and `pillar_grants` make: the exam, the reading, the
 * standings sweep are all inputs to a decision a person takes on the admin
 * panel, and the row is that decision, not a cache of those inputs.
 *
 * Four rules the code depends on.
 *
 * **The code is the point** (`services/reference.ts`, prefix `DC`). It goes
 * on a LinkedIn profile as the "credential ID", is typed by a stranger into
 * our verify page, and is read back off a phone screen — so it uses the same
 * no-0/O-1/I-5/S-8/B alphabet gift cards and support tickets already use.
 * Minted with a retry on the unique index rather than a bigger alphabet: six
 * characters is what a human will actually retype.
 *
 * **`holder_name` is frozen at issue.** Not a join to `profiles.display_name`,
 * which defaults to a generated pseudonym and can be renamed at will — the
 * verify page must always agree with the paper it is verifying.
 *
 * **Revoked, never deleted.** The code may already be on somebody's profile.
 * A missing row would read as "never existed"; a revoked one says what
 * happened, which is the honest answer to whoever is checking.
 *
 * **The ٪۱۰ is written, never derived** — an ordinary `discount_grants` row
 * in the same transaction (`kind: 'certificate'`), because pathway progress
 * goes BACKWARDS whenever publish step 5.6 files new content into a pathway,
 * and a credit derived from "finished the pathway" would silently vanish
 * with it (services/pathway-standings.ts). Ten is one purchase's whole cap
 * on purpose: spent in a single purchase, never sliced across several.
 *
 * The verify surface is PUBLIC and deliberately thin: name as printed,
 * pathway title, issue date, revoked-or-not. No user id, no phone, no
 * display name, nothing that ties the paper back to an account.
 */

export interface Certificate {
  id: string;
  user_id: string;
  pathway_id: string;
  verify_code: string;
  holder_name: string | null;
  exam_id: string | null;
  attempt_id: string | null;
  issued_at: Date;
  revoked_at: Date | null;
  discount_grant_id: string | null;
}

/** What the world may see. Nothing here identifies an account. */
export interface CertificateVerification {
  verify_code: string;
  holder_name: string;
  pathway_id: string;
  pathway_title_fa: string;
  issued_at: Date;
  revoked: boolean;
  revoked_at: Date | null;
}

const PREFIX = 'DC';
const MINT_TRIES = 8;

const CERT_SELECT = `select id, user_id, pathway_id, verify_code, holder_name, exam_id, attempt_id,
                            issued_at, revoked_at, discount_grant_id
                       from certificates`;

export interface IssueInput {
  holderName: string;
  examId?: string | null;
  /** The exam attempt that earned it, when one did (services/pathway-exams.ts). */
  attemptId?: string | null;
  /**
   * Run inside a caller's transaction instead of opening one — the exam
   * service marks an attempt `passed` and issues the certificate as ONE act,
   * so a reader can never be passed with no certificate or the reverse.
   */
  client?: pg.PoolClient;
  /** Override the configured credit; 0 issues with no credit at all. */
  discountPercent?: number;
  /** Send the reader an اطلاعیه about it (default true). */
  notify?: boolean;
}

export interface IssueResult {
  ok: true;
  certificate: Certificate;
  /** False when this reader already held a live certificate for the pathway. */
  created: boolean;
  discount_percent: number;
}

/**
 * Issue a certificate — idempotent per (reader, pathway) while one is live.
 *
 * A second issue for the same pathway while the first is not revoked hands
 * back the existing row and writes nothing: pressing the button twice must
 * not mint two codes or two credits. After a revoke, a fresh issue is a fresh
 * certificate with a fresh code — the old one stays on record as revoked.
 */
export async function issueCertificate(
  userId: string,
  pathwayId: string,
  input: IssueInput,
): Promise<IssueResult> {
  const pathway = getPathwayById(pathwayId);
  if (!pathway || pathway.kind === 'bundle') throw new Error('unknown_pathway');
  const holderName = input.holderName.trim();
  if (!holderName) throw new Error('holder_name_required');
  const percent = input.discountPercent ?? config.certificate.discountPercent;

  const run = async (client: pg.PoolClient) => {
    const live = await one<Certificate>(
      `${CERT_SELECT} where user_id = $1 and pathway_id = $2 and revoked_at is null`,
      [userId, pathwayId], client,
    );
    if (live) return { certificate: live, created: false };

    let grantId: string | null = null;
    if (percent > 0) {
      const rows = await insertGrant(userId, {
        percent,
        kind: 'certificate',
        label_fa: `گواهی «${pathway.title_fa}»`,
      }, client);
      grantId = rows[0]?.id ?? null;
    }

    const certificate = await insertWithFreshCode(client, {
      userId, pathwayId, holderName, examId: input.examId ?? null, attemptId: input.attemptId ?? null, grantId,
    });
    return { certificate, created: true };
  };
  const result = input.client ? await run(input.client) : await withTransaction(run);

  if (result.created && input.notify !== false) {
    await notifyIssued(userId, result.certificate, pathway.title_fa, percent);
  }
  return { ok: true, ...result, discount_percent: result.created ? percent : 0 };
}

/**
 * Insert with a minted code, retrying on the unique index. The window for a
 * collision is 27^6 ≈ 387M, so a retry is essentially theoretical — but the
 * alternative on the one day it happens is a 500 on the founder's button.
 */
async function insertWithFreshCode(
  client: pg.PoolClient,
  row: {
    userId: string; pathwayId: string; holderName: string; examId: string | null;
    attemptId: string | null; grantId: string | null;
  },
): Promise<Certificate> {
  for (let i = 0; i < MINT_TRIES; i += 1) {
    const code = mintReference(PREFIX);
    await client.query('savepoint mint');
    try {
      const inserted = await one<Certificate>(
        `insert into certificates (user_id, pathway_id, verify_code, holder_name, exam_id, attempt_id, discount_grant_id)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning id, user_id, pathway_id, verify_code, holder_name, exam_id, attempt_id,
                   issued_at, revoked_at, discount_grant_id`,
        [row.userId, row.pathwayId, code, row.holderName, row.examId, row.attemptId, row.grantId],
        client,
      );
      await client.query('release savepoint mint');
      if (inserted) return inserted;
    } catch (err) {
      await client.query('rollback to savepoint mint');
      if ((err as { code?: string }).code !== '23505') throw err;
    }
  }
  throw new Error('could_not_mint_code');
}

async function notifyIssued(
  userId: string, cert: Certificate, pathwayTitle: string, percent: number,
): Promise<void> {
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const fa = (n: number) => String(n).replace(/\d/g, (d) => FA[Number(d)]);
  const body = `گواهی تکمیل مسیر «${pathwayTitle}» به نام ${cert.holder_name} صادر شد. `
    + `کد: ${cert.verify_code}`
    + (percent > 0 ? ` · ${fa(percent)}٪ تخفیف برای خرید بعدی‌ات ثبت شد.` : '');
  // 'system' — a founder decision about one reader, exempt from the daily cap,
  // exactly as POST /admin/notices/user is. A certificate must not be the
  // notification a streak nudge crowded out.
  await sendCapped(userId, {
    title: 'گواهی‌ات صادر شد',
    body,
    url: `/plus/certificate.html?c=${cert.verify_code}`,
    tag: 'certificate',
  }, 'system');
}

/** Mark a certificate revoked. The row stays; the verify page says so. */
export async function revokeCertificate(id: string, client: Queryable = pool): Promise<boolean> {
  const r = await query(
    'update certificates set revoked_at = now() where id = $1 and revoked_at is null',
    [id], client,
  );
  return (r.rowCount ?? 0) > 0;
}

/** Every certificate one reader holds, live and revoked, newest first. */
export async function listCertificates(userId: string, client: Queryable = pool): Promise<Certificate[]> {
  const r = await query<Certificate>(
    `${CERT_SELECT} where user_id = $1 order by issued_at desc`, [userId], client,
  );
  return r.rows;
}

export async function getCertificate(id: string, client: Queryable = pool): Promise<Certificate | null> {
  return one<Certificate>(`${CERT_SELECT} where id = $1`, [id], client);
}

/**
 * The public answer. A code that matches nothing is `null` — the caller
 * decides how to say "no such certificate", and says nothing more.
 */
export async function verifyCertificate(
  rawCode: string, client: Queryable = pool,
): Promise<CertificateVerification | null> {
  const code = normalizeReference(rawCode);
  if (!/^[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(code)) return null;
  const cert = await one<Certificate>(`${CERT_SELECT} where verify_code = $1`, [code], client);
  if (!cert) return null;
  const pathway = getPathwayById(cert.pathway_id);
  return {
    verify_code: cert.verify_code,
    holder_name: cert.holder_name ?? '',
    pathway_id: cert.pathway_id,
    pathway_title_fa: pathway?.title_fa ?? cert.pathway_id,
    issued_at: cert.issued_at,
    revoked: cert.revoked_at !== null,
    revoked_at: cert.revoked_at,
  };
}

/** The founder's read: every certificate ever issued, newest first, with who. */
export async function certificateRoster(limit = 100): Promise<Array<Certificate & { display_name: string }>> {
  const r = await query<Certificate & { display_name: string }>(
    `select c.id, c.user_id, c.pathway_id, c.verify_code, c.holder_name, c.exam_id, c.attempt_id,
            c.issued_at, c.revoked_at, c.discount_grant_id, p.display_name
       from certificates c join profiles p on p.id = c.user_id
      order by c.issued_at desc limit $1`,
    [limit],
  );
  return r.rows;
}
