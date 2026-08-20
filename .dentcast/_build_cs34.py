# -*- coding: utf-8 -*-
import hashlib, pathlib, shutil

src = pathlib.Path("chairside/chairside-33.html")
dst = pathlib.Path("chairside/chairside-34.html")
text = src.read_text(encoding="utf-8")

TITLE = "آیا واقعاً می‌توانیم شکایت اصلی بیمار را بهتر کنیم؟"
CAPTION = (
    "در این کیس Chairside می‌بینیم چرا تعویض فوری یک بریج PFM نازیبا برای شکایتِ "
    "حجیم‌بودن سمت لینگوال رد شد: کانتور لینگوال در محدودهٔ طبیعی است، پس ساخت "
    "زیباترین بریج هم فضای زبان را خالی‌تر نمی‌کند — و چرا عکس پری‌اپیکال شرطِ "
    "تصمیم است نه شروع توربین."
)
OG = (
    "بیمار از بریج تازه‌تحویل شکایت حجیم‌بودن سمت زبان دارد — چرا تعویض فوری رد شد، "
    "و چرا کانتور نرمال لینگوال را زیباترین بریج هم خالی‌تر نمی‌کند."
)
KEYWORDS = (
    "lingual overcontour vs subjective bulk, PFM three unit bridge mandibular left, "
    "chief complaint matching retreatment, panoramic distortion anterior abutment margin, "
    "periapical radiograph before turbine, declining immediate prosthesis replacement, "
    "opaque show through occlusal reduction, شکایت اصلی, کانتور لینگوال, دکتر فواد شهابیان, دنت‌کست"
)
ALT = (
    "Cropped panoramic radiograph showing a three-unit PFM bridge on mandibular left "
    "teeth 4–6, with apparently acceptable seating on the posterior abutment and a "
    "flattened occlusal profile."
)
FIG = (
    "نمای رادیوگرافی (Cropped Panoramic View): تصویر پانورامیک نشان‌دهنده یک بریج سه "
    "واحدی PFM در ناحیه دندان‌های ۴ تا ۶ پایین سمت چپ است. نشست کلی پروتز، به‌ویژه روی "
    "پایه خلفی، قابل قبول به نظر می‌رسد. با این حال، به دلیل دیستورشن‌های رایج در "
    "پانورامیک، بررسی دقیق تطابق لبه‌ها و مارجین پایه قدامی نیازمند رادیوگرافی پری‌اپیکال است."
)

repls = [
    ("chairside-33.html", "chairside-34.html"),
    ("chairside-33", "chairside-34"),
    ("cs33.webp", "cs34.webp"),
    ("Chairside 33", "Chairside 34"),
    ("چالش‌های توزیع فضا و بیومکانیک در حضور عفونت فعال اپیکال", TITLE),
    ("2026-08-16", "2026-08-18"),
]
for a, b in repls:
    text = text.replace(a, b)

# caption / descriptions that came from 33
old_cap = (
    "در این کیس Chairside می‌بینیم چرا شروع فوری درمان زیبایی روی بریج‌های قدامی در حضور "
    "فیستول فعال رد شد: جراحی اپیکال بدون پرکردگی رتروگراد، سانترال‌های اورسایز با دیاستم "
    "میدلاینِ باز، پونتیک‌های باریک لترال، و چرا حتی با کشیدن دندان ۲۱ بدون ارزیابی دندان ۱۱ "
    "و اصلاح توزیع فضا، زیبایی قابل اصلاح نیست."
)
text = text.replace(old_cap, CAPTION)

old_kw = (
    "active apical infection sinus tract maxillary central, failed apicoectomy no retrograde filling, "
    "poor space management oversized central incisors, midline diastema two separate bridges, "
    "missing lateral incisor narrow pontics, declining immediate anterior esthetic treatment, "
    "extraction hopeless tooth 21, two implant space distribution anterior, فیستول اپیکال, "
    "توزیع فضا, دیاستم میدلاین, دکتر فواد شهابیان, دنت‌کست"
)
text = text.replace(old_kw, KEYWORDS)

