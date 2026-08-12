import { config } from '../config.js';
import { one, query, withTransaction, type Queryable } from '../db.js';
import { getContentInfo } from '../content-index.js';
import { sendCapped } from './notify-policy.js';
import { mintReference } from './reference.js';

/**
 * Support tickets — the reader's own words, kept where both sides can find them.
 *
 * WHO MAY OPEN ONE IS DECIDED BY THE KIND, NOT BY THE PLAN. Gating the whole
 * feature behind premium reads well until you follow one case through: the
 * person asking for a student discount is asking BECAUSE they are not premium,
 * so a premium-only door means the only ticket that could ever earn us a
 * subscriber is the one that cannot be sent. `POST /pay/gift` already settled
 * this — it is requireAuth, never requirePremium, because somebody trying to
 * pay is not yet a customer. So the kinds that lead to a purchase (and the bug
 * report, which is a gift to us) are open to any signed-in reader, and what
 * premium buys is the OPEN-ENDED one: «پشتیبانی و مشاوره», a person to think
 * with rather than a transaction to complete.
 *
 * NOTHING DERIVABLE IS STORED (see migration 0041): last activity, message
 * count, and who the ticket is waiting on all come out of the thread itself.
 * `awaiting` in particular is just "who wrote last" — a stored flag would be
 * one more thing to forget to flip on a path somebody adds later, and it would
 * be the flag the founder's queue is sorted by.
 *
 * THE REFERENCE IS HOW A PHOTO GETS HERE. There is no upload in this system and
 * deliberately so — no object storage, and a student card is an identity
 * document, which is a liability to hold rather than an asset. The card is
 * photographed into a messenger with the ticket's tag typed under it, and the
 * tag is what matches it to the account waiting. Same move gift-redemption.ts
 * makes with a card code: the valuable thing never enters our system.
 */

export type TicketStatus = 'open' | 'closed';
export type TicketAuthor = 'user' | 'founder';

export interface TicketKindSpec {
  title_fa: string;
  /** Whether opening this kind requires a paid plan. */
  premium: boolean;
  /** Shown under the kind on the reader's form — what this queue is actually for. */
  hint_fa: string;
}

/**
 * The catalog. Kept here rather than in a JSON file on the site: unlike a badge
 * threshold or a pathway, a kind is not a number to retune — each one is a
 * promise about who may write and what happens next, and both live in code.
 */
export const TICKET_KINDS: Record<string, TicketKindSpec> = {
  billing: {
    title_fa: 'مشکل در پرداخت',
    premium: false,
    hint_fa: 'پرداخت کردید ولی اشتراک فعال نشد، یا فاکتور می‌خواهید.',
  },
  student: {
    title_fa: 'تخفیف دانشجویی',
    premium: false,
    // Says «از درگاه نخرید» out loud, because the gateway has no student
    // concept at all: startPayment knows «ستون» and badge credits and nothing
    // else, so a student who pays there is charged the full price and there is
    // no way to give the difference back except a hand-gifted month.
    hint_fa: '۱۵٪ تخفیف روی اشتراک شش‌ماهه، فقط از راه «واریز به حساب» — نه از درگاه. '
      + 'عکس کارت دانشجویی لازم است: پایین تیک بزنید تا کد پیگیری بگیرید.',
  },
  bug: {
    title_fa: 'مشکل فنی',
    premium: false,
    hint_fa: 'چه‌کاری کردید و چه پیش‌آمد. اگر اسکرین‌شات دارید، پایین تیک بزنید.',
  },
  // Not on the form — پشتیبانی و مشاوره is still a valid kind for OLD tickets
  // opened before this change (kindTitle() must keep resolving it), but the
  // form no longer offers it: «گفت‌وگوی زیر مطلب» is the premium question path
  // now (see .dentcast/support-payment-handoff.md decision 2.9).
  support: {
    title_fa: 'پشتیبانی و مشاوره',
    premium: true,
    hint_fa: 'هر سؤالی دربارهٔ محتوا، مسیرهای یادگیری و استفاده از پریمیوم.',
  },
  // Not offered on the support form — a thread of this kind is opened by
  // commenting under an article, and it is the one kind that can be published.
  article: {
    title_fa: 'گفت‌وگوی زیر مطلب',
    premium: true,
    hint_fa: 'زیر هر مطلب می‌توانید نظر یا سؤالتان را بنویسید.',
  },
};

