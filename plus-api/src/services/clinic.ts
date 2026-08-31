import { one, query } from '../db.js';
import { dayInTz, nextDay } from './time.js';
import { formatJalaliDay } from './jalali.js';

/**
 * تعطیلی مطب — the days the clinic is closed beyond its ordinary week.
 *
 * The contact card (/card/) prints a live open/closed pill computed from the
 * working hours, so during a holiday it cheerfully told visitors what time the
 * clinic opens tomorrow. The first fix was a date constant in that page, which
 * is a deploy for something the founder needs to change from a phone — so the
 * dates live here instead, written from the admin panel and read by the card
 * through the public GET /clinic/status.
 *
 * The rule the whole thing rests on: NO ROW MEANS NOTHING CHANGES. An empty
 * table, an expired closure, an unreachable API — every one of them leaves the
 * card computing its ordinary pill exactly as it did before this existed, so
 * forgetting to clear a closure is the only way to be wrong, and that one is
 * visible on the card itself.
 */

/**
 * Sat-Wed, opening at 12:30 (Asia/Tehran) — the same week and the same time as
 * the pill in /card/index.html and the openingHoursSpecification in
 * /about.html. Only used to name the day the clinic is back; it does not
 * decide whether it is open (the card still does that itself).
 */
const OPEN_TIME_FA = '۱۲:۳۰';
/** getUTCDay(): 4 = Thursday, 5 = Friday — the ordinary weekend. */
const WEEKEND = new Set([4, 5]);

export type Closure = {
  id: string;
  starts_on: string;
  ends_on: string;
  note: string | null;
};

export type ClinicStatus =
  | { closed: false }
  | { closed: true; text: string; starts_on: string; ends_on: string; back_on: string };

function weekday(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

/** Today, as an Asia/Tehran calendar day. */
export function today(): string {
  return dayInTz(new Date());
}

export async function listClosures(): Promise<Closure[]> {
  const res = await query<Closure>(
    'select id, starts_on, ends_on, note from clinic_closures order by starts_on, ends_on',
  );
  return res.rows;
}

/**
 * Overlapping closures are allowed on purpose: extending a break is one more
 * row, not an edit, and the LATEST end wins — so a second row can only ever
 * push the reopening later, never pull it earlier by accident.
 */
export async function activeClosure(day: string): Promise<Closure | null> {
  return one<Closure>(
    `select id, starts_on, ends_on, note from clinic_closures
      where starts_on <= $1 and ends_on >= $1
      order by ends_on desc limit 1`,
    [day],
  );
}

export async function addClosure(
  startsOn: string, endsOn: string, note: string | null,
): Promise<Closure> {
  const row = await one<Closure>(
    `insert into clinic_closures (starts_on, ends_on, note)
     values ($1, $2, $3) returning id, starts_on, ends_on, note`,
    [startsOn, endsOn, note],
  );
  return row!;
}

export async function removeClosure(id: string): Promise<boolean> {
  const res = await query('delete from clinic_closures where id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

/**
 * The first day the clinic is actually open again after `closure`: the day
 * after it ends, skipping the ordinary weekend and any further closure that
 * happens to start there — the answer has to be a day somebody can walk in,
 * not merely a day this particular row does not cover.
 */
export function backOn(closure: Closure, all: Closure[]): string {
  let day = nextDay(closure.ends_on);
  for (let i = 0; i < 400; i += 1) {
    if (WEEKEND.has(weekday(day))) { day = nextDay(day); continue; }
    const covering = all.find((c) => c.starts_on <= day && c.ends_on >= day);
    if (covering) { day = nextDay(covering.ends_on); continue; }
    return day;
  }
  return day;
}

/**
 * What the pill says. A founder-written `note` is printed verbatim — it is the
 * whole point of the field, and widening or "fixing" it would make the panel
 * lie about what it will show. Otherwise the sentence is built in the card's
 * own vocabulary («مطب بسته است · فردا ساعت ۱۲:۳۰ باز می‌شود»), because a
 * closure notice that reads like a different site's writing is the tell that
 * something is broken.
 */
export function closureText(closure: Closure, back: string, day: string): string {
  const note = (closure.note ?? '').trim();
  if (note) return note;
  const when = back === nextDay(day) ? 'فردا' : formatJalaliDay(back);
  return `مطب تعطیل است · ${when} ساعت ${OPEN_TIME_FA} باز می‌شود`;
}

/** The one answer GET /clinic/status gives, for `day` (default: today). */
export async function clinicStatus(day: string = today()): Promise<ClinicStatus> {
  const closure = await activeClosure(day);
  if (!closure) return { closed: false };
  const back = backOn(closure, await listClosures());
  return {
    closed: true,
    text: closureText(closure, back, day),
    starts_on: closure.starts_on,
    ends_on: closure.ends_on,
    back_on: back,
  };
}
