// @vitest-environment jsdom
// «در یک نگاه» (plus/js/presentation.js buildGlance; dc-nav.js builds the same
// card on a standalone page with the same rules). The card sits ABOVE the
// article, so a box's words reach the reader before the paragraph they follow.
// Pinned here (founder's report on sharehub/share-58):
//   · a frame-alone box under «حرف آخر» is named by that heading, never «•»;
//   · a box opening with the author's own label («Clinical Tip:») is named by it;
//   · a row starts at the first sentence that does not point back with a
//     demonstrative («این ایمنی …»); «این کیس …» names the page and stays;
//   · a box with no name anywhere, or whose every sentence points back, gets no
//     row — and with fewer than two rows there is no card.
import { describe, it, expect, beforeEach } from 'vitest';

const { buildGlance, glanceRow } = await import('../../plus/js/presentation.js');

const LEAD = '<p>یکی از مفاهیمی که موقع تراش دندان برای روکش زیاد اسمش می‌آید ولی همیشه دقیق تعریف نمی‌شود، همین است.</p>';

function page(body: string) {
  document.body.innerHTML = `<main class="article-content-wrap"><div class="glass-box" id="b">${LEAD}${body}</div></main>`;
  return document.getElementById('b')!;
}
const rows = () => [...document.querySelectorAll('#dcGlance button')].map((b) => [
  b.querySelector('.dc-glance-lab')!.textContent, b.querySelector('.dc-glance-tx')!.textContent,
]);

beforeEach(() => { document.body.innerHTML = ''; });

describe('«در یک نگاه»', () => {
  it('share-58: the tip skips «این ایمنی …», the frame-alone box takes the heading above', () => {
    const root = page(`
      <p>مرور سیستماتیک Abduo نتیجه گرفته افزایش دائمی تا ۵ میلی‌متر ایمن است.</p>
      <div role="note" class="dc-box dc-box-tip"><p class="dc-box-label" data-dc-presentation><strong>نکته‌ی بالینی</strong></p>
        <p>این ایمنی شرط داره. TMJ باید سالم، adapted و پایدار باشه.</p></div>
      <h2><span data-dc-presentation>۵. </span>حرف آخر</h2>
      <div role="note" class="dc-box"><p>قبل از دست زدن به OVD باید دلیل کلینیکی روشنی داشته باشیم.</p></div>`);
    buildGlance([root]);
    expect(rows()).toEqual([
      ['نکته‌ی بالینی', 'TMJ باید سالم، adapted و پایدار باشه.'],
      ['حرف آخر', 'قبل از دست زدن به OVD باید دلیل کلینیکی روشنی داشته باشیم.'],
    ]);
  });

  it('the author\'s own label names a frame-alone box, and is not repeated in its words', () => {
    const box = page('<div role="note" class="dc-box"><p>خلاصه‌ی بالینی: وقتی همه‌ی داده‌ها را با هم تحلیل می‌کنید، تفاوت کم است.</p></div>')
      .querySelector('.dc-box')!;
    expect(glanceRow(box)).toEqual({ label: 'خلاصه‌ی بالینی', text: 'وقتی همه‌ی داده‌ها را با هم تحلیل می‌کنید، تفاوت کم است.' });
  });

  it('«این کیس …» names the page and stays; a leading connector stays', () => {
    const root = page(`
      <div role="note" class="dc-box dc-box-bottom"><p class="dc-box-label" data-dc-presentation><strong>نتیجه</strong></p><p>این کیس یادآوری می‌کند که فرول مهم است.</p></div>
      <div role="note" class="dc-box dc-box-tip"><p class="dc-box-label" data-dc-presentation><strong>نکته‌ی بالینی</strong></p><p>بنابراین قبل از درمان، ساپورت خلفی لازم است.</p></div>`);
    buildGlance([root]);
    expect(rows().map((r) => r[1])).toEqual(['این کیس یادآوری می‌کند که فرول مهم است.', 'بنابراین قبل از درمان، ساپورت خلفی لازم است.']);
  });

  it('no name anywhere, or nothing that stands alone: no row — and one row is no card', () => {
    const root = page(`
      <p>یک پاراگراف.</p>
      <div role="note" class="dc-box"><p>جمله‌ای که هیچ برچسبی ندارد و تیتری هم بالایش نیست.</p></div>
      <div role="note" class="dc-box dc-box-tip"><p class="dc-box-label" data-dc-presentation><strong>نکته‌ی بالینی</strong></p><p>این مقادیر مطلق نیستند. این‌ها نقطهٔ شروع‌اند.</p></div>
      <div role="note" class="dc-box dc-box-bottom"><p class="dc-box-label" data-dc-presentation><strong>نتیجه</strong></p><p>فرول دو میلی‌متر لازم است.</p></div>`);
    const boxes = [...root.querySelectorAll('.dc-box')];
    expect(glanceRow(boxes[0])).toBeNull();
    expect(glanceRow(boxes[1])).toBeNull();
    buildGlance([root]);
    expect(document.getElementById('dcGlance')).toBeNull();
  });
});