/** The kinds the support form offers — `support` and `article` are not. */
export const FORM_KINDS = ['billing', 'student', 'bug'];

export function ticketKinds(): Array<{ key: string } & TicketKindSpec> {
  return FORM_KINDS.map((key) => ({ key, ...TICKET_KINDS[key] }));
}

/**
 * How many tickets one account may have open at once.
 *
 * A bound rather than a rate: the failure this prevents is not speed, it is a
 * queue nobody can triage because one person opened thirty threads. Closing one
 * frees the slot immediately, which is the behaviour a person with a real
 * second question expects.
 */
export const MAX_OPEN_PER_USER = 3;

const SUBJECT_MAX = 120;
const BODY_MAX = 4000;

export interface Ticket {
  id: string;
  user_id: string;
  reference: string;
  kind: string;
  subject: string;
  status: TicketStatus;
  closed_at: Date | null;
  created_at: Date;
  /** The article this thread hangs under; null for a support-page ticket. */
  content_id: string | null;
  /** Published to everyone by the founder. Never true unless somebody decided it. */
  is_public: boolean;
  made_public_at: Date | null;
  /**
   * The reader ticked «عکسی دارم که برای این درخواست می‌فرستم» — a claim they
   * made, not a derived fact (same kind of column as `status`). Lets the admin
   * queue show a «📎 عکس در راه» flag instead of the photo being a surprise.
   */
  has_photo: boolean;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author: TicketAuthor;
  body: string;
  created_at: Date;
}

const TICKET_COLUMNS =
  'id, user_id, reference, kind, subject, status, closed_at, created_at, '
  + 'content_id, is_public, made_public_at, has_photo';

/** What a reader's own surfaces call this kind — falls back to the raw key. */
export const kindTitle = (kind: string): string => TICKET_KINDS[kind]?.title_fa ?? kind;

export type OpenOutcome =
  | 'opened'
  | 'unknown_kind'
  | 'premium_required'
  | 'too_many_open'
  | 'empty';

export interface OpenResult {
  outcome: OpenOutcome;
  ticket: Ticket | null;
  message: string;
}

/**
 * Open a ticket and file its first message.
 *
 * Both rows commit together: a ticket whose opening message failed to land is a
 * subject line in the founder's queue with nothing to answer, and the reader
 * has no way to tell that is what happened.
 */
export async function openTicket(input: {
  userId: string;
  tier: string;
  kind: string;
  subject: string;
  body: string;
  hasPhoto?: boolean;
}): Promise<OpenResult> {
  const spec = TICKET_KINDS[input.kind];
  if (!spec) {
    return { outcome: 'unknown_kind', ticket: null, message: 'این دستهٔ درخواست وجود ندارد.' };
  }
  if (spec.premium && input.tier !== 'premium') {
    return {
      outcome: 'premium_required',
      ticket: null,
      message: 'پشتیبانی اختصاصی ویژهٔ اشتراک پریمیوم است. برای خرید و پرداخت یا تخفیف دانشجویی، دستهٔ مربوط را انتخاب کنید.',
    };
  }

  const subject = input.subject.trim().slice(0, SUBJECT_MAX);
  const body = input.body.trim().slice(0, BODY_MAX);
  if (!subject || !body) {
    return { outcome: 'empty', ticket: null, message: 'موضوع و متن پیام هر دو لازم‌اند.' };
  }

  // Only support-page tickets count against the bound. An article thread is not
  // a demand on the founder's triage in the same way — a reader may well be
  // mid-conversation under five different pages — and counting them would mean
  // commenting quietly locks somebody out of reporting a payment problem.
  const openNow = await one<{ n: number }>(
    `select count(*)::int as n from support_tickets
      where user_id = $1 and status = 'open' and content_id is null`,
    [input.userId],
  );
  if ((openNow?.n ?? 0) >= MAX_OPEN_PER_USER) {
    return {
      outcome: 'too_many_open',
      ticket: null,
      message: `هم‌زمان حداکثر ${MAX_OPEN_PER_USER} درخواست باز می‌توانید داشته باشید. یکی را ببندید و دوباره تلاش کنید.`,
    };
  }

  // Retry the astronomically unlikely tag collision rather than failing someone
  // who is mid-question. Same shape as startRedemption().
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const ticket = await withTransaction(async (client) => {
        const row = (await one<Ticket>(
          `insert into support_tickets (user_id, reference, kind, subject, has_photo)
           values ($1, $2, $3, $4, $5) returning ${TICKET_COLUMNS}`,
          [input.userId, mintReference('T'), input.kind, subject, !!input.hasPhoto],
          client,
        ))!;
        await query(
          "insert into ticket_messages (ticket_id, author, body) values ($1, 'user', $2)",
          [row.id, body], client,
        );
        return row;
      });
      await notifyFounder(ticket, body);
      return { outcome: 'opened', ticket, message: '' };
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
    }
  }
  throw new Error('ticket reference collision: exhausted retries');
}

