# تیکت آروان — قطع دسترسی خروجی به یک مقصد خارجی

تاریخ تهیه: ۶ مرداد ۱۴۰۵ (2026-07-27)
مربوط به: قطع کانال نوتیف تلگرام از سرویس plus-api روی ArvanCloud Cloud Container

نکتهٔ تایپی: در فرم تیکت، هر توکن لاتین را روی خط جداگانه نگه دار. قاطی‌شدن
فارسی و انگلیسی در یک خط همان چیزی است که موقع کپی‌پیست جابه‌جا دیده می‌شود.

---

## نسخهٔ فارسی

**موضوع:**

عدم دسترسی خروجی از کانتینر به یک مقصد خارجی مشخص

**متن:**

با سلام،

سرویس Cloud Container ما در ناحیهٔ ir-central1 اجرا می‌شود و API آن روی این آدرس است:

api.dentcast.ir

از داخل کانتینر، اتصال خروجی HTTPS فقط به یک مقصد شکست می‌خورد و بقیهٔ مقصدهای
خارجی سالم‌اند. نتیجهٔ تست از داخل همان پاد:

https://api.telegram.org → connection failed (~24ms)

https://fcm.googleapis.com → HTTP 404 (366ms)

https://web.push.apple.com → HTTP 405 (779ms)

https://tapi.bale.ai → HTTP 404 (47ms)

یعنی مشکل از نبودِ دسترسی بین‌الملل نیست؛ سه مقصد خارجیِ دیگر از همین کانتینر
پاسخ می‌دهند و فقط این یک مقصد در دسترس نیست. سرعت شکست (حدود ۲۴ میلی‌ثانیه)
نشان می‌دهد اتصال حتی برقرار نمی‌شود و در سطح DNS یا مسیریابی رد می‌شود.

نکتهٔ مهم: تا تاریخ ۳ مرداد ۱۴۰۵ همین سرویس به این مقصد دسترسی داشت. پس از یک
ری‌دیپلوی در ۴ مرداد ۱۴۰۵ حدود ساعت ۱۳:۴۳ و بالا آمدن پاد جدید، دسترسی قطع شد.
نام پادها:

پاد قبلی (سالم):

dentcast-6d78d6c5c-kb6mk

پاد فعلی (ناموفق):

dentcast-5cb9479c-dn5cv

سؤال‌ها:

۱. آیا روی این namespace یا روی نودی که پاد فعلی روی آن اجرا می‌شود، سیاست
فایروال یا DNS خاصی برای این مقصد اعمال شده است؟

۲. آیا امکان بازگرداندن وضعیت قبلی وجود دارد؟

۳. اگر خیر، روش پیشنهادی شما برای دسترسی خروجی به این مقصد چیست (مثلاً
egress gateway یا پراکسی)؟

با تشکر

---

## نسخهٔ انگلیسی (اگر فرم تیکت متن فارسی را به‌هم ریخت)

**Subject:**

Outbound connectivity from Cloud Container fails for one specific external host

**Body:**

Hello,

Our Cloud Container service runs in ir-central1 and serves api.dentcast.ir.

From inside the container, outbound HTTPS fails for exactly one destination
while other international destinations from the same pod work:

- https://api.telegram.org → connection failed (~24ms)
- https://fcm.googleapis.com → HTTP 404 (366ms)
- https://web.push.apple.com → HTTP 405 (779ms)
- https://tapi.bale.ai → HTTP 404 (47ms)

So this is not a general lack of international egress: three other external
hosts respond from the same container. The 24ms failure indicates the
connection is refused at DNS/routing level, before any TLS handshake.

Important: the same service could reach api.telegram.org until 2026-07-25.
After a redeploy on 2026-07-26 at ~13:43 (Tehran) the new pod cannot.

- Previous pod (working): dentcast-6d78d6c5c-kb6mk
- Current pod (failing): dentcast-5cb9479c-dn5cv

Questions:

1. Is there a firewall or DNS policy applied to this namespace, or to the node
   the current pod runs on, that blocks this destination?
2. Can the previous behaviour be restored?
3. If not, what is your recommended way to reach this destination (egress
   gateway, proxy)?

Thank you.

---

## پشت‌صحنه (برای خودمان، در تیکت نیاید)

- اعداد بالا از خروجی `GET /admin/notify/health` روی همان پاد است (بیلد v27،
  ۲۶ جولای ساعت ۲۱:۰۱ UTC).
- خطای سمت اپلیکیشن در لاگ کانتینر، سه بار پشت سر هم:
  `[notify:telegram:system] network error chat=…: fetch failed`
- زمان ری‌دیپلوی از روی مهاجرت `0010_view_stats` به دست آمد که در
  `2026-07-26T10:13:16Z` اجرا شده (= ۱۳:۴۳ تهران).
- در متن تیکت عمداً هیچ حرفی از فیلترینگ زده نشده — فقط اندازه‌گیری. اگر بحث به
  علت سیاسی کشیده شود، مسیر شبکه بررسی نمی‌شود.
- اگر جواب «امکان‌پذیر نیست» بود: `OUTBOUND_PROXY_URL` در همان بیلد v27 آماده
  است؛ فقط یک متغیر محیطی + ری‌استارت. تأییدش هم در همان health دیده می‌شود
  (probe با `"via":"proxy"` و `"ok":true`).
- دامنهٔ خسارت تا وقتی تلگرام قطع است: از ۳۹ کاربرِ نوتیف‌روشن، ۸ نفر تلگرام
  دارند که ۵ نفرشان کانال دیگری هم دارند؛ پس ۳ نفر کاملاً بی‌خبر می‌مانند.
