import { one, query, type Queryable } from '../db.js';
import { mintReference } from './reference.js';

/**
 * ارزیاب DES — a reader's submission and the founder's queue over it.
 *
 * Mirrors services/support.ts's ticket queue on purpose: a reference tag
 * minted with mintReference('D') (support uses 'T'), a per-user open cap
 * enforced by a query rather than a counter column, and a founder-facing
 * queue ordered oldest-first. The one real difference is what "answered"
 * means — here it is a `paper_id` pointing at des_papers, never text typed
 * back into this table, so the score lives in exactly one place.
 */

export const MAX_OPEN_PER_USER = 2;

export interface DesRequest {
  id: string;
  user_id: string;
  reference: string;
  title: string;
  body: string | null;
  claim: 'ABSTRACT_ONLY' | 'FULL_TEXT';
  link: string | null;
  has_pdf: boolean;
  status: 'pending' | 'answered' | 'rejected';
  paper_id: string | null;
  created_at: string;
  answered_at: string | null;
}

const COLUMNS = 'id, user_id, reference, title, body, claim, link, has_pdf, status, paper_id, created_at, answered_at';

export async function openCountOf(userId: string, client?: Queryable): Promise<number> {
  const row = await one<{ n: number }>(
    "select count(*)::int as n from des_requests where user_id = $1 and status = 'pending'",
    [userId],
    client,
  );
  return row?.n ?? 0;
}

/** This reader's own OPEN requests, for the panel's "در نوبت" view. */
export async function openRequestsOf(userId: string): Promise<DesRequest[]> {
  const r = await query<DesRequest>(
    `select ${COLUMNS} from des_requests
      where user_id = $1 and status = 'pending' order by created_at`,
    [userId],
  );
  return r.rows;
}

export interface SubmitInput {
  userId: string;
  title: string;
  body: string;
  claim: 'ABSTRACT_ONLY' | 'FULL_TEXT';
  link: string | null;
  hasPdf: boolean;
}

/**
 * File a new pending request. Retries the astronomically unlikely reference
 * collision, the same shape support.ts's openTicket() and gift-redemption's
 * startRedemption() both use.
 */
export async function createRequest(input: SubmitInput): Promise<DesRequest> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return (await one<DesRequest>(
        `insert into des_requests (user_id, reference, title, body, claim, link, has_pdf)
         values ($1, $2, $3, $4, $5, $6, $7) returning ${COLUMNS}`,
        [input.userId, mintReference('D'), input.title, input.body || null, input.claim, input.link, input.hasPdf],
      ))!;
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
      // reference collision — try again with a freshly minted one
    }
  }
  throw new Error('could not mint a unique reference after 5 attempts');
}

export interface QueueRow extends DesRequest {
  display_name: string | null;
  phone: string | null;
}

/** The founder's queue: oldest pending first — whoever waited longest goes first. */
export async function requestQueue(): Promise<QueueRow[]> {
  const r = await query<QueueRow>(
    `select r.${COLUMNS.replace(/, /g, ', r.')}, p.display_name, p.phone
       from des_requests r join profiles p on p.id = r.user_id
      where r.status = 'pending'
      order by r.created_at`,
  );
  return r.rows;
}

export async function getRequest(id: string): Promise<QueueRow | null> {
  return one<QueueRow>(
    `select r.${COLUMNS.replace(/, /g, ', r.')}, p.display_name, p.phone
       from des_requests r join profiles p on p.id = r.user_id
      where r.id = $1`,
    [id],
  );
}

/** Found the way a human holds it — by the code typed under a Telegram PDF. */
export async function requestByReference(reference: string): Promise<QueueRow | null> {
  return one<QueueRow>(
    `select r.${COLUMNS.replace(/, /g, ', r.')}, p.display_name, p.phone
       from des_requests r join profiles p on p.id = r.user_id
      where r.reference = $1`,
    [reference.trim().toUpperCase()],
  );
}

export async function markAnswered(id: string, paperId: string, client?: Queryable): Promise<void> {
  await query(
    "update des_requests set status = 'answered', paper_id = $2, answered_at = now() where id = $1",
    [id, paperId],
    client,
  );
}

export async function markRejected(id: string): Promise<void> {
  await query("update des_requests set status = 'rejected' where id = $1", [id]);
}