/* ------------------------------------------------ threads under an article -- */

export type CommentOutcome = 'posted' | 'premium_required' | 'empty' | 'unknown_content';

/**
 * Comment under an article — find the reader's thread there, or start it.
 *
 * Deliberately find-or-create rather than "new comment": one reader's remarks
 * under one page are a conversation, and splitting them into parallel threads
 * would leave the founder answering the same person in three places. A thread
 * the reader had closed reopens on their next comment, for the same reason.
 *
 * Premium-only, and here that gate is simply right — unlike the support kinds,
 * where the reader most likely to need the door is the one who has not paid yet
 * (see the header), nobody needs to comment on an article in order to become a
 * subscriber.
 */
export async function commentOnArticle(input: {
  userId: string;
  tier: string;
  contentId: string;
  body: string;
}): Promise<{ outcome: CommentOutcome; ticket: Ticket | null; message: string }> {
  if (input.tier !== 'premium') {
    return {
      outcome: 'premium_required', ticket: null,
      message: 'نوشتن زیر مطلب‌ها ویژه‌ی اشتراک پریمیوم است.',
    };
  }
  const body = input.body.trim().slice(0, BODY_MAX);
  if (!body) return { outcome: 'empty', ticket: null, message: 'متن پیام خالی است.' };

  const contentId = input.contentId.trim().replace(/^\/+/, '').replace(/\.html$/i, '');
  if (!contentId) {
    return { outcome: 'unknown_content', ticket: null, message: 'این مطلب شناخته نشد.' };
  }

  const existing = await one<Ticket>(
    `select ${TICKET_COLUMNS} from support_tickets where user_id = $1 and content_id = $2`,
    [input.userId, contentId],
  );
  if (existing) {
    if (existing.status === 'closed') await reopenTicket(existing.id, input.userId);
    const r = await addMessage({ ticketId: existing.id, author: 'user', body, userId: input.userId });
    return { outcome: 'posted', ticket: r.ticket ?? existing, message: '' };
  }

  // The subject is the article's own title where the index knows it — the
  // founder's queue has to say WHICH page somebody is writing under, and a raw
  // content_id is not that. It is a snapshot on purpose: a retitled article does
  // not rewrite the thread that was opened under the old name.
  const subject = getContentInfo(contentId)?.title || contentId;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const ticket = await withTransaction(async (client) => {
        const row = (await one<Ticket>(
          `insert into support_tickets (user_id, reference, kind, subject, content_id)
           values ($1, $2, 'article', $3, $4) returning ${TICKET_COLUMNS}`,
          [input.userId, mintReference('T'), subject.slice(0, SUBJECT_MAX), contentId],
          client,
        ))!;
        await query(
          "insert into ticket_messages (ticket_id, author, body) values ($1, 'user', $2)",
          [row.id, body], client,
        );
        return row;
      });
      await notifyFounder(ticket, body);
      return { outcome: 'posted', ticket, message: '' };
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== '23505') throw err;
      // A reference collision retries; a racing second tab hitting the
      // per-(user, page) unique index means the thread now exists — fold into it
      // rather than telling the reader their comment failed.
      const raced = await one<Ticket>(
        `select ${TICKET_COLUMNS} from support_tickets where user_id = $1 and content_id = $2`,
        [input.userId, contentId],
      );
      if (raced) {
        const r = await addMessage({ ticketId: raced.id, author: 'user', body, userId: input.userId });
        return { outcome: 'posted', ticket: r.ticket ?? raced, message: '' };
      }
    }
  }
  throw new Error('thread reference collision: exhausted retries');
}

