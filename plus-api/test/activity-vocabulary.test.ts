// POST /activity's vocabulary, from both ends.
//
// The vocabulary is deliberately OPEN (routes/activity.ts): an unrecognised
// action is an inert row nothing reads, and that openness is what lets a new
// client-side signal ship without an API deploy. What must never be open is the
// set of actions a SERVICE mints as the record of something that happened —
// several of them are read by score.ts, league.ts, streak.ts and
// achievements.ts, so a browser that can post them can pay itself.
//
// Until 2026-09-17 only `challenge_answered` was guarded, though its own
// comment ("an open vocabulary here would let a client buy shield score +
// league XP + the badge without answering anything") described `highlight_created`,
// `review_finished` and `streak_kept` exactly as well. Six forged posts moved
// weekly league XP from 23 to 32 with no highlight and no review behind them.
//
// The second test is the part that does not rot: it reads the service sources
// and fails when a NEW action starts being minted without anybody deciding
// which side of the line it is on.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { SERVER_MINTED_ACTIONS, CLIENT_ACTIONS } from '../src/services/activity.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200311';

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

const post = (action: string, content_id: string | null = null) => app.inject({
  method: 'POST', url: '/activity', headers: { cookie }, payload: { action, content_id },
});

async function actionsLogged(): Promise<string[]> {
  const r = await pool.query<{ action: string }>(
    `select a.action from user_activity a join profiles p on p.id = a.user_id
      where p.phone = $1`, [phone],
  );
  return r.rows.map((x) => x.action);
}

describe('POST /activity refuses every server-minted action', () => {
  it('refuses each one with invalid_action and writes no row', async () => {
    for (const action of SERVER_MINTED_ACTIONS) {
      const res = await post(action, 'insight/insight-1');
      expect(res.statusCode, `action "${action}" was accepted`).toBe(400);
      expect(res.json().error).toBe('invalid_action');
    }
    expect(await actionsLogged()).toEqual([]);
  });

  it('names the ones that pay: score, league XP and the streak', () => {
    // Not a restatement of the set — these four are the reason it exists.
    for (const a of ['highlight_created', 'review_finished', 'challenge_answered', 'streak_kept']) {
      expect(SERVER_MINTED_ACTIONS.has(a), a).toBe(true);
    }
  });

  it('still accepts what a browser legitimately reports', async () => {
    for (const action of CLIENT_ACTIONS) {
      const res = await post(action, 'insight/insight-1');
      expect(res.statusCode, `action "${action}" was refused`).toBe(200);
    }
    const logged = new Set(await actionsLogged());
    for (const action of CLIENT_ACTIONS) expect(logged.has(action), action).toBe(true);
    // Anything else in the log is the server's own doing — `article_completed`
    // is a qualifying action, so applyStreak appends `streak_kept` beside it.
    // That is the distinction this whole file is about: the same token the
    // client may not post, the server mints on the client's behalf.
    for (const action of logged) {
      if (!CLIENT_ACTIONS.has(action)) expect(SERVER_MINTED_ACTIONS.has(action), action).toBe(true);
    }
    expect(logged.has('streak_kept')).toBe(true);
  });

  it('leaves the vocabulary open for an inert token', async () => {
    const res = await post('some_new_client_signal', 'insight/insight-1');
    expect(res.statusCode).toBe(200);
  });
});

