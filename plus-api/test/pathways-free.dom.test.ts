// @vitest-environment jsdom
// Drives the REAL shipped catalog/detail renderers (/plus/js/pathways.js) for
// the one-pathway-free decision (founder, 1405/07/03): a pathway whose entry
// says `premium: false` is open to a free account, and the catalog a free
// reader sees shows it live and FIRST, every other pathway locked in amber —
// never hidden, because a locked door is what makes the rest wantable. The
// server decides per pathway (`open` on each row, 402 on a locked one); the
// page keeps no list of its own.
import { describe, it, expect, beforeEach, vi } from 'vitest';

class ApiError extends Error {
  status: number;
  constructor(status: number) { super('api ' + status); this.status = status; }
}

let pathways: () => Promise<unknown>;
let pathway: (id: string) => Promise<unknown>;

vi.mock('/plus/js/api.js', () => ({
  ApiError,
  api: {
    pathways: () => pathways(),
    pathway: (id: string) => pathway(id),
    exam: () => Promise.reject(new ApiError(409)),
  },
}));

const row = (id: string, title: string, extra: Record<string, unknown> = {}) => ({
  id, kind: null, glyph: null, title_fa: title, description_fa: 'شرح',
  milestone_count: 0, enrolled: false, started_at: null, certifiable: false,
  certificate_intent: null, certificate_held: false,
  completed_steps: 0, total_steps: 10, current_step: 0, is_complete: false,
  ...extra,
});

const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => { document.body.innerHTML = '<div id="root"></div>'; });

describe('the catalog a free reader sees', () => {
  it('puts the open pathway first, says so, and locks the rest', async () => {
    pathways = () => Promise.resolve({ pathways: [
      row('fixed-pros', 'پروتز ثابت', { open: false, free: false }),
      row('evidence-literacy', 'ارزیابی شواهد و استدلال بالینی', { open: true, free: true }),
      row('bundle-x', 'باندل', { kind: 'bundle', open: false, free: false }),
    ] });
    const { renderPathwaysList } = await import('/plus/js/pathways.js');
    const root = document.getElementById('root')!;
    await renderPathwaysList(root, { onLocked: () => { throw new Error('not locked'); } });

    const cards = Array.from(root.querySelectorAll('.dcp-pw-card'));
    expect(cards[0].textContent).toContain('ارزیابی شواهد');
    expect(cards[0].querySelector('.dcp-pw-free')).toBeTruthy();
    expect(cards[1].classList.contains('is-locked')).toBe(true);
    expect(cards[1].querySelector('.dcp-pw-lock')!.textContent).toContain('پریمیوم');
    expect(root.querySelector('.dcp-pw-freenote')!.textContent).toContain('ارزیابی شواهد و استدلال بالینی');
    expect(root.querySelector('.dcb-railcard')!.textContent).toContain('پریمیوم');
  });

  it('a locked pathway the reader has read to the end says «تکمیل شد» and leads to its exam', async () => {
    pathways = () => Promise.resolve({ pathways: [
      row('evidence-literacy', 'ارزیابی شواهد و استدلال بالینی', { open: true, free: true }),
      row('removable-pros', 'پروتز متحرک', { open: false, free: false, completed_steps: 10, total_steps: 10, is_complete: true }),
      row('fixed-pros', 'پروتز ثابت', { open: false, free: false }),
    ] });
    const { renderPathwaysList } = await import('/plus/js/pathways.js');
    const root = document.getElementById('root')!;
    await renderPathwaysList(root);
    const [, done, locked] = Array.from(root.querySelectorAll('.dcp-pw-card'));
    expect(done.getAttribute('href')).toBe('/plus/exam.html?id=removable-pros');
    expect(done.classList.contains('is-locked')).toBe(false);
    expect(done.querySelector('.dcp-pw-tag.is-done')!.textContent).toContain('تکمیل شد');
    expect(done.querySelector('.dcp-pw-lock')).toBeNull();
    expect(locked.getAttribute('href')).toBe('/plus/pathway.html?id=fixed-pros');
    expect(locked.querySelector('.dcp-pw-lock')).toBeTruthy();
  });

  it('a premium reader sees no lock and no «رایگان» chip', async () => {
    pathways = () => Promise.resolve({ pathways: [
      row('fixed-pros', 'پروتز ثابت', { open: true, free: false }),
      row('evidence-literacy', 'ارزیابی شواهد و استدلال بالینی', { open: true, free: true }),
    ] });
    const { renderPathwaysList } = await import('/plus/js/pathways.js');
    const root = document.getElementById('root')!;
    await renderPathwaysList(root);
    expect(root.querySelector('.dcp-pw-lock, .dcp-pw-free, .dcp-pw-freenote')).toBeNull();
    expect(root.querySelector('.dcp-pw-card')!.textContent).toContain('پروتز ثابت');
  });

  it('an API that still gates the whole route (402) draws the old gate', async () => {
    pathways = () => Promise.reject(new ApiError(402));
    const { renderPathwaysList } = await import('/plus/js/pathways.js');
    const onLocked = vi.fn();
    await renderPathwaysList(document.getElementById('root')!, { onLocked });
    expect(onLocked).toHaveBeenCalledOnce();
  });
});

describe('one pathway page', () => {
  it('a 402 on a premium pathway draws the gate, never «پیدا نشد»', async () => {
    pathway = () => Promise.reject(new ApiError(402));
    const { renderPathwayDetail } = await import('/plus/js/pathways.js');
    const root = document.getElementById('root')!;
    const onLocked = vi.fn();
    await renderPathwayDetail(root, 'fixed-pros', { onLocked });
    expect(onLocked).toHaveBeenCalledOnce();
    expect(root.textContent).not.toContain('پیدا نشد');
  });

  it('a 404 is still «پیدا نشد»', async () => {
    pathway = () => Promise.reject(new ApiError(404));
    const { renderPathwayDetail } = await import('/plus/js/pathways.js');
    const root = document.getElementById('root')!;
    const onLocked = vi.fn();
    await renderPathwayDetail(root, 'nope', { onLocked });
    await settle();
    expect(onLocked).not.toHaveBeenCalled();
    expect(root.textContent).toContain('پیدا نشد');
  });
});