/**
 * Publish a thread, or take it back.
 *
 * The founder's switch, and the only thing that ever makes a reader's words
 * visible to anyone else. Unpublishing is a real path rather than a nicety: a
 * thread published in the morning may need to stop being public at noon, and
 * "delete it and ask them to write it again" is not a remedy.
 *
 * `made_public_at` is kept because it is NOT derivable from anything — it is a
 * decision's own timestamp, the same reason `closed_at` exists.
 */
export async function setThreadPublic(ticketId: string, isPublic: boolean): Promise<Ticket | null> {
  return one<Ticket>(
    `update support_tickets
        set is_public = $2,
            made_public_at = case when $2 then coalesce(made_public_at, now()) else null end
      where id = $1 and content_id is not null
      returning ${TICKET_COLUMNS}`,
    [ticketId, isPublic],
  );
}

export interface PublicThread {
  id: string;
  content_id: string;
  author_name: string;
  made_public_at: Date | null;
  messages: Array<{ author: TicketAuthor; body: string; created_at: Date }>;
}

/**
 * Every published thread under one page — the ONLY read path in this service
 * that answers without a session, because a published thread is part of the
 * page now.
 *
 * The author is their `display_name`, which defaults to a generated Persian
 * pseudonym (services/pseudonym.ts). That is what makes publishing safe to offer
 * at all: nobody is exposed under a name they did not choose, and a reader who
 * renamed themselves chose that too.
 */
export async function publicThreadsFor(contentId: string): Promise<PublicThread[]> {
  const r = await query<{
    id: string; content_id: string; author_name: string | null; made_public_at: Date | null;
    author: TicketAuthor; body: string; created_at: Date;
  }>(
    `select t.id, t.content_id, p.display_name as author_name, t.made_public_at,
            m.author, m.body, m.created_at
       from support_tickets t
       join profiles p on p.id = t.user_id
       join ticket_messages m on m.ticket_id = t.id
      where t.content_id = $1 and t.is_public
      order by t.made_public_at asc, t.id, m.created_at, m.id`,
    [contentId],
  );
  const out = new Map<string, PublicThread>();
  for (const row of r.rows) {
    let thread = out.get(row.id);
    if (!thread) {
      thread = {
        id: row.id,
        content_id: row.content_id,
        author_name: row.author_name || 'خواننده',
        made_public_at: row.made_public_at,
        messages: [],
      };
      out.set(row.id, thread);
    }
    thread.messages.push({ author: row.author, body: row.body, created_at: row.created_at });
  }
  return [...out.values()];
}

/** This reader's own thread under one page, with its messages. */
export async function myThreadFor(userId: string, contentId: string): Promise<
{ ticket: Ticket; messages: TicketMessage[] } | null> {
  const ticket = await one<Ticket>(
    `select ${TICKET_COLUMNS} from support_tickets where user_id = $1 and content_id = $2`,
    [userId, contentId],
  );
  if (!ticket) return null;
  return { ticket, messages: await messagesOf(ticket.id) };
}

/**
 * Append a message to a ticket.
 *
 * `author` decides who gets told: the founder's reply notifies the reader, and
 * the reader's reply notifies the founder. Neither side is notified about their
 * own writing, which is the one thing a shared code path here has to get right.
 */
