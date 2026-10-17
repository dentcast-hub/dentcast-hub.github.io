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
  <h3 style="margin-top:26px">مدیریت جایگاه‌های تبلیغ</h3>
  <div class="muted">هر جایگاه به‌طور مستقل قابل جایگزینی است. تا پیش از ذخیره، تنظیمات فعلی سایت و چرخش تبلیغ‌ها برقرار می‌ماند. پریمیوم همچنان تبلیغ نمی‌بیند.</div>
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
      el('spotStorageStatus').textContent = j.upload_configured ? 'تصویر در spot/img مخزن ذخیره می‌شود؛ نمایش عمومی پس از انتشار فایل سایت آماده است.' : 'آپلود به SPOT_GITHUB_TOKEN با دسترسی Contents:write همین مخزن در API نیاز دارد؛ مسیر تصاویر فعلی همچنان قابل استفاده است.';
      return request('/admin/spot/defaults');
    }).then(function (j) { site = j; el('spotControlForm').hidden = false; el('spotControlStatus').textContent = ''; choose(); })
      .catch(function (e) { el('spotControlForm').hidden = true; el('spotControlStatus').textContent = e.message === 'spot_defaults_unavailable' ? 'تنظیمات فعلی سایت دریافت نشد؛ صفحه را دوباره بارگذاری کنید. وضعیت جایگاه‌ها هنوز مشخص نیست.' : 'خوانده نشد: ' + e.message; });
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

