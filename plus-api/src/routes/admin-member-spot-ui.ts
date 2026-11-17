/** Native admin markup: same-origin Basic auth, existing table/form styles. */
export function renderMemberSpotControls(): string {
  return String.raw`
  <h3 style="margin-top:26px">فهرست اعضا</h3>
  <form id="memberFilters" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    <div><label for="memberQuery">جستجوی نام، نام کاربری، موبایل یا شناسه</label><input id="memberQuery" maxlength="200" type="search"></div>
    <div><label for="memberOrder">ترتیب تاریخ عضویت</label><select id="memberOrder"><option value="newest">تازه‌ترین عضوها اول</option><option value="oldest">قدیمی‌ترین عضوها اول</option></select></div>
    <button type="submit">جستجو / بازخوانی</button>
  </form>
  <div id="memberStatus" role="status" aria-live="polite"></div>
  <div class="tblwrap" style="max-height:65vh;overflow:auto" tabindex="0" aria-label="فهرست قابل پیمایش اعضا">
    <table><thead><tr><th>عضو و تاریخ عضویت</th><th>پریمیوم واقعی</th><th>اشتراک</th><th>جایزهٔ لیگ</th><th>پرداخت‌ها</th></tr></thead><tbody id="memberRows"></tbody></table>
  </div>
  <button id="memberMore" type="button" hidden>اعضای بیشتر</button>
  <div class="muted">وضعیت از اشتراک و جایزهٔ ثبت‌شده محاسبه می‌شود؛ سطح کش‌شدهٔ حساب معیار نیست. لغو یا شکست پرداخت به معنای لغو اشتراک نیست.</div>
  <h3 style="margin-top:26px">برنامهٔ چهارزمانهٔ تبلیغ‌ها</h3>
  <style>
  .cmp-intro{color:#4a5f85;font-size:.92rem;line-height:1.9}
  .cmp-more{margin-top:6px;font-size:.86rem;color:#62779a}
  .cmp-more summary{cursor:pointer;color:#0b5fff}
  .cmp-steps{display:flex;gap:8px;margin:14px 0 4px}
  .cmp-step{flex:1;min-width:0;border:1px solid #dce4f2;border-radius:14px;padding:9px 4px;background:#fff;text-align:center;font:inherit;font-size:.8rem;color:#62779a;cursor:pointer}
  .cmp-step b{display:block;font-size:.9rem;color:#0a1a33;margin-bottom:2px}
  .cmp-step.on{border-color:#0b5fff;background:#eef4ff;color:#0b5fff}
  .cmp-step.house{border-color:#9db4dd;background:#f4f7fd;color:#33476b}
  .cmp-status{margin:12px 0 0;padding:10px 14px;border-radius:12px;background:#f1f5fb;color:#33476b;font-size:.9rem;line-height:1.8}
  .cmp-status.ok{background:#e8f6ee;color:#17603a}
  .cmp-status.err{background:#fdecec;color:#9b1c1c}
  .cmp-card{margin-top:12px;padding:14px 16px;border:1px solid #dce4f2;border-radius:16px;background:#fff}
  .cmp-card.off{background:#f8fafe}
  .cmp-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
  .cmp-head h4{margin:0;font-size:1.05rem;color:#0a1a33}
    .cmp-off{margin:10px 0 0;color:#62779a;font-size:.88rem;line-height:1.8}
  .cmp-body{margin-top:12px;display:grid;gap:12px}
  .cmp-body[hidden],.cmp-field[hidden],.cmp-off[hidden],.cmp-row[hidden]{display:none}
  .cmp-field label{display:block;font-size:.82rem;color:#62779a;margin-bottom:4px}
  .cmp-field input:not([type=file]):not([type=checkbox]),.cmp-field textarea,.cmp-field select{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cfd9ea;border-radius:10px;font:inherit;background:#fff;color:#0a1a33}
  .cmp-field textarea{min-height:72px;resize:vertical}
  .cmp-field input[type=file]{max-width:100%;font-size:.82rem}
  .cmp-hint{font-size:.78rem;color:#7a8aa6;margin-top:4px;line-height:1.7}
  .cmp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .cmp-prev-l{font-size:.78rem;color:#62779a;margin-bottom:4px}
  .cmp-prev{border:1px dashed #b9c7e0;border-radius:14px;padding:12px 14px;background:#f8fafe;color:#0a1a33}
  .cmp-prev small{display:inline-block;background:#e6edfb;color:#3b5ea8;border-radius:999px;padding:2px 10px;font-size:.72rem}
  .cmp-prev h4{margin:.4rem 0 .2rem;font-size:1rem}
  .cmp-prev p{margin:.2rem 0;font-size:.9rem;line-height:1.8}
  .cmp-prev img{display:block;max-width:100%;max-height:180px;border-radius:10px;margin-top:6px}
  .cmp-prev a{display:inline-block;margin-top:8px;background:#0b5fff;color:#fff;border-radius:999px;padding:6px 16px;text-decoration:none;font-size:.85rem}
  .cmp-prev .cmp-empty{color:#7a8aa6;font-size:.86rem}
  .cmp-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;align-items:center}
  .cmp-btn{border:0;border-radius:999px;padding:11px 24px;font:inherit;font-weight:700;cursor:pointer;background:#0b5fff;color:#fff}
  .cmp-btn.ghost{background:#fff;color:#0b5fff;border:1px solid #b9c7e0;font-weight:500}
  .cmp-btn.small{padding:8px 16px;font-size:.85rem}
  .cmp-btn:disabled{opacity:.55;cursor:default}
  .cmp-dirty{font-size:.82rem;color:#b06a00}
  </style>
  <div class="cmp-intro">تبلیغ‌های سایت چهار «زمان» دارند که پشتِ‌سرهم می‌چرخند. این‌جا مشخص می‌کنی در هر زمان چه نمایش داده شود: تبلیغ اسپانسر با محتوایی که خودت می‌نویسی، تبلیغ خودِ دنت‌کست، یا هیچ. بعد از زمان چهارم دوباره از اول شروع می‌شود. تا «ذخیره» را نزنی چیزی در سایت عوض نمی‌شود.</div>
  <details class="cmp-more">
    <summary>جزئیات</summary>
    <div><span id="campaignCadence"></span> مقاله و بقیهٔ جایگاه‌ها در هر زمان همان محتوا را نشان می‌دهند. صفحهٔ اصلی فقط تبلیغ اسپانسر نشان می‌دهد: در زمانی که مالِ اسپانسر است همان را، در زمانِ «خودِ دنت‌کست» یکی از اسپانسرهای همین برنامه را، و در زمانِ «هیچ» چیزی نشان نمی‌دهد. ستون کنارِ دسکتاپ همیشه محتوای زمان اول را دارد. کاربران پریمیوم همچنان تبلیغ نمی‌بینند.</div>
  </details>
  <form id="campaignForm" hidden>
    <div class="cmp-steps" id="campaignSteps"></div>
    <div id="campaignSessions"></div>
    <div class="cmp-actions">
      <button id="campaignSave" class="cmp-btn" type="submit">ذخیره</button>
      <button id="campaignReset" class="cmp-btn ghost" type="button">برگشتن به چرخشِ خودِ سایت</button>
      <span id="campaignDirty" class="cmp-dirty" hidden>تغییرات ذخیره نشده</span>
    </div>
  </form>
  <div id="campaignStatus" class="cmp-status" role="status" aria-live="polite">در حال خواندن…</div>
  <details style="margin-top:18px">
    <summary>تنظیم جداگانهٔ محل‌های نمایش (پیشرفته)</summary>
    <div class="muted">این گزینه‌ها فقط مشخص می‌کنند تبلیغ در کدام بخش‌های سایت نمایش داده شود. برای تغییر محتوای چهار زمان از برنامهٔ بالا استفاده کن.</div>
  <h4 style="margin-top:14px">جایگاه‌های نمایش</h4>
  <div class="muted">هر جایگاه به‌طور مستقل قابل جایگزینی است. تا پیش از ذخیره، تنظیمات فعلی سایت و چرخش تبلیغ‌ها برقرار می‌ماند.</div>
  <div id="spotControlStatus" role="status" aria-live="polite">در حال خواندن…</div>
  <form id="spotControlForm" hidden>
    <label for="spotPlacement">جایگاه</label><select id="spotPlacement"></select>
    <div id="spotControlMode" class="muted"></div>
    <label><input id="spotEnabled" type="checkbox"> فعال</label>
    <label for="spotBadge">برچسب</label><input id="spotBadge" maxlength="100">
    <label for="spotTitle">عنوان</label><input id="spotTitle" maxlength="300">
    <label for="spotText">متن</label><textarea id="spotText" maxlength="2000"></textarea>
    <label for="spotCta">متن دکمه</label><input id="spotCta" maxlength="100">
    <label for="spotUrl">لینک مقصد (اختیاری)</label><input id="spotUrl" dir="ltr" maxlength="2000" placeholder="https://… یا /plus/">
    <label for="spotImage">مسیر تصویر ذخیره‌شده (اختیاری)</label><input id="spotImage" dir="ltr" placeholder="/spot/img/…webp">
    <label for="spotUpload">آپلود تصویر WebP، PNG، JPEG یا GIF — حداکثر ۵ مگابایت</label><input id="spotUpload" type="file" accept="image/webp,image/png,image/jpeg,image/gif">
    <button id="spotUploadButton" type="button">آپلود تصویر</button>
    <button id="spotRemoveImage" type="button">برداشتن تصویر از محتوا</button>
    <div id="spotStorageStatus" class="muted"></div>
    <h4>پیش‌نمایش محتوا</h4><div id="spotPreview" class="card"></div>
    <button id="spotSave" type="submit">ذخیرهٔ جایگاه</button>
    <button id="spotReset" type="button">بازگشت به چرخش فعلی سایت</button>
  </form>
  </details>
  <script>
  (function () {
    function el(id) { return document.getElementById(id); }
    function text(tag, value) { var n = document.createElement(tag); n.textContent = value == null ? '—' : String(value); return n; }
    function when(value) { return value ? new Date(value).toLocaleString('fa-IR') : '—'; }
    function status(value) { return ({ active: 'فعال', expired: 'منقضی', revoked: 'لغوشده', canceled: 'لغوشده', paid: 'پرداخت‌شده', approved: 'تأییدشده', pending: 'در انتظار', failed: 'ناموفق', rejected: 'ردشده' })[value] || value || 'ندارد'; }
    function request(url, opts) {
      return fetch(url, Object.assign({ credentials: 'include', cache: 'no-store' }, opts || {})).then(function (r) {
        return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status); return j; });
      });
    }
    var cursor = null, generation = 0, loading = false, filter = {};
    function paymentCell(user) {
      var cell = document.createElement('td'), button = text('button', 'نمایش سوابق پرداخت'), list = document.createElement('div');
      var offset = 0, busy = false;
      button.type = 'button';
      button.onclick = function () {
        if (busy) return; busy = true; button.disabled = true;
        request('/admin/users/' + encodeURIComponent(user.id) + '/payments?offset=' + offset).then(function (j) {
          if (!j.payments.length && offset === 0) list.appendChild(text('p', 'پرداخت ثبت‌شده‌ای ندارد؛ هدیه یا جایزه الزاماً پرداخت ندارد.'));
          j.payments.forEach(function (p) {
            var box = document.createElement('div');
            box.appendChild(text('strong', status(p.status) + ' · ' + (p.kind || p.rail)));
            box.appendChild(text('p', when(p.created_at) + ' · ' + p.months + ' ماه · ' + (p.amount_rial == null ? 'مبلغ ریالی ثبت نشده' : p.amount_rial + ' ریال')));
            [['کد پیگیری', p.ref_id], ['مرجع بانک', p.bank_ref], ['شماره سفارش', p.order_id], ['مرجع واریز/هدیه', p.reference]].forEach(function (pair) {
              if (pair[1]) box.appendChild(text('p', pair[0] + ': ' + pair[1]));
            });
            list.appendChild(box);
          });
          offset = j.next_offset; button.hidden = offset == null; button.textContent = 'پرداخت‌های بیشتر';
        }).catch(function (e) { list.appendChild(text('p', 'خوانده نشد: ' + e.message)); }).finally(function () { busy = false; button.disabled = false; });
      };
      cell.append(button, list); return cell;
    }
    function memberRow(u) {
      var row = document.createElement('tr'), who = document.createElement('td');
      who.appendChild(text('strong', u.display_name || u.id));
      who.appendChild(text('p', u.phone)); who.appendChild(text('small', u.id));
      who.appendChild(text('p', 'عضویت: ' + when(u.created_at)));
      (u.identities || []).forEach(function (i) { if (i.username) who.appendChild(text('p', i.provider + ': ' + i.username)); });
      var sub = document.createElement('td'), s = u.subscription;
      if (s) {
        sub.appendChild(text('strong', status(s.effective_status) + ' · ' + s.plan));
        sub.appendChild(text('p', 'شروع: ' + when(s.started_at)));
        sub.appendChild(text('p', 'انقضا: ' + (s.is_founder && !s.expires_at ? 'همیشگی' : when(s.expires_at))));
        if (s.status !== s.effective_status) sub.appendChild(text('small', 'وضعیت ذخیره‌شده: ' + status(s.status)));
      } else sub.appendChild(text('p', u.last_subscription_event && u.last_subscription_event.kind === 'revoked' ? 'لغوشده (رویداد ثبت‌شدهٔ سرور)' : 'اشتراک ندارد'));
      if (u.last_subscription_event) sub.appendChild(text('small', 'آخرین تغییر: ' + (u.last_subscription_event.source || '') + ' · ' + when(u.last_subscription_event.at)));
      var league = document.createElement('td'), g = u.league_grant;
      if (g) {
        league.appendChild(text('p', g.extends_subscription ? 'افزوده‌شده به اشتراک' : 'جایزهٔ مستقل'));
        league.appendChild(text('p', 'شروع: ' + when(g.granted_at)));
        league.appendChild(text('p', 'انقضا: ' + when(g.expires_at)));
        if (g.revoked_at) league.appendChild(text('p', 'پایان ثبت‌شده: ' + when(g.revoked_at)));
      } else league.textContent = 'ندارد';
      row.append(who, text('td', u.is_premium ? 'فعال' : 'غیرفعال'), sub, league, paymentCell(u)); return row;
    }
    function loadMembers(reset) {
      if (reset) { generation++; cursor = null; loading = false; filter = { q: el('memberQuery').value.trim(), order: el('memberOrder').value }; el('memberRows').replaceChildren(); }
      if (loading) return; loading = true;
      var current = generation, params = new URLSearchParams(filter);
      if (cursor) params.set('cursor', cursor);
      el('memberMore').disabled = true; el('memberStatus').textContent = 'در حال خواندن…';
      request('/admin/users?' + params).then(function (j) {
        if (current !== generation) return;
        j.users.forEach(function (u) { el('memberRows').appendChild(memberRow(u)); });
        cursor = j.next_cursor; el('memberMore').hidden = !cursor;
        el('memberStatus').textContent = el('memberRows').children.length + ' عضو نمایش داده شد' + (cursor ? '؛ برای ادامه «اعضای بیشتر» را بزنید.' : '؛ پایان فهرست.');
      }).catch(function (e) { if (current === generation) el('memberStatus').textContent = 'خوانده نشد: ' + e.message; })
        .finally(function () { if (current === generation) { loading = false; el('memberMore').disabled = false; } });
    }
    el('memberFilters').onsubmit = function (e) { e.preventDefault(); loadMembers(true); };
    el('memberOrder').onchange = function () { loadMembers(true); };
    el('memberMore').onclick = function () { loadMembers(false); };
    loadMembers(true);

    var saved = {}, site = {}, objectUrl = null, uploading = false;
    var fields = { badge: 'spotBadge', title: 'spotTitle', text: 'spotText', cta: 'spotCta', url: 'spotUrl', image: 'spotImage' };
    var campaignUploading = false, uploadConfigured = false;
    var BEATS = 4, ORD = ['اول', 'دوم', 'سوم', 'چهارم'];
    function sessionId(i, key) { return 'campaign' + i + key; }
    // One place decides how the status reads: neutral while working, green for
    // done, red for anything the founder has to act on.
    function say(message, kind) {
      var box = el('campaignStatus');
      box.textContent = message; box.className = 'cmp-status' + (kind ? ' ' + kind : '');
      if (kind && typeof box.scrollIntoView === 'function') box.scrollIntoView({ block: 'nearest' });
    }
    function dirty(on) { el('campaignDirty').hidden = !on; }
    function field(cls, label, control, hint) {
      return '<div class="cmp-field ' + cls + '"><label>' + label + '</label>' + control + (hint ? '<div class="cmp-hint">' + hint + '</div>' : '') + '</div>';
    }
    function campaignCard(i) {
      var host = document.createElement('section'); host.className = 'cmp-card'; host.id = sessionId(i, 'Card');
      host.innerHTML = '<div class="cmp-head"><h4>زمان ' + ORD[i - 1] + '</h4></div>'
        + field('', 'در این زمان چه نمایش داده شود؟', '<select id="' + sessionId(i, 'Mode') + '">'
          + '<option value="custom">تبلیغ اسپانسر (محتوایی که این‌جا می‌نویسم)</option>'
          + '<option value="house">تبلیغ خودِ دنت‌کست</option>'
          + '<option value="off">هیچ</option></select>')
        + '<p class="cmp-off cmp-note-house">کارتِ خودِ سایت نمایش داده می‌شود: دعوت به پلاس برای مهمان، دعوت به پریمیوم برای عضو. متنِ این کارت از تنظیماتِ سایت می‌آید و از این‌جا عوض نمی‌شود.</p>'
        + '<p class="cmp-off cmp-note-off">در این زمان هیچ تبلیغی نمایش داده نمی‌شود.</p>'
        + '<div class="cmp-body">'
        + field('', 'شکلِ تبلیغ', '<select id="' + sessionId(i, 'Kind') + '"><option value="text">فقط متن</option><option value="image">فقط تصویر</option><option value="mixed">تصویر و متن</option></select>')
        + field('campaign-text', 'عنوان', '<input id="' + sessionId(i, 'Title') + '" maxlength="300">')
        + field('campaign-text', 'متن', '<textarea id="' + sessionId(i, 'Text') + '" maxlength="2000"></textarea>')
        + field('campaign-text', 'برچسب کوتاه (اختیاری)', '<input id="' + sessionId(i, 'Badge') + '" maxlength="100" placeholder="مثلاً حامی دنت‌کست">', 'بالای کارت، کوچک نوشته می‌شود.')
        + field('campaign-image', 'تصویر',
          '<div class="cmp-row campaign-upload"><input id="' + sessionId(i, 'Upload') + '" type="file" accept="image/webp,image/png,image/jpeg,image/gif">'
          + '<button type="button" class="cmp-btn ghost small" id="' + sessionId(i, 'UploadButton') + '">آپلود</button></div>'
          + '<div class="cmp-hint campaign-upload">WebP، PNG، JPEG یا GIF تا ۵ مگابایت. بعد از آپلود، مسیرش خودکار پایین نوشته می‌شود.</div>'
          + '<div class="cmp-hint campaign-noupload" hidden>آپلود از پنل روی این سرور فعال نیست؛ مسیرِ تصویری را که از قبل در سایت هست بنویس.</div>'
          + '<input id="' + sessionId(i, 'Image') + '" dir="ltr" placeholder="/spot/img/…webp" style="margin-top:8px">')
        + field('', 'لینک مقصد (اختیاری)', '<input id="' + sessionId(i, 'Url') + '" dir="ltr" maxlength="2000" placeholder="https://… یا /plus/">', 'خالی بماند، کارت به جایی لینک نمی‌شود.')
        + field('campaign-text', 'متن دکمه (اختیاری)', '<input id="' + sessionId(i, 'Cta') + '" maxlength="100" placeholder="مثلاً بیشتر بدانید">')
        + '<div><div class="cmp-prev-l">پیش‌نمایش</div><div id="' + sessionId(i, 'Preview') + '" class="cmp-prev"></div></div>'
        + '</div>';
      return host;
    }
    // What is SENT for a beat. The fields of a house or empty beat go along too:
    // the server keeps them, so switching a beat back to «اسپانسر» finds what was typed.
    function campaignValue(i) {
      var kind = el(sessionId(i, 'Kind')).value;
      return { mode: el(sessionId(i, 'Mode')).value, badge: kind === 'image' ? '' : el(sessionId(i, 'Badge')).value.trim(),
        title: kind === 'image' ? '' : el(sessionId(i, 'Title')).value.trim(), text: kind === 'image' ? '' : el(sessionId(i, 'Text')).value.trim(),
        cta: kind === 'image' ? '' : el(sessionId(i, 'Cta')).value.trim(), url: el(sessionId(i, 'Url')).value.trim(),
        image: kind === 'text' ? null : (el(sessionId(i, 'Image')).value.trim() || null) };
    }
    function campaignPreview(i) {
      var v = campaignValue(i), out = el(sessionId(i, 'Preview')); out.replaceChildren();
      if (v.mode !== 'custom') return;
      if (v.badge) out.appendChild(text('small', v.badge));
      if (v.title) out.appendChild(text('h4', v.title));
      if (v.text) out.appendChild(text('p', v.text));
      if (v.image && /^\/spot\/img\/[a-z0-9._-]+\.(webp|png|jpe?g|gif)$/i.test(v.image)) { var img = document.createElement('img'); img.src = new URL(v.image, 'https://dentcast.ir').href; img.alt = ''; out.appendChild(img); }
      if (v.url && safeLink(v.url)) {
        // A picture-only card has no button on the site: the whole picture is the link.
        if (el(sessionId(i, 'Kind')).value === 'image') { var note = text('div', 'کلِ تصویر لینک است به: ' + v.url); note.className = 'cmp-empty'; note.dir = 'auto'; out.appendChild(note); }
        else { var a = text('a', v.cta || 'باز کردن لینک'); a.href = new URL(v.url, 'https://dentcast.ir').href; a.rel = 'sponsored noopener'; a.target = '_blank'; out.appendChild(a); }
      }
      if (!out.children.length) { var empty = text('div', 'هنوز چیزی برای نمایش وارد نشده.'); empty.className = 'cmp-empty'; out.appendChild(empty); }
    }
    // The strip above the cards: the whole schedule at a glance, and a way to
    // jump to one beat without scrolling past the others.
    function campaignSteps() {
      // Called from each card's first paint, before the later cards exist.
      if (!el(sessionId(BEATS, 'Mode'))) return;
      var host = el('campaignSteps'); host.replaceChildren();
      for (var n = 1; n <= BEATS; n++) (function (i) {
        var mode = el(sessionId(i, 'Mode')).value, b = document.createElement('button');
        b.type = 'button'; b.className = 'cmp-step' + (mode === 'custom' ? ' on' : mode === 'house' ? ' house' : '');
        b.appendChild(text('b', 'زمان ' + ORD[i - 1]));
        b.appendChild(document.createTextNode(mode === 'custom' ? 'اسپانسر' : mode === 'house' ? 'دنت‌کست' : 'خالی'));
        b.onclick = function () { var c = el(sessionId(i, 'Card')); if (typeof c.scrollIntoView === 'function') c.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
        host.appendChild(b);
      })(n);
    }
    // The four beats the site is running RIGHT NOW, read from its published
    // rotation — so a founder who has never saved a schedule opens the form on
    // what is live, edits one beat, and saves, instead of retyping all four.
    function siteBeats() {
      var seq = (site.rotation && site.rotation.sequence) || [], creatives = site.creatives || {};
      var sponsors = (creatives.sponsors || []).filter(function (c) { return c && c.enabled; });
      var paid = sponsors.filter(function (c) { return !c.url || /^https?:\/\//.test(c.url); });
      var beats = [];
      for (var i = 0; i < BEATS; i++) {
        var step = seq.length ? seq[i % seq.length] : 'premium', c = null;
        if (step === 'none') { beats.push({ enabled: false, creative: {} }); continue; }
        if (step === 'premium') { beats.push({ enabled: true, house: true, creative: {} }); continue; }
        if (step === 'sponsor') c = paid[0];
        else c = sponsors.find(function (x) { return x.id === step; }) || paid[0];
        beats.push(c ? { enabled: true, creative: c } : { enabled: true, house: true, creative: {} });
      }
      return beats;
    }
    function setCampaignSessions(sessions) {
      var host = el('campaignSessions'); host.replaceChildren();
      for (var i = 1; i <= BEATS; i++) {
        // A beat the saved schedule does not have (one saved as three visits) is the house card.
        var value = sessions && sessions[i - 1] || { enabled: true, house: true, creative: {} }, c = value.creative || {};
        host.appendChild(campaignCard(i));
        el(sessionId(i, 'Mode')).value = !value.enabled ? 'off' : value.house ? 'house' : 'custom';
        el(sessionId(i, 'Kind')).value = c.image && (c.title || c.text) ? 'mixed' : c.image ? 'image' : 'text';
        ['Badge','Title','Text','Cta','Url','Image'].forEach(function (key) {
          var field = key.toLowerCase(); el(sessionId(i, key)).value = c[field] || '';
        });
        (function (n) {
          var card = host.children[n - 1];
          function update() {
            var kind = el(sessionId(n, 'Kind')).value, mode = el(sessionId(n, 'Mode')).value;
            card.classList.toggle('off', mode !== 'custom');
            card.querySelector('.cmp-body').hidden = mode !== 'custom';
            card.querySelector('.cmp-note-house').hidden = mode !== 'house';
            card.querySelector('.cmp-note-off').hidden = mode !== 'off';
            card.querySelectorAll('.campaign-text').forEach(function (x) { x.hidden = kind === 'image'; });
            card.querySelectorAll('.campaign-image').forEach(function (x) { x.hidden = kind === 'text'; });
            card.querySelectorAll('.campaign-upload').forEach(function (x) { x.hidden = !uploadConfigured; });
            card.querySelectorAll('.campaign-noupload').forEach(function (x) { x.hidden = uploadConfigured; });
            campaignPreview(n); campaignSteps();
          }
          card.addEventListener('input', function () { dirty(true); campaignPreview(n); });
          card.addEventListener('change', function () { dirty(true); update(); });
          update();
          el(sessionId(n, 'UploadButton')).disabled = !uploadConfigured;
          el(sessionId(n, 'UploadButton')).onclick = function () {
            var file = el(sessionId(n, 'Upload')).files[0];
            if (campaignUploading) return;
            if (!file) { say('اول یک فایل تصویر انتخاب کن، بعد «آپلود» را بزن.', 'err'); return; }
            if (file.size > 5 * 1024 * 1024 || !['image/webp','image/png','image/jpeg','image/gif'].includes(file.type)) { say('نوع یا حجم تصویر مجاز نیست.', 'err'); return; }
            campaignUploading = true; el(sessionId(n, 'UploadButton')).disabled = true; say('در حال آپلود تصویر زمان ' + ORD[n - 1] + '…');
            request('/admin/spot/image', { method: 'POST', headers: { 'content-type': file.type }, body: file }).then(function (j) {
              el(sessionId(n, 'Image')).value = j.image; dirty(true); campaignPreview(n);
              say('تصویر زمان ' + ORD[n - 1] + ' آپلود شد. چند دقیقه طول می‌کشد تا روی سایت منتشر شود؛ بعد «ذخیره» را بزن.', 'ok');
            }).catch(function (e) { say('آپلود نشد: ' + e.message, 'err'); })
              .finally(function () { campaignUploading = false; el(sessionId(n, 'UploadButton')).disabled = !uploadConfigured; });
          };
        })(i);
      }
      campaignSteps(); dirty(false);
    }
    el('campaignForm').onsubmit = function (e) {
      e.preventDefault(); if (campaignUploading) return;
      var sessions = [];
      for (var i = 1; i <= BEATS; i++) sessions.push(campaignValue(i));
      for (i = 0; i < sessions.length; i++) {
        if (sessions[i].mode === 'custom' && !(sessions[i].title || sessions[i].text || sessions[i].image)) { say('برای زمان ' + ORD[i] + ' متن یا تصویر وارد کن، یا آن را روی «هیچ» یا «تبلیغ خودِ دنت‌کست» بگذار.', 'err'); return; }
        if (!safeLink(sessions[i].url)) { say('لینک زمان ' + ORD[i] + ' معتبر نیست. باید با https:// یا / شروع شود.', 'err'); return; }
      }
      el('campaignSave').disabled = true; say('در حال ذخیره…');
      request('/admin/spot/campaign', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessions: sessions }) }).then(function () {
        dirty(false);
        say('برنامه ذخیره شد و از همین حالا روی سایت فعال است.', 'ok');
      }).catch(function (e) { say('ذخیره نشد: ' + e.message, 'err'); }).finally(function () { el('campaignSave').disabled = false; });
    };
    el('campaignReset').onclick = function () {
      // It drops what the founder typed for a published rotation they did not write here.
      if (typeof confirm === 'function' && !confirm('برنامهٔ ذخیره‌شده کنار برود و چرخشِ خودِ سایت برگردد؟')) return;
      request('/admin/spot/campaign/reset', { method: 'POST' }).then(function () { setCampaignSessions(siteBeats()); say('چرخشِ خودِ سایت دوباره فعال شد. این چهار زمان همان است.', 'ok'); })
        .catch(function (e) { say('بازنشانی نشد: ' + e.message, 'err'); });
    };
    function revokePreview() { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = null; }
    function formValue() { var v = { enabled: el('spotEnabled').checked }; Object.keys(fields).forEach(function (key) { v[key] = el(fields[key]).value.trim(); }); v.image = v.image || null; return v; }
    function safeLink(url) {
      if (!url) return true;
      if (/[\s\\\u0000-\u001f\u007f]/.test(url)) return false;
      if (/^\/(?!\/)/.test(url)) return true;
      try { var parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password; }
      catch (_) { return false; }
    }
    function preview() {
      var v = formValue(), out = el('spotPreview'); out.replaceChildren();
      if (!v.enabled) { out.textContent = 'غیرفعال — در سایت نمایش داده نمی‌شود.'; return; }
      out.appendChild(text('small', v.badge)); out.appendChild(text('h4', v.title)); out.appendChild(text('p', v.text));
      if (objectUrl || /^\/spot\/img\/[a-z0-9._-]+\.(webp|png|jpe?g|gif)$/i.test(v.image || '')) {
        var image = document.createElement('img'); image.src = objectUrl || new URL(v.image, 'https://dentcast.ir').href;
        image.alt = ''; image.style.maxWidth = '100%'; image.style.maxHeight = '220px'; out.appendChild(image);
      }
      if (v.url && safeLink(v.url)) { var link = text('a', v.cta || v.url); link.href = new URL(v.url, 'https://dentcast.ir').href; link.target = '_blank'; link.rel = 'sponsored noopener'; out.appendChild(link); }
    }
    function choose() {
      revokePreview(); el('spotUpload').value = '';
      var slot = el('spotPlacement').value, override = saved[slot], v = override && override.creative;
      // An untouched placement previews the current first rotation beat, not
      // a made-up new advertisement. Saving is always an explicit replacement.
      if (!v) {
        var step = ((site.rotation || {}).sequence || ['premium'])[0], creatives = site.creatives || {};
        v = step === 'premium' ? creatives.premium : (creatives.sponsors || []).find(function (c) { return c.id === step; });
        v = v || {};
      }
      el('spotEnabled').checked = override ? override.enabled : !!(site.slots && site.slots[slot] && site.slots[slot].enabled);
      Object.keys(fields).forEach(function (key) { el(fields[key]).value = v[key] || ''; });
      el('spotControlMode').textContent = override ? 'محتوای مستقل ذخیره‌شده' : 'چرخش فعلی سایت؛ پیش‌نمایش زمان اول است و مخاطب و زمان‌های دیگر ممکن است محتوای دیگری ببینند.';
      preview();
    }
    request('/admin/spot/config').then(function (j) {
      saved = j.slots;
      Object.keys(j.placements).forEach(function (key) { var option = text('option', j.placements[key] + ' (' + key + ')'); option.value = key; el('spotPlacement').appendChild(option); });
      el('spotUploadButton').disabled = !j.upload_configured;
      uploadConfigured = !!j.upload_configured;
      el('spotStorageStatus').textContent = j.upload_configured ? 'تصویر در spot/img مخزن ذخیره می‌شود؛ نمایش عمومی پس از انتشار فایل سایت آماده است.' : 'آپلود به SPOT_GITHUB_TOKEN با دسترسی Contents:write همین مخزن در API نیاز دارد؛ مسیر تصاویر فعلی همچنان قابل استفاده است.';
      return request('/admin/spot/defaults');
    }).then(function (j) { site = j; return request('/admin/spot/campaign'); })
      .then(function (j) {
        el('campaignCadence').textContent = (site.rotation && site.rotation.advance) === 'session'
          ? 'نوبت با هر بار سر زدنِ خواننده به سایت یک زمان جلو می‌رود.'
          : 'نوبت با هر بازدیدِ صفحه‌ای که خواننده تبلیغ را در آن می‌بیند یک زمان جلو می‌رود.';
        setCampaignSessions(j.sessions || siteBeats());
        el('campaignForm').hidden = false;
        if (!j.sessions) say('هنوز برنامه‌ای از پنل ذخیره نشده؛ این چهار زمان همان چرخشِ فعلیِ سایت است. هر تغییری بدهی، با «ذخیره» فعال می‌شود.');
        else if (j.sessions.length !== BEATS) { dirty(true); say('برنامهٔ ذخیره‌شده ' + j.sessions.length + ' زمان داشت؛ زمانِ خالی‌مانده روی «تبلیغ خودِ دنت‌کست» گذاشته شد. «ذخیره» را بزن تا چهارزمانه شود.'); }
        else say('برنامهٔ ذخیره‌شده از پنل الان روی سایت فعال است.', 'ok');
        el('spotControlForm').hidden = false; el('spotControlStatus').textContent = ''; choose();
      })
      .catch(function (e) {
        el('spotControlForm').hidden = true; el('campaignForm').hidden = true;
        var message = e.message === 'spot_defaults_unavailable' ? 'تنظیمات فعلی سایت دریافت نشد؛ صفحه را دوباره بارگذاری کن. وضعیت جایگاه‌ها هنوز مشخص نیست.' : 'تنظیمات خوانده نشد: ' + e.message;
        say(message, 'err'); el('spotControlStatus').textContent = message;
      });
    el('spotPlacement').onchange = choose;
    el('spotControlForm').addEventListener('input', preview);
    el('spotImage').addEventListener('input', function () { revokePreview(); preview(); });
    el('spotRemoveImage').onclick = function () { revokePreview(); el('spotImage').value = ''; el('spotUpload').value = ''; preview(); };
    el('spotUploadButton').onclick = function () {
      var file = el('spotUpload').files[0]; if (!file || uploading) return;
      if (file.size > 5 * 1024 * 1024 || !['image/webp', 'image/png', 'image/jpeg', 'image/gif'].includes(file.type)) { el('spotControlStatus').textContent = 'نوع یا حجم تصویر مجاز نیست.'; return; }
      uploading = true; el('spotSave').disabled = true; el('spotUploadButton').disabled = true; el('spotPlacement').disabled = true;
      request('/admin/spot/image', { method: 'POST', headers: { 'content-type': file.type }, body: file }).then(function (j) {
        el('spotImage').value = j.image; revokePreview(); objectUrl = URL.createObjectURL(file); preview();
        el('spotControlStatus').textContent = 'تصویر ذخیره شد. پس از انتشار فایل سایت، جایگاه را ذخیره کنید؛ پیش‌نمایش فعلی از فایل انتخابی است.';
      }).catch(function (e) { el('spotControlStatus').textContent = 'آپلود نشد: ' + e.message; })
        .finally(function () { uploading = false; el('spotSave').disabled = false; el('spotUploadButton').disabled = false; el('spotPlacement').disabled = false; });
    };
    el('spotControlForm').onsubmit = function (e) {
      e.preventDefault(); if (uploading) return;
      var slot = el('spotPlacement').value, v = formValue();
      if (!safeLink(v.url)) { el('spotControlStatus').textContent = 'لینک مقصد معتبر نیست.'; return; }
      el('spotSave').disabled = true;
      request('/admin/spot/config/' + slot, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(v) }).then(function () {
        saved[slot] = { enabled: v.enabled, creative: v }; el('spotControlStatus').textContent = 'جایگاه ذخیره شد؛ با بارگذاری بعدی سایت اعمال می‌شود.';
        el('spotControlMode').textContent = 'محتوای مستقل ذخیره‌شده';
      }).catch(function (e) { el('spotControlStatus').textContent = 'ذخیره نشد: ' + e.message; }).finally(function () { el('spotSave').disabled = false; });
    };
    el('spotReset').onclick = function () {
      var slot = el('spotPlacement').value;
      request('/admin/spot/config/' + slot + '/reset', { method: 'POST' }).then(function () { delete saved[slot]; choose(); el('spotControlStatus').textContent = 'چرخش فعلی سایت برقرار شد.'; })
        .catch(function (e) { el('spotControlStatus').textContent = 'ذخیره نشد: ' + e.message; });
    };
  })();
  </script>`;
}
