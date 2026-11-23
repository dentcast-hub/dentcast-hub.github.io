// @vitest-environment jsdom
// Drives the REAL shipped «ذخیره در دفترچه» (/plus/js/box-save.js) through the
// presentation layer's own mount (/plus/js/presentation.js).
//
// The decisions pinned here (the founder's approved mockup):
//   · every box gets the button at run time, inside a row marked
//     data-dc-presentation — no word is added to the article's text;
//   · guest and free reader see it LOCKED (amber, the lock icon) before any
//     tap; a tap opens one line under the box — no window, nothing saved —
//     and the guest's line offers the login;
//   · premium: the whole box (its words and its label) is saved; the button
//     says «در دفترچه ذخیره شد»; a second tap takes it out;
//   · a box already saved is drawn saved on arrival;
//   · /me unreachable: no button at all — never a purchase pitch;
//   · «در یک نگاه» still reads the label, never the button row.
import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

let user: any = null;
let status = 'user';
let savedRows: any[] = [];
let listFails: any = null;
const saves: any[] = [];
const deletes: string[] = [];
let loginOpened = 0;

vi.mock('/plus/js/api.js', () => ({
  api: {
    listBoxes: () => (listFails ? Promise.reject(listFails) : Promise.resolve({ boxes: savedRows })),
    saveBox: (b: any) => { saves.push(b); return Promise.resolve({ box: { id: 'box-' + saves.length, ...b } }); },
    deleteBox: (id: string) => { deletes.push(id); return Promise.resolve({ ok: true }); },
  },
  currentUser: () => Promise.resolve(user),
  meStatus: () => status,
}));
vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: () => { loginOpened += 1; return Promise.resolve(null); },
}));

const { mountPresentation, boxText } = await import('../../plus/js/presentation.js');
const { _resetBoxSave } = await import('../../plus/js/box-save.js');

const PAGE = 'sharehub/share-10';
const settle = () => new Promise((r) => setTimeout(r, 0));

function article() {
  document.body.innerHTML = `
    <main class="article-content-wrap"><div class="glass-box" id="body">
      <p>یکی از مفاهیمی که موقع تراش دندان برای روکش زیاد اسمش می‌آید ولی همیشه دقیق تعریف نمی‌شود، resistance form است.</p>
      <div role="note" class="dc-box dc-box-tip"><p class="dc-box-label" data-dc-presentation><strong>نکته‌ی بالینی</strong></p>
        <p>resistance form عمدتاً در مرحلهٔ تراش تعیین می‌شود،
           نه در لابراتوار.</p></div>
      <p>متن میانی.</p>
      <div role="note" class="dc-box"><p>Clinical Tip: روکش را اول کامل بنشانید.</p></div>
    </div></main>`;
  return document.getElementById('body')!;
}

async function mount() {
  const root = article();
  mountPresentation(root, [root], document, PAGE);
  await settle(); await settle();
  return root;
}

const buttons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.dc-box-save-btn'));

beforeEach(() => {
  _resetBoxSave();
  user = null; status = 'anon'; savedRows = []; listFails = null;
  saves.length = 0; deletes.length = 0; loginOpened = 0;
});

describe('the button', () => {
  it('is drawn on every box, inside a marked row, and adds no word to the box text', async () => {
    user = { tier: 'premium' }; status = 'user';
    const root = await mount();
    expect(buttons()).toHaveLength(2);
    for (const row of Array.from(document.querySelectorAll('.dc-box-save'))) {
      expect(row.hasAttribute('data-dc-presentation')).toBe(true);
      expect(row.parentElement!.classList.contains('dc-box')).toBe(true);
    }
    const box = root.querySelector('.dc-box-tip')!;
    expect(boxText(box)).toBe('resistance form عمدتاً در مرحلهٔ تراش تعیین می‌شود، نه در لابراتوار.');
  });

  it('«در یک نگاه» reads the label, never the button row', async () => {
    user = { tier: 'premium' }; status = 'user';
    await mount();
    const labs = Array.from(document.querySelectorAll('.dc-glance-lab')).map((x) => x.textContent);
    // the frame-alone box is named by the author's own «Clinical Tip:» (glanceRow)
    expect(labs).toEqual(['نکته‌ی بالینی', 'Clinical Tip']);
  });

  it('is not drawn when /me could not be asked', async () => {
    user = null; status = 'error';
    await mount();
    expect(buttons()).toHaveLength(0);
  });
});

