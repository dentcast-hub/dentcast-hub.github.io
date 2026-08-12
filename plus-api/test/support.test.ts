// Support tickets — the first channel that carries a reader's words INTO the
// site. The properties pinned here are the ones the design rests on:
//
//   who may open one is decided by the KIND, not the plan (the student asking
//   for a discount is by definition not premium yet — a premium-only door
//   would refuse the one ticket that could earn us a subscriber),
//   nothing derivable is stored (awaiting/count/last activity come out of the
//   thread, so the two queues can never disagree),
//   a ticket and its first message commit together,
//   the reference is what lets a photo arrive from a messenger and find its
//   account, and
//   a reader can only ever see and write to their own thread.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { MAX_OPEN_PER_USER } from '../src/services/support.js';

let app: FastifyInstance;
let cookie: string;
const PHONE = '09121710055';
const OTHER = '09121710066';

const auth = 'Basic '
  + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, PHONE);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(phone = PHONE): Promise<void> {
  await pool.query("update profiles set tier = 'premium' where phone = $1", [phone]);
}

function open(body: Record<string, unknown>, c = cookie) {
  return app.inject({
    method: 'POST', url: '/support/tickets', headers: { cookie: c }, payload: body,
  });
}

const TICKET = { kind: 'student', subject: 'تخفیف دانشجویی', body: 'دانشجوی سال آخرم.' };

/* --------------------------------------------------- who may open one ---- */

describe('the plan gate is per kind, not per feature', () => {
  it('lets a FREE reader open the kinds that lead to a purchase', async () => {
    for (const kind of ['billing', 'student', 'bug']) {
      const r = await open({ kind, subject: 'سلام', body: 'یک سؤال دارم.' });
      expect(r.statusCode, kind).toBe(200);
    }
  });

  it('refuses the open-ended kind to a free reader, and names the way through', async () => {
    const r = await open({ kind: 'support', subject: 'مشاوره', body: 'یک سؤال دارم.' });
    expect(r.statusCode).toBe(402);
    expect(r.json().error).toBe('premium_required');
    expect(r.json().message).toContain('تخفیف دانشجویی'); // points at the open door
  });

  it('opens the premium kind once the reader pays', async () => {
    await makePremium();
    cookie = await loginAs(app, PHONE);
    expect((await open({ kind: 'support', subject: 'مشاوره', body: 'سؤال.' })).statusCode).toBe(200);
  });

  it('refuses a kind that does not exist', async () => {
    const r = await open({ kind: 'refund', subject: 'x', body: 'y' });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('unknown_kind');
  });

  it('is closed to anyone not signed in', async () => {
    const r = await app.inject({ method: 'GET', url: '/support/tickets' });
    expect(r.statusCode).toBe(401);
  });

  it('shows a free reader which kinds are locked instead of hiding the door', async () => {
    const r = await app.inject({ method: 'GET', url: '/support/kinds', headers: { cookie } });
    const locked = r.json().kinds.filter((k: { locked: boolean }) => k.locked);
    expect(locked.map((k: { key: string }) => k.key)).toEqual(['support']);
  });
});

/* --------------------------------------------------------- opening one --- */

describe('opening a ticket', () => {
  it('writes the ticket and its first message together, with a typeable tag', async () => {
    const r = await open(TICKET);
    expect(r.statusCode).toBe(200);
    const t = r.json().ticket;
    expect(t.reference).toMatch(/^T-[ACDEFGHJKMNPQRTUVWXY2346789]{3}-[ACDEFGHJKMNPQRTUVWXY2346789]{3}$/);
    expect(t.status).toBe('open');
    expect(t.kind_title_fa).toBe('تخفیف دانشجویی');

    const msgs = await pool.query('select author, body from ticket_messages where ticket_id = $1', [t.id]);
    expect(msgs.rows).toEqual([{ author: 'user', body: TICKET.body }]);
  });

  it('bounds how many threads one account can leave open, and frees the slot on close', async () => {
    const ids: string[] = [];
    for (let i = 0; i < MAX_OPEN_PER_USER; i += 1) {
      const r = await open({ kind: 'bug', subject: `مشکل ${i}`, body: 'توضیح.' });
      expect(r.statusCode).toBe(200);
      ids.push(r.json().ticket.id);
    }
    const over = await open({ kind: 'bug', subject: 'یکی بیشتر', body: 'توضیح.' });
    expect(over.statusCode).toBe(400);
    expect(over.json().error).toBe('too_many_open');

    await app.inject({ method: 'POST', url: `/support/tickets/${ids[0]}/close`, headers: { cookie } });
    expect((await open({ kind: 'bug', subject: 'حالا باشد', body: 'توضیح.' })).statusCode).toBe(200);
  });

  it('refuses a subject or body that is only whitespace', async () => {
    const r = await open({ kind: 'bug', subject: '   ', body: 'توضیح.' });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('empty');
  });
});

/* ------------------------------------------------------- the two sides --- */

