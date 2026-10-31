import type { FastifyInstance, FastifyReply } from 'fastify';
import { QP_TYPES, QpError, MAX_QP_IMAGE_BYTES, publish, edit, restore, preview, status, source, uploadImage } from '../services/quick-publish.js';

// Registered INSIDE adminRoutes, after its onRequest requireAdmin hook.
// Owner doc: .dentcast/quick-publish.md
export async function adminQuickPublishRoutes(app: FastifyInstance): Promise<void> {
  const fail = (reply: FastifyReply, err: unknown) => {
    if (err instanceof QpError) return reply.code(err.status).send({ error: err.message });
    const message = (err as Error).message || '';
    if (message.startsWith('qp_storage_')) return reply.code(502).send({ error: 'storage_unavailable', detail: message });
    if (err instanceof SyntaxError) return reply.code(502).send({ error: 'brain_unreadable' });
    throw err;
  };
  const idOf = (p: unknown) => {
    const id = (p as { id?: string }).id ?? '';
    if (!/^[a-z0-9-]{1,40}$/.test(id)) throw new QpError('invalid_id');
    return id;
  };

  app.get('/admin/quick-publish', async () => ({ ...(await status()), types: Object.fromEntries(Object.entries(QP_TYPES).map(([k, t]) => [k, t.label])) }));
  app.post('/admin/quick-publish/preview', async (request, reply) => {
    try { return preview((request.body as { body?: unknown } | null)?.body); } catch (err) { return fail(reply, err); }
  });
  app.post('/admin/quick-publish', async (request, reply) => {
    try { return { ok: true, ...(await publish((request.body ?? {}) as Record<string, unknown> as never)) }; } catch (err) { return fail(reply, err); }
  });
  app.get('/admin/quick-publish/:id/source', async (request, reply) => {
    try {
      const s = await source(idOf(request.params));
      return s ?? reply.code(404).send({ error: 'not_found' });
    } catch (err) { return fail(reply, err); }
  });
  app.put('/admin/quick-publish/:id', async (request, reply) => {
    try { return { ok: true, ...(await edit(idOf(request.params), (request.body ?? {}) as never)) }; } catch (err) { return fail(reply, err); }
  });
  app.post('/admin/quick-publish/:id/restore', async (request, reply) => {
    try { return { ok: true, ...(await restore(idOf(request.params))) }; } catch (err) { return fail(reply, err); }
  });
  app.addContentTypeParser(['image/webp', 'image/png', 'image/jpeg', 'image/gif'], { parseAs: 'buffer', bodyLimit: MAX_QP_IMAGE_BYTES }, (_request, body, done) => done(null, body));
  app.post('/admin/quick-publish/media', { bodyLimit: MAX_QP_IMAGE_BYTES }, async (request, reply) => {
    if (!Buffer.isBuffer(request.body)) return reply.code(400).send({ error: 'invalid_image' });
    try { return { ok: true, path: await uploadImage(request.body, String(request.headers['content-type']).split(';')[0]) }; }
    catch (err) { return fail(reply, err); }
  });
}