describe('guest and free reader', () => {
  it('a free reader sees the lock before the tap; the tap opens one line under the box and saves nothing', async () => {
    user = { tier: 'free' }; status = 'user';
    const root = await mount();
    const [b] = buttons();
    expect(b.classList.contains('is-locked')).toBe(true);
    expect(b.querySelector('svg')).not.toBeNull();
    b.click(); await settle();
    const box = root.querySelector('.dc-box-tip')!;
    const line = box.querySelector(':scope > .dc-box-gate')!;
    expect(line).not.toBeNull();
    expect(line.hasAttribute('data-dc-presentation')).toBe(true);
    expect(line.textContent).toContain('ذخیرهٔ کادرها در دفترچه ویژهٔ پریمیوم است.');
    expect(line.querySelector('a')!.getAttribute('href')).toContain('box-save');
    expect(line.querySelector('.dc-box-gate-login')).toBeNull();
    expect(document.querySelector('[role="dialog"], .dcp-sheet, .dcp-modal')).toBeNull();
    expect(saves).toHaveLength(0);
    b.click(); await settle();
    expect(box.querySelector(':scope > .dc-box-gate')).toBeNull();
  });

  it('a guest also gets the way in', async () => {
    user = null; status = 'anon';
    const root = await mount();
    buttons()[0].click(); await settle();
    const login = root.querySelector('.dc-box-gate-login') as HTMLButtonElement;
    expect(login).not.toBeNull();
    login.click(); await settle();
    expect(loginOpened).toBe(1);
    expect(saves).toHaveLength(0);
  });
});

describe('premium', () => {
  it('saves the whole box — words and label — and a second tap takes it out', async () => {
    user = { tier: 'premium' }; status = 'user';
    await mount();
    const [b, frame] = buttons();
    expect(b.classList.contains('is-locked')).toBe(false);
    b.click(); await settle(); await settle();
    expect(saves).toEqual([{
      content_id: PAGE,
      text: 'resistance form عمدتاً در مرحلهٔ تراش تعیین می‌شود، نه در لابراتوار.',
      label: 'نکته‌ی بالینی',
    }]);
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(b.textContent).toBe('در دفترچه ذخیره شد');
    b.click(); await settle(); await settle();
    expect(deletes).toEqual(['box-1']);
    expect(b.getAttribute('aria-pressed')).toBe('false');

    frame.click(); await settle(); await settle();
    expect(saves[1]).toEqual({ content_id: PAGE, text: 'Clinical Tip: روکش را اول کامل بنشانید.', label: null });
  });

  it('a box already in the notebook is drawn saved on arrival', async () => {
    user = { tier: 'premium' }; status = 'user';
    savedRows = [{ id: 'old', text: 'resistance form عمدتاً در مرحلهٔ تراش تعیین می‌شود، نه در لابراتوار.' }];
    await mount();
    const [b, other] = buttons();
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(other.getAttribute('aria-pressed')).toBe('false');
  });

  it('an API without the route yet (404) draws no button for a subscriber — never one that can only fail', async () => {
    user = { tier: 'premium' }; status = 'user';
    listFails = Object.assign(new Error('not found'), { status: 404 });
    await mount();
    expect(buttons()).toHaveLength(0);
  });

  it('any other failure of the list still draws the button, as «not saved»', async () => {
    user = { tier: 'premium' }; status = 'user';
    listFails = Object.assign(new Error('down'), { status: 503 });
    await mount();
    expect(buttons()).toHaveLength(2);
    expect(buttons()[0].getAttribute('aria-pressed')).toBe('false');
  });
});