export async function addMessage(input: {
  ticketId: string;
  author: TicketAuthor;
  body: string;
  /** Only checked for a reader — the founder may answer anybody's ticket. */
  userId?: string;
}): Promise<{ ok: boolean; message: string; ticket: Ticket | null; row: TicketMessage | null }> {
  const body = input.body.trim().slice(0, BODY_MAX);
  if (!body) return { ok: false, message: 'متن پیام خالی است.', ticket: null, row: null };

  const ticket = await getTicket(input.ticketId, input.userId);
  if (!ticket) return { ok: false, message: 'این درخواست پیدا نشد.', ticket: null, row: null };
  if (ticket.status === 'closed') {
    return { ok: false, message: 'این درخواست بسته شده است.', ticket, row: null };
  }

  const row = (await one<TicketMessage>(
    `insert into ticket_messages (ticket_id, author, body) values ($1, $2, $3)
     returning id, ticket_id, author, body, created_at`,
    [ticket.id, input.author, body],
  ))!;

  if (input.author === 'founder') await notifyReader(ticket, body);
  else await notifyFounder(ticket, body);

  return { ok: true, message: '', ticket, row };
}

/** One ticket. Pass `userId` to scope it to its owner; omit for the founder. */
export async function getTicket(
  ticketId: string,
  userId?: string,
  client?: Queryable,
): Promise<Ticket | null> {
  return one<Ticket>(
    `select ${TICKET_COLUMNS} from support_tickets
      where id = $1 ${userId ? 'and user_id = $2' : ''}`,
    userId ? [ticketId, userId] : [ticketId],
    client,
  );
}

/** A ticket looked up the way a human holds it — by the tag they typed. */
export async function ticketByReference(reference: string): Promise<Ticket | null> {
  return one<Ticket>(
    `select ${TICKET_COLUMNS} from support_tickets where reference = $1`,
    [reference],
  );
}

export async function messagesOf(ticketId: string): Promise<TicketMessage[]> {
  const r = await query<TicketMessage>(
    `select id, ticket_id, author, body, created_at from ticket_messages
      where ticket_id = $1 order by created_at, id`,
    [ticketId],
  );
  return r.rows;
}

export interface TicketSummary extends Ticket {
  kind_title_fa: string;
  message_count: number;
  last_at: Date;
  last_author: TicketAuthor;
  last_excerpt: string;
  /** Whose turn it is — derived from who wrote last, never stored. */
  awaiting: TicketAuthor;
}

/**
 * The summary both queues are built from.
 *
 * Every column past the ticket's own is derived in this one query, so the
 * reader's list and the founder's queue can never disagree about which thread
 * is waiting or how old it is.
 */
const SUMMARY_SELECT = `
  select t.id, t.user_id, t.reference, t.kind, t.subject, t.status, t.closed_at, t.created_at,
         t.content_id, t.is_public, t.made_public_at, t.has_photo,
         m.n::int as message_count, m.last_at, m.last_author, m.last_excerpt
    from support_tickets t
    join lateral (
      select count(*) as n,
             max(created_at) as last_at,
             (array_agg(author order by created_at desc, id desc))[1] as last_author,
             (array_agg(body   order by created_at desc, id desc))[1] as last_excerpt
        from ticket_messages where ticket_id = t.id
    ) m on true
`;

function decorate(row: TicketSummary): TicketSummary {
  return {
    ...row,
    kind_title_fa: kindTitle(row.kind),
    last_excerpt: (row.last_excerpt ?? '').slice(0, 160),
    // Closed threads await nobody; an open one awaits whoever did not write last.
    awaiting: row.status === 'closed'
      ? 'founder'
      : (row.last_author === 'user' ? 'founder' : 'user'),
  };
}

/** One reader's own tickets, newest activity first. */
export async function ticketsOfUser(userId: string): Promise<TicketSummary[]> {
  const r = await query<TicketSummary>(
    `${SUMMARY_SELECT} where t.user_id = $1 order by m.last_at desc`,
    [userId],
  );
  return r.rows.map(decorate);
}

/**
 * The founder's queue.
 *
 * Ordered by what needs a human: open threads whose last word came from the
 * reader, oldest first — so the person who has been waiting longest is answered
 * first, rather than whoever wrote most recently.
 */
export async function ticketQueue(opts: { status?: TicketStatus | 'all'; limit?: number } = {}):
Promise<Array<TicketSummary & { phone: string | null; display_name: string | null; tier: string }>> {
  const status = opts.status ?? 'open';
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const r = await query<TicketSummary & {
    phone: string | null; display_name: string | null; tier: string;
  }>(
    `select q.*, p.phone, p.display_name, p.tier from (${SUMMARY_SELECT}) q
       join profiles p on p.id = q.user_id
      ${status === 'all' ? '' : 'where q.status = $2'}
      order by (q.status = 'open' and q.last_author = 'user') desc,
               q.last_at asc
      limit $1`,
    status === 'all' ? [limit] : [limit, status],
  );
  return r.rows.map((row) => ({ ...row, ...decorate(row) }));
}