describe('a thread, from both ends', () => {
  it('carries a reply back to the reader and flips whose turn it is', async () => {
    const t = (await open(TICKET)).json().ticket;

    // Opened by the reader -> the founder's queue says it is waiting on them.
    let mine = await app.inject({ method: 'GET', url: '/support/tickets', headers: { cookie } });
    expect(mine.json().tickets[0]).toMatchObject({ awaiting: 'founder', message_count: 1 });

    const q = await app.inject({ method: 'GET', url: '/admin/support', headers: { authorization: auth } });
    expect(q.json().waiting).toBe(1);
    expect(q.json().tickets[0].reference).toBe(t.reference);

    const rep = await app.inject({
      method: 'POST', url: `/admin/support/${t.id}/reply`, headers: { authorization: auth },
      payload: { body: 'عکس کارت را با همین کد بفرست.' },
    });
    expect(rep.statusCode).toBe(200);

    // Now it is the reader's turn, and the answer is in their اطلاعیه.
    mine = await app.inject({ method: 'GET', url: '/support/tickets', headers: { cookie } });
    expect(mine.json().tickets[0]).toMatchObject({ awaiting: 'user', message_count: 2 });

    const notices = await app.inject({ method: 'GET', url: '/notices', headers: { cookie } });
    expect(JSON.stringify(notices.json())).toContain('پاسخ پشتیبانی');

    // And the reader can write back.
    const back = await app.inject({
      method: 'POST', url: `/support/tickets/${t.id}/messages`, headers: { cookie },
      payload: { body: 'فرستادم.' },
    });
    expect(back.statusCode).toBe(200);
    const full = await app.inject({ method: 'GET', url: `/support/tickets/${t.id}`, headers: { cookie } });
    expect(full.json().messages.map((m: { author: string }) => m.author))
      .toEqual(['user', 'founder', 'user']);
  });

  it('answers and closes in one press, and a closed thread takes no more writing', async () => {
    const t = (await open(TICKET)).json().ticket;
    const rep = await app.inject({
      method: 'POST', url: `/admin/support/${t.id}/reply`, headers: { authorization: auth },
      payload: { body: 'تأیید شد، تخفیف اعمال شد.', close: true },
    });
    expect(rep.json().ticket.status).toBe('closed');

    const back = await app.inject({
      method: 'POST', url: `/support/tickets/${t.id}/messages`, headers: { cookie },
      payload: { body: 'یک چیز دیگر' },
    });
    expect(back.statusCode).toBe(400);

    // Reopening is a real path — a thread closed early should not have to be
    // re-explained from scratch.
    await app.inject({
      method: 'POST', url: `/support/tickets/${t.id}/reopen`, headers: { cookie },
    });
    expect((await app.inject({
      method: 'POST', url: `/support/tickets/${t.id}/messages`, headers: { cookie },
      payload: { body: 'یک چیز دیگر' },
    })).statusCode).toBe(200);
  });
});

/* ----------------------------------------------------- the reference ----- */

describe('the reference is how a photo finds its account', () => {
  it('resolves a tag typed back at us, however it was typed', async () => {
    const t = (await open(TICKET)).json().ticket;
    for (const typed of [t.reference, t.reference.toLowerCase(), ` ${t.reference} `]) {
      const r = await app.inject({
        method: 'GET',
        url: `/admin/support/by-reference/${encodeURIComponent(typed)}`,
        headers: { authorization: auth },
      });
      expect(r.statusCode, typed).toBe(200);
      expect(r.json().user.phone).toBe(PHONE);
      expect(r.json().ticket.id).toBe(t.id);
    }
  });

  it('404s an unknown tag rather than guessing', async () => {
    const r = await app.inject({
      method: 'GET', url: '/admin/support/by-reference/T-XXX-YYY', headers: { authorization: auth },
    });
    expect(r.statusCode).toBe(404);
  });
});

/* ---------------------------------------------------------- separation --- */

describe('a reader sees only their own thread', () => {
  it('cannot read, answer or close somebody else\'s ticket', async () => {
    const mine = (await open(TICKET)).json().ticket;
    const otherCookie = await loginAs(app, OTHER);

    for (const call of [
      { method: 'GET' as const, url: `/support/tickets/${mine.id}` },
      { method: 'POST' as const, url: `/support/tickets/${mine.id}/close` },
    ]) {
      expect((await app.inject({ ...call, headers: { cookie: otherCookie } })).statusCode).toBe(404);
    }
    const write = await app.inject({
      method: 'POST', url: `/support/tickets/${mine.id}/messages`,
      headers: { cookie: otherCookie }, payload: { body: 'سلام' },
    });
    expect(write.statusCode).toBe(404);

    // And their own list does not contain it.
    const theirs = await app.inject({
      method: 'GET', url: '/support/tickets', headers: { cookie: otherCookie },
    });
    expect(theirs.json().tickets).toEqual([]);
  });

  it('keeps the admin queue behind basic auth', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/support' })).statusCode).toBe(401);
  });

  it('renders the queue into the founder page itself', async () => {
    const page = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: auth } });
    expect(page.statusCode).toBe(200);
    expect(page.body).toContain('صندوق پشتیبانی');
    expect(page.body).toContain('/admin/support/by-reference/'); // the student-card lookup
  });
});
