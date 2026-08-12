// Threads under an article — a premium reader talking to the founder beneath the
// page they are reading, and the founder's own switch for which of those the
// rest of the site sees. The properties pinned here:
//
//   writing is premium-only (here that gate is simply right — nobody needs to
//   comment in order to become a subscriber, unlike the support kinds),
//   PRIVATE IS THE DEFAULT and publishing is a decision nothing else can make,
//   one reader + one page = ONE conversation, never N parallel threads,
//   a published thread is readable with NO session at all, and
//   unpublishing really takes it back.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

let app: FastifyInstance;
let cookie: string;
const PHONE = '09121710077';
const OTHER = '09121710088';
const CONTENT = 'notecast/note-1';

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

async function premium(phone = PHONE): Promise<string> {
  await pool.query("update profiles set tier = 'premium' where phone = $1", [phone]);
  return loginAs(app, phone);
}

function comment(body: string, c = cookie, content_id = CONTENT) {
  return app.inject({
    method: 'POST', url: '/threads', headers: { cookie: c }, payload: { content_id, body },
  });
}

const publicThreads = (content_id = CONTENT) =>
  app.inject({ method: 'GET', url: `/threads/public?content_id=${encodeURIComponent(content_id)}` });

/* ------------------------------------------------------------ who writes -- */

describe('writing is premium-only', () => {
  it('refuses a free reader with 402 and a reason', async () => {
    const r = await comment('نظر من');
    expect(r.statusCode).toBe(402);
    expect(r.json().error).toBe('premium_required');
  });

  it('refuses somebody with no session at all', async () => {
    const r = await app.inject({
      method: 'POST', url: '/threads', payload: { content_id: CONTENT, body: 'سلام' },
    });
    expect(r.statusCode).toBe(401);
  });

  it('lets a premium reader write', async () => {
    cookie = await premium();
    expect((await comment('نکته‌ی خوبی بود.')).statusCode).toBe(200);
  });
});

/* ------------------------------------------- one reader, one page, one thread */

describe('one reader and one page make one conversation', () => {
  it('folds a second comment into the same thread instead of opening another', async () => {
    cookie = await premium();
    const first = (await comment('سؤال اول')).json().ticket;
    const second = (await comment('سؤال دوم')).json().ticket;
    expect(second.id).toBe(first.id);

    const rows = await pool.query('select count(*)::int as n from support_tickets');
    expect(rows.rows[0].n).toBe(1);
    const msgs = await pool.query(
      'select count(*)::int as n from ticket_messages where ticket_id = $1', [first.id],
    );
    expect(msgs.rows[0].n).toBe(2);
  });

  it('keeps separate pages separate', async () => {
    cookie = await premium();
    await comment('زیر مطلب اول');
    await comment('زیر مطلب دوم', cookie, 'insight/ins-2');
    const rows = await pool.query('select count(*)::int as n from support_tickets');
    expect(rows.rows[0].n).toBe(2);
  });

  it('normalises the content_id so a .html suffix is not a second page', async () => {
    cookie = await premium();
    const a = (await comment('یک', cookie, CONTENT)).json().ticket;
    const b = (await comment('دو', cookie, `/${CONTENT}.html`)).json().ticket;
    expect(b.id).toBe(a.id);
  });

  it('does not spend the support ticket budget', async () => {
    cookie = await premium();
    // Four article threads — comfortably past MAX_OPEN_PER_USER (3)...
    for (const id of ['a/1', 'a/2', 'a/3', 'a/4']) await comment('نظر', cookie, id);
    // ...and a support ticket still opens.
    const t = await app.inject({
      method: 'POST', url: '/support/tickets', headers: { cookie },
      payload: { kind: 'bug', subject: 'یک مشکل', body: 'توضیح' },
    });
    expect(t.statusCode).toBe(200);
  });
});

/* --------------------------------------------------- private until chosen -- */