/** Close a ticket. Either side may; `userId` scopes it to its owner. */
export async function closeTicket(ticketId: string, userId?: string): Promise<Ticket | null> {
  return one<Ticket>(
    `update support_tickets set status = 'closed', closed_at = now()
      where id = $1 and status = 'open' ${userId ? 'and user_id = $2' : ''}
      returning ${TICKET_COLUMNS}`,
    userId ? [ticketId, userId] : [ticketId],
  );
}

/** Reopen — a thread closed too early is not a thread that has to be re-explained. */
export async function reopenTicket(ticketId: string, userId?: string): Promise<Ticket | null> {
  return one<Ticket>(
    `update support_tickets set status = 'open', closed_at = null
      where id = $1 and status = 'closed' ${userId ? 'and user_id = $2' : ''}
      returning ${TICKET_COLUMNS}`,
    userId ? [ticketId, userId] : [ticketId],
  );
}

/**
 * Tell the reader their ticket was answered.
 *
 * `support_reply` is UNCAPPED in notify-policy.ts, on the same reasoning as the
 * renewal warning: this is a reply to a question the reader asked, and losing
 * it because a streak nudge arrived that morning is exactly the outcome the cap
 * was never meant to produce.
 */
async function notifyReader(ticket: Ticket, body: string): Promise<void> {
  // An article thread sends the reader back to the ARTICLE, where the
  // conversation actually lives — /plus/support.html would be the long way
  // round to a page they were already on.
  const url = ticket.content_id
    ? `/${ticket.content_id}.html`
    : `/plus/support.html?t=${ticket.id}`;
  await sendCapped(ticket.user_id, {
    title: ticket.content_id ? 'پاسخ زیر مطلب' : 'پاسخ پشتیبانی',
    body: `${ticket.subject} — ${body.slice(0, 140)}`,
    url,
    tag: `ticket_${ticket.id}`,
  }, 'support_reply').catch(() => { /* the thread is the record; the nudge is a courtesy */ });
}

/**
 * Tell the reader their thread was published.
 *
 * Not a courtesy — their words are on a public page now, under the name on
 * their profile. Finding that out by accident is the version of this feature
 * nobody would want to have shipped. The compose box says publishing is
 * possible before they write; this says it happened.
 */
export async function notifyPublished(ticket: Ticket): Promise<void> {
  if (!ticket.content_id) return;
  await sendCapped(ticket.user_id, {
    title: 'گفت‌وگوی شما عمومی شد',
    body: `«${ticket.subject}» — حالا زیر همان مطلب برای همه دیده می‌شود.`,
    url: `/${ticket.content_id}.html`,
    tag: `ticket_pub_${ticket.id}`,
  }, 'support_reply').catch(() => { /* publishing must not fail on a notification */ });
}

/**
 * Tell the founder somebody is waiting.
 *
 * Same reasoning as gift-redemption's own founder alert: without it the queue
 * is only seen when somebody remembers to look, and the answer becomes a matter
 * of luck. Silent (a log line) when no alert phone is configured — an alert
 * nobody can receive must never fail the reader's write.
 */
async function notifyFounder(ticket: Ticket, body: string): Promise<void> {
  const phone = config.support.alertPhone;
  if (!phone) {
    // eslint-disable-next-line no-console
    console.log(`[support] ${ticket.reference} (${ticket.kind}) — no SUPPORT_ALERT_PHONE set`);
    return;
  }
  const target = await one<{ id: string }>('select id from profiles where phone = $1', [phone]);
  if (!target) return;
  await sendCapped(target.id, {
    title: `تیکت ${kindTitle(ticket.kind)}`,
    body: `${ticket.reference} — ${ticket.subject}\n${body.slice(0, 140)}`,
    url: '/admin',
    tag: `ticket_${ticket.id}`,
  }, 'system').catch(() => { /* alerting never blocks a reader */ });
}