old_og = (
    "بیمار می‌خواست بریج‌های قدامی را همین امروز عوض کند — چرا این درخواست رد شد، "
    "و چرا فیستول فعال و توزیع غلط فضا با تعویض روکش حل نمی‌شوند."
)
text = text.replace(old_og, OG)

old_alt = (
    "Intraoral view showing a sinus tract above the maxillary left central incisor (#21), "
    "oversized central incisors with a midline diastema, and narrow lateral incisor pontics "
    "indicating poor previous space management."
)
text = text.replace(old_alt, ALT)

# image dimensions
text = text.replace('width="1080" height="559"', 'width="1080" height="635"')

body = r'''<figure>
  <img loading="lazy" src="cs34.webp" alt="''' + ALT + '''" style="max-width:100%; border-radius:0.75rem;" width="1080" height="635">
  <figcaption style="text-align:center; font-size:.85rem; color:#555; margin-top:0.5rem;">''' + FIG + '''</figcaption>
</figure>

<p>بریج تازه‌تحویل‌گرفته از نظر آناتومی و زیبایی ضعیف است — سطح جونده صاف، اوپک بیرون‌زده، حتی فلز نمایان. اما بیمار از هیچ‌کدام شکایت ندارد؛ حسش این است که سمت زبان حجیم است. کار این ویزیت این است که قبل از توربین، ببینیم آیا این شکایت اصلاً با تعویض بریج برطرف می‌شود یا نه.</p>

<p>بیمار با نارضایتی شدید از بریجی که به تازگی تحویل گرفته مراجعه کرده است. با وجود اینکه سطح اکلوزال پروتز به خاطر تراش‌های مکرر کاملاً صاف شده، اوپک آن بیرون زده و حتی در نواحی‌ای فلز مشخص است و زیبایی و آناتومی مناسبی ندارد، شکایت اصلی بیمار چیز دیگری است: احساس می‌کند پروتز بیش از حد داخل دهانش جا گرفته و سمت زبان  برجسته است. چالش اصلی این ویزیت این است که قبل از دست به توربین شدن، ببینیم آیا شکایت سابجکتیو بیمار با یک درمان مجدد واقعاً برطرف می‌شود یا نه.</p>

<p><strong>شرح مراجعه.</strong> بیمار با شکایت از اینکه «این بریج را تازه گذاشته‌ام، اصلاً راضی نیستم و خیلی توی دهانم حس می‌شود» مراجعه کرد. در نگاه اول، بریج از نظر تکنیکی و ظاهری بسیار ضعیف است؛ آناتومی جونده ندارد، سطح جونده به علت تراش زیاد اوپک نماست، در نواحی‌ای فلز بیرون زده و حتی در جاهایی فلز دیده می‌شود. اما بیمار اصلاً از ظاهر، زیبایی، جویدن یا گیر غذایی شکایت ندارد، بلکه تمام تمرکزش روی احساس حجیم بودن سمت لینگوال است.</p>

<p><strong>ارزیابی بالینی و تصمیم‌گیری.</strong></p>

<ul>
  <li><strong>بررسی کانتور لینگوال:</strong> در معاینه دقیق داخل دهان، سطح لینگوال بریج برجستگی غیرعادی (Overcontouring) نسبت به سایر دندان‌های قوس فکی ندارد و کانتور آن کاملاً در محدوده طبیعی است.</li>
  <li><strong>بررسی رادیوگرافی:</strong> در نمای پانورامیک، ایراد تکنیکی فاحشی در نشست بریج دیده نمی‌شود، هرچند که برای قضاوت نهایی درباره پوسیدگی احتمالی یا لبه‌های پایه قدامی باید گرافی پری‌اپیکال بررسی شود.</li>
  <li><strong>تطابق شکایت بیمار با توان درمان:</strong> زیبایی یک مسئله ذهنی و سابجکتیو است، اما کانتور و موقعیت دندان یک واقعیت بیومکانیکال عینی است. اگر مشکل بیمار گیر غذایی، بلندی بایت یا زیبایی بود، تعویض بریج صددرصد نتیجه را بهتر می‌کرد؛ اما وقتی کانتور لینگوال در حد نرمال است، ساخت یک بریج بی‌نقص و زیبا باز هم نمی‌تواند فضای سمت زبان را از این خالی‌تر کند و حس بیمار بعد از درمان مجدد دقیقاً مثل قبل خواهد ماند.</li>
</ul>

<p><strong>طرح درمان و پاسخ به بیمار.</strong> شروع فوری تعویض پروتز رد شد.</p>

<p>به بیمار توضیح داده شد:</p>

<p>«بریج فعلی از نظر ظاهری زیبا نیست و آناتومی خوبی ندارد، اما این چیزی نیست که تو از آن ناراضی باشی. مسئله اینجاست که فرم سمت زبان این بریج کاملاً نرمال است و من اگر این کار را بردارم و زیباترین و ظریف‌ترین بریج دنیا را هم برایت بسازم، باز هم نمی‌توانم سمت زبان را از این کم حجم تر کنم. در نتیجه هزینه‌ای می‌کنی، رفت‌وآمدی داری، اما در نهایت همان حس سنگینی قبل را خواهی داشت.»</p>

<p>در نهایت درمان متوقف نشد بلکه مشروط شد: به بیمار گفته شد ابتدا یک عکس پری‌اپیکال تهیه کند تا اگر پایه‌ها مشکل بیولوژیک یا تکنیکی جدی (مثل عدم انطباق لبه‌ها یا پوسیدگی) داشتند تصمیم درست گرفته شود، در غیر این صورت تعویض پروتز کمکی به رفع شکایت ذهنی او نخواهد کرد.</p>

<p><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="4"/></svg>️Clinical Tip: در جلسات ویزیت، پیش از هر اقدامی باید بسنجیم که آیا واقعاً توانایی برطرف کردن «شکایت اصلی (Chief Complaint)» بیمار را داریم یا نه. اگر مشکلی که بیمار مطرح می‌کند با استانداردهای آناتومیک قابل تغییر نیست، عوض کردن یک پروتزِ نازیبا صرفاً شما را شریکِ یک نارضایتی حل‌نشده خواهد کرد.</p>
'''