/** Phone-first panel section. Filed by the admin shell under its H3. */
export function renderQuickPublish(): string {
  return String.raw`
  <h3 style="margin-top:26px">انتشار حداقلی (اضطراری)</h3>
  <div class="muted">برای وقتی که GitHub در دسترس نیست. مطلب مستقیم روی dentcast.ir منتشر می‌شود: صفحه، یک ردیف ته brain، و یک خط در دفتر انتشار حداقلی. بعد از وصل شدن اینترنت، هر مطلبِ این فهرست وارد گیت و ورک‌فلوی کامل می‌شود (انگلیسی، کراس‌لینک، پیلار، DES، هشتگ، Pulse …) و تا آن موقع دیپلوی‌ها جلوی پاک شدنش را می‌گیرند.</div>
  <div id="qpStatus" role="status" aria-live="polite" style="margin:10px 0">در حال خواندن…</div>
  <span id="qpWaiting" hidden></span>
  <form id="qpForm" class="qp-form" hidden>
    <input id="qpEditing" type="hidden">
    <div id="qpEditBanner" class="card" hidden></div>
    <label for="qpType">بخش</label><select id="qpType"></select>
    <fieldset class="qp-ask"><legend>این مطلب عکس دارد؟</legend>
      <label><input type="radio" name="qpHasImages" value="yes"> بله</label>
      <label><input type="radio" name="qpHasImages" value="no"> نه</label>
    </fieldset>
    <div id="qpImageBox" hidden>
      <label class="qp-file"><input id="qpImage" type="file" accept="image/webp,image/png,image/jpeg,image/gif" multiple hidden><span>انتخاب عکس‌ها از گوشی</span></label>
      <div class="muted">WebP، PNG، JPEG یا GIF، هر کدام تا ۸ مگابایت. هر عکس بعد از آپلود این‌جا می‌ماند؛ «درج در متن» آن را جای مکان‌نمای متن می‌گذارد. عکسی که در متن درج نکنی، موقع انتشار ته متن می‌آید.</div>
      <div id="qpImages"></div>
    </div>
    <label for="qpTitle">عنوان</label><input id="qpTitle" maxlength="200" autocomplete="off">
    <label for="qpCaption">توضیح کوتاه (کپشن و توضیح متا — ۱ تا ۲ جمله)</label><textarea id="qpCaption" maxlength="400" rows="3"></textarea>
    <label for="qpBody">متن</label>
    <details class="muted"><summary>راهنمای نوشتن</summary>
      <div>بین دو پاراگراف یک خط خالی. «## » اول خط = تیتر. «- » یا «۱. » اول خط = فهرست. **پررنگ**. [متن لینک](/glossary/…). متن باید با یک پاراگراف شروع شود.</div>
    </details>
    <textarea id="qpBody" rows="16" style="width:100%;font-size:16px;line-height:1.9"></textarea>
    <div class="qp-row">
      <button id="qpPreviewBtn" type="button">پیش‌نمایش</button>
    </div>
    <div id="qpDraftNote" class="muted"></div>
    <div id="qpPreview" class="card" hidden></div>
    <div class="qp-row">
      <button id="qpSubmit" type="submit">انتشار روی dentcast.ir</button>
      <button id="qpCancelEdit" type="button" hidden>انصراف از ویرایش</button>
    </div>
    <div id="qpResult" role="status" aria-live="polite"></div>
  </form>
  <h4 style="margin-top:20px">دفتر انتشار حداقلی</h4>
  <div id="qpList"></div>
  <style>
    .qp-form label{display:block;margin-top:12px}
    .qp-form input,.qp-form select,.qp-form textarea{width:100%;box-sizing:border-box;font-size:16px;font-family:inherit}
    .qp-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .qp-row>*{flex:1 1 140px;min-height:44px}
    .qp-file span{display:flex;align-items:center;justify-content:center;min-height:44px;border:1px dashed currentColor;border-radius:10px;cursor:pointer}
    #qpPreview img{max-width:100%;height:auto}
    .qp-item{border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:10px 12px;margin:8px 0}
    .qp-item b{display:block}
    .qp-chip{display:inline-block;font-size:.8rem;border-radius:999px;padding:1px 8px;margin-inline-start:6px;border:1px solid currentColor}
    .qp-item .qp-row button{min-height:38px}
    .qp-ask{margin-top:14px;border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:8px 12px}
    .qp-ask label{display:inline-flex;gap:6px;align-items:center;margin:4px 0 4px 18px;min-height:36px}
    .qp-ask input{width:auto}
    .qp-img{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:8px;margin:8px 0}
    .qp-img img{width:84px;height:84px;object-fit:cover;border-radius:8px}
    .qp-img .qp-img-main{flex:1 1 180px}
    .qp-img .qp-row{margin-top:6px}
    .qp-img .qp-in{font-size:.85rem}
  </style>
  <script>
  (function () {
    function el(id) { return document.getElementById(id); }
    var ERR = {
      storage_not_configured: 'دسترسی API به باکت آروان تنظیم نشده (QP_S3_*).',
      storage_unavailable: 'باکت آروان جواب نداد؛ چند لحظه بعد دوباره امتحان کن.',
      template_missing: 'قالب صفحه روی باکت نیست — این قابلیت هنوز یک بار روی dentcast.ir دیپلوی نشده.',
      template_invalid: 'قالب صفحه روی باکت خراب است.', brain_missing: 'dentcast-brain.json روی باکت پیدا نشد.',
      brain_unreadable: 'dentcast-brain.json روی باکت خوانا نیست؛ چیزی منتشر نشد.', ledger_unreadable: 'دفتر انتشار حداقلی خوانا نیست.',
      invalid_type: 'بخش را انتخاب کن.', invalid_title: 'عنوان بین ۳ تا ۲۰۰ حرف.', invalid_caption: 'توضیح کوتاه بین ۱۰ تا ۴۰۰ حرف.',
      invalid_body: 'متن خیلی کوتاه یا خیلی بلند است.', first_block_not_paragraph: 'متن باید با یک پاراگراف معمولی شروع شود، نه تیتر، فهرست یا تصویر.',
      invalid_image_reference: 'یک خط تصویر به فایلی اشاره می‌کند که از این پنل آپلود نشده.', image_not_uploaded: 'تصویری که در متن هست آپلود نشده.',
      invalid_image: 'فقط WebP، PNG، JPEG یا GIF تا ۸ مگابایت.', no_free_address: 'نشانی آزادی برای صفحه پیدا نشد.', id_taken: 'این شناسه در brain هست.',
      not_found: 'پیدا نشد.', already_imported: 'این مطلب وارد گیت شده؛ ویرایشش از این‌جا ممکن نیست.', type_locked: 'بخش مطلب منتشرشده عوض نمی‌شود.',
      brain_entry_moved: 'ردیف این مطلب در brain دست خورده؛ ویرایش از این‌جا ممکن نیست.'
    };
    var STATE = { live: 'زنده — منتظر ورود به گیت', imported: 'در گیت — منتظر ورک‌فلوی کامل', completed: 'کامل شد' };
    function msg(e) { return ERR[e] || ('خطا: ' + e); }
    function request(url, opts) {
      return fetch(url, Object.assign({ credentials: 'include', cache: 'no-store' }, opts || {})).then(function (r) {
        return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status); return j; });
      });
    }
    function json(method, url, body) { return request(url, { method: method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
    function text(tag, value, cls) { var n = document.createElement(tag); n.textContent = value; if (cls) n.className = cls; return n; }

    var form = el('qpForm'), body = el('qpBody'), DRAFT = 'dc-qp-draft', images = [];
    // The phone's own copy for the thumbnail: a just-uploaded file is not worth a round trip to the site.
    var shown = {};
    function hasImages() { var r = form.querySelector('input[name="qpHasImages"]:checked'); return r ? r.value : ''; }
    function setHasImages(v) {
      Array.prototype.forEach.call(form.querySelectorAll('input[name="qpHasImages"]'), function (r) { r.checked = r.value === v; });
      el('qpImageBox').hidden = v !== 'yes';
    }
    function fields() { return { type: el('qpType').value, title: el('qpTitle').value, caption: el('qpCaption').value, body: body.value }; }
    function fill(v) {
      el('qpType').value = v.type || el('qpType').value; el('qpTitle').value = v.title || ''; el('qpCaption').value = v.caption || ''; body.value = v.body || '';
      images = Array.isArray(v.images) ? v.images : []; setHasImages(v.hasImages || ''); drawImages();
    }
    function inBody(img) { return body.value.indexOf('](' + img.path + ')') >= 0; }
    function line(img) { return '![' + (img.alt || '').replace(/[\[\]\n]/g, ' ').trim() + '](' + img.path + ')'; }
    function drawImages() {
      var box = el('qpImages'); box.textContent = '';
      images.forEach(function (img, i) {
        var card = document.createElement('div'); card.className = 'qp-img';
        var t = document.createElement('img'); t.src = shown[img.path] || ('https://dentcast.ir' + img.path); t.alt = ''; card.appendChild(t);
        var main = document.createElement('div'); main.className = 'qp-img-main';
        var alt = document.createElement('input'); alt.placeholder = 'توضیح عکس (اختیاری)'; alt.maxLength = 200; alt.value = img.alt || '';
        alt.addEventListener('input', function () { img.alt = alt.value; saveDraft(); });
        main.appendChild(alt);
        main.appendChild(text('div', inBody(img) ? 'در متن درج شده' : 'هنوز در متن نیست — اگر درج نکنی ته متن می‌آید', 'muted qp-in'));
        var row = document.createElement('div'); row.className = 'qp-row';
        var put = text('button', 'درج در متن (جای مکان‌نما)'); put.type = 'button';
        put.onclick = function () { if (!inBody(img)) insert('\n\n' + line(img) + '\n\n'); drawImages(); };
        var drop = text('button', 'حذف از فهرست'); drop.type = 'button';
        drop.onclick = function () { if (inBody(img)) { alert('اول خطِ این عکس را از متن پاک کن.'); return; } images.splice(i, 1); saveDraft(); drawImages(); };
        row.appendChild(put); row.appendChild(drop); main.appendChild(row); card.appendChild(main); box.appendChild(card);
      });
    }
    Array.prototype.forEach.call(form.querySelectorAll('input[name="qpHasImages"]'), function (r) {
      r.addEventListener('change', function () { setHasImages(r.value); saveDraft(); });
    });
    function saveDraft() {
      if (el('qpEditing').value) return;
      try { localStorage.setItem(DRAFT, JSON.stringify(Object.assign(fields(), { images: images, hasImages: hasImages() }))); el('qpDraftNote').textContent = 'پیش‌نویس روی همین گوشی ذخیره شد.'; } catch (e) {}
    }
    ['qpType', 'qpTitle', 'qpCaption'].forEach(function (id) { el(id).addEventListener('input', saveDraft); });
    body.addEventListener('input', function () { saveDraft(); drawImages(); });

    function insert(snippet) {
      var s = body.selectionStart != null ? body.selectionStart : body.value.length, e = body.selectionEnd != null ? body.selectionEnd : s;
      body.value = body.value.slice(0, s) + snippet + body.value.slice(e);
      body.selectionStart = body.selectionEnd = s + snippet.length; saveDraft();
    }
    el('qpImage').addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []); this.value = '';
      var note = el('qpImageBox').querySelector('.muted'), done = 0, failed = [];
      if (!files.length) return;
      // One at a time: a phone on a weak link should not race eight uploads.
      (function next() {
        var f = files.shift();
        if (!f) {
          note.textContent = done.toLocaleString('fa-IR') + ' عکس آپلود شد' + (failed.length ? ' · ناموفق: ' + failed.join('، ') : '') + '. «درج در متن» هر عکس را جای مکان‌نمای متن می‌گذارد.';
          return;
        }
        note.textContent = 'در حال آپلود ' + f.name + '…';
        request('/admin/quick-publish/media', { method: 'POST', headers: { 'content-type': f.type }, body: f }).then(function (j) {
          try { shown[j.path] = URL.createObjectURL(f); } catch (e) {}
          images.push({ path: j.path, alt: '' }); done++; saveDraft(); drawImages();
        }).catch(function (e) { failed.push(f.name + ' (' + msg(e.message) + ')'); }).then(next);
      })();
    });
    function finalBody() {
      var extra = images.filter(function (img) { return !inBody(img); }).map(line);
      return extra.length ? body.value.replace(/\s+$/, '') + '\n\n' + extra.join('\n\n') + '\n' : body.value;
    }
    el('qpPreviewBtn').onclick = function () {
      json('POST', '/admin/quick-publish/preview', { body: finalBody() }).then(function (j) {
        var p = el('qpPreview'); p.hidden = false; p.innerHTML = j.html;
        if (j.warning) p.insertBefore(text('p', msg(j.warning), 'muted'), p.firstChild);
      }).catch(function (e) { el('qpResult').textContent = msg(e.message); });
    };
    function stopEditing() {
      el('qpEditing').value = ''; el('qpEditBanner').hidden = true; el('qpCancelEdit').hidden = true; el('qpType').disabled = false;
      el('qpSubmit').textContent = 'انتشار روی dentcast.ir';
      try { fill(JSON.parse(localStorage.getItem(DRAFT) || '{}')); } catch (e) { fill({}); }
    }
    el('qpCancelEdit').onclick = stopEditing;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var editing = el('qpEditing').value, v = fields();
      if (!hasImages()) { alert('اول بگو این مطلب عکس دارد یا نه.'); form.querySelector('.qp-ask').scrollIntoView({ behavior: 'smooth' }); return; }
      if (hasImages() === 'yes' && !images.length && !/!\[[^\]]*\]\(/.test(body.value)) {
        if (!confirm('گفتی عکس دارد ولی هنوز عکسی آپلود نشده. بدون عکس منتشر شود؟')) return;
      }
      var tail = images.filter(function (img) { return !inBody(img); }).length;
      v.body = finalBody();
      if (!confirm((editing ? 'نسخهٔ تازه جای صفحهٔ زنده بنشیند؟' : 'روی dentcast.ir منتشر شود؟') + (tail ? '\n' + tail + ' عکسِ درج‌نشده ته متن می‌آید.' : ''))) return;
      el('qpSubmit').disabled = true; el('qpResult').textContent = 'در حال انتشار…';
      (editing ? json('PUT', '/admin/quick-publish/' + encodeURIComponent(editing), v) : json('POST', '/admin/quick-publish', v)).then(function (j) {
        var r = el('qpResult'); r.textContent = (editing ? 'به‌روز شد: ' : 'منتشر شد: ');
        var a = text('a', j.url); a.href = j.url; a.target = '_blank'; a.rel = 'noopener'; r.appendChild(a);
        if (!editing) { try { localStorage.removeItem(DRAFT); } catch (e) {} fill({}); el('qpPreview').hidden = true; }
        else stopEditing();
        load();
      }).catch(function (e) { el('qpResult').textContent = msg(e.message); })
        .then(function () { el('qpSubmit').disabled = false; });
    });

    function row(it) {
      var box = document.createElement('div'); box.className = 'qp-item';
      var b = text('b', it.title); b.appendChild(text('span', STATE[it.state] || it.state, 'qp-chip')); box.appendChild(b);
      box.appendChild(text('div', it.id + ' · ' + it.date + ' · ' + it.path, 'muted'));
      var actions = document.createElement('div'); actions.className = 'qp-row';
      var open = text('a', 'باز کردن'); open.href = 'https://dentcast.ir' + it.path; open.target = '_blank'; open.rel = 'noopener'; actions.appendChild(open);
      if (it.state === 'live') {
        var ed = text('button', 'ویرایش'); ed.type = 'button';
        ed.onclick = function () {
          request('/admin/quick-publish/' + encodeURIComponent(it.id) + '/source').then(function (s) {
            var found = [], re = /!\[([^\]]*)\]\(([^)\s]+)\)/g, m;
            while ((m = re.exec(s.body))) found.push({ path: m[2], alt: m[1] });
            fill({ type: s.item.type, title: s.item.title, caption: s.item.caption, body: s.body, images: found, hasImages: found.length ? 'yes' : 'no' });
            el('qpEditing').value = it.id; el('qpType').disabled = true; el('qpCancelEdit').hidden = false;
            var banner = el('qpEditBanner'); banner.hidden = false; banner.textContent = 'در حال ویرایش ' + it.id + ' — نشانی و تاریخ عوض نمی‌شوند.';
            el('qpSubmit').textContent = 'ذخیرهٔ نسخهٔ تازه'; form.scrollIntoView({ behavior: 'smooth' });
          }).catch(function (e) { el('qpResult').textContent = msg(e.message); });
        };
        actions.appendChild(ed);
        var rs = text('button', 'بازگرداندن روی سایت'); rs.type = 'button';
        rs.title = 'اگر دیپلوی‌ای صفحه یا ردیف brain را پاک کرده، از نسخهٔ پشتیبان API برمی‌گرداند.';
        rs.onclick = function () {
          json('POST', '/admin/quick-publish/' + encodeURIComponent(it.id) + '/restore', {}).then(function (j) {
            el('qpResult').textContent = j.restored.length ? ('برگردانده شد: ' + j.restored.join('، ')) : 'همه‌چیز سر جایش بود.';
          }).catch(function (e) { el('qpResult').textContent = msg(e.message); });
        };
        actions.appendChild(rs);
      }
      box.appendChild(actions);
      return box;
    }
    function load() {
      request('/admin/quick-publish').then(function (j) {
        var st = el('qpStatus'), sel = el('qpType');
        if (!sel.options.length) {
          Object.keys(j.types).forEach(function (k) { var o = text('option', j.types[k]); o.value = k; sel.appendChild(o); });
          if (!el('qpEditing').value) { try { fill(JSON.parse(localStorage.getItem(DRAFT) || '{}')); } catch (e) {} }
        }
        if (!j.configured) st.textContent = msg('storage_not_configured');
        else if (j.error) st.textContent = msg('storage_unavailable') + ' (' + j.error + ')';
        else if (!j.template) st.textContent = msg('template_missing');
        else st.textContent = 'آماده. هر انتشار مستقیم روی dentcast.ir می‌نشیند.';
        form.hidden = !(j.configured && j.template && !j.error);
        var open = j.items.filter(function (it) { return it.state !== 'completed'; });
        el('qpWaiting').textContent = String(open.length);
        var list = el('qpList'); list.textContent = '';
        if (!j.items.length) list.appendChild(text('p', 'هنوز چیزی با انتشار حداقلی منتشر نشده.', 'muted'));
        j.items.slice().reverse().forEach(function (it) { list.appendChild(row(it)); });
      }).catch(function (e) { el('qpStatus').textContent = msg(e.message); });
    }
    load();
  })();
  </script>`;
}
