// @vitest-environment jsdom
// Drives the REAL shipped renderer (/plus/js/achievements.js). The section has
// two rules that are purely visual, which means nothing but a DOM test can hold
// them: a level is a ring COLOUR and never the word «طلا» on the wall, and a
// still-secret badge must leak nothing at all — not its name, not its icon, not
// its criterion. Both are one careless line away from breaking silently.
import { describe, it, expect, beforeEach } from 'vitest';

const { achievementsBody, discountBody } = await import('/plus/js/achievements.js');

/** A response shaped exactly like GET /achievements returns. */
function payload(over: Record<string, unknown> = {}) {
  return {
    summary: { earned: 2, total: 4, bronze: 1, silver: 1, gold: 0 },
    medals: [
      {
        key: 'medal_gold', title_fa: 'مدال طلا', earned: true, name_fa: 'طلای کامپوزیت',
        tier: { slug: 'composite', name_fa: 'کامپوزیت', tier_order: 3 },
        lead_fa: 'اولِ گروهت شدی.', detail_fa: 'جنسِ مدال از بالاترین لیگ می‌آید.',
      },
      {
        key: 'medal_silver', title_fa: 'مدال نقره', earned: false, name_fa: 'مدال نقره',
        tier: null, lead_fa: 'هنوز دومِ گروهت نشده‌ای.', detail_fa: 'مثل طلا فقط بالا می‌رود.',
      },
    ],
    badges: [
      {
        key: 'quill', hidden: false, title_fa: 'قلم', icon: 'quill', group_fa: 'قلم و حاشیه',
        premium: false, leveled: true, earned: true, level: 1, metal: 'silver',
        value: 63, target: 300, ratio: 13 / 250, unit_fa: 'هایلایت',
        lead_fa: 'پنجاه هایلایت.', detail_fa: 'هر هایلایت می‌ماند.',
        levels: [
          { tier: 'bronze', threshold: 1, unlock_fa: 'اولین هایلایتت.', done: true },
          { tier: 'silver', threshold: 50, unlock_fa: 'پنجاه هایلایت.', done: true },
          { tier: 'gold', threshold: 300, unlock_fa: 'سیصد هایلایت.', done: false },
        ],
      },
      {
        key: 'phoenix', hidden: false, title_fa: 'ققنوس', icon: 'phoenix', group_fa: 'عادت',
        premium: false, leveled: false, earned: true, level: 0, metal: 'plain',
        value: 1, target: null, ratio: 1, unit_fa: null,
        lead_fa: 'بهت افتخار می‌کنم که برگشتی.', detail_fa: 'برگشتن سخت‌ترین قسمت است.',
        levels: null,
      },
      {
        key: 'eagle', hidden: false, title_fa: 'عقاب', icon: 'eagle', group_fa: 'ریتم',
        premium: false, leveled: true, earned: false, level: -1, metal: null,
        value: 0, target: 1, ratio: 0, unit_fa: 'بار',
        lead_fa: 'مطلبی را در همان ساعتِ اولِ انتشارش بخوان.', detail_fa: 'ساعتِ اول یعنی شصت دقیقه.',
        levels: [
          { tier: 'bronze', threshold: 1, unlock_fa: 'زود رسیدی.', done: false },
          { tier: 'silver', threshold: 5, unlock_fa: 'پنج بار.', done: false },
          { tier: 'gold', threshold: 25, unlock_fa: 'بیست‌وپنج بار.', done: false },
        ],
      },
      {
        key: 'night_owl', hidden: true, title_fa: null, icon: null, group_fa: null,
        premium: false, leveled: false, earned: false, level: -1, metal: null,
        value: 0, target: 1, ratio: 0, unit_fa: null,
        lead_fa: null, detail_fa: null, levels: null,
      },
    ],
    ...over,
  };
}

function mount(data = payload()) {
  document.body.replaceChildren();
  const body = achievementsBody(data);
  if (body) document.body.appendChild(body);
  return body;
}

function openTile(sel: string) {
  document.querySelector<HTMLButtonElement>(sel)!.click();
  return document.querySelector('.dcp-sheet-card')!;
}

beforeEach(() => { document.body.replaceChildren(); });

describe('the section only exists when there is something to show', () => {
  it('returns null for a missing or empty payload, so no empty card is drawn', () => {
    expect(achievementsBody(null)).toBeNull();
    expect(achievementsBody({ summary: {}, medals: [], badges: [] })).toBeNull();
  });
});