describe('the classification does not rot', () => {
  it('every action a service mints is on one side of the line', () => {
    const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        // scripts/ is dev tooling (seed, rebuild), not a runtime writer.
        if (e.isDirectory()) { if (e.name !== 'scripts') walk(full); }
        else if (e.name.endsWith('.ts')) files.push(full);
      }
    };
    walk(srcDir);

    const found = new Map<string, string>(); // action -> where
    for (const file of files) {
      // routes/activity.ts is the door itself: the action it records is
      // whatever the client sent, not a token it mints.
      if (file.endsWith(path.join('routes', 'activity.ts'))) continue;
      const src = fs.readFileSync(file, 'utf8');
      const patterns = [
        /recordActivity\(\s*[^,]+,\s*'([a-z_]+)'/g,          // recordActivity(uid, 'x', …)
        /insert into user_activity[^`'"]*?values\s*\([^)]*?'([a-z_]+)'/gis, // a direct insert
      ];
      for (const re of patterns) {
        for (const m of src.matchAll(re)) {
          if (!found.has(m[1])) found.set(m[1], path.basename(file));
        }
      }
    }

    // Sanity: the scan must actually be finding things, or this test passes by
    // reading nothing at all.
    expect(found.size).toBeGreaterThan(8);

    const unclassified = [...found]
      .filter(([a]) => !SERVER_MINTED_ACTIONS.has(a) && !CLIENT_ACTIONS.has(a))
      .map(([a, where]) => `${a} (minted in ${where})`);
    expect(unclassified).toEqual([]);
  });

  // The scan above can only see an action it can READ, and that is the hole
  // this one closes. streak-reminder.ts wrote `values ($1, $2, $3::jsonb)` with
  // the token in a bind parameter, so `streak_sms_sent` was minted by a service,
  // absent from both sets, and postable by any browser through POST /activity —
  // while this file stayed green the whole time, because there was no string in
  // the SQL for it to find. Counting rows of it is the streak SMS's monthly
  // ceiling, so a forged one is not inert.
  //
  // Binding the action is a fine habit (three services pass a module `ACTION`
  // const), so the rule is not "write a literal" — it is that the token must be
  // RESOLVABLE from the source: either quoted in the SQL, or a const in the same
  // file. An action that is neither is one nobody can classify, which is how the
  // set above quietly stops being the whole truth.
  it('resolves every bound action, so the scan cannot be bypassed', () => {
    const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
    const unresolved: string[] = [];
    const bound = new Map<string, string>(); // action -> where
    const walk = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== 'scripts') walk(full); continue; }
        if (!e.name.endsWith('.ts')) continue;
        // The two generic doors: routes/activity.ts records whatever the client
        // sent, services/activity.ts is the writer every caller goes through.
        // Neither mints a token of its own.
        if (full.endsWith(path.join('routes', 'activity.ts'))) continue;
        if (full.endsWith(path.join('services', 'activity.ts'))) continue;
        const src = fs.readFileSync(full, 'utf8');
        const consts = new Map<string, string>();
        for (const c of src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*'([a-z][a-z_]+)'/g)) {
          consts.set(c[1], c[2]);
        }
        for (const m of src.matchAll(/insert into user_activity[^`']*?values\s*\(([^)]*)\)/gis)) {
          const action = (m[1].split(',')[1] ?? '').trim();
          if (action.startsWith("'")) continue; // already visible to the scan above
          // The params array follows the SQL; the action is whichever identifier
          // in it names a token this file declares.
          const tail = src.slice(m.index! + m[0].length, m.index! + m[0].length + 400);
          const named = [...tail.matchAll(/[A-Za-z_$][\w$]*/g)]
            .map((i) => consts.get(i[0]))
            .find(Boolean);
          if (named) bound.set(named, path.basename(full));
          else unresolved.push(`${path.basename(full)}: values (${m[1].trim()})`);
        }
      }
    };
    walk(srcDir);

    // The real guard: a bound action nobody can trace back to a token. No floor
    // on `bound.size` — converting the last bound insert to a literal is a fine
    // thing to do, and moves those actions under the scan above rather than
    // leaving this one to fail for having nothing left to read.
    expect(unresolved).toEqual([]);
    const unclassified = [...bound]
      .filter(([a]) => !SERVER_MINTED_ACTIONS.has(a) && !CLIENT_ACTIONS.has(a))
      .map(([a, where]) => `${a} (minted in ${where})`);
    expect(unclassified).toEqual([]);
  });
});
