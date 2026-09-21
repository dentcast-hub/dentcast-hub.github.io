// «یادآوری‌ها» — the profile's notification section: one master switch and,
// under it, the «از کجا برسد» matrix (channel × kind). Approved mockup:
// .dentcast/streak-sms-mockup.html (founder, 2026-09-16).
//
// Two objects in the data, and the split is deliberate:
//   · settings.reminders.{new_content,streak} — the master. Both keys flip
//     together (the card that asks for browser permission promises both, and a
//     half-on account is a worse product than either end). Written WHOLE, every
//     time: PATCH /me shallow-merges `settings`, so a one-key patch would wipe
//     the sibling. home-card.js and notif-prompt.js write the same object.
//   · settings.notify_channels.{webpush,bale,sms}.{new_content,streak} — the
//     matrix. A SIBLING of `reminders`, never nested inside it, or the three
//     writers above would erase it on their next toggle. Also written whole.
//
// The matrix picks the CHANNEL; the master decides whether the reminder is sent
// at all. Which means a tick here is worth nothing on its own — and on
// 2026-09-18 two readers ticked پیامک, the tick saved, survived every reload,
// and no text arrived, because `reminders.streak` was off on their accounts and
// nothing on this screen says the column depends on it. (streak-reminder.ts is
// the one service of five reading that key whose coalesce default is FALSE, so
// an account that never touched the master is opted out of it alone.) So
// ticking a cell now carries the master key for that kind — see implyMaster.
// The master switch is NOT repaired on render: a reader who never asked for
// «مطلب جدید» must not be signed up for it by opening their profile.
//
// Defaults (mirrored server-side in services/notify-channels.ts): an absent
// webpush/bale flag is ON — nobody who receives today may be switched off by
// the arrival of a preference; an absent sms flag is OFF — it costs money, and
// it is the one channel a reader cannot mute from the message itself.
//
// The پیامک row is PREMIUM and wears amber (--dcp-gold), the site's one
// meaning for that colour: «this is what a subscription buys». It carries the
// streak alone — the «مطلب جدید» cell is a dash, not an unchecked box, because
// an unchecked box says «you could», and here you cannot: Iranian service
// lines send registered templates, and the article notice's value is its
// Pulse sentence, which no template can carry. The gate is on the TAP
// (sheet.js gateCard, the clips pattern): a free reader sees the row, taps the
// box, and is told what it is before what it costs.
import { el } from './util.js?v=127';
import { api, currentUser } from './api.js?v=127';
import { ensurePushSubscription, removePushSubscription, pushSupported } from './push.js?v=127';
import { baleEnabled } from './config.js?v=127';
import { openSheet, gateCard } from './sheet.js?v=127';
import { premiumCta } from './premium-cta.js?v=127';

const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = (s) => String(s).replace(/\d/g, (d) => FA[Number(d)]);

/** «۰۹۱۲···۴۵۶۱» — enough to recognise your own number, never the whole thing on a shared screen. */
export function maskPhone(phone) {
  const p = String(phone || '').replace(/\D/g, '');
  if (p.length < 8) return fa(p);
  return fa(p.slice(0, 4)) + '···' + fa(p.slice(-4));
}

/** The mask as a node: a number is LTR even in Persian digits, or the RTL run
 *  reorders it around the dots («۴۵۶۱···۰۹۱۲»). */
const phoneNode = (phone) => el('span', { class: 'dcp-rem-num', dir: 'ltr' }, maskPhone(phone));

/** The matrix as stored, with the defaults filled in (see the header). */
export function channelPrefs(settings) {
  const raw = (settings && settings.notify_channels) || {};
  const pick = (ch, key, dflt) => {
    const v = raw[ch] && raw[ch][key];
    return typeof v === 'boolean' ? v : dflt;
  };
  return {
    webpush: { new_content: pick('webpush', 'new_content', true), streak: pick('webpush', 'streak', true) },
    bale: { new_content: pick('bale', 'new_content', true), streak: pick('bale', 'streak', true) },
    sms: { streak: pick('sms', 'streak', false) },
  };
}

const PUSH_GUIDANCE = {
  denied: 'اعلان‌ها در مرورگر بلاک شده. ترجیح ذخیره شد؛ برای دریافت نوتیف، از تنظیمات سایتِ مرورگر آن را Allow کن.',
  unsupported: 'مرورگر شما از اعلان پشتیبانی نمی‌کند. ترجیح ذخیره شد ولی نوتیف مرورگر ارسال نمی‌شود.',
};
const guidanceText = (res) => PUSH_GUIDANCE[res]
  || 'ترجیح ذخیره شد؛ فعال‌سازی اعلان فعلاً ناموفق بود و بعداً دوباره تلاش می‌شود.';