describe('a level is a ring colour, never a word', () => {
  it('never writes «طلا» anywhere on the wall', () => {
    mount();
    const wall = document.querySelector('.dcp-bg-wall')!;
    expect(wall.textContent).not.toContain('طلا');
    expect(wall.textContent).not.toContain('نقره');
    expect(wall.textContent).not.toContain('برنز');
  });

  it('carries the level in the disc class instead', () => {
    mount();
    const tiles = [...document.querySelectorAll('.dcp-bg-tile')];
    const quill = tiles.find((t) => t.textContent?.includes('قلم'))!;
    expect(quill.querySelector('.dcp-bg-disc')!.className).toContain('is-silver');
  });

  it('gives an earned one-shot badge the accent, not a metal', () => {
    mount();
    const tiles = [...document.querySelectorAll('.dcp-bg-tile')];
    const phoenix = tiles.find((t) => t.textContent?.includes('ققنوس'))!;
    const cls = phoenix.querySelector('.dcp-bg-disc')!.className;
    expect(cls).toContain('is-plain');
    expect(cls).not.toMatch(/is-(bronze|silver|gold)/);
  });

  it('does write the metal in the medal row — but never on its own', () => {
    mount();
    const row = document.querySelector('.dcp-md-row')!;
    expect(row.textContent).toContain('طلای کامپوزیت');
    // The medal reuses the league's own tier gradient class, so it cannot drift
    // from the tier badge it is meant to be the same object as.
    expect(document.querySelector('.dcp-md-shield')!.className).toContain('dcp-tier-t3');
  });
});

describe('a secret badge leaks nothing', () => {
  it('shows only a «؟» tile, with no name, icon or criterion', () => {
    mount();
    const tiles = [...document.querySelectorAll('.dcp-bg-tile')];
    const mystery = tiles.find((t) => t.querySelector('.is-mystery'))!;
    expect(mystery).toBeTruthy();
    expect(mystery.textContent!.replace(/\s/g, '')).toBe('؟؟');
    expect(mystery.querySelector('svg')).toBeNull();
  });

  it('keeps the secret when opened, too', () => {
    mount();
    const tiles = [...document.querySelectorAll('.dcp-bg-tile')];
    const mystery = tiles.find((t) => t.querySelector('.is-mystery')) as HTMLButtonElement;
    mystery.click();
    const card = document.querySelector('.dcp-sheet-card')!;
    expect(card.textContent).toContain('پیدا کردنش خودِ جایزه است');
    expect(card.textContent).not.toContain('جغد');
    expect(card.querySelector('.dcp-ach-lv-list')).toBeNull();
  });
});

describe('the progress bar', () => {
  it('is left off a badge sitting at zero', () => {
    mount();
    const tiles = [...document.querySelectorAll('.dcp-bg-tile')];
    const eagle = tiles.find((t) => t.textContent?.includes('عقاب'))!;
    expect(eagle.querySelector('.dcp-bg-bar')).toBeNull();
    expect(eagle.querySelector('.dcp-bg-bar-spacer')).toBeTruthy();
  });

  it('counts from the level already held, in Persian digits', () => {
    mount();
    const card = openTile('.dcp-bg-tile');
    expect(card.querySelector('.dcp-ach-prog-lbl')!.textContent).toContain('تا سطحِ بعد');
    expect(card.querySelector('.dcp-ach-prog-lbl')!.textContent).toContain('۶۳ از ۳۰۰');
  });

  it('replaces the bar with a statement once nothing is left to count', () => {
    const data = payload();
    Object.assign((data.badges as any[])[0], { level: 2, metal: 'gold', target: null, ratio: 1 });
    (data.badges as any[])[0].levels[2].done = true;
    mount(data);
    const card = openTile('.dcp-bg-tile');
    expect(card.textContent).toContain('بالاترین سطح');
    expect(card.querySelector('.dcp-ach-prog-bar')).toBeNull();
  });
});