describe('private is the default; publishing is a decision', () => {
  it('shows nothing publicly until the founder says so', async () => {
    cookie = await premium();
    const t = (await comment('این را زیر مطلب نوشتم')).json().ticket;
    expect(t.is_public).toBe(false);
    expect((await publicThreads()).json().threads).toEqual([]);

    // Another signed-in premium reader cannot see it either — "private" means
    // private, not "hidden from logged-out visitors".
    const otherCookie = await premium(OTHER);
    const theirView = await app.inject({
      method: 'GET', url: `/threads/mine?content_id=${encodeURIComponent(CONTENT)}`,
      headers: { cookie: otherCookie },
    });
    expect(theirView.json().thread).toBeNull();
  });

  it('publishes on the founder\'s press, with the whole exchange and a pseudonym', async () => {
    cookie = await premium();
    const t = (await comment('سؤالی دارم')).json().ticket;
    await app.inject({
      method: 'POST', url: `/admin/support/${t.id}/reply`, headers: { authorization: auth },
      payload: { body: 'جواب من' },
    });

    const pub = await app.inject({
      method: 'POST', url: `/admin/support/${t.id}/publish`, headers: { authorization: auth },
      payload: { public: true },
    });
    expect(pub.statusCode).toBe(200);
    expect(pub.json().ticket.is_public).toBe(true);
    expect(pub.json().ticket.made_public_at).toBeTruthy();

    // Readable with NO session — a published thread is part of the page now.
    const seen = await publicThreads();
    expect(seen.statusCode).toBe(200);
    expect(seen.json().threads).toHaveLength(1);
    const thread = seen.json().threads[0];
    expect(thread.messages.map((m: { author: string }) => m.author)).toEqual(['user', 'founder']);
    expect(thread.messages[0].body).toBe('سؤالی دارم');
    // The display name is a generated Persian pseudonym, never the phone.
    expect(thread.author_name).toBeTruthy();
    expect(thread.author_name).not.toContain(PHONE);
  });

  it('tells the reader their words went public', async () => {
    cookie = await premium();
    const t = (await comment('نظر من')).json().ticket;
    await app.inject({
      method: 'POST', url: `/admin/support/${t.id}/publish`, headers: { authorization: auth },
      payload: { public: true },
    });
    const notices = await app.inject({ method: 'GET', url: '/notices', headers: { cookie } });
    expect(JSON.stringify(notices.json())).toContain('عمومی شد');
  });

  it('really takes it back', async () => {
    cookie = await premium();
    const t = (await comment('نظر من')).json().ticket;
    const pubUrl = `/admin/support/${t.id}/publish`;
    await app.inject({ method: 'POST', url: pubUrl, headers: { authorization: auth }, payload: { public: true } });
    expect((await publicThreads()).json().threads).toHaveLength(1);

    await app.inject({ method: 'POST', url: pubUrl, headers: { authorization: auth }, payload: { public: false } });
    expect((await publicThreads()).json().threads).toEqual([]);
    const row = await pool.query('select is_public, made_public_at from support_tickets where id = $1', [t.id]);
    expect(row.rows[0].is_public).toBe(false);
    expect(row.rows[0].made_public_at).toBeNull();
  });

  it('refuses to publish a support ticket — it has no page to appear on', async () => {
    const t = (await app.inject({
      method: 'POST', url: '/support/tickets', headers: { cookie },
      payload: { kind: 'bug', subject: 'یک مشکل', body: 'توضیح' },
    })).json().ticket;
    const r = await app.inject({
      method: 'POST', url: `/admin/support/${t.id}/publish`, headers: { authorization: auth },
      payload: { public: true },
    });
    expect(r.statusCode).toBe(404);
    expect(r.json().error).toBe('not_an_article_thread');
  });

  it('keeps the switch behind admin auth', async () => {
    cookie = await premium();
    const t = (await comment('نظر')).json().ticket;
    const r = await app.inject({
      method: 'POST', url: `/admin/support/${t.id}/publish`, payload: { public: true },
    });
    expect(r.statusCode).toBe(401);
    expect((await publicThreads()).json().threads).toEqual([]);
  });
});

/* ------------------------------------------------------------ the author -- */

describe('the reader\'s own view', () => {
  it('returns their thread and its messages, and nothing when they have none', async () => {
    cookie = await premium();
    const empty = await app.inject({
      method: 'GET', url: `/threads/mine?content_id=${encodeURIComponent(CONTENT)}`,
      headers: { cookie },
    });
    expect(empty.json().thread).toBeNull();

    await comment('اولین نظر');
    const mine = await app.inject({
      method: 'GET', url: `/threads/mine?content_id=${encodeURIComponent(CONTENT)}`,
      headers: { cookie },
    });
    expect(mine.json().thread.content_id).toBe(CONTENT);
    expect(mine.json().messages).toHaveLength(1);
  });

  it('reopens a closed thread when they comment again', async () => {
    cookie = await premium();
    const t = (await comment('نظر اول')).json().ticket;
    await app.inject({ method: 'POST', url: `/support/tickets/${t.id}/close`, headers: { cookie } });

    const again = await comment('نظر دوم');
    expect(again.statusCode).toBe(200);
    const row = await pool.query('select status from support_tickets where id = $1', [t.id]);
    expect(row.rows[0].status).toBe('open');
  });
});