# replace from <figure> through Clinical Tip paragraph (keep disclaimer)
import re
text2, n = re.subn(
    r"<figure>.*?</p>\s*\n\s*<!-- TODO: Add references section if this page cites scientific literature\. -->",
    body + "\n  <!-- TODO: Add references section if this page cites scientific literature. -->",
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f"body replace count={n}")

# related section: keep only the two nav capsules (step 2.5); 4.9 fills later
old_rel = '''    <a href="/glossary/" class="dc-related-capsule">دانشنامه</a>
    <a href="/pillar/treatment-planning/" class="dc-related-capsule">فهرست موضوعی</a>
    <a href="/chairside/chairside-14.html" class="dc-related-capsule">درخواست زیبایی روی فونداسیونِ پریودنتال</a>
    <a href="/chairside/chairside-1.html" class="dc-related-capsule">زیبایی در حضور دیاستم قدامی</a>
    <a href="/chairside/chairside-26.html" class="dc-related-capsule">بریج آسان‌تر، بیومکانیک ضعیف‌تر</a>'''
new_rel = '''    <a href="/glossary/" class="dc-related-capsule">دانشنامه</a>
    <a href="/pillar/treatment-planning/" class="dc-related-capsule">فهرست موضوعی</a>'''
if old_rel not in text2:
    raise SystemExit("related block not found")
text2 = text2.replace(old_rel, new_rel, 1)

dst.write_text(text2, encoding="utf-8")
h = hashlib.sha256(dst.read_bytes()).hexdigest()
print("wrote", dst, "sha256", h)
# leftover 33?
if "chairside-33" in text2 or "cs33" in text2 or "2026-08-16" in text2:
    print("WARN leftover 33/cs33/old date")
else:
    print("no leftover 33 markers")