function browserStatus() {
  if (!pushSupported()) return 'پشتیبانی نمی‌شود';
  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return 'اعلان بلاک شده';
  return 'وب‌پوش';
}

/** One cell of the matrix: a real checkbox, so keyboard and screen reader get it for free. */
function cell({ checked, disabled, amber, label, onChange, onBlocked }) {
  const input = el('input', {
    type: 'checkbox', class: 'dcp-rem-box' + (amber ? ' is-amber' : ''), 'aria-label': label,
  });
  input.checked = checked;
  if (disabled) input.disabled = true;
  if (onBlocked) {
    // The gate: revert the tick the browser just drew and open the sheet.
    input.addEventListener('click', (e) => { e.preventDefault(); onBlocked(); });
  } else {
    input.addEventListener('change', () => onChange(input));
  }
  return el('td', {}, input);
}

function channelCell(name, sub, ico, tone) {
  return el('td', {}, el('div', { class: 'dcp-rem-ch' }, [
    el('span', { class: 'dcp-rem-ico is-' + tone, 'aria-hidden': 'true' }, ico),
    el('span', {}, [el('b', {}, name), el('small', {}, sub)]),
  ]));
}

export function remindersBlock(me) {
  const r = (me.settings && me.settings.reminders) || {};
  const msg = el('span', { class: 'dcp-inline-msg', role: 'status' });
  const state = { new_content: !!r.new_content, streak: !!r.streak };
  const prefs = channelPrefs(me.settings);
  const isPremium = me.tier === 'premium';
  const hasPhone = !!(me.phone && String(me.phone).trim());

  const patchMaster = () => api.updateMe({ settings: { reminders: { ...state } } }).catch(() => {});
  const patchPrefs = () => api.updateMe({ settings: { notify_channels: prefs } })
    .then(() => currentUser({ refresh: true }))
    .catch(() => { msg.textContent = 'ذخیره نشد؛ دوباره تلاش کن.'; });

  // TWO keys decide whether a streak reminder happens, and the matrix writes
  // only one of them. `notify_channels.<ch>.streak` picks the CHANNEL;
  // `reminders.streak` decides whether the reminder is sent at all — and
  // streak-reminder.ts is the one service of five reading that key whose
  // default is OFF, so an account where it is false gets nothing by any
  // channel. Ticking «استریک» in this table is a reader saying «send me the
  // streak reminder, here», so the tick carries the master key with it.
  // Without this, an amber tick sat in the profile, survived every reload, and
  // delivered nothing — with no surface anywhere saying why (two readers,
  // 2026-09-18).
  const implyMaster = (kind) => {
    if (state[kind]) return null;
    state[kind] = true;
    master.checked = true;
    syncMaster();
    return patchMaster();
  };

  // ---- master --------------------------------------------------------------
  const master = el('input', { type: 'checkbox', role: 'switch', class: 'dcp-rem-sw', id: 'dcp-rem-master' });
  master.checked = state.new_content || state.streak;
  const matrix = el('div', { class: 'dcp-rem-matrix' });
  const syncMaster = () => {
    const on = master.checked;
    matrix.classList.toggle('is-off', !on);
    matrix.setAttribute('aria-hidden', on ? 'false' : 'true');
    matrix.querySelectorAll('input').forEach((i) => { i.tabIndex = on ? 0 : -1; });
  };
  master.addEventListener('change', async () => {
    const on = master.checked;
    state.new_content = on; // the switch reflects the user's intent no matter what
    state.streak = on;
    syncMaster();
    if (on) {
      // Call ensurePushSubscription FIRST so the click gesture is still active
      // for the permission prompt (any earlier await would consume it). The
      // switch stays on regardless of the outcome; we only annotate delivery.
      msg.textContent = 'در حال فعال‌سازی اعلان‌ها...';
      const res = await ensurePushSubscription();
      msg.textContent = res === 'ok' ? '' : guidanceText(res);
    } else {
      msg.textContent = '';
    }
    await patchMaster();
    // Off -> drop the browser subscription so none lingers.
    if (!on) await removePushSubscription();
  });

  // ---- rows ---------------------------------------------------------------
  const browserRow = el('tr', {}, [
    channelCell('مرورگر', browserStatus(), 'و', 'web'),
    ...['new_content', 'streak'].map((k) => cell({
      checked: prefs.webpush[k], amber: false,
      label: (k === 'streak' ? 'استریک' : 'مطلب جدید') + ' از مرورگر',
      onChange: async (input) => {
        prefs.webpush[k] = input.checked;
        if (input.checked && pushSupported()
            && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
          const res = await ensurePushSubscription();
          msg.textContent = res === 'ok' ? '' : guidanceText(res);
        }
        if (input.checked) await implyMaster(k);
        await patchPrefs();
      },
    })),
  ]);

  const baleOn = baleEnabled();
  const baleLinked = !!me.bale_linked;
  const baleSub = baleLinked
    ? 'متصل است'
    : el('a', { href: '#connect', class: 'dcp-rem-link' }, 'متصل نیست — اتصال');
  const baleRow = baleOn ? el('tr', { class: baleLinked ? '' : 'is-muted' }, [
    channelCell('بله', baleSub, 'ب', 'bale'),
    ...['new_content', 'streak'].map((k) => cell({
      checked: prefs.bale[k], disabled: !baleLinked, amber: false,
      label: (k === 'streak' ? 'استریک' : 'مطلب جدید') + ' از بله',
      onChange: async (input) => {
        prefs.bale[k] = input.checked;
        if (input.checked) await implyMaster(k);
        await patchPrefs();
      },
    })),
  ]) : null;

  // پیامک — premium, streak only. Three readers, three rows (mockup decision 3):
  // premium with a phone → live amber box; premium without a phone → the row
  // stays, greyed, saying what is missing (a row that vanished could not be
  // wanted); free → the box is drawn and the tap opens the gate.
  let smsSub;
  let smsCell;
  const smsLabel = 'استریک از پیامک';
  if (!hasPhone && isPremium) {
    smsSub = el('a', { href: '#phone', class: 'dcp-rem-link' }, 'شماره ثبت نشده — ثبت شماره');
    smsCell = cell({ checked: false, disabled: true, amber: true, label: smsLabel, onChange: () => {} });
  } else if (!isPremium) {
    smsSub = hasPhone ? phoneNode(me.phone) : 'ویژه‌ی پریمیوم';
    smsCell = cell({
      checked: false, amber: true, label: smsLabel,
      onBlocked: () => openSheet(gateCard({
        title: 'پیامکِ استریک ویژه‌ی پریمیوم است',
        sub: 'با پریمیوم، یادآوریِ استریک به‌جای اعلانِ مرورگر با پیامک به گوشی‌ات می‌رسد — یک اسم، یک عدد، همان شب — و حتی وقتی بقیه‌ی اعلان‌ها قبلاً رفته باشند باز هم می‌آید.',
        cta: premiumCta('gate-sms'),
      })),
    });
  } else {
    smsSub = phoneNode(me.phone);
    smsCell = cell({
      checked: prefs.sms.streak, amber: true, label: smsLabel,
      onChange: async (input) => {
        prefs.sms.streak = input.checked;
        if (input.checked) await implyMaster('streak');
        await patchPrefs();
      },
    });
  }
  const smsRow = el('tr', { class: 'is-premium' + (hasPhone || !isPremium ? '' : ' is-muted') }, [
    channelCell(
      el('span', {}, ['پیامک ', el('span', { class: 'dcp-rem-tag' }, 'پریمیوم')]),
      smsSub, 'پ', 'sms',
    ),
    el('td', {}, el('span', { class: 'dcp-rem-dash', title: 'پیامک قالبِ متنِ آزاد ندارد' }, '—')),
    smsCell,
  ]);

  matrix.append(
    el('div', { class: 'dcp-rem-scroll' }, el('table', { class: 'dcp-rem-mx' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { scope: 'col' }, 'از کجا برسد'),
        el('th', { scope: 'col' }, 'مطلب جدید'),
        el('th', { scope: 'col' }, 'استریک'),
      ])),
      el('tbody', {}, [browserRow, baleRow, smsRow]),
    ])),
    el('p', { class: 'dcp-rem-foot' }, 'پیامک فقط برای یادآوریِ استریک فرستاده می‌شود و شب‌ها بعد از ساعت ۲۲ هرگز.'),
  );
  syncMaster();

  const block = el('div', { class: 'dcp-rem' }, [
    el('label', { class: 'dcp-rem-master', for: 'dcp-rem-master' }, [
      master,
      el('span', {}, [el('b', {}, 'نوتیف‌ها'), el('small', {}, 'خبرِ مطلبِ جدید + یادآوریِ استریک')]),
    ]),
    matrix,
    msg,
  ]);

  // Self-heal: if a reminder is on and the browser already grants notifications,
  // make sure a live subscription exists (the user may have unblocked in browser
  // settings, or turned a toggle on earlier while blocked and has since allowed).
  // Only when permission is already 'granted' so we never prompt without a gesture.
  if ((state.new_content || state.streak) && pushSupported()
      && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    ensurePushSubscription().catch(() => {});
  }

  return block;
}