describe('the badge sheet', () => {
  it('lists every level with its own copy and marks the ones held', () => {
    mount();
    const card = openTile('.dcp-bg-tile');
    const rows = [...card.querySelectorAll('.dcp-ach-lv')];
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.className.includes('is-done'))).toEqual([true, true, false]);
    // the first unheld level is the one being aimed at
    expect(rows[2].className).toContain('is-next');
    expect(rows[2].textContent).toContain('سیصد هایلایت');
    expect(rows[2].textContent).toContain('۳۰۰ هایلایت'); // threshold + unit, Persian digits
  });

  it('leads with the reason it is lit, and with the ask when it is not', () => {
    mount();
    expect(openTile('.dcp-bg-tile')!.querySelector('.dcp-ach-lead')!.className)
      .not.toContain('is-locked');

    mount();
    const tiles = [...document.querySelectorAll('.dcp-bg-tile')] as HTMLButtonElement[];
    tiles.find((t) => t.textContent?.includes('عقاب'))!.click();
    const lead = document.querySelector('.dcp-ach-lead')!;
    expect(lead.className).toContain('is-locked');
    expect(lead.textContent).toContain('ساعتِ اولِ انتشارش');
  });

  it('opens only one sheet at a time, and cleans the previous one up', async () => {
    mount();
    const tiles = [...document.querySelectorAll('.dcp-bg-tile')] as HTMLButtonElement[];
    tiles[0].click();
    tiles[1].click();
    // The outgoing sheet stays in the DOM for the length of its exit transition
    // and the incoming one is shown on the next frame — both are the shared
    // component's contract, not leaks. Once that has settled, exactly one sheet
    // is left standing and it is the one that was asked for.
    await new Promise((r) => { setTimeout(r, 350); });
    const overlays = document.querySelectorAll('.dcp-sheet-overlay');
    expect(overlays).toHaveLength(1);
    expect(overlays[0].className).toContain('is-open');
    expect(overlays[0].textContent).toContain('ققنوس');
  });
});

describe('the tally', () => {
  it('counts what is held and omits a metal nobody has', () => {
    mount();
    const t = document.querySelector('.dcp-ach-tally')!;
    expect(t.textContent).toContain('۲ از ۴ نشان');
    expect(t.querySelectorAll('.dcp-ach-pip.is-g')).toHaveLength(0); // no golds yet
    expect(t.querySelectorAll('.dcp-ach-pip.is-s')).toHaveLength(1);
    expect(t.querySelectorAll('.dcp-ach-pip.is-b')).toHaveLength(1);
  });
});

// ------------------------------------------------------- the discount block ---
//
// Reported by the founder, 2026-08-08: the block told a «ستون» seat-holder that
// «در هر خرید تا سقف ٪۱۰ اعمال می‌شود» — a sentence with no subject, which reads
// as a ceiling on their own discount. It is not: payment.ts computes
// `pillar + creditPercent(credits)`, so the permanent ٪۲۰ stacks ON TOP of the
// cap and is never trimmed. The cap governs the one-time badge credits alone.
//
// Copy is exactly where this class of bug hides — the numbers were right the
// whole time and every test stayed green.
describe('the discount block says what the cap governs', () => {
  const discount = (over: Record<string, unknown> = {}) => ({
    discount: {
      pillar_percent: 20, ready_percent: 6, next_purchase_percent: 26, cap_percent: 10,
      spent_percent: 0, ...over,
    },
  });

  // «تخفیف‌های من» is its own section since 2026-08-13 (it was a strip under
  // the «افتخارات» heading, which announced a trophy shelf and showed a
  // price). The copy rules below are unchanged; only the mount point moved.
  function mount(data: Record<string, unknown>) {
    document.body.replaceChildren();
    const body = discountBody(data);
    if (body) document.body.appendChild(body);
    return body;
  }

  it('never lets a seat-holder read the cap as covering their permanent ٪۲۰', () => {
    mount(payload(discount()));
    const foot = document.querySelector('.dcp-disc-foot')!.textContent!;

    // The cap must name its subject...
    expect(foot).toContain('سهم نشان‌ها');
    // ...and the permanent discount must be said to sit outside it.
    expect(foot).toContain('جدا از این سقف');
    expect(foot).toContain('٪۲۰');
  });

  it('does the same when the badge credits are under the cap', () => {
    // The branch most readers actually hit — and the one that had no subject.
    mount(payload(discount({ ready_percent: 3, next_purchase_percent: 23 })));
    const foot = document.querySelector('.dcp-disc-foot')!.textContent!;

    expect(foot).toContain('سهم نشان‌ها');
    expect(foot).toContain('جدا از این سقف');
    // Under the cap nothing is held back, so it must not promise a remainder.
    expect(foot).not.toContain('برای خرید بعد می‌ماند');
  });

  it('still explains the leftover when the credits overflow the cap', () => {
    mount(payload(discount({ ready_percent: 14, next_purchase_percent: 30 })));
    const foot = document.querySelector('.dcp-disc-foot')!.textContent!;

    expect(foot).toContain('سهم نشان‌ها');
    expect(foot).toContain('باقی‌مانده برای خریدهای بعد می‌ماند');
  });

  it('says nothing about a pillar discount to a reader who has none', () => {
    mount(payload(discount({ pillar_percent: 0, ready_percent: 3, next_purchase_percent: 3 })));
    const foot = document.querySelector('.dcp-disc-foot')!.textContent!;

    expect(foot).toContain('سهم نشان‌ها');
    expect(foot).not.toContain('ستون');
  });

  // ---------------------------------------------------------- the position ---
  //
  // Founder report, 2026-08-13: the box has to answer «چقدر دارم، چقدرش را
  // استفاده کرده‌ام، چقدرش مانده» — a position, not a teaser. Before this it
  // reported only what was ready and vanished outright once that hit zero, so
  // an account that had SPENT its credit was indistinguishable from one that
  // never earned any, precisely when the reader was asking.
  describe('reports the whole position, not just what is ready', () => {
    const ledger = () => [...document.querySelectorAll('.dcp-disc-ledger b')]
      .map((n) => n.textContent);

    it('shows unspent, spent and what the next purchase takes', () => {
      mount(payload(discount({
        pillar_percent: 0, ready_percent: 6, spent_percent: 4, next_purchase_percent: 6,
      })));
      expect(ledger()).toEqual(['٪۶', '٪۴', '٪۶']);
    });

    it('still renders for an account that has spent everything', () => {
      const body = mount(payload(discount({
        pillar_percent: 0, ready_percent: 0, spent_percent: 10, next_purchase_percent: 0,
      })));
      expect(body).not.toBeNull();
      expect(ledger()).toEqual(['٪۰', '٪۱۰', '٪۰']);
      // ...and says so, rather than advertising a discount that is not there.
      expect(document.querySelector('.dcp-disc-t h3')!.textContent)
        .toContain('تخفیف آماده‌ای نداری');
    });

    it('renders nothing at all for an account with no position either way', () => {
      expect(discountBody(payload(discount({
        pillar_percent: 0, ready_percent: 0, spent_percent: 0, next_purchase_percent: 0,
      })))).toBeNull();
      expect(discountBody(payload())).toBeNull(); // no `discount` block at all
      expect(discountBody(null)).toBeNull();
    });
  });

  // The split itself. Without this, moving the strip back under «افتخارات»
  // would go unnoticed until somebody looked at the profile again.
  it('is no longer part of the «افتخارات» body', () => {
    document.body.replaceChildren();
    const body = achievementsBody(payload(discount()))!;
    document.body.appendChild(body);
    expect(document.querySelector('.dcp-disc')).toBeNull();
    // ...while the wall itself is untouched.
    expect(document.querySelector('.dcp-bg-wall')).not.toBeNull();
    expect(document.querySelector('.dcp-md-row')).not.toBeNull();
  });

  // -------------------------------------------------------- the itemized position ---
  //
  // Founder report, 2026-08-14: the strip only ever spoke in totals («٪۳
  // نشان‌ها یک‌بارمصرف») — a founder-granted badge like «همراه» mints a real
  // discount_grants row with its own label_fa ('همراه'), but that name never
  // left the API, so a reader could never tell which of their credits it was.
  describe('names every credit it counts', () => {
    it('lists ready and spent credits by their own label, ready first', () => {
      mount(payload(discount({
        ready_percent: 5, spent_percent: 10, next_purchase_percent: 5,
        items: [
          { label_fa: 'همراه', percent: 5, kind: 'grant', state: 'ready' },
          { label_fa: 'پاداش معرفی', percent: 10, kind: 'referral', state: 'spent' },
        ],
      })));
      const rows = [...document.querySelectorAll('.dcp-disc-item')];
      expect(rows).toHaveLength(2);
      expect(rows[0].querySelector('.dcp-disc-item-label')!.textContent).toBe('همراه');
      expect(rows[0].querySelector('.dcp-ach-lv-val')!.classList.contains('is-spent')).toBe(false);
      expect(rows[1].querySelector('.dcp-disc-item-label')!.textContent).toBe('پاداش معرفی');
      expect(rows[1].querySelector('.dcp-ach-lv-val')!.classList.contains('is-spent')).toBe(true);
    });

    it('renders no itemized list when the route sends none, without breaking the rest', () => {
      const body = mount(payload(discount()));
      expect(body).not.toBeNull();
      expect(document.querySelectorAll('.dcp-disc-item')).toHaveLength(0);
    });
  });
});
