#!/usr/bin/env python3
"""
build_pillar.py — DentCast Pillar Page Builder
================================================
Generates a static HTML pillar page for a given pillar slug by reading
the two JSON sources of truth (dentcast-brain.json + glossary/glossary.json),
filtering entries by pillar.primary, grouping by pillar.subtopic, and
rendering a fully static HTML file. Visible content is present in raw HTML.
The output includes two <script> elements: theme-init (anti-flash) and
JSON-LD structured data; no other JavaScript.

Run from the project root:
    python tools/build_pillar.py bonding

Output:
    pillar/<slug>/index.html

Sources read (never modified):
    dentcast-brain.json
    glossary/glossary.json
    assets/icons/icons.svg   (referenced by URL only; not opened)

No other file in the project is read or written.
"""
from __future__ import annotations
import html
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# -------------------------------------------------------------------
# Pillar-specific copy & metadata.
# Add a new entry to PILLARS to build a new pillar page; the rest of
# the script is data-driven.
# -------------------------------------------------------------------
PILLARS = {
    "bonding": {
        "title_fa": "باندینگ",
        "icon":             "icon-tooth",
        "subtitle_fa_short": "از شیمی سطح تا چالش‌های بالینی",
        "page_title":       "فهرست موضوعی — باندینگ / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی باندینگ در دندان‌پزشکی — از مفاهیم پایه تا چالش‌های پیشرفته. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "باندینگ",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'باندینگ مدرن، یکی از معدود نقاطی است که دندان‌پزشکی واقعاً تبدیل به یک <strong>رشته‌ی مولکولی</strong> می‌شود. این‌جا دیگر فقط با شکل و فرم سر و کار نداریم؛ با شیمی سطح، با ساختار کلاژن، با لایه‌هایی به ضخامت چند میکرون که تعیین می‌کنند یک ترمیم <strong>پنج سال</strong> دوام می‌آورد یا <strong>پنج ماه</strong>.',
            'پشت هر تصمیم باندینگ، یک زنجیره از مفاهیم نشسته است:',
            '<strong>substrate</strong> ای که می‌خواهیم به آن باند شویم چیست؟ — مینای پریزماتیک، عاج با توبول‌های باز، سرامیک سیلیکا‌بیس، زیرکونیا، فلز.',
            'چه <strong>استراتژی</strong>‌ای متناسب با این substrate است؟ چه ماده‌ای، با چه <strong>pH</strong>، در چه ترتیبی روی آن می‌نشیند؟',
            'و در نهایت، باند ایجاد شده در شرایط بالینی واقعی — رطوبت، آلودگی، فشار اکلوزال، گذر زمان — چقدر <strong>پایدار</strong> می‌ماند؟',
            'این صفحه یک نقشه‌ی موضوعی برای ورود به این جهان است. مطالب در پنج لایه دسته‌بندی شده‌اند، از مفاهیم پایه تا چالش‌های پیشرفته. اگر تازه با باندینگ آشنا می‌شوید، از بالا شروع کنید. اگر دنبال یک مفهوم خاص یا یک تصمیم بالینی مشخص هستید، مستقیم به دسته‌ی مرتبط بروید. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "basics",     "title_fa": "مفاهیم پایه",     "icon": "icon-book",    "intro_fa": ""},
            {"slug": "materials",  "title_fa": "مواد و شیمی",  "icon": "icon-flask",   "intro_fa": ""},
            {"slug": "strategies", "title_fa": "استراتژی‌ها و نسل‌ها", "icon": "icon-compass", "intro_fa": ""},
            {"slug": "clinical",   "title_fa": "کاربردهای بالینی",   "icon": "icon-tooth",   "intro_fa": ""},
            {"slug": "advanced",   "title_fa": "موضوعات پیشرفته",   "icon": "icon-target",  "intro_fa": ""},
        ],
    },
    "ceramics": {
        "title_fa": "سرامیک",
        "icon":             "icon-flask",
        "subtitle_fa_short": "از شیمی ماده تا انتخاب بالینی",
        "page_title":       "فهرست موضوعی سرامیک / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی سرامیک در دندان‌پزشکی — از شیمی ماده و انواع سرامیک‌ها تا آماده‌سازی سطح، اندیکاسیون‌های بالینی، و الگوهای شکست. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "سرامیک",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'سرامیک در دندان‌پزشکی یک ماده نیست. یک <strong>خانواده</strong> است. فلدسپاتیک، لیتیوم دی‌سیلیکات، زیرکونیا، هیبریدهای رزین‌ماتریکس — هر کدام یک شیمی، یک ساختار کریستالی، یک رفتار مکانیکی، و یک محدوده‌ی بالینی متفاوت دارد.',
            'این تنوع، یک تنش بالینی واقعی می‌سازد. <strong>برای این بیمار، این دندان، این جایگاه، چه سرامیکی؟</strong> پاسخ به این سؤال نه از کاتالوگ سازنده می‌آید نه از تجربه‌ی تنها. از فهم بنیادین این که چرا فلدسپاتیک شفاف‌تر است ولی شکننده‌تر، چرا زیرکونیا قوی‌تر است ولی <strong>کدرتر</strong>، چرا لیتیوم دی‌سیلیکات تعادلی بین این دو می‌سازد، و چرا هیچ‌کدام «بهترین» نیست.',
            'پشت هر تصمیم سرامیک، چند لایه نشسته است. ساختار ماده. روش پردازش. <strong>آماده‌سازی سطح</strong>. اندیکاسیون بالینی. و در نهایت، مکانیسم‌های شکست که گاهی سال‌ها بعد از سمان شدن خود را نشان می‌دهند.',
            'این صفحه یک نقشه‌ی موضوعی برای ورود به این جهان است. مطالب در <strong>پنج لایه دسته‌بندی شده‌اند</strong>، از مفاهیم پایه و انواع مواد تا چالش‌های آماده‌سازی سطح، کاربردهای بالینی، و الگوهای شکست. اگر تازه با سرامیک‌ها آشنا می‌شوید، از بالا شروع کنید. اگر دنبال یک ماده‌ی خاص یا یک تصمیم بالینی مشخص هستید، مستقیم به دسته‌ی مرتبط بروید. هر مورد به منبع کاملش در دنت‌کست لینک شده.',
        ],
        "subtopics": [
            {"slug": "basics",       "title_fa": "مفاهیم پایه",     "icon": "icon-book",    "intro_fa": ""},
            {"slug": "types",        "title_fa": "انواع سرامیک",    "icon": "icon-diamond", "intro_fa": ""},
            {"slug": "surface-prep", "title_fa": "آماده‌سازی سطح", "icon": "icon-wrench",  "intro_fa": "آماده‌سازی سطح سرامیک، آغاز یک زنجیره است. مرحله‌ی بعدی، یعنی پروتکل باند به دندان و انتخاب adhesive و رزین سمنت، در Pillar باندینگ به تفصیل آمده."},
            {"slug": "indications",  "title_fa": "کاربردهای بالینی", "icon": "icon-tooth",   "intro_fa": "انتخاب ماده‌ی سرامیک، نیمی از تصمیم است. نیمه‌ی دیگر، یعنی پروتکل سمان کردن و adhesive interface، در Pillar باندینگ بحث شده."},
            {"slug": "failures",     "title_fa": "چالش‌ها و شکست",   "icon": "icon-warning", "intro_fa": ""},
        ],
    },
    "fixed-pros": {
        "title_fa": "پروتز ثابت",
        "icon":             "icon-crown",
        "subtitle_fa_short": "از تراش تا سمان — زنجیره‌ی بازسازی",
        "page_title":       "فهرست موضوعی پروتز ثابت / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی پروتز ثابت در دندان‌پزشکی — از پست و کور و آماده‌سازی، تا قالب‌گیری، روکش و اینله/آنله، سمان‌کردن و الگوهای شکست. زنجیره‌ی بازسازی به‌صورت ساختارمند، با لینک به اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست.",
        "h1_fa":        "پروتز ثابت",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'پروتز ثابت، یک <strong>زنجیره</strong> از تصمیم‌های وابسته است، نه یک ترمیم منفرد. هر حلقه — از بازسازی ساختار باقی‌مانده با <strong>پست و کور</strong> و کنترل <strong>فرول</strong>، تا تراش، قالب‌گیری، انتخاب ترمیم و سمان‌کردن — سقفِ کیفیت حلقه‌ی بعد را تعیین می‌کند. خطا در یک مرحله، تمام مراحل بعد را روی بنیان لرزان می‌نشاند.',
            'کیفیت <strong>تراش</strong> سقف دقت قالب‌گیری را معین می‌کند؛ دقت قالب — معمولی یا اسکن دیجیتال — سقف <strong>تطابق مارجینال</strong> ترمیم نهایی را؛ و انتخاب <strong>رزین سمنت</strong> به‌همراه آماده‌سازی سطح، حدِ پایداری <strong>روکش، اینله، آنله یا بریج</strong> را در میان‌مدت رقم می‌زند. هیچ مرحله‌ای ضعف مرحله‌ی قبل را جبران نمی‌کند.',
            'الگوهای شکست — از <strong>پوسیدگی ثانویه</strong> و جداشدگی روکش تا فرکچر — معمولاً به یک حلقه‌ی ضعیف در ابتدای زنجیره برمی‌گردند. این صفحه نقشه‌ای از کل این زنجیره است؛ هر بخش یک حلقه، با لینک به منبع کاملش در دنت‌کست.',
        ],
        "subtopics": [
            {"slug": "post-and-core", "title_fa": "پست و کور",           "icon": "icon-key",     "intro_fa": "اولین حلقه‌ی زنجیره. تصمیم درباره‌ی پست و کور — یا گاهی پرهیز از آن — تعیین می‌کند آیا اصلاً پایه‌ای برای ترمیم وجود دارد. <strong>فرول</strong> کافی، آماده‌سازی صحیح دنتین ریشه، و انتخاب جنس پست، شالوده‌ی همه‌ی مراحل بعدی است."},
            {"slug": "preparation",   "title_fa": "آماده‌سازی و تراش",   "icon": "icon-ruler",   "intro_fa": "تراش، گام عملی پس از تعیین بنیان است. هر دهم میلی‌متر، یک معامله بین حفظ بافت و فضای کافی برای ماده‌ی ترمیمی است. کیفیت تراش، حد بالایی برای دقت قالب‌گیری، <strong>تطابق مارجینال</strong> و طول عمر نهایی ترمیم می‌سازد."},
            {"slug": "impression",    "title_fa": "قالب‌گیری",            "icon": "icon-camera",  "intro_fa": "وقتی تراش تمام شد، قالب‌گیری پل میان دهان و لابراتوار است. دقت این مرحله — معمولی یا <strong>اسکن دیجیتال</strong> — حد بالایی برای تطابق نهایی ترمیم تعیین می‌کند. هیچ ترمیمی از قالبِ ناقص بهتر در نمی‌آید."},
            {"slug": "crowns-onlays", "title_fa": "روکش و اینله/آنله",   "icon": "icon-shield",  "intro_fa": "ترمیم نهایی — تک‌واحدی، چندواحدی، اینله یا آنله — حلقه‌ای است که حلقه‌های قبلی را به‌هم می‌رساند. انتخاب نوع و ماده‌ی ترمیم باید با <strong>بنیان ساخته‌شده</strong>، نوع تراش و شرایط اکلوزال هماهنگ باشد."},
            {"slug": "cementation",   "title_fa": "سمان‌کردن",            "icon": "icon-link",    "intro_fa": "آخرین حلقه‌ی زنجیره — اتصال نهایی ترمیم به دندان. انتخاب <strong>رزین سمنت</strong>، آماده‌سازی سطوح، کنترل آلودگی، و حذف کامل اضافات سمان، نقاطی هستند که موفقیت همه‌ی مراحل قبل به آن‌ها وابسته می‌شود."},
            {"slug": "failures",      "title_fa": "شکست و عوارض",         "icon": "icon-warning", "intro_fa": "وقتی زنجیره می‌شکند. الگوهای شکست — از جداشدگی روکش و فرکچر تا <strong>پوسیدگی ثانویه</strong> — معمولاً به یک حلقه‌ی ضعیف در ابتدای راه برمی‌گردند. درس گرفتن از شکست‌ها، طراحی بهتر زنجیره‌ی بعدی است."},
        ],
    },
    "implantology": {
        "title_fa": "ایمپلنتولوژی",
        "icon":             "icon-implant",
        "subtitle_fa_short": "از استخوان تا روکش — یک قوس پیوسته",
        "page_title":       "فهرست موضوعی — ایمپلنتولوژی / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی ایمپلنتولوژی در دندان‌پزشکی — از جراحی و طرح درمان و حفظ استخوان پری‌ایمپلنت، تا اجزای پروتزی، رستوریشن نهایی و مبانی آموزش بیمار. یک قوس پیوسته از استخوان تا روکش، با لینک به اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست.",
        "h1_fa":        "ایمپلنتولوژی",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'ایمپلنتولوژی یک درمان منفرد نیست؛ یک <strong>قوس پیوسته</strong> است که از استخوان آغاز می‌شود و به روکش می‌رسد. بیولوژی، جراحی و پروتز سه فصل جدا نیستند — سه بخش از یک مسیرند که در آن هر تصمیم اولیه، سقفِ کیفیت مراحل بعد را تعیین می‌کند.',
            'مسیر با یک پرسش جراحی آغاز می‌شود: <strong>کجا</strong> و <strong>چگونه</strong> فیکسچر را بنشانیم؟ زمان بارگذاری، ایمپلنت کوتاه در برابر سینوس‌لیفت و رویکردهایی مثل <strong>All-on-4</strong> پاسخ‌های همین پرسش‌اند. اما هیچ ایمپلنتی جدا از بافت زنده‌ی اطرافش دوام نمی‌آورد؛ <strong>اوسئواینتگریشن</strong>، تحلیل استخوان مارژینال و پری‌ایمپلنتایتیس تعیین می‌کنند که این قوس پایدار می‌ماند یا می‌شکند.',
            'حلقه‌های پروتزی سپس وارد می‌شوند: <strong>اباتمنت</strong>، کانکشن، Ti-Base و پیچ‌ها رفتار مکانیکی اتصال را رقم می‌زنند، و <strong>رستوریشن</strong> نهایی — پیچ‌شونده یا سمان‌شونده، انتخاب متریال و طراحی پروفایل اِمرجِنس — کار را کامل می‌کند. سمان باقی‌مانده این‌جا یک عارضه‌ی صرفاً پروتزی نیست؛ تهدیدی بیولوژیک برای همان استخوانی است که در ابتدای قوس حفظش کردیم.',
            'این صفحه نقشه‌ای موضوعی از همین قوس است؛ مطالب در <strong>پنج لایه</strong>، به‌ترتیب زنجیره‌ی درمان، از جراحی و طرح درمان تا مبانیِ آموزش بیمار چیده شده‌اند. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "surgical-planning",    "title_fa": "جراحی، جایگذاری و طرح درمان", "icon": "icon-compass",    "intro_fa": "نخستین حلقه‌ی قوس. تصمیم درباره‌ی <strong>زمان و محل جایگذاری</strong>، پروتکل بارگذاری، و انتخاب میان رویکردها — از ایمپلنت کوتاه و سینوس‌لیفت تا فول‌آرچ — بستری را می‌سازد که تمام مراحل بعد روی آن بنا می‌شود."},
            {"slug": "peri-implant-health",  "title_fa": "بیولوژی، حفظ استخوان و عوارض پری‌ایمپلنت", "icon": "icon-microbe", "intro_fa": "بستر زیستیِ همه‌چیز. <strong>اوسئواینتگریشن</strong>، حفظ استخوان مارژینال و پیشگیری از پری‌ایمپلنتایتیس تعیین می‌کنند که قوس درمان پایدار می‌ماند یا فرومی‌پاشد. ریسک را این‌جا می‌سنجیم، نه پس از شکست."},
            {"slug": "prosthetic-components", "title_fa": "اجزا، اباتمنت، اتصالات و پیچ‌ها", "icon": "icon-gear",      "intro_fa": "حلقه‌ی مکانیکی میانی. <strong>اباتمنت، کانکشن و پیچ</strong> — به‌علاوه‌ی Ti-Base و اسکن‌بادی — رفتار اتصال را رقم می‌زنند. بیشتر عوارض مکانیکی، از شل‌شدن پیچ تا عدم‌تطابق دیجیتال، در همین نقطه ریشه دارند."},
            {"slug": "restoration-design",    "title_fa": "رستوریشن: ریتنشن، سمان، متریال و اِمرجِنس", "icon": "icon-crown", "intro_fa": "حلقه‌ی پایانی و بازگشت به آغاز. انتخاب میان <strong>پیچ‌شونده و سمان‌شونده</strong>، متریال روکش، طراحی پروفایل اِمرجِنس و مدیریت سمان — جایی که موفقیت پروتزی و سلامت بیولوژیک به هم گره می‌خورند."},
            {"slug": "fundamentals",          "title_fa": "مبانی و آموزش بیمار", "icon": "icon-book",                "intro_fa": "زبان مشترک با بیمار. توضیح ساده‌ی این‌که <strong>ایمپلنت چیست</strong>، مراحل درمان کدام‌اند و چرا فالوآپ اهمیت دارد — نقطه‌ی ورود برای کسی که می‌خواهد کل این قوس را از بیرون بفهمد."},
        ],
    },
    "occlusion": {
        "title_fa": "اکلوژن",
        "icon":             "icon-occlusion",
        "subtitle_fa_short": "از تماس دو قوس تا درد و بازسازی",
        "page_title":       "فهرست موضوعی — اکلوژن / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی اکلوژن در دندان‌پزشکی — از بُعد عمودی و الگوهای هدایت لترال، تا سایش و کانسپت دال، اختلالات گیجگاهی‌فکی، و تحلیل و تنظیم تماس‌های اکلوزال. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "اکلوژن",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'اکلوژن، نقطه‌ای است که دندان‌پزشکی از سطحِ یک دندان منفرد فراتر می‌رود و به <strong>رابطه‌ی دو قوس</strong> می‌رسد. این‌جا دیگر با یک ترمیم تنها سر و کار نداریم؛ با این‌که این ترمیم در میان صدها تماس دینامیک، با حرکات فک، با عضله و مفصل، چگونه <strong>رفتار</strong> می‌کند.',
            'پشت هر تصمیم اکلوزال، چند پرسش بنیادین نشسته است: <strong>بُعد عمودی</strong> درست کجاست و کِی باید تغییرش داد؟ در حرکات لترال، هدایت با <strong>کانین</strong> باشد یا <strong>گروپ فانکشن</strong>؟ سایش پیش‌رونده را کجا باید متوقف کرد و کجا با کانسپت دال جبران؟ و وقتی درد و صدای مفصل وارد می‌شود، مرز میان یک <strong>اختلال گیجگاهی‌فکی</strong> و یک تماس زودرسِ ساده کجاست؟',
            'و در نهایت، همه‌چیز به یک مهارت پای صندلی برمی‌گردد: <strong>سنجش و تنظیم تماس</strong>. کاغذ آرتیکولاسیون، فرمیتوس، قانون BULL — ابزارهایی که تعیین می‌کنند آیا کارِ خوبِ ما در دهان <strong>پایدار</strong> می‌ماند یا به عارضه تبدیل می‌شود.',
            'این صفحه یک نقشه‌ی موضوعی برای ورود به این جهان است. مطالب در پنج لایه دسته‌بندی شده‌اند، از بُعد عمودی و الگوهای هدایت تا سایش، اختلالات مفصلی، و تحلیل و تنظیم. اگر دنبال یک مفهوم خاص یا یک تصمیم بالینی مشخص هستید، مستقیم به دسته‌ی مرتبط بروید. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "vertical-dimension",          "title_fa": "بُعد عمودی (VDO)",       "icon": "icon-ruler",   "intro_fa": ""},
            {"slug": "occlusal-scheme-guidance",     "title_fa": "الگوی هدایت و اسکیم اکلوزال", "icon": "icon-compass", "intro_fa": ""},
            {"slug": "tooth-wear-dahl",              "title_fa": "سایش دندانی و کانسپت دال", "icon": "icon-warning", "intro_fa": ""},
            {"slug": "tmd-orofacial-pain",           "title_fa": "اختلالات گیجگاهی‌فکی و درد", "icon": "icon-alert-circle", "intro_fa": ""},
            {"slug": "occlusal-analysis-adjustment", "title_fa": "تحلیل و تنظیم اکلوزال",  "icon": "icon-target",  "intro_fa": ""},
        ],
    },
    "esthetic": {
        "title_fa": "زیبایی",
        "icon":             "icon-smile",
        "subtitle_fa_short": "از آنالیز لبخند تا رنگ و ونیر",
        "page_title":       "فهرست موضوعی — زیبایی / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی زیبایی در دندان‌پزشکی — از آنالیز و طراحی لبخند، تا علم رنگ و سفیدکردن، و ونیر و لمینیت. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "زیبایی",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'زیبایی در دندان‌پزشکی، فراتر از «سفید و ردیف» است. یک <strong>هماهنگی</strong> است میان دندان، لثه، لب و صورت — جایی که تناسب، رنگ و فرم باید با هم یک کلِ باورپذیر بسازند. این‌جا تصمیم بالینی نه با یک دندانِ تنها، که با کلِ <strong>لبخند</strong> در قاب صورت سنجیده می‌شود.',
            'پشت هر درمان زیبایی، چند پرسش بنیادین نشسته است: <strong>تناسبات</strong> لبخند و موقعیت لبه‌ی اینسایزال کجا درست می‌نشیند؟ <strong>رنگ</strong> نهایی را چه چیزی تعیین می‌کند — زیرلایه، ماده، نور، یا بلیچینگ؟ و کجا یک <strong>ونیر</strong> یا لمینیت کم‌تهاجمی پاسخ است و کجا باید از آن پرهیز کرد؟',
            'این سه محور — طراحی و آنالیز لبخند، علم رنگ و سفیدکردن، و ونیر و لمینیت — به‌هم وابسته‌اند. آنالیز درست، نقشه‌ی درمان را می‌سازد؛ رنگ، باورپذیری نتیجه را؛ و انتخاب ماده و تکنیک، <strong>پایداری</strong> آن را در گذر زمان. خطا در آنالیز، با بهترین ونیر هم جبران نمی‌شود.',
            'این صفحه یک نقشه‌ی موضوعی برای ورود به این جهان است. مطالب در <strong>سه لایه</strong> دسته‌بندی شده‌اند، از آنالیز و طراحی لبخند تا رنگ و ونیر. اگر دنبال یک مفهوم خاص یا یک تصمیم بالینی مشخص هستید، مستقیم به دسته‌ی مرتبط بروید. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "smile-design",        "title_fa": "طراحی و آنالیز لبخند", "icon": "icon-ruler",   "intro_fa": ""},
            {"slug": "shade-and-whitening", "title_fa": "رنگ، شید و سفیدکردن", "icon": "icon-sparkle", "intro_fa": ""},
            {"slug": "veneers-laminates",   "title_fa": "ونیر و لمینیت",       "icon": "icon-diamond", "intro_fa": ""},
        ],
    },
    "treatment-planning": {
        "title_fa": "طرح درمان",
        "icon":             "icon-compass",
        "subtitle_fa_short": "از تشخیص جامع تا تصمیمِ حفظ یا جایگزینی",
        "page_title":       "فهرست موضوعی — طرح درمان / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی طرح درمان در دندان‌پزشکی — از تشخیص جامع و طراحیِ کلِ درمان، تا تصمیمِ حفظ یا کشیدن دندان و جایگزینیِ دندانِ ازدست‌رفته. انضباطِ تصمیم‌گیری که پیش از هر تکنیک می‌نشیند، با لینک به اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست.",
        "h1_fa":        "طرح درمان",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'طرح درمان، یک پیلارِ <strong>مقصد</strong> است؛ جایی که همه‌ی رشته‌های دیگر — از ایمپلنت و پروتز تا پریو و اندو — مطلب به آن می‌سپارند تا یک پرسشِ واحد پاسخ بگیرد: <strong>برای این بیمار، برای این دندان، چه باید کرد؟</strong> این‌جا دیگر بحث بر سرِ «چگونه»‌ی یک تکنیک نیست؛ بر سرِ <strong>«چه»</strong> و <strong>«چرا»</strong>ست.',
            'مرزِ این پیلار دقیق است. <strong>تصمیمِ</strong> میان حفظ و کشیدن، میان بریج و ایمپلنت، میان مداخله و عدم‌مداخله — این‌جا جا دارد. اما <strong>اجرای</strong> همان تصمیم — تکنیکِ جراحیِ ایمپلنت، تراشِ روکش، ساختِ دنچر — به پیلارِ تخصصیِ خودش برمی‌گردد. طرح درمان، نقطه‌ی تصمیم است، نه میزِ کار.',
            'پشت هر تصمیمِ خوب، یک <strong>تشخیصِ جامع</strong> نشسته است: نگاهی سیستمی که فراتر از یک دندانِ منفرد، کلِ صورت و لبخند و فانکشن و <strong>پروگنوزِ بلندمدت</strong> را می‌بیند. بدون این نقشه‌ی کلان، هر ترمیمِ موضعی ریسکِ آن را دارد که در خدمتِ یک طرحِ اشتباه بنشیند.',
            'این صفحه نقشه‌ای موضوعی از همین انضباط است. مطالب در <strong>سه لایه</strong> چیده شده‌اند — از تشخیصِ جامع، تا تصمیمِ حفظ یا کشیدن، تا جایگزینیِ دندانِ ازدست‌رفته. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "comprehensive-diagnosis",    "title_fa": "تشخیص جامع و طرح‌ریزی", "icon": "icon-node-graph", "intro_fa": "پیش از هر تصمیم، یک نقشه‌ی کلان لازم است. تشخیصِ جامع — به‌سبکِ <strong>Global Diagnosis</strong> — کلِ صورت، لبخند، فانکشن و پروگنوز را در یک قابِ واحد می‌بیند، تا درمان‌های موضعی در خدمتِ یک طرحِ منسجم بنشینند، نه برعکس."},
            {"slug": "extraction-vs-preservation", "title_fa": "حفظ یا کشیدن دندان",     "icon": "icon-scale",      "intro_fa": "بنیادی‌ترین تصمیمِ طرح درمان: آیا این دندان ارزشِ نگه‌داشتن دارد؟ سنجشِ <strong>restorability</strong>، پروگنوزِ بیومکانیکی و بیولوژیک، و مقایسه‌ی صادقانه‌ی حفظ در برابرِ کشیدن و جایگزینی — جایی که عجله یا تعصب، گران تمام می‌شود."},
            {"slug": "replacing-missing-teeth",    "title_fa": "جایگزینیِ دندانِ ازدست‌رفته", "icon": "icon-puzzle", "intro_fa": "وقتی دندان رفته یا قرار است برود، پرسشِ بعدی <strong>مودالیتیِ جایگزینی</strong> است: بریج، ایمپلنت، یا گاهی هیچ‌کدام. این تصمیم — جدا از تکنیکِ اجرای آن — بر اساسِ فضا، فانکشن و نیازِ واقعیِ بیمار سنجیده می‌شود."},
        ],
    },
    "removable-pros": {
        "title_fa": "پروتز متحرک",
        "icon":             "icon-denture",
        "subtitle_fa_short": "از اوردنچر و دنچر کامل تا اسنپ‌آن اسمایل",
        "page_title":       "فهرست موضوعی — پروتز متحرک / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی پروتز متحرک در دندان‌پزشکی — از اوردنچرِ متکی بر ایمپلنت و انتخابِ اتچمنت، تا دنچرِ کامل و اپلاینسِ اسنپ‌آن اسمایل. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "پروتز متحرک",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'پروتز متحرک، هنرِ بازگرداندنِ فانکشن و زیبایی در جایی است که دندان‌ها رفته‌اند — اما برخلافِ پروتزِ ثابت، اتکای اصلیِ آن بر <strong>بافتِ زنده</strong> است: مخاط، ریج، و گاهی چند ایمپلنت. این وابستگی به بافت، هر تصمیم را به یک <strong>معامله</strong> میان گیر، پایداری و راحتی تبدیل می‌کند.',
            'طیفِ این درمان‌ها گسترده است. در یک سَر، <strong>اوردنچرِ متکی بر ایمپلنت</strong> که با انتخابِ درستِ اتچمنت، گیر و پایداری را به دنچر بازمی‌گرداند. در سرِ دیگر، <strong>دنچرِ کاملِ</strong> کلاسیک که موفقیتش به بسترِ پروتزی و رکوردگیریِ دقیق گره خورده. و در میانه، اپلاینس‌هایی مثلِ <strong>اسنپ‌آن اسمایل</strong> که نقشی موقت و کم‌تهاجمی ایفا می‌کنند.',
            'پشت هر پروتزِ موفق، یک زنجیره از سنجش‌ها نشسته است: <strong>اکلوژن</strong> و ساپورتِ قوسِ مقابل، فرمِ ریج، انتخابِ اتچمنت یا سیستمِ ساخت، و رابطِ پروتز با بافت. ضعف در هر حلقه — از نبودِ ساپورتِ خلفی تا ریجِ نامناسب — می‌تواند کلِ درمان را ناپایدار کند.',
            'این صفحه نقشه‌ای موضوعی از این جهان است. مطالب در <strong>سه لایه</strong> چیده شده‌اند — اوردنچرِ متکی بر ایمپلنت، دنچرِ کامل، و اسنپ‌آن اسمایل. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "implant-overdentures", "title_fa": "اوردنچرِ متکی بر ایمپلنت", "icon": "icon-implant", "intro_fa": "دنچری که چند ایمپلنت آن را مهار می‌کنند. قلبِ تصمیم این‌جا <strong>اتچمنت</strong> است — بار در برابر لوکیتور، تعداد ایمپلنت، و پروتکلِ بارگذاری — و این‌که چگونه گیر و پایداری با راحتی و بهداشتِ بیمار متعادل شود."},
            {"slug": "complete-dentures",    "title_fa": "دنچر کامل",               "icon": "icon-denture", "intro_fa": "پروتزِ کاملِ متکی بر بافت، برای قوسِ بی‌دندان. موفقیتش به <strong>بسترِ پروتزی</strong>، رکوردگیریِ دقیق و سیستمِ ساخت (مثلِ BPS) و تعادلِ استتیک با فرمِ ریج وابسته است — جایی که میلی‌مترها در نمای نهایی دیده می‌شوند."},
            {"slug": "snap-on-smile",        "title_fa": "اسنپ‌آن اسمایل",          "icon": "icon-smile",   "intro_fa": "اپلاینسِ متحرکِ <strong>بدون تراش</strong> که روی دندان‌ها snap می‌شود. نقشی موقت و کم‌تهاجمی دارد — از راه‌حلِ زیباییِ سریع تا اسپلینتِ پریودنتال — با اندیکاسیون‌ها و محدودیت‌های مشخصِ خودش."},
        ],
    },
    "operative": {
        "title_fa": "دندانپزشکی ترمیمی",
        "icon":             "icon-tooth-restoration",
        "subtitle_fa_short": "از پوسیدگی و ترک تا ترمیمِ مستقیم",
        "page_title":       "فهرست موضوعی — دندانپزشکی ترمیمی / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی دندانپزشکی ترمیمی — از مدیریت و برداشتِ پوسیدگی با حداقل تهاجم، تا تشخیص و مدیریتِ ترک و آسیبِ ساختاری دندان، و ترمیمِ مستقیم و مواد. رویکردِ محافظه‌کارانه و بیومیمتیک به حفظِ ساختارِ دندان، با لینک به اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست.",
        "h1_fa":        "دندانپزشکی ترمیمی",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'دندانپزشکی ترمیمی، هنرِ <strong>حفظِ ساختارِ دندان</strong> است؛ جایی که هر تصمیم میان مداخله و پرهیز، یک معامله بر سرِ بافتِ از‌دست‌رفتنی است. این‌جا دیگر بحث بر سرِ بازساختِ کاملِ تاج نیست؛ بر سرِ این است که <strong>چقدر برداریم</strong>، <strong>کجا متوقف شویم</strong>، و چه چیزی جای بافتِ رفته بنشیند.',
            'پشت هر ترمیم، یک زنجیره از پرسش‌ها نشسته است: این پوسیدگی را تا کجا باید برداشت — تا عاجِ سخت یا تا مرزِ کنترل‌شده‌ی نزدیکِ پالپ؟ این ترکِ مینایی یک خطِ بی‌خطر است یا آغازِ یک فرکچرِ ساختاری؟ و این حفره را با چه طراحی و چه ماده‌ای ترمیم کنیم تا <strong>مقاومت به شکست</strong> بازگردد؟',
            'این صفحه نقشه‌ای موضوعی از همین انضباط است. مطالب در <strong>سه لایه</strong> چیده شده‌اند — مدیریت و برداشتِ پوسیدگی، ترک و آسیبِ ساختاری، و ترمیمِ مستقیم و مواد. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "caries-management",   "title_fa": "مدیریت و برداشتِ پوسیدگی", "icon": "icon-microbe", "intro_fa": "قلبِ ترمیمی: <strong>چقدر</strong> پوسیدگی را برداریم و <strong>کجا</strong> متوقف شویم. از فلسفه‌ی حداقل تهاجم (MID) و برداشتِ انتخابی، تا نقاطِ پایانیِ کنترل‌شده مثلِ PSZ و CRE برای حفظِ پالپ در ضایعاتِ عمیق."},
            {"slug": "cracked-tooth",       "title_fa": "ترک و آسیبِ ساختاریِ دندان", "icon": "icon-warning", "intro_fa": "تشخیصِ آنچه چشمِ غیرمسلح نمی‌بیند. تمایزِ <strong>ترک‌های بی‌خطر از فرکچرهای ساختاری</strong>، و تعیینِ نقاطِ پایانیِ حذفِ ترک (CrRE) — مرزِ میانِ حفظِ دندان و شکستِ پیش‌رونده."},
            {"slug": "direct-restorations", "title_fa": "ترمیمِ مستقیم و مواد",       "icon": "icon-tooth",   "intro_fa": "وقتی بافت رفته، چه چیزی جایش بنشیند؟ طراحیِ حفره برای <strong>مقاومت به شکست</strong>، و انتخابِ موادِ ترمیمِ مستقیم — جایی که شیمیِ ماده و طراحیِ مکانیکی با هم طولِ عمرِ ترمیم را رقم می‌زنند."},
        ],
    },
    "digital": {
        "title_fa": "دندانپزشکی دیجیتال",
        "icon":             "icon-scan",
        "subtitle_fa_short": "از اسکن و CAD/CAM تا هوشِ مصنوعی",
        "page_title":       "فهرست موضوعی — دندانپزشکی دیجیتال / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی دندانپزشکی دیجیتال — از اسکنِ داخل‌دهانی و قالب‌گیریِ دیجیتال، تا CAD/CAM و موادِ نوین، گردش‌کارِ دیجیتال و بیمارِ مجازی، و هوشِ مصنوعی در تشخیص و درمان. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "دندانپزشکی دیجیتال",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'دندانپزشکی دیجیتال یک ابزار نیست؛ یک <strong>گردش‌کار</strong> است که از ثبتِ واقعیتِ دهان آغاز می‌شود و تا طراحی، ساخت و تصمیم‌گیریِ هوشمند ادامه می‌یابد. این‌جا دقتِ هر مرحله، سقفِ کیفیتِ مرحله‌ی بعد را تعیین می‌کند — درست مثلِ هر زنجیره‌ی بالینیِ دیگر.',
            'مسیر با یک پرسشِ ساده آغاز می‌شود: <strong>چگونه</strong> دهان را به داده تبدیل کنیم؟ اسکنِ داخل‌دهانی، فرمتِ فایل، و کنترلِ شرایطِ بافتی تعیین می‌کنند که این داده چقدر <strong>دقیق</strong> است. سپس داده به ماده می‌رسد — <strong>CAD/CAM</strong> و موادی مثلِ PEEK — و در نهایت به تلفیق و تصمیم: بیمارِ مجازی، و <strong>هوشِ مصنوعی</strong> که الگوها را جایی می‌بیند که چشمِ ما نمی‌بیند.',
            'این صفحه نقشه‌ای موضوعی از همین جهان است. مطالب در <strong>چهار لایه</strong> چیده شده‌اند — اسکنِ داخل‌دهانی، CAD/CAM و مواد، گردش‌کارِ دیجیتال و بیمارِ مجازی، و هوشِ مصنوعی. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "intraoral-scanning", "title_fa": "اسکنِ داخل‌دهانی و قالب‌گیریِ دیجیتال", "icon": "icon-camera",     "intro_fa": "نخستین حلقه: تبدیلِ دهان به داده. <strong>دقتِ اسکن</strong> — از فرمتِ فایل و سرعتِ اسکن تا کنترلِ خونریزی و بافتِ نرم — سقفِ دقتِ همه‌ی مراحلِ بعد را تعیین می‌کند."},
            {"slug": "cad-cam",            "title_fa": "CAD/CAM و موادِ دیجیتال",          "icon": "icon-gear",       "intro_fa": "از داده به ماده. طراحی و ساختِ دیجیتالِ ترمیم، و موادی مثلِ <strong>PEEK</strong> — با خواصِ مکانیکی و اندیکاسیون‌های خاصِ خود — که گردش‌کارِ دیجیتال آن‌ها را ممکن کرده است."},
            {"slug": "digital-workflow",   "title_fa": "گردش‌کارِ دیجیتال و بیمارِ مجازی", "icon": "icon-monitor",    "intro_fa": "تلفیقِ همه‌چیز. <strong>بیمارِ مجازی</strong> — همپوشانیِ اسکنِ صورت، اسکنِ داخل‌دهانی و CBCT — و گردش‌کارِ جامعِ مطبِ مدرن، جایی که داده‌های پراکنده یک تصویرِ واحد برای تصمیم می‌سازند."},
            {"slug": "ai",                 "title_fa": "هوشِ مصنوعی",                       "icon": "icon-brain",      "intro_fa": "لایه‌ی تصمیم. مفاهیمِ پایه‌ی <strong>AI، یادگیریِ ماشین و یادگیریِ عمیق</strong>، مسیرِ یادگیریِ آن‌ها، و کاربردهای عملی در تشخیص و درمان — فناوریِ عرضی‌ای که کم‌کم همه‌ی شاخه‌ها را لمس می‌کند."},
        ],
    },
}

TYPE_META = {
    "glossary":         ("گلاسری",  "icon-book"),
    "podcast":          ("پادکست",   "icon-headphones"),
    "notecast":         ("نوت‌کست",  "icon-note"),
    "insight":          ("اینسایت",   "icon-lightbulb"),
    "dentai":           ("دنت‌AI",    "icon-bot"),
    "chairside":        ("چِرساید", "icon-chair"),
    "metanote":         ("متانوت",  "icon-meta"),
    "litecast":         ("لایت‌کست",  "icon-volume"),
    "photocast":        ("فوتوکست", "icon-camera"),
    "dentcast_plus":    ("دنت‌کست+",    "icon-film"),
    "sharehub":         ("شِیر هاب",  "icon-link"),
    "unknown":          ("",              "icon-bullet"),
}


# Icons are emitted INLINE, not via <use href="external.svg#id">.
# External SVG sprite references are not rendered by several browsers
# (notably Safari/iOS), which left every pillar icon blank. Each symbol's
# markup is read once from the sprite and inlined — matching the inline
# <svg> pattern used everywhere else on the site. Sizing/fill/stroke come
# from the .dc-svg-icon CSS class exactly as before.
_ICON_CACHE = None


def _load_icons():
    global _ICON_CACHE
    if _ICON_CACHE is None:
        import re
        sprite = (ROOT / "assets" / "icons" / "icons.svg").read_text(encoding="utf-8")
        _ICON_CACHE = {}
        for m in re.finditer(r'<symbol id="([^"]+)"([^>]*)>(.*?)</symbol>', sprite, re.S):
            sid, attrs, inner = m.group(1), m.group(2), m.group(3)
            vb = re.search(r'viewBox="([^"]+)"', attrs)
            _ICON_CACHE[sid] = (vb.group(1) if vb else "0 0 24 24", " ".join(inner.split()))
    return _ICON_CACHE


def svg_icon(symbol_id):
    icons = _load_icons()
    if symbol_id not in icons:
        raise KeyError("icon symbol not found in sprite: " + symbol_id)
    viewbox, inner = icons[symbol_id]
    return (
        '<svg class="dc-svg-icon" viewBox="' + viewbox + '" aria-hidden="true">'
        + inner +
        '</svg>'
    )


TOOLBAR_DRAWER_HTML = (
    '<div id="dcToolbarDrawer" class="dc-toolbar-drawer" aria-hidden="true">\n'
    '  <div class="dc-toolbar-drawer-inner">\n'
    '    <span class="dc-toolbar-drawer-label">ابزارها</span>\n'
    '    <button class="dc-drawer-tool-seg" type="button" id="tool-pwa"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/></svg></span><span class="dc-drawer-tool-txt">نصب</span></button>\n'
    '    <button class="dc-drawer-tool-seg" type="button" id="tool-consult"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="dc-drawer-tool-txt">مشاوره</span></button>\n'
    '    <button class="dc-drawer-tool-seg" type="button" id="tool-about"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg></span><span class="dc-drawer-tool-txt">درباره</span></button>\n'
    '  </div>\n'
    '</div>\n'
)

RADAR_OVERLAY_HTML = (
    '<div id="dcRadarOverlay" class="radar-overlay" aria-hidden="true">\n'
    '  <div class="radar-overlay-header">\n'
    '    <button id="dcCloseRadarOverlay" class="radar-close-btn">&times;</button>\n'
    '    <div class="radar-header-title">رادار دنت‌کست (جایگزین گوگل)</div>\n'
    '  </div>\n'
    '  <div class="radar-overlay-body">\n'
    '    <div class="radar-search-box">\n'
    '      <input type="text" id="dcRadarInput" placeholder="نام سایت، زمینه فعالیت یا کلمه کلیدی..." autocomplete="off">\n'
    '    </div>\n'
    '    <div id="dcRadarResults" class="radar-results">\n'
    '      <div class="radar-initial-msg">برای جستجو در بین سایت‌های دندانپزشکی، تایپ کنید...</div>\n'
    '    </div>\n'
    '  </div>\n'
    '</div>\n'
)

GLOBAL_SEARCH_HTML = (
    '  <!-- 🔍 Global Search -->\n'
    '  <div class="dc-global-filter-box" id="dcGlobalBox">\n'
    '    <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>\n'
    '    <h3 class="dc-global-filter-title">جستجوی سراسری دنت‌کست</h3>\n'
    '    <input id="dcSearch" class="dc-search-input" placeholder="جستجو در همهٔ بخش‌های دنت‌کست…">\n'
    '    <div class="dc-filter-list">\n'
    '      <button class="dc-filter-btn active" data-type="dentcast">دنت‌کست</button>\n'
    '      <button class="dc-filter-btn active" data-type="notecast">نوت‌کست</button>\n'
    '      <button class="dc-filter-btn active" data-type="clinical">نکات کلینیکی</button>\n'
    '      <!-- <button class="dc-filter-btn active" data-type="litecast">لایت‌کست</button>-->\n'
    '      <!-- <button class="dc-filter-btn active" data-type="photocast">فوتوکست</button>-->\n'
    '      <button class="dc-filter-btn active" data-type="dentcast_plus">ویدیوها</button>\n'
    '      <button class="dc-filter-btn active" data-type="dentai">مقالات</button>\n'
    '      <button class="dc-filter-btn active" data-type="meta">metanote</button>\n'
    '      <button class="dc-filter-btn active" data-type="chairside">chairside</button>\n'
    '      <button class="dc-filter-btn active" data-type="sharehub">Share Hub</button>\n'
    '    </div>\n'
    '    <div class="dc-results-box" id="dcResults"></div>\n'
    '  </div>\n'
)

GLOBAL_SEARCH_CSS_LINK = '  <link rel="stylesheet" href="/global-search.css?v=2">\n'

GLOBAL_SEARCH_SCRIPTS = (
    '<script src="/global-search.js?v=6"></script>\n'
    '<script src="/global-search-ui.js?v=2"></script>\n'
)

URL_TO_TYPE = [
    ("/glossary/",      "glossary"),
    ("/episodes/",      "podcast"),
    ("/notecast/",      "notecast"),
    ("/insight/",       "insight"),
    ("/dentai/",        "dentai"),
    ("/chairside/",     "chairside"),
    ("/metanotes/",     "metanote"),
    ("/litecast/",      "litecast"),
    ("/photocast/",     "photocast"),
    ("/dentcast-plus/", "dentcast_plus"),
    ("/sharehub/",      "sharehub"),
]

JSON_TYPE_TO_KEY = {
    "notecast":     "notecast",
    "dentai":       "dentai",
    "clinical":     "insight",
    "chairside":    "chairside",
    "meta":         "metanote",
    "litecast":     "litecast",
    "photocast":    "photocast",
    "dentcast_plus": "dentcast_plus",
    "sharehub":     "sharehub",
    "dentcast":     "podcast",
    "glossary":     "glossary",
}


def detect_type(entry, source):
    if source == "glossary":
        return "glossary"
    t = entry.get("type")
    if t and t in JSON_TYPE_TO_KEY:
        return JSON_TYPE_TO_KEY[t]
    url = entry.get("page_url") or entry.get("url") or ""
    for prefix, key in URL_TO_TYPE:
        if url.startswith(prefix):
            return key
    return "unknown"


def esc(s):
    return html.escape(s or "", quote=True)


def render_item(entry, source):
    title = entry.get("title") or entry.get("fa_title") or "(بدون عنوان)"
    url = entry.get("page_url") or entry.get("url") or "#"
    tkey = detect_type(entry, source)
    label_fa, symbol_id = TYPE_META[tkey]
    return (
        '      <li class="pillar-item" data-type="' + esc(tkey) + '">\n'
        '        <a href="' + esc(url) + '" class="pillar-item-link">\n'
        '          <span class="pillar-item-icon" aria-hidden="true">' + svg_icon(symbol_id) + '</span>\n'
        '          <span class="pillar-item-title">' + esc(title) + '</span>\n'
        '          <span class="sr-only"> ' + esc(label_fa) + '</span>\n'
        '        </a>\n'
        '      </li>\n'
    )


def fa_digits(n):
    table = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
    return str(n).translate(table)


def render_subtopic_card(sub_slug, sub_title, sub_symbol_id, items, intro_fa=""):
    count = len(items)
    items_html = "".join(render_item(it["entry"], it["source"]) for it in items)
    intro_html = (
        '      <p class="pillar-subtopic-intro">' + intro_fa + '</p>\n'
        if intro_fa else ''
    )
    return (
        '  <details class="pillar-card" data-subtopic="' + esc(sub_slug) + '">\n'
        '    <summary class="pillar-card-summary">\n'
        '      <span class="pillar-card-icon" aria-hidden="true">' + svg_icon(sub_symbol_id) + '</span>\n'
        '      <h2 class="pillar-card-title">' + esc(sub_title) + '</h2>\n'
        '      <span class="pillar-card-count" aria-label="' + fa_digits(count) + ' مورد">'
        '(' + fa_digits(count) + ')</span>\n'
        '      <span class="pillar-card-chevron" aria-hidden="true">▾</span>\n'
        '    </summary>\n'
        '    <div class="pillar-card-body">\n'
        + intro_html +
        '      <ul class="pillar-list">\n'
        + items_html +
        '      </ul>\n'
        '      <div class="pillar-card-fade" aria-hidden="true"></div>\n'
        '    </div>\n'
        '  </details>\n'
    )


def sort_items(items):
    def k(it):
        e = it["entry"]; src = it["source"]
        if src == "glossary":
            return (0, (e.get("slug") or e.get("title") or "").lower())
        url = (e.get("page_url") or e.get("url") or "").lower()
        return (1, url)
    return sorted(items, key=k)


def build_jsonld(cfg, canonical, flat_ordered):
    item_list_elements = []
    for i, it in enumerate(flat_ordered, start=1):
        e = it["entry"]
        title = e.get("title") or e.get("fa_title") or "(بدون عنوان)"
        url = e.get("page_url") or e.get("url") or ""
        if url.startswith("/"):
            url_abs = "https://dentcast.org" + url
        else:
            url_abs = url
        item_list_elements.append({
            "@type": "ListItem",
            "position": i,
            "name": title,
            "url": url_abs,
        })

    data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "url": canonical,
                "name": cfg["page_title"],
                "description": cfg["meta_description"],
                "inLanguage": "fa",
                "isPartOf": {"@id": "https://dentcast.org/#website"},
                "author": {"@id": "https://dentcast.org/about.html#person-fouad-shahabian"},
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": len(item_list_elements),
                    "itemListElement": item_list_elements,
                },
            }
        ],
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


# ROOT path is set via env var for portable execution.
_root_env = os.environ.get("DENTCAST_ROOT")
if _root_env:
    ROOT = Path(_root_env).resolve()
else:
    HERE = Path(__file__).resolve().parent
    ROOT = HERE.parent
BRAIN_PATH = ROOT / "dentcast-brain.json"
GLOSS_PATH = ROOT / "glossary" / "glossary.json"


def build_pillar(slug):
    if slug not in PILLARS:
        raise SystemExit("Unknown pillar slug: " + slug)
    cfg = PILLARS[slug]

    brain = json.loads(BRAIN_PATH.read_text(encoding="utf-8"))
    gloss_doc = json.loads(GLOSS_PATH.read_text(encoding="utf-8"))
    gloss = gloss_doc["glossary"]

    collected = []
    for e in brain:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            collected.append({"source": "brain", "entry": e})
    for e in gloss:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            collected.append({"source": "glossary", "entry": e})

    groups = defaultdict(list)
    for it in collected:
        groups[it["entry"]["pillar"].get("subtopic")].append(it)

    cards_html_parts = []
    counts = {}
    flat_ordered = []
    for sub in cfg["subtopics"]:
        sub_slug  = sub["slug"]
        sub_title = sub["title_fa"]
        sub_icon  = sub["icon"]
        sub_intro = sub.get("intro_fa", "")
        items = sort_items(groups.get(sub_slug, []))
        counts[sub_slug] = len(items)
        cards_html_parts.append(render_subtopic_card(sub_slug, sub_title, sub_icon, items, sub_intro))
        flat_ordered.extend(items)
    cards_html = "".join(cards_html_parts)

    intro_html = "\n".join(
        '      <p>' + p + '</p>' for p in cfg["intro_paragraphs"]
    )

    page = render_page(slug, cfg, intro_html, cards_html, flat_ordered)

    out_dir = ROOT / "pillar" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.html"
    out_path.write_text(page, encoding="utf-8")

    print("Built " + str(out_path.relative_to(ROOT)))
    print("Total items: " + str(sum(counts.values())))
    for sub in cfg["subtopics"]:
        print("  " + sub["slug"].ljust(11) + " " + str(counts[sub["slug"]]))
    return out_path


def render_page(slug, cfg, intro_html, cards_html, flat_ordered):
    canonical = "https://dentcast.org/pillar/" + slug + "/"
    jsonld_body = build_jsonld(cfg, canonical, flat_ordered)

    head = (
        '<!DOCTYPE html>\n'
        '<html lang="fa" dir="rtl">\n'
        '<head>\n'
        '  <meta charset="UTF-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '  <title>' + esc(cfg["page_title"]) + '</title>\n'
        '  <meta name="description" content="' + esc(cfg["meta_description"]) + '">\n'
        '  <link rel="canonical" href="' + canonical + '">\n'
        '  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/pillar/' + slug + '/">\n'
        '  <link rel="alternate" hreflang="fa"    href="https://dentcast.org/pillar/' + slug + '/">\n'
        '  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/pillar/' + slug + '/">\n'
        '  <link rel="icon" href="/logo-v2.png" type="image/png" sizes="512x512">\n'
        '  <link rel="apple-touch-icon" href="/logo-v2.png">\n'
        '  <meta name="theme-color" content="#F3F5F7">\n'
        '  <meta property="og:type" content="website">\n'
        '  <meta property="og:locale" content="fa_IR">\n'
        '  <meta property="og:site_name" content="DentCast">\n'
        '  <meta property="og:title" content="' + esc(cfg["page_title"]) + '">\n'
        '  <meta property="og:description" content="' + esc(cfg["meta_description"]) + '">\n'
        '  <meta property="og:url" content="' + canonical + '">\n'
        '  <meta property="og:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        '  <meta name="twitter:title" content="' + esc(cfg["page_title"]) + '">\n'
        '  <meta name="twitter:description" content="' + esc(cfg["meta_description"]) + '">\n'
        '  <meta name="twitter:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '\n'
        '  <!-- JSON-LD structured data -->\n'
        '  <script type="application/ld+json">\n'
        + jsonld_body + '\n'
        '  </script>\n'
        '\n'
        '  <link rel="stylesheet" href="/dc-theme.css">\n'
        '  <link rel="stylesheet" href="/dc-nav.css">\n'
        '  <link rel="stylesheet" href="/global-search.css?v=2">\n'
        '\n'
        '  <link rel="stylesheet" href="/pillar/bonding/bonding.css">\n'
        '\n'
        '  <style>\n'
        '    /* Optional intro paragraph at the top of a subtopic card body.\n'
        '       Rendered only when a subtopic defines a non-empty intro_fa\n'
        '       in PILLARS. Calm muted block, RTL accent on the right.\n'
        '       Default palette (used by bonding) matches the pillar-index\n'
        '       default teal; per-pillar overrides below stay scoped via\n'
        '       [data-pillar="..."] on <body>. */\n'
        '    .pillar-subtopic-intro {\n'
        '      margin: 0 0 16px 0;\n'
        '      padding: 12px 16px;\n'
        '      background: rgba(45, 106, 122, 0.06);\n'
        '      border-right: 3px solid rgba(45, 106, 122, 0.35);\n'
        '      border-radius: 6px;\n'
        '      font-size: 14px;\n'
        '      line-height: 1.7;\n'
        '      color: var(--text, #333);\n'
        '    }\n'
        '    [data-theme="dark"] .pillar-subtopic-intro {\n'
        '      background: rgba(74, 154, 171, 0.10);\n'
        '      border-right-color: rgba(74, 154, 171, 0.45);\n'
        '      color: var(--text, #ddd);\n'
        '    }\n'
        '    /* ceramics — turquoise: #1ca5a5 light / #3dd6c4 dark */\n'
        '    [data-pillar="ceramics"] .pillar-subtopic-intro {\n'
        '      background: rgba(28, 165, 165, 0.07);\n'
        '      border-right-color: rgba(28, 165, 165, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="ceramics"] .pillar-subtopic-intro {\n'
        '      background: rgba(61, 214, 196, 0.10);\n'
        '      border-right-color: rgba(61, 214, 196, 0.45);\n'
        '    }\n'
        '    /* implantology — metallic gray: #6b7280 light / #9ca3af dark */\n'
        '    [data-pillar="implantology"] .pillar-subtopic-intro {\n'
        '      background: rgba(107, 114, 128, 0.07);\n'
        '      border-right-color: rgba(107, 114, 128, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="implantology"] .pillar-subtopic-intro {\n'
        '      background: rgba(156, 163, 175, 0.10);\n'
        '      border-right-color: rgba(156, 163, 175, 0.45);\n'
        '    }\n'
        '    /* occlusion — violet: #7c5cbf light / #a98fe0 dark */\n'
        '    [data-pillar="occlusion"] .pillar-subtopic-intro {\n'
        '      background: rgba(124, 92, 191, 0.07);\n'
        '      border-right-color: rgba(124, 92, 191, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="occlusion"] .pillar-subtopic-intro {\n'
        '      background: rgba(169, 143, 224, 0.10);\n'
        '      border-right-color: rgba(169, 143, 224, 0.45);\n'
        '    }\n'
        '    /* esthetic — dusty rose: #a8536b light / #c77d92 dark */\n'
        '    [data-pillar="esthetic"] .pillar-subtopic-intro {\n'
        '      background: rgba(168, 83, 107, 0.07);\n'
        '      border-right-color: rgba(168, 83, 107, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="esthetic"] .pillar-subtopic-intro {\n'
        '      background: rgba(199, 125, 146, 0.10);\n'
        '      border-right-color: rgba(199, 125, 146, 0.45);\n'
        '    }\n'
        '    /* treatment-planning — slate indigo: #4a5a8a light / #7d8cc0 dark */\n'
        '    [data-pillar="treatment-planning"] .pillar-subtopic-intro {\n'
        '      background: rgba(74, 90, 138, 0.07);\n'
        '      border-right-color: rgba(74, 90, 138, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="treatment-planning"] .pillar-subtopic-intro {\n'
        '      background: rgba(125, 140, 192, 0.10);\n'
        '      border-right-color: rgba(125, 140, 192, 0.45);\n'
        '    }\n'
        '    /* removable-pros — terracotta: #9c6644 light / #c08a63 dark */\n'
        '    [data-pillar="removable-pros"] .pillar-subtopic-intro {\n'
        '      background: rgba(156, 102, 68, 0.07);\n'
        '      border-right-color: rgba(156, 102, 68, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="removable-pros"] .pillar-subtopic-intro {\n'
        '      background: rgba(192, 138, 99, 0.10);\n'
        '      border-right-color: rgba(192, 138, 99, 0.45);\n'
        '    }\n'
        '    /* operative — sage green: #5e8c6a light / #86b894 dark */\n'
        '    [data-pillar="operative"] .pillar-subtopic-intro {\n'
        '      background: rgba(94, 140, 106, 0.07);\n'
        '      border-right-color: rgba(94, 140, 106, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="operative"] .pillar-subtopic-intro {\n'
        '      background: rgba(134, 184, 148, 0.10);\n'
        '      border-right-color: rgba(134, 184, 148, 0.45);\n'
        '    }\n'
        '    /* digital — steel periwinkle: #6b5b95 light / #9d8ec7 dark */\n'
        '    [data-pillar="digital"] .pillar-subtopic-intro {\n'
        '      background: rgba(107, 91, 149, 0.07);\n'
        '      border-right-color: rgba(107, 91, 149, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="digital"] .pillar-subtopic-intro {\n'
        '      background: rgba(157, 142, 199, 0.10);\n'
        '      border-right-color: rgba(157, 142, 199, 0.45);\n'
        '    }\n'
        '    /* Pillar header icon — centered above H1, colored with each\n'
        '       pillar accent via [data-pillar] scope. Stroke icons inherit\n'
        '       the color through currentColor. Same accent values + light/\n'
        '       dark pairs as the pillar-index card icons. */\n'
        '    .pillar-header-icon { display: block; line-height: 1; margin: 0 0 8px; color: #2d6a7a; }\n'
        '    .pillar-header-icon .dc-svg-icon { width: 38px; height: 38px; }\n'
        '    [data-theme="dark"] .pillar-header-icon { color: #4a9aab; }\n'
        '    [data-pillar="ceramics"] .pillar-header-icon { color: #1ca5a5; }\n'
        '    [data-theme="dark"] [data-pillar="ceramics"] .pillar-header-icon { color: #3dd6c4; }\n'
        '    [data-pillar="fixed-pros"] .pillar-header-icon { color: #9a6a2d; }\n'
        '    [data-theme="dark"] [data-pillar="fixed-pros"] .pillar-header-icon { color: #c89456; }\n'
        '    [data-pillar="implantology"] .pillar-header-icon { color: #6b7280; }\n'
        '    [data-theme="dark"] [data-pillar="implantology"] .pillar-header-icon { color: #9ca3af; }\n'
        '    [data-pillar="occlusion"] .pillar-header-icon { color: #7c5cbf; }\n'
        '    [data-theme="dark"] [data-pillar="occlusion"] .pillar-header-icon { color: #a98fe0; }\n'
        '    [data-pillar="esthetic"] .pillar-header-icon { color: #a8536b; }\n'
        '    [data-theme="dark"] [data-pillar="esthetic"] .pillar-header-icon { color: #c77d92; }\n'
        '    [data-pillar="treatment-planning"] .pillar-header-icon { color: #4a5a8a; }\n'
        '    [data-theme="dark"] [data-pillar="treatment-planning"] .pillar-header-icon { color: #7d8cc0; }\n'
        '    [data-pillar="removable-pros"] .pillar-header-icon { color: #9c6644; }\n'
        '    [data-theme="dark"] [data-pillar="removable-pros"] .pillar-header-icon { color: #c08a63; }\n'
        '    [data-pillar="operative"] .pillar-header-icon { color: #5e8c6a; }\n'
        '    [data-theme="dark"] [data-pillar="operative"] .pillar-header-icon { color: #86b894; }\n'
        '    [data-pillar="digital"] .pillar-header-icon { color: #6b5b95; }\n'
        '    [data-theme="dark"] [data-pillar="digital"] .pillar-header-icon { color: #9d8ec7; }\n'
        '  </style>\n'
        '\n'
        "  <!-- Theme init verbatim from metanotes/index.html -->\n"
        "  <script>\n"
        "    (function(){\n"
        "      const s=localStorage.getItem('dc-theme');\n"
        "      const d=window.matchMedia('(prefers-color-scheme:dark)').matches;\n"
        "      if(s==='dark'||(s===null&&d)) document.documentElement.setAttribute('data-theme','dark');\n"
        "    })();\n"
        "  </script>\n"
        '</head>\n'
    )

    body = (
        '<body data-pillar="' + esc(slug) + '">\n'
        '\n'
        '<header class="dc-topbar">\n'
        '  <div class="dc-topbar-actions">\n'
        '    <a href="/" aria-label="صفحه اصلی دنت‌کست" style="display:flex;align-items:center;margin-left:8px;flex-shrink:0;"><img src="/logo-v2.png" alt="DentCast" width="38" height="38" style="display:block;object-fit:contain;"></a>\n'
        '    <button class="dc-topbar-btn" id="btn-toolbar-toggle" aria-label="ابزارها" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>\n'
        '    <button class="dc-topbar-btn dcOpenSearch" aria-label="جستجو"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>\n'
        '  </div>\n'
        '  <div class="dc-topbar-brand">\n'
        '    <div class="dc-topbar-brand-name">DentCast</div>\n'
        '    <a href="/about.html" class="dc-topbar-brand-sub">دکتر فواد شهابیان</a>\n'
        '  </div>\n'
        '</header>\n'
        '\n'
        '<div id="dcToolbarDrawer" class="dc-toolbar-drawer" aria-hidden="true">\n'
        '  <div class="dc-toolbar-drawer-inner">\n'
        '    <span class="dc-toolbar-drawer-label">ابزارها</span>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-pwa"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/></svg></span><span class="dc-drawer-tool-txt">نصب</span></button>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-consult"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="dc-drawer-tool-txt">مشاوره</span></button>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-about"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg></span><span class="dc-drawer-tool-txt">درباره</span></button>\n'
        '  </div>\n'
        '</div>\n'
        '<div id="dcRadarOverlay" class="radar-overlay" aria-hidden="true">\n'
        '  <div class="radar-overlay-header">\n'
        '    <button id="dcCloseRadarOverlay" class="radar-close-btn">&times;</button>\n'
        '    <div class="radar-header-title">رادار دنت‌کست (جایگزین گوگل)</div>\n'
        '  </div>\n'
        '  <div class="radar-overlay-body">\n'
        '    <div class="radar-search-box">\n'
        '      <input type="text" id="dcRadarInput" placeholder="نام سایت، زمینه فعالیت یا کلمه کلیدی..." autocomplete="off">\n'
        '    </div>\n'
        '    <div id="dcRadarResults" class="radar-results">\n'
        '      <div class="radar-initial-msg">برای جستجو در بین سایت‌های دندانپزشکی، تایپ کنید...</div>\n'
        '    </div>\n'
        '  </div>\n'
        '</div>\n'
        '\n'
        '<div id="dc-top"></div>\n'
        '\n'
        '<div class="wrap">\n'
        '\n'
        '  <header>\n'
        '    <span class="pillar-header-icon" aria-hidden="true">' + svg_icon(cfg["icon"]) + '</span>\n'
        '    <h1>' + esc(cfg["h1_fa"]) + '</h1>\n'
        '    <p class="pillar-subtitle">' + esc(cfg["subtitle_fa"]) + '</p>\n'
        '  </header>\n'
        '\n'
        '  <!-- 🔍 Global Search -->\n'
        '  <div class="dc-global-filter-box" id="dcGlobalBox">\n'
        '    <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>\n'
        '    <h3 class="dc-global-filter-title">جستجوی سراسری دنت‌کست</h3>\n'
        '    <input id="dcSearch" class="dc-search-input" placeholder="جستجو در همهٔ بخش‌های دنت‌کست…">\n'
        '    <div class="dc-filter-list">\n'
        '      <button class="dc-filter-btn active" data-type="dentcast">دنت‌کست</button>\n'
        '      <button class="dc-filter-btn active" data-type="notecast">نوت‌کست</button>\n'
        '      <button class="dc-filter-btn active" data-type="clinical">نکات کلینیکی</button>\n'
        '      <!-- <button class="dc-filter-btn active" data-type="litecast">لایت‌کست</button>-->\n'
        '      <!-- <button class="dc-filter-btn active" data-type="photocast">فوتوکست</button>-->\n'
        '      <button class="dc-filter-btn active" data-type="dentcast_plus">ویدیوها</button>\n'
        '      <button class="dc-filter-btn active" data-type="dentai">مقالات</button>\n'
        '      <button class="dc-filter-btn active" data-type="meta">metanote</button>\n'
        '      <button class="dc-filter-btn active" data-type="chairside">chairside</button>\n'
        '      <button class="dc-filter-btn active" data-type="sharehub">Share Hub</button>\n'
        '    </div>\n'
        '    <div class="dc-results-box" id="dcResults"></div>\n'
        '  </div>\n'
        '\n'
        '  <main>\n'
        '    <section class="intro pillar-intro" aria-label="مقدمه">\n'
        + intro_html + '\n'
        '    </section>\n'
        '\n'
        '    <section class="pillar-cards" aria-label="دسته‌بندی موضوعی">\n'
        + cards_html +
        '    </section>\n'
        '  </main>\n'
        '\n'
        '  <footer class="dc-site-footer">\n'
        '    <a href="../" class="btn-home"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg> بازگشت به فهرست موضوعی</a>\n'
        '    <a href="/about.html" class="btn-about"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg> درباره‌ی دکتر فواد شهابیان و دنت‌کست</a>\n'
        '    <div class="footer-copy">© 2025 DentCast — طراحی و توسعه توسط <strong>دکتر فواد شهابیان</strong></div>\n'
        '  </footer>\n'
        '\n'
        '</div>\n'
        '\n'
        '<!-- تم تاگل -->\n'
        '\n'
        '<!-- Theme toggle behavior moved to /dc-nav.js (single source) -->\n'
        '<script src="/global-search.js?v=6"></script>\n'
        '<script src="/global-search-ui.js?v=2"></script>\n'
        '<script src="/dc-nav.js?v=20" defer></script>\n'
        '\n'
        '</body>\n'
        '</html>\n'
    )

    return head + body


def _count_pillar(slug, brain, gloss):
    items = 0
    subs = set()
    for e in brain:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            items += 1
            if p.get("subtopic"): subs.add(p["subtopic"])
    for e in gloss:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            items += 1
            if p.get("subtopic"): subs.add(p["subtopic"])
    return items, len(subs)


def build_jsonld_index(canonical, pillars_info):
    items = []
    for i, info in enumerate(pillars_info, start=1):
        items.append({
            "@type": "ListItem",
            "position": i,
            "name": info["h1_fa"],
            "url": "https://dentcast.org/pillar/" + info["slug"] + "/",
            "description": info["subtitle_fa_short"],
        })
    data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "url": canonical,
                "name": "فهرست موضوعی / دنت‌کست",
                "description": INDEX_META_DESCRIPTION,
                "inLanguage": "fa",
                "isPartOf": {"@id": "https://dentcast.org/#website"},
                "author": {"@id": "https://dentcast.org/about.html#person-fouad-shahabian"},
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": len(items),
                    "itemListElement": items,
                },
            }
        ],
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


INDEX_META_DESCRIPTION = (
    "نقشه‌ی موضوعی دنت‌کست — "
    "مجموعه‌ای از pillar‌های دندان‌پزشکی که "
    "محتوای پادکست، گلاسری، نوت‌کست "
    "و یادداشت‌های بالینی را در ساختاری "
    "منسجم سازماندهی می‌کنند."
)

INDEX_INTRO_HTML = (
    "دنت‌کست در طول سال‌ها به شبکه‌ای از "
    "اپیزود، گلاسری، نوت‌کست و یادداشت "
    "بالینی تبدیل شده. هر <strong>موضوع</strong> "
    "اینجا یک نقطه‌ی ورود است به این شبکه — "
    "مفاهیم پایه تا چالش‌های پیشرفته، با لینک "
    "به منبع کامل. نقشه به‌مرور رشد می‌کند."
)

INDEX_INLINE_STYLE = (
    "<style>\n"
    "/* Pillar index — visual sibling of Glossary index.\n"
    "   Teal palette mirrors Glossary's blue at equivalent intensity:\n"
    "     light primary teal: #2d6a7a — mirrors --pr (#022360)\n"
    "     dark primary teal:  #4a9aab — mirrors dark --pr (#5b9cf6)\n"
    "   Opacities mirror Glossary's. */\n"
    "\n"
    "/* Page container */\n"
    ".pillar-index .page { max-width: 680px; margin: 0 auto; padding: 0 14px 60px; }\n"
    "\n"
    "/* Hero / title */\n"
    ".pillar-index .top { padding: 12px 0 10px; }\n"
    ".pillar-index .nav-back { margin-bottom: 8px; }\n"
    ".pillar-index .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; font-weight: 600; color: var(--txt3); transition: color var(--tr); }\n"
    ".pillar-index .back-link::before { content: \"\\2190 \\00A0\"; }\n"
    ".pillar-index .back-link:hover { color: #2d6a7a; }\n"
    "[data-theme=\"dark\"] .pillar-index .back-link:hover { color: #4a9aab; }\n"
    "\n"
    ".pillar-index .hero { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }\n"
    ".pillar-index .title { font-size: 1.1rem; font-weight: 900; color: #2d6a7a; display: flex; gap: 8px; align-items: center; transition: color var(--tr2); margin: 0; }\n"
    ".pillar-index .title .dot { width: 9px; height: 9px; border-radius: var(--r-f); background: #2d6a7a; box-shadow: 0 0 0 4px rgba(45,106,122,.15); flex-shrink: 0; }\n"
    ".pillar-index .subtitle { color: var(--txt3); font-size: .80rem; line-height: 1.6; transition: color var(--tr2); }\n"
    "[data-theme=\"dark\"] .pillar-index .title { color: #4a9aab; }\n"
    "[data-theme=\"dark\"] .pillar-index .title .dot { background: #4a9aab; box-shadow: 0 0 0 4px rgba(74,154,171,.15); }\n"
    "\n"
    "/* Intro paragraph — free-flowing text */\n"
    "body:has(.dc-topbar) .pillar-intro { background: transparent; border: 0; box-shadow: none; padding: 0; backdrop-filter: none; -webkit-backdrop-filter: none; margin: 6px 0 14px; }\n"
    ".pillar-intro p { color: var(--txt2); font-size: .82rem; line-height: 1.85; margin: 0; }\n"
    ".pillar-intro p strong { color: var(--txt); }\n"
    "\n"
    "/* Stats — three separate chips */\n"
    ".pillar-index-stats { display: flex; flex-direction: row; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 16px 0; }\n"
    ".pillar-index-stat-chip { display: inline-flex; align-items: baseline; gap: 6px; padding: 8px 16px; border-radius: 22px; background: rgba(45,106,122,.10); border: 1px solid rgba(45,106,122,.25); }\n"
    ".pillar-index-stat-chip .stat-value { font-size: 16px; font-weight: 700; color: #2d6a7a; font-feature-settings: \"tnum\"; font-variant-numeric: tabular-nums; }\n"
    ".pillar-index-stat-chip .stat-label { font-size: 13px; color: var(--txt3); }\n"
    "[data-theme=\"dark\"] .pillar-index-stat-chip { background: rgba(74,154,171,.15); border-color: rgba(74,154,171,.35); }\n"
    "[data-theme=\"dark\"] .pillar-index-stat-chip .stat-value { color: #4a9aab; }\n"
    "\n"
    "/* List wrap (outer card frame, same as Glossary's .listWrap) */\n"
    ".pillar-index .listWrap { margin-top: 4px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--card-sh); transition: all var(--tr2); }\n"
    "\n"
    "/* Pillar card row */\n"
    ".pillar-card-row { display: flex; align-items: stretch; gap: 12px; padding: 14px 14px; margin: 6px 6px; border-radius: var(--r-md); background: var(--surface2); border: 1px solid rgba(45,106,122,.25); transition: all var(--tr); -webkit-tap-highlight-color: transparent; color: inherit; text-decoration: none; }\n"
    ".pillar-card-row:hover { background: var(--surface3); border-color: rgba(45,106,122,.35); transform: translateX(-2px); }\n"
    ".pillar-card-row:active { transform: scale(.99); }\n"
    "[data-theme=\"dark\"] .pillar-card-row { border-color: rgba(74,154,171,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row:hover { border-color: rgba(74,154,171,.45); }\n"
    "\n"
    ".pillar-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }\n"
    ".pillar-card-header { display: flex; align-items: center; gap: 8px; }\n"
    ".pillar-card-icon { font-size: 1.1rem; line-height: 1; color: #2d6a7a; flex-shrink: 0; display: inline-flex; align-items: center; }\n"
    ".pillar-card-icon .dc-svg-icon { width: 1.2em; height: 1.2em; }\n"
    "[data-theme=\"dark\"] .pillar-card-icon { color: #4a9aab; }\n"
    ".pillar-card-name { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #2d6a7a; letter-spacing: -.2px; }\n"
    "[data-theme=\"dark\"] .pillar-card-name { color: #6ab5c4; }\n"
    ".pillar-card-subtitle { margin: 0; font-size: .78rem; color: var(--txt2); line-height: 1.5; }\n"
    ".pillar-card-meta { margin: 0; font-size: .7rem; color: var(--txt3); font-feature-settings: \"tnum\"; }\n"
    "\n"
    "/* Subtopic list — label on right (RTL), small teal chip on left */\n"
    ".pillar-card-subtopics { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 0; font-size: .78rem; color: var(--txt2); }\n"
    ".pillar-card-subtopics li { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border2); }\n"
    ".pillar-card-subtopics li:last-child { border-bottom: 0; }\n"
    ".subtopic-label { font-size: .82rem; color: var(--txt); }\n"
    ".subtopic-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 22px; padding: 0 8px; border-radius: 11px; background: rgba(45,106,122,.10); color: #2d6a7a; font-size: 12px; font-weight: 600; font-feature-settings: \"tnum\"; font-variant-numeric: tabular-nums; }\n"
    "[data-theme=\"dark\"] .subtopic-chip { background: rgba(74,154,171,.18); color: #4a9aab; }\n"
    "\n"
    "/* Arrow (chevron) on the LEFT in RTL */\n"
    ".pillar-card-arrow { width: 30px; height: 30px; border-radius: var(--r-sm); display: grid; place-items: center; background: rgba(45,106,122,.10); border: 1px solid rgba(45,106,122,.25); color: #2d6a7a; flex-shrink: 0; align-self: center; transition: all var(--tr2); }\n"
    ".pillar-card-arrow .dc-svg-icon { width: 1em; height: 1em; }\n"
    "[data-theme=\"dark\"] .pillar-card-arrow { background: rgba(74,154,171,.15); border-color: rgba(74,154,171,.35); color: #4a9aab; }\n"
    "\n"
    "@media (max-width: 480px) {\n"
    "  .pillar-card-row { padding: 12px 12px; }\n"
    "  .pillar-card-name { font-size: .92rem; }\n"
    "}\n"
    "\n"
    "/* Per-pillar accent — ceramics uses turquoise in place of the\n"
    "   default teal. Same mechanism, same places as the default above;\n"
    "   selectors are scoped to [data-pillar=\"ceramics\"] so bonding\n"
    "   keeps the default.\n"
    "     light primary turquoise: #1ca5a5\n"
    "     dark primary turquoise:  #3dd6c4 */\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] { border-color: rgba(28,165,165,.25); }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"]:hover { border-color: rgba(28,165,165,.35); }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-icon { color: #1ca5a5; }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-name { color: #1ca5a5; }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] .subtopic-chip { background: rgba(28,165,165,.10); color: #1ca5a5; }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-arrow { background: rgba(28,165,165,.10); border-color: rgba(28,165,165,.25); color: #1ca5a5; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] { border-color: rgba(61,214,196,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"]:hover { border-color: rgba(61,214,196,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-icon { color: #3dd6c4; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-name { color: #3dd6c4; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] .subtopic-chip { background: rgba(61,214,196,.18); color: #3dd6c4; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-arrow { background: rgba(61,214,196,.15); border-color: rgba(61,214,196,.35); color: #3dd6c4; }\n"
    "\n"
    "/* Per-pillar accent — fixed-pros uses warm brown in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"fixed-pros\"] so other cards stay teal.\n"
    "     light primary brown: #9a6a2d\n"
    "     dark primary brown:  #c89456 */\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] { border-color: rgba(154,106,45,.25); }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"]:hover { border-color: rgba(154,106,45,.35); }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-icon { color: #9a6a2d; }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-name { color: #9a6a2d; }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] .subtopic-chip { background: rgba(154,106,45,.10); color: #9a6a2d; }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-arrow { background: rgba(154,106,45,.10); border-color: rgba(154,106,45,.25); color: #9a6a2d; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] { border-color: rgba(200,148,86,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"]:hover { border-color: rgba(200,148,86,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-icon { color: #c89456; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-name { color: #d8a570; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] .subtopic-chip { background: rgba(200,148,86,.18); color: #c89456; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-arrow { background: rgba(200,148,86,.15); border-color: rgba(200,148,86,.35); color: #c89456; }\n"
    "\n"
    "/* Per-pillar accent — implantology uses metallic gray in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"implantology\"] so other cards stay teal.\n"
    "     light primary gray: #6b7280\n"
    "     dark primary gray:  #9ca3af */\n"
    ".pillar-card-row[data-pillar=\"implantology\"] { border-color: rgba(107,114,128,.25); }\n"
    ".pillar-card-row[data-pillar=\"implantology\"]:hover { border-color: rgba(107,114,128,.35); }\n"
    ".pillar-card-row[data-pillar=\"implantology\"] .pillar-card-icon { color: #6b7280; }\n"
    ".pillar-card-row[data-pillar=\"implantology\"] .pillar-card-name { color: #6b7280; }\n"
    ".pillar-card-row[data-pillar=\"implantology\"] .subtopic-chip { background: rgba(107,114,128,.10); color: #6b7280; }\n"
    ".pillar-card-row[data-pillar=\"implantology\"] .pillar-card-arrow { background: rgba(107,114,128,.10); border-color: rgba(107,114,128,.25); color: #6b7280; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"implantology\"] { border-color: rgba(156,163,175,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"implantology\"]:hover { border-color: rgba(156,163,175,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"implantology\"] .pillar-card-icon { color: #9ca3af; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"implantology\"] .pillar-card-name { color: #9ca3af; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"implantology\"] .subtopic-chip { background: rgba(156,163,175,.18); color: #9ca3af; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"implantology\"] .pillar-card-arrow { background: rgba(156,163,175,.15); border-color: rgba(156,163,175,.35); color: #9ca3af; }\n"
    "\n"
    "/* Per-pillar accent — occlusion uses violet in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"occlusion\"] so other cards stay teal.\n"
    "     light primary violet: #7c5cbf\n"
    "     dark primary violet:  #a98fe0 */\n"
    ".pillar-card-row[data-pillar=\"occlusion\"] { border-color: rgba(124,92,191,.25); }\n"
    ".pillar-card-row[data-pillar=\"occlusion\"]:hover { border-color: rgba(124,92,191,.35); }\n"
    ".pillar-card-row[data-pillar=\"occlusion\"] .pillar-card-icon { color: #7c5cbf; }\n"
    ".pillar-card-row[data-pillar=\"occlusion\"] .pillar-card-name { color: #7c5cbf; }\n"
    ".pillar-card-row[data-pillar=\"occlusion\"] .subtopic-chip { background: rgba(124,92,191,.10); color: #7c5cbf; }\n"
    ".pillar-card-row[data-pillar=\"occlusion\"] .pillar-card-arrow { background: rgba(124,92,191,.10); border-color: rgba(124,92,191,.25); color: #7c5cbf; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"occlusion\"] { border-color: rgba(169,143,224,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"occlusion\"]:hover { border-color: rgba(169,143,224,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"occlusion\"] .pillar-card-icon { color: #a98fe0; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"occlusion\"] .pillar-card-name { color: #a98fe0; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"occlusion\"] .subtopic-chip { background: rgba(169,143,224,.18); color: #a98fe0; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"occlusion\"] .pillar-card-arrow { background: rgba(169,143,224,.15); border-color: rgba(169,143,224,.35); color: #a98fe0; }\n"
    "\n"
    "/* Per-pillar accent — esthetic uses dusty rose in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"esthetic\"] so other cards stay teal.\n"
    "     light primary rose: #a8536b\n"
    "     dark primary rose:  #c77d92 */\n"
    ".pillar-card-row[data-pillar=\"esthetic\"] { border-color: rgba(168,83,107,.25); }\n"
    ".pillar-card-row[data-pillar=\"esthetic\"]:hover { border-color: rgba(168,83,107,.35); }\n"
    ".pillar-card-row[data-pillar=\"esthetic\"] .pillar-card-icon { color: #a8536b; }\n"
    ".pillar-card-row[data-pillar=\"esthetic\"] .pillar-card-name { color: #a8536b; }\n"
    ".pillar-card-row[data-pillar=\"esthetic\"] .subtopic-chip { background: rgba(168,83,107,.10); color: #a8536b; }\n"
    ".pillar-card-row[data-pillar=\"esthetic\"] .pillar-card-arrow { background: rgba(168,83,107,.10); border-color: rgba(168,83,107,.25); color: #a8536b; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"esthetic\"] { border-color: rgba(199,125,146,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"esthetic\"]:hover { border-color: rgba(199,125,146,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"esthetic\"] .pillar-card-icon { color: #c77d92; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"esthetic\"] .pillar-card-name { color: #c77d92; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"esthetic\"] .subtopic-chip { background: rgba(199,125,146,.18); color: #c77d92; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"esthetic\"] .pillar-card-arrow { background: rgba(199,125,146,.15); border-color: rgba(199,125,146,.35); color: #c77d92; }\n"
    "\n"
    "/* Per-pillar accent — treatment-planning uses slate indigo in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"treatment-planning\"] so other cards stay teal.\n"
    "     light primary indigo: #4a5a8a\n"
    "     dark primary indigo:  #7d8cc0 */\n"
    ".pillar-card-row[data-pillar=\"treatment-planning\"] { border-color: rgba(74,90,138,.25); }\n"
    ".pillar-card-row[data-pillar=\"treatment-planning\"]:hover { border-color: rgba(74,90,138,.35); }\n"
    ".pillar-card-row[data-pillar=\"treatment-planning\"] .pillar-card-icon { color: #4a5a8a; }\n"
    ".pillar-card-row[data-pillar=\"treatment-planning\"] .pillar-card-name { color: #4a5a8a; }\n"
    ".pillar-card-row[data-pillar=\"treatment-planning\"] .subtopic-chip { background: rgba(74,90,138,.10); color: #4a5a8a; }\n"
    ".pillar-card-row[data-pillar=\"treatment-planning\"] .pillar-card-arrow { background: rgba(74,90,138,.10); border-color: rgba(74,90,138,.25); color: #4a5a8a; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"treatment-planning\"] { border-color: rgba(125,140,192,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"treatment-planning\"]:hover { border-color: rgba(125,140,192,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"treatment-planning\"] .pillar-card-icon { color: #7d8cc0; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"treatment-planning\"] .pillar-card-name { color: #7d8cc0; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"treatment-planning\"] .subtopic-chip { background: rgba(125,140,192,.18); color: #7d8cc0; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"treatment-planning\"] .pillar-card-arrow { background: rgba(125,140,192,.15); border-color: rgba(125,140,192,.35); color: #7d8cc0; }\n"
    "\n"
    "/* Per-pillar accent — removable-pros uses terracotta in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"removable-pros\"] so other cards stay teal.\n"
    "     light primary terracotta: #9c6644\n"
    "     dark primary terracotta:  #c08a63 */\n"
    ".pillar-card-row[data-pillar=\"removable-pros\"] { border-color: rgba(156,102,68,.25); }\n"
    ".pillar-card-row[data-pillar=\"removable-pros\"]:hover { border-color: rgba(156,102,68,.35); }\n"
    ".pillar-card-row[data-pillar=\"removable-pros\"] .pillar-card-icon { color: #9c6644; }\n"
    ".pillar-card-row[data-pillar=\"removable-pros\"] .pillar-card-name { color: #9c6644; }\n"
    ".pillar-card-row[data-pillar=\"removable-pros\"] .subtopic-chip { background: rgba(156,102,68,.10); color: #9c6644; }\n"
    ".pillar-card-row[data-pillar=\"removable-pros\"] .pillar-card-arrow { background: rgba(156,102,68,.10); border-color: rgba(156,102,68,.25); color: #9c6644; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"removable-pros\"] { border-color: rgba(192,138,99,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"removable-pros\"]:hover { border-color: rgba(192,138,99,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"removable-pros\"] .pillar-card-icon { color: #c08a63; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"removable-pros\"] .pillar-card-name { color: #c08a63; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"removable-pros\"] .subtopic-chip { background: rgba(192,138,99,.18); color: #c08a63; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"removable-pros\"] .pillar-card-arrow { background: rgba(192,138,99,.15); border-color: rgba(192,138,99,.35); color: #c08a63; }\n"
    "\n"
    "/* Per-pillar accent — operative uses sage green in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"operative\"] so other cards stay teal.\n"
    "     light primary sage: #5e8c6a\n"
    "     dark primary sage:  #86b894 */\n"
    ".pillar-card-row[data-pillar=\"operative\"] { border-color: rgba(94,140,106,.25); }\n"
    ".pillar-card-row[data-pillar=\"operative\"]:hover { border-color: rgba(94,140,106,.35); }\n"
    ".pillar-card-row[data-pillar=\"operative\"] .pillar-card-icon { color: #5e8c6a; }\n"
    ".pillar-card-row[data-pillar=\"operative\"] .pillar-card-name { color: #5e8c6a; }\n"
    ".pillar-card-row[data-pillar=\"operative\"] .subtopic-chip { background: rgba(94,140,106,.10); color: #5e8c6a; }\n"
    ".pillar-card-row[data-pillar=\"operative\"] .pillar-card-arrow { background: rgba(94,140,106,.10); border-color: rgba(94,140,106,.25); color: #5e8c6a; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"operative\"] { border-color: rgba(134,184,148,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"operative\"]:hover { border-color: rgba(134,184,148,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"operative\"] .pillar-card-icon { color: #86b894; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"operative\"] .pillar-card-name { color: #86b894; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"operative\"] .subtopic-chip { background: rgba(134,184,148,.18); color: #86b894; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"operative\"] .pillar-card-arrow { background: rgba(134,184,148,.15); border-color: rgba(134,184,148,.35); color: #86b894; }\n"
    "\n"
    "/* Per-pillar accent — digital uses steel periwinkle in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"digital\"] so other cards stay teal.\n"
    "     light primary periwinkle: #6b5b95\n"
    "     dark primary periwinkle:  #9d8ec7 */\n"
    ".pillar-card-row[data-pillar=\"digital\"] { border-color: rgba(107,91,149,.25); }\n"
    ".pillar-card-row[data-pillar=\"digital\"]:hover { border-color: rgba(107,91,149,.35); }\n"
    ".pillar-card-row[data-pillar=\"digital\"] .pillar-card-icon { color: #6b5b95; }\n"
    ".pillar-card-row[data-pillar=\"digital\"] .pillar-card-name { color: #6b5b95; }\n"
    ".pillar-card-row[data-pillar=\"digital\"] .subtopic-chip { background: rgba(107,91,149,.10); color: #6b5b95; }\n"
    ".pillar-card-row[data-pillar=\"digital\"] .pillar-card-arrow { background: rgba(107,91,149,.10); border-color: rgba(107,91,149,.25); color: #6b5b95; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"digital\"] { border-color: rgba(157,142,199,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"digital\"]:hover { border-color: rgba(157,142,199,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"digital\"] .pillar-card-icon { color: #9d8ec7; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"digital\"] .pillar-card-name { color: #9d8ec7; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"digital\"] .subtopic-chip { background: rgba(157,142,199,.18); color: #9d8ec7; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"digital\"] .pillar-card-arrow { background: rgba(157,142,199,.15); border-color: rgba(157,142,199,.35); color: #9d8ec7; }\n"
    "</style>"
)


def _count_per_subtopic(slug, brain, gloss):
    counts = defaultdict(int)
    for e in brain:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            sub = p.get("subtopic")
            if sub:
                counts[sub] += 1
    for e in gloss:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            sub = p.get("subtopic")
            if sub:
                counts[sub] += 1
    return counts


def build_index():
    brain = json.loads(BRAIN_PATH.read_text(encoding="utf-8"))
    gloss = json.loads(GLOSS_PATH.read_text(encoding="utf-8"))["glossary"]

    pillars_info = []
    for slug, cfg in PILLARS.items():
        items, subs = _count_pillar(slug, brain, gloss)
        per_sub = _count_per_subtopic(slug, brain, gloss)
        subtopic_list = [
            {"slug": sub["slug"], "title_fa": sub["title_fa"], "count": per_sub.get(sub["slug"], 0)}
            for sub in cfg["subtopics"]
        ]
        pillars_info.append({
            "slug": slug,
            "h1_fa": cfg["h1_fa"],
            "subtitle_fa_short": cfg["subtitle_fa_short"],
            "icon": cfg["icon"],
            "items": items,
            "subtopics": subs,
            "subtopic_list": subtopic_list,
        })

    cards_html = "".join(_render_index_card(info) for info in pillars_info)
    page = _render_index_page(pillars_info, cards_html)

    out_dir = ROOT / "pillar"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.html"
    out_path.write_text(page, encoding="utf-8")

    print("Built " + str(out_path.relative_to(ROOT)))
    print("Pillars listed: " + str(len(pillars_info)))
    for info in pillars_info:
        print("  " + info["slug"].ljust(11) + " " + str(info["items"]) + " items, " + str(info["subtopics"]) + " subtopics")
    return out_path


def _render_index_card(info):
    subtopic_lis = "".join(
        '          <li>\n'
        '            <span class="subtopic-label">' + esc(s["title_fa"]) + '</span>\n'
        '            <span class="subtopic-chip">' + fa_digits(s["count"]) + '</span>\n'
        '          </li>\n'
        for s in info["subtopic_list"]
    )
    return (
        '      <a class="pillar-card-row" data-pillar="' + esc(info["slug"]) + '" href="/pillar/' + esc(info["slug"]) + '/">\n'
        '        <div class="pillar-card-body">\n'
        '          <div class="pillar-card-header">\n'
        '            <span class="pillar-card-icon" aria-hidden="true">' + svg_icon(info["icon"]) + '</span>\n'
        '            <h2 class="pillar-card-name">' + esc(info["h1_fa"]) + '</h2>\n'
        '          </div>\n'
        '          <p class="pillar-card-subtitle">' + esc(info["subtitle_fa_short"]) + '</p>\n'
        '          <p class="pillar-card-meta">' + fa_digits(info["items"]) + ' مطلب · ' + fa_digits(info["subtopics"]) + ' زیرموضوع</p>\n'
        '          <ul class="pillar-card-subtopics">\n'
        + subtopic_lis +
        '          </ul>\n'
        '        </div>\n'
        '        <div class="pillar-card-arrow" aria-hidden="true">\n'
        '          <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>\n'
        '        </div>\n'
        '      </a>\n'
    )


def _render_index_page(pillars_info, cards_html):
    canonical = "https://dentcast.org/pillar/"
    page_title = "فهرست موضوعی / دنت‌کست"
    h1_fa = "فهرست موضوعی"
    subtitle_fa = "نقشه‌ی موضوعی دنت‌کست"
    jsonld_body = build_jsonld_index(canonical, pillars_info)

    total_pillars   = len(pillars_info)
    total_items     = sum(p["items"] for p in pillars_info)
    total_subtopics = sum(p["subtopics"] for p in pillars_info)

    stats_html = (
        '      <div class="pillar-index-stats">\n'
        '        <span class="pillar-index-stat-chip"><span class="stat-value">' + fa_digits(total_pillars)   + '</span><span class="stat-label">موضوع</span></span>\n'
        '        <span class="pillar-index-stat-chip"><span class="stat-value">' + fa_digits(total_items)     + '</span><span class="stat-label">مطلب</span></span>\n'
        '        <span class="pillar-index-stat-chip"><span class="stat-value">' + fa_digits(total_subtopics) + '</span><span class="stat-label">زیرموضوع</span></span>\n'
        '      </div>\n'
    )

    head = (
        '<!DOCTYPE html>\n'
        '<html lang="fa" dir="rtl">\n'
        '<head>\n'
        '  <meta charset="UTF-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '  <title>' + esc(page_title) + '</title>\n'
        '  <meta name="description" content="' + esc(INDEX_META_DESCRIPTION) + '">\n'
        '  <link rel="canonical" href="' + canonical + '">\n'
        '  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/pillar/">\n'
        '  <link rel="alternate" hreflang="fa"    href="https://dentcast.org/pillar/">\n'
        '  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/pillar/">\n'
        '  <link rel="icon" href="/logo-v2.png" type="image/png" sizes="512x512">\n'
        '  <link rel="apple-touch-icon" href="/logo-v2.png">\n'
        '  <meta name="theme-color" content="#F3F5F7">\n'
        '  <meta property="og:type" content="website">\n'
        '  <meta property="og:locale" content="fa_IR">\n'
        '  <meta property="og:site_name" content="DentCast">\n'
        '  <meta property="og:title" content="' + esc(page_title) + '">\n'
        '  <meta property="og:description" content="' + esc(INDEX_META_DESCRIPTION) + '">\n'
        '  <meta property="og:url" content="' + canonical + '">\n'
        '  <meta property="og:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        '  <meta name="twitter:title" content="' + esc(page_title) + '">\n'
        '  <meta name="twitter:description" content="' + esc(INDEX_META_DESCRIPTION) + '">\n'
        '  <meta name="twitter:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '\n'
        '  <!-- JSON-LD structured data -->\n'
        '  <script type="application/ld+json">\n'
        + jsonld_body + '\n'
        '  </script>\n'
        '\n'
        '  <link rel="stylesheet" href="/dc-theme.css">\n'
        '  <link rel="stylesheet" href="/dc-nav.css">\n'
        '  <link rel="stylesheet" href="/global-search.css?v=2">\n'
        '\n'
        '  ' + INDEX_INLINE_STYLE + '\n'
        '\n'
        "  <!-- Theme init verbatim from metanotes/index.html -->\n"
        "  <script>\n"
        "    (function(){\n"
        "      const s=localStorage.getItem('dc-theme');\n"
        "      const d=window.matchMedia('(prefers-color-scheme:dark)').matches;\n"
        "      if(s==='dark'||(s===null&&d)) document.documentElement.setAttribute('data-theme','dark');\n"
        "    })();\n"
        "  </script>\n"
        '</head>\n'
    )

    body = (
        '<body class="pillar-index">\n'
        '\n'
        '<header class="dc-topbar">\n'
        '  <div class="dc-topbar-actions">\n'
        '    <a href="/" aria-label="صفحه اصلی دنت‌کست" style="display:flex;align-items:center;margin-left:8px;flex-shrink:0;"><img src="/logo-v2.png" alt="DentCast" width="38" height="38" style="display:block;object-fit:contain;"></a>\n'
        '    <button class="dc-topbar-btn" id="btn-toolbar-toggle" aria-label="ابزارها" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>\n'
        '    <button class="dc-topbar-btn dcOpenSearch" aria-label="جستجو"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>\n'
        '  </div>\n'
        '  <div class="dc-topbar-brand">\n'
        '    <div class="dc-topbar-brand-name">DentCast</div>\n'
        '    <a href="/about.html" class="dc-topbar-brand-sub">دکتر فواد شهابیان</a>\n'
        '  </div>\n'
        '</header>\n'
        '\n'
        '<div id="dcToolbarDrawer" class="dc-toolbar-drawer" aria-hidden="true">\n'
        '  <div class="dc-toolbar-drawer-inner">\n'
        '    <span class="dc-toolbar-drawer-label">ابزارها</span>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-pwa"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/></svg></span><span class="dc-drawer-tool-txt">نصب</span></button>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-consult"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="dc-drawer-tool-txt">مشاوره</span></button>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-about"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg></span><span class="dc-drawer-tool-txt">درباره</span></button>\n'
        '  </div>\n'
        '</div>\n'
        '<div id="dcRadarOverlay" class="radar-overlay" aria-hidden="true">\n'
        '  <div class="radar-overlay-header">\n'
        '    <button id="dcCloseRadarOverlay" class="radar-close-btn">&times;</button>\n'
        '    <div class="radar-header-title">رادار دنت‌کست (جایگزین گوگل)</div>\n'
        '  </div>\n'
        '  <div class="radar-overlay-body">\n'
        '    <div class="radar-search-box">\n'
        '      <input type="text" id="dcRadarInput" placeholder="نام سایت، زمینه فعالیت یا کلمه کلیدی..." autocomplete="off">\n'
        '    </div>\n'
        '    <div id="dcRadarResults" class="radar-results">\n'
        '      <div class="radar-initial-msg">برای جستجو در بین سایت‌های دندانپزشکی، تایپ کنید...</div>\n'
        '    </div>\n'
        '  </div>\n'
        '</div>\n'
        '\n'
        '<div id="dc-top"></div>\n'
        '\n'
        '<div class="wrap">\n'
        '\n'
        '  <!-- 🔍 Global Search -->\n'
        '  <div class="dc-global-filter-box" id="dcGlobalBox">\n'
        '    <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>\n'
        '    <h3 class="dc-global-filter-title">جستجوی سراسری دنت‌کست</h3>\n'
        '    <input id="dcSearch" class="dc-search-input" placeholder="جستجو در همهٔ بخش‌های دنت‌کست…">\n'
        '    <div class="dc-filter-list">\n'
        '      <button class="dc-filter-btn active" data-type="dentcast">دنت‌کست</button>\n'
        '      <button class="dc-filter-btn active" data-type="notecast">نوت‌کست</button>\n'
        '      <button class="dc-filter-btn active" data-type="clinical">نکات کلینیکی</button>\n'
        '      <button class="dc-filter-btn active" data-type="dentcast_plus">ویدیوها</button>\n'
        '      <button class="dc-filter-btn active" data-type="dentai">مقالات</button>\n'
        '      <button class="dc-filter-btn active" data-type="meta">metanote</button>\n'
        '      <button class="dc-filter-btn active" data-type="chairside">chairside</button>\n'
        '      <button class="dc-filter-btn active" data-type="sharehub">Share Hub</button>\n'
        '    </div>\n'
        '    <div class="dc-results-box" id="dcResults"></div>\n'
        '  </div>\n'
        '\n'
        '  <main class="page">\n'
        '\n'
        '    <div class="top">\n'
        '      <div class="hero">\n'
        '        <div class="nav-back">\n'
        '          <a href="/index.html" class="back-link">بازگشت به صفحهٔ اصلی دنت‌کست</a>\n'
        '        </div>\n'
        '        <h1 class="title"><span class="dot" aria-hidden="true"></span>' + esc(h1_fa) + '</h1>\n'
        '        <div class="subtitle">' + esc(subtitle_fa) + '</div>\n'
        '      </div>\n'
        '\n'
        '      <section class="intro pillar-intro" aria-label="مقدمه">\n'
        '        <p>' + INDEX_INTRO_HTML + '</p>\n'
        '      </section>\n'
        '\n'
        + stats_html +
        '    </div>\n'
        '\n'
        '    <div class="listWrap">\n'
        + cards_html +
        '    </div>\n'
        '\n'
        '  </main>\n'
        '\n'
        '</div>\n'
        '\n'
        '<!-- تم تاگل -->\n'
        '\n'
        '<!-- Theme toggle behavior moved to /dc-nav.js (single source) -->\n'
        '<script src="/global-search.js?v=6"></script>\n'
        '<script src="/global-search-ui.js?v=2"></script>\n'
        '<script src="/dc-nav.js?v=20" defer></script>\n'
        '\n'
        '</body>\n'
        '</html>\n'
    )
    return head + body


# =====================================================
# Glossary index builder
# =====================================================
# Generates glossary/index.html from glossary/glossary.json.
# Static markup + hydration JS. Replaces the previous
# client-side fetch+render model. Source of truth: glossary.json.
# Per-letter badges use ASCII digits; #countChip uses Persian digits.
# JSON-LD DefinedTermSet is regenerated alphabetically.

_GLOSSARY_ALPHABET = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


def _glossary_first_letter(title):
    m = re.search(r"[A-Za-z]", (title or "").strip())
    return m.group(0).upper() if m else "#"


def _glossary_sort_key(entry):
    return (entry.get("title") or "").lower()


def _render_glossary_term(entry):
    title = entry.get("title") or ""
    fa = entry.get("fa_title") or ""
    slug = entry.get("slug") or ""
    url = entry.get("url") or "#"
    return (
        '        <a class="term" href="' + esc(url) + '"'
        ' data-en="' + esc(title.lower()) + '"'
        ' data-fa="' + esc(fa.lower()) + '"'
        ' data-slug="' + esc(slug.lower()) + '">\n'
        '          <div class="left">\n'
        '            <div class="en">' + esc(title) + '</div>\n'
        '            <div class="fa">' + esc(fa) + '</div>\n'
        '          </div>\n'
        '          <div class="arrow">›</div>\n'
        '        </a>\n'
    )


def _render_glossary_section(letter, items):
    rows = "".join(_render_glossary_term(e) for e in items)
    return (
        '      <section id="sec-' + esc(letter) + '">\n'
        '        <div class="sectionHeader">\n'
        '          <h2>' + esc(letter) + ' <span class="badge">' + str(len(items)) + '</span></h2><span class="badge">A–Z</span>\n'
        '        </div>\n'
        '        <div class="items">\n'
        + rows +
        '        </div>\n'
        '      </section>\n'
    )


def _render_glossary_alpha_nav(enabled):
    parts = []
    for L in _GLOSSARY_ALPHABET:
        if L in enabled:
            parts.append('        <button type="button" class="alphaBtn">' + L + '</button>\n')
        else:
            parts.append(
                '        <button type="button" class="alphaBtn disabled" aria-disabled="true">'
                + L + '</button>\n'
            )
    return "".join(parts)


def _build_glossary_jsonld(terms_sorted):
    defined_terms = []
    for e in terms_sorted:
        url = e.get("url") or ""
        url_abs = ("https://dentcast.org" + url) if url.startswith("/") else url
        defined_terms.append({
            "@type": "DefinedTerm",
            "@id": url_abs + "#term",
            "name": e.get("fa_title") or e.get("title") or "",
            "url": url_abs,
        })
    doc = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": "https://dentcast.org/glossary/#collection",
        "name": "دانشنامه دنت‌کست",
        "description": "دانشنامهٔ مفاهیم تصمیم‌ساز در دندان‌پزشکی و پروتز.",
        "url": "https://dentcast.org/glossary/",
        "isPartOf": {"@id": "https://dentcast.org/#website"},
        "about": {"@id": "https://dentcast.org/about.html#person-fouad-shahabian"},
        "hasPart": {
            "@type": "DefinedTermSet",
            "name": "DentCast Glossary Terms",
            "description": "مجموعه‌ای از مفاهیم تعریف‌شده مرتبط با تصمیم‌گیری پروتزی و دندان‌پزشکی.",
            "@id": "https://dentcast.org/glossary/#termset",
            "url": "https://dentcast.org/glossary/",
            "inLanguage": "fa",
            "hasDefinedTerm": defined_terms,
        },
    }
    return json.dumps(doc, ensure_ascii=False, indent=2)


_GLOSSARY_HEAD_TOP = """<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>دانشنامه | DentCast</title>
  <meta name="description" content="دانشنامهٔ دنت‌کست: مفاهیم تصمیم‌ساز در دندان‌پزشکی. جستجوی زنده + فهرست الفبایی A–Z." />
  <link rel="canonical" href="https://dentcast.org/glossary/" />
  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/glossary/">
  <link rel="alternate" hreflang="fa" href="https://dentcast.org/glossary/">
  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/glossary/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:site_name" content="DentCast">
  <meta property="og:title" content="دانشنامه | DentCast">
  <meta property="og:description" content="دانشنامهٔ دنت‌کست: مفاهیم تصمیم‌ساز در دندان‌پزشکی. جستجوی زنده + فهرست الفبایی A–Z.">
  <meta property="og:url" content="https://dentcast.org/glossary/">
  <meta property="og:image" content="https://dentcast.org/dentcast-cover.webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="دانشنامه | DentCast">
  <meta name="twitter:description" content="دانشنامهٔ دنت‌کست: مفاهیم تصمیم‌ساز در دندان‌پزشکی. جستجوی زنده + فهرست الفبایی A–Z.">
  <meta name="twitter:image" content="https://dentcast.org/dentcast-cover.webp">
  <link rel="icon" href="/logo-v2.png" type="image/png" sizes="512x512">
  <link rel="apple-touch-icon" href="/logo-v2.png">
  <meta name="theme-color" content="#F3F5F7">

  <script type="application/ld+json">
"""

_GLOSSARY_HEAD_AFTER_JSONLD = """</script>

  <script>
    (function(){
      const s=localStorage.getItem('dc-theme');
      const d=window.matchMedia('(prefers-color-scheme:dark)').matches;
      if(s==='dark'||(s===null&&d)) document.documentElement.setAttribute('data-theme','dark');
    })();
  </script>

  <style>
:root{
  --pr:#022360; --pr-rgb:2,35,96;
  --ac:#0b5fff; --ac-rgb:11,95,255;
  --bg:#f0f2f5;
  --surface:#ffffff;
  --surface2:#f4f6fb;
  --surface3:#eaecf5;
  --border:rgba(2,35,96,.10);
  --border2:rgba(2,35,96,.06);
  --txt:#0a1a33;
  --txt2:#4a5f85;
  --txt3:#8a9cbe;
  --card-bg:#ffffff;
  --card-border:rgba(2,35,96,.09);
  --card-sh:0 1px 3px rgba(2,35,96,.07),0 4px 14px rgba(2,35,96,.04);
  --card-sh2:0 4px 18px rgba(2,35,96,.13),0 1px 4px rgba(2,35,96,.07);
  --tr:.17s cubic-bezier(.4,0,.2,1);
  --tr2:.26s cubic-bezier(.4,0,.2,1);
  --r-sm:10px; --r-md:14px; --r-lg:18px; --r-xl:22px; --r-f:999px;
}
[data-theme="dark"]{
  --pr:#5b9cf6; --pr-rgb:91,156,246;
  --ac:#5b9cf6; --ac-rgb:91,156,246;
  --bg:#0e1621;
  --surface:#17212b; --surface2:#1e2c3a; --surface3:#232e3c;
  --border:rgba(255,255,255,.08); --border2:rgba(255,255,255,.04);
  --txt:#e8f0ff; --txt2:#8aaac8; --txt3:#4a6a88;
  --card-bg:#1e2c3a; --card-border:rgba(255,255,255,.07);
  --card-sh:0 1px 3px rgba(0,0,0,.22),0 4px 14px rgba(0,0,0,.14);
  --card-sh2:0 4px 18px rgba(0,0,0,.28);
}

*{box-sizing:border-box;margin:0;padding:0;}
html{height:100%;width:100%;}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  font-size:16px; line-height:1.5;
  background:var(--bg); color:var(--txt);
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
  touch-action:pan-y;
  transition:background var(--tr2),color var(--tr2);
}
a{color:inherit;text-decoration:none;}

.page{
  max-width:680px;
  margin:0 auto;
  padding:0 14px 60px;
}

/* ── STICKY TOP ── */
.top{
  position:sticky; top:0; z-index:20;
  padding:12px 0 10px;
  background:var(--surface);
  border-bottom:1px solid var(--border);
  box-shadow:0 2px 10px rgba(var(--pr-rgb),.06);
  transition:background var(--tr2),border-color var(--tr2);
}

.nav-back{ margin-bottom:8px; }
.back-link{
  display:inline-flex; align-items:center; gap:4px;
  font-size:.78rem; font-weight:600;
  color:var(--txt3);
  transition:color var(--tr);
}
.back-link::before{ content:"← "; }
.back-link:hover{ color:var(--ac); }

.hero{ display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }

.title{
  font-size:1.1rem; font-weight:900;
  color:var(--pr);
  display:flex; gap:8px; align-items:center;
  transition:color var(--tr2);
}
.title .dot{
  width:9px; height:9px; border-radius:var(--r-f);
  background:var(--ac);
  box-shadow:0 0 0 4px rgba(var(--ac-rgb),.15);
  flex-shrink:0;
}
.subtitle{
  color:var(--txt3); font-size:.80rem; line-height:1.6;
  transition:color var(--tr2);
}

/* سرچ */
.searchWrap{
  background:var(--surface2);
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  padding:8px 10px;
  display:flex; gap:10px; align-items:center;
  transition:all var(--tr2);
}
.searchWrap:focus-within{
  border-color:rgba(var(--ac-rgb),.35);
  box-shadow:0 0 0 3px rgba(var(--ac-rgb),.08);
}
.searchIcon{
  width:34px; height:34px;
  border-radius:var(--r-md);
  background:rgba(var(--ac-rgb),.08);
  border:1px solid rgba(var(--ac-rgb),.18);
  display:grid; place-items:center;
  flex-shrink:0; color:var(--ac);
  font-weight:900; font-size:16px;
  transition:all var(--tr2);
}
#search{
  width:100%; border:0; outline:0;
  background:transparent; color:var(--txt);
  font-size:14px; font-family:inherit;
  padding:6px 4px;
}
#search::placeholder{ color:var(--txt3); }

.metaRow{
  display:flex; justify-content:space-between;
  align-items:center; gap:10px;
  margin-top:8px; font-size:.76rem;
}
.chip{
  padding:5px 10px; border-radius:var(--r-f);
  border:1px solid var(--border);
  background:var(--surface2);
  font-size:.72rem; color:var(--txt3);
  user-select:none; white-space:nowrap;
  transition:all var(--tr2);
}

/* alpha nav */
.alphaNav{
  margin-top:8px;
  display:flex; gap:6px;
  overflow-x:auto; overflow-y:hidden;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
  padding:4px 2px 2px;
}
.alphaNav::-webkit-scrollbar{ display:none; }

.alphaBtn{
  flex:0 0 auto; min-width:32px; height:32px;
  border-radius:var(--r-sm);
  border:1px solid var(--border);
  background:var(--surface2);
  display:grid; place-items:center;
  font-weight:700; font-size:.80rem;
  color:var(--txt2); cursor:pointer;
  user-select:none;
  transition:all var(--tr);
}
.alphaBtn:active{ transform:scale(.95); }
.alphaBtn.disabled{ opacity:.3; cursor:default; }
.alphaBtn.active{
  background:rgba(var(--ac-rgb),.12);
  border-color:rgba(var(--ac-rgb),.30);
  color:var(--ac);
}

/* ── LIST WRAP ── */
.listWrap{
  margin-top:12px;
  background:var(--card-bg);
  border:1px solid var(--card-border);
  border-radius:var(--r-xl);
  overflow:hidden;
  box-shadow:var(--card-sh);
  transition:all var(--tr2);
}

.sectionHeader{
  display:flex; justify-content:space-between;
  align-items:center; gap:10px;
  padding:10px 14px;
  background:var(--surface2);
  border-bottom:1px solid var(--border2);
  transition:background var(--tr2);
}
.sectionHeader h2{
  margin:0; font-size:.82rem; font-weight:800;
  color:var(--txt2); letter-spacing:.04em;
  display:flex; align-items:center; gap:8px;
  transition:color var(--tr2);
}
.sectionHeader .badge{
  font-size:.68rem; color:var(--txt3);
  border:1px solid var(--border);
  background:var(--surface);
  padding:3px 8px; border-radius:var(--r-f);
  transition:all var(--tr2);
}

.items{ padding:8px 6px 10px; }

.term{
  display:flex; justify-content:space-between;
  align-items:center; gap:10px;
  padding:10px 12px; margin:4px 4px;
  border-radius:var(--r-md);
  background:var(--surface2);
  border:1px solid var(--border2);
  transition:all var(--tr);
  -webkit-tap-highlight-color:transparent;
}
.term:hover{
  background:var(--surface3);
  border-color:var(--border);
  transform:translateX(-2px);
}
.term:active{ transform:scale(.99); }

.term .left{
  display:flex; flex-direction:column;
  gap:2px; min-width:0;
}
.en{
  font-weight:700; font-size:.88rem; color:var(--txt);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  transition:color var(--tr2);
}
.fa{
  color:var(--txt3); font-size:.78rem;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  transition:color var(--tr2);
}
.arrow{
  width:30px; height:30px; border-radius:var(--r-sm);
  display:grid; place-items:center;
  background:rgba(var(--ac-rgb),.08);
  border:1px solid rgba(var(--ac-rgb),.18);
  color:var(--ac); flex-shrink:0;
  font-weight:900; font-size:16px;
  transition:all var(--tr2);
}

.empty{
  padding:24px 16px; color:var(--txt3);
  font-size:.86rem; line-height:1.9; text-align:center;
}

section[id^="sec-"]{ scroll-margin-top:160px; }
@media(max-width:640px){
  section[id^="sec-"]{ scroll-margin-top:120px; }
}

/* فوتر */
.footer{
  margin-top:16px; padding:14px 6px 0;
  color:var(--txt3); font-size:.76rem;
  display:flex; justify-content:space-between;
  align-items:center; gap:12px; flex-wrap:wrap;
  transition:color var(--tr2);
}
.footer a{
  color:var(--txt3);
  border-bottom:1px dotted var(--border);
  transition:color var(--tr);
}
.footer a:hover{ color:var(--ac); }

@media(max-width:640px){
  .footer{
    margin-top:24px; padding:18px 12px 28px;
    flex-direction:column; justify-content:center;
    align-items:center; gap:10px;
    text-align:center; border-top:1px solid var(--border);
  }
  .footer a{
    display:inline-block; padding:6px 14px;
    border-radius:var(--r-f);
    background:var(--surface2); border:1px solid var(--border);
  }
}

/* تم تاگل */
#dc-theme-toggle{
  position:fixed; bottom:20px; left:14px; z-index:250;
  width:42px; height:42px; border-radius:var(--r-f);
  background:#17212b; color:#e8f0ff;
  border:1px solid rgba(255,255,255,.12);
  box-shadow:0 4px 16px rgba(0,0,0,.28);
  display:flex; align-items:center; justify-content:center;
  font-size:19px; cursor:pointer;
  transition:all var(--tr);
}
#dc-theme-toggle:active{ transform:scale(.86); }
  </style>
    <link rel="stylesheet" href="/dc-theme.css">
<link rel="stylesheet" href="/dc-nav.css">
  <link rel="stylesheet" href="/global-search.css?v=2">
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "دنت‌کست", "item": "https://dentcast.org/" },
    { "@type": "ListItem", "position": 2, "name": "Glossary", "item": "https://dentcast.org/glossary/" }
  ]
}
  </script>
</head>

<body>
<!-- DC NAV: TOP BAR -->
<header class="dc-topbar">
  <div class="dc-topbar-actions">
    <a href="/" aria-label="صفحه اصلی دنت‌کست" style="display:flex;align-items:center;margin-left:8px;flex-shrink:0;"><img src="/logo-v2.png" alt="DentCast" width="38" height="38" style="display:block;object-fit:contain;"></a>
    <button class="dc-topbar-btn" id="btn-toolbar-toggle" aria-label="ابزارها" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
    <button class="dc-topbar-btn dcOpenSearch" aria-label="جستجو"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>
  </div>
  <div class="dc-topbar-brand">
    <div class="dc-topbar-brand-name">DentCast</div>
    <a href="/about.html" class="dc-topbar-brand-sub">دکتر فواد شهابیان</a>
  </div>
</header>
<div id="dcToolbarDrawer" class="dc-toolbar-drawer" aria-hidden="true">
  <div class="dc-toolbar-drawer-inner">
    <span class="dc-toolbar-drawer-label">ابزارها</span>
    <button class="dc-drawer-tool-seg" type="button" id="tool-pwa"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/></svg></span><span class="dc-drawer-tool-txt">نصب</span></button>
    <button class="dc-drawer-tool-seg" type="button" id="tool-consult"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="dc-drawer-tool-txt">مشاوره</span></button>
    <button class="dc-drawer-tool-seg" type="button" id="tool-about"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg></span><span class="dc-drawer-tool-txt">درباره</span></button>
  </div>
</div>
<div id="dcRadarOverlay" class="radar-overlay" aria-hidden="true">
  <div class="radar-overlay-header">
    <button id="dcCloseRadarOverlay" class="radar-close-btn">&times;</button>
    <div class="radar-header-title">رادار دنت‌کست (جایگزین گوگل)</div>
  </div>
  <div class="radar-overlay-body">
    <div class="radar-search-box">
      <input type="text" id="dcRadarInput" placeholder="نام سایت، زمینه فعالیت یا کلمه کلیدی..." autocomplete="off">
    </div>
    <div id="dcRadarResults" class="radar-results">
      <div class="radar-initial-msg">برای جستجو در بین سایت‌های دندانپزشکی، تایپ کنید...</div>
    </div>
  </div>
</div>

  <main class="page">

    <div class="top">
      <div class="hero">
        <div class="nav-back">
          <a href="/index.html" class="back-link">بازگشت به صفحهٔ اصلی دنت‌کست</a>
        </div>
        <h1 class="title"><span class="dot"></span>دانشنامهٔ دنت‌کست</h1>
        <div class="subtitle">مفاهیم کلیدی دندانپزشکی</div>
      </div>

      <div class="searchWrap">
        <div class="searchIcon"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
        <input id="search" type="search" placeholder="جستجو: ..." autocomplete="off" />
      </div>

      <div class="metaRow">
"""

_GLOSSARY_BETWEEN_CHIP_AND_ALPHANAV = """        <div class="chip" id="hintChip">برای پرش، حروف A–Z رو بزن</div>
      </div>

      <div class="alphaNav" id="alphaNav" aria-label="Alphabet navigation">
"""

_GLOSSARY_BETWEEN_ALPHANAV_AND_LISTWRAP = """      </div>
    </div>

    <div class="listWrap" id="listWrap">
"""

_GLOSSARY_EMPTY_STATE = (
    '      <div class="empty" id="emptyState" hidden>موردی پیدا نشد. '
    '<br>املا رو چک کنید یا عبارت کوتاه‌تری بزنید.</div>\n'
)

_GLOSSARY_AFTER_LISTWRAP = """    </div>

  </main>

  <footer class="footer dc-site-footer">
    <div>© 2025 DentCast</div>
    <div><a href="/about.html">دربارهٔ دکتر فؤاد شهابیان</a></div>
  </footer>


  <!-- Theme toggle behavior moved to /dc-nav.js (single source) -->
"""

_GLOSSARY_HYDRATION_SCRIPT = """  <script>
    const elListWrap = document.getElementById("listWrap");
    const elSearch = document.getElementById("search");
    const elCountChip = document.getElementById("countChip");
    const elAlphaNav = document.getElementById("alphaNav");
    const elEmpty = document.getElementById("emptyState");

    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    function normalize(str){
      return (str || "").toString().trim().toLowerCase().replace(/\\s+/g, " ");
    }

    function debounce(fn, wait){
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    }

    function faDigits(n){
      return String(n).replace(/\\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
    }

    const allSections = Array.from(elListWrap.querySelectorAll('section[id^="sec-"]'));
    const TOTAL = elListWrap.querySelectorAll(".term").length;
    const sectionInfo = allSections.map(sec => ({
      el: sec,
      letter: sec.id.replace(/^sec-/, ""),
      terms: Array.from(sec.querySelectorAll(".term")),
      badge: sec.querySelector(".sectionHeader h2 .badge"),
      initialCount: sec.querySelectorAll(".term").length,
    }));

    function applyFilter(q){
      const enabled = new Set();
      let visible = 0;
      if (!q){
        sectionInfo.forEach(s => {
          s.el.hidden = false;
          s.terms.forEach(t => { t.style.display = ""; });
          if (s.badge) s.badge.textContent = String(s.initialCount);
          if (ALPHABET.includes(s.letter)) enabled.add(s.letter);
        });
        visible = TOTAL;
        elEmpty.hidden = true;
      } else {
        sectionInfo.forEach(s => {
          let n = 0;
          s.terms.forEach(t => {
            const hit = (t.dataset.en || "").includes(q)
                     || (t.dataset.fa || "").includes(q)
                     || (t.dataset.slug || "").includes(q);
            t.style.display = hit ? "" : "none";
            if (hit) n++;
          });
          s.el.hidden = (n === 0);
          if (s.badge) s.badge.textContent = String(n);
          if (n > 0 && ALPHABET.includes(s.letter)) enabled.add(s.letter);
          visible += n;
        });
        elEmpty.hidden = (visible > 0);
      }
      elCountChip.textContent = faDigits(visible) + " عنوان";
      elAlphaNav.querySelectorAll(".alphaBtn").forEach(btn => {
        const on = enabled.has(btn.textContent);
        btn.classList.toggle("disabled", !on);
        if (on) btn.removeAttribute("aria-disabled");
        else    btn.setAttribute("aria-disabled", "true");
      });
    }

    elAlphaNav.querySelectorAll(".alphaBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("disabled")) return;
        const target = document.getElementById("sec-" + btn.textContent);
        if (!target) return;
        const topBar = document.querySelector(".top");
        const offset = topBar ? topBar.offsetHeight + 8 : 0;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: "smooth" });
        elAlphaNav.querySelectorAll(".alphaBtn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        setTimeout(() => btn.classList.remove("active"), 1200);
      });
    });

    elSearch.addEventListener("input", debounce(() => applyFilter(normalize(elSearch.value)), 120));

    (function enableGlobalHorizontalSwipeForAlphaNav(){
      const nav = document.getElementById("alphaNav");
      const wrap = document.getElementById("listWrap");
      const search = document.getElementById("search");
      if (!nav || !wrap) return;
      let startX=0, startY=0, startScrollLeft=0, swiping=false, moved=false, suppressClickUntil=0;
      const THRESHOLD=10, SPEED=1.0;
      document.addEventListener("click", (e) => {
        if (Date.now() < suppressClickUntil){ e.preventDefault(); e.stopPropagation(); }
      }, true);
      function isInsideSearch(e){ return e.target === search || (search && search.contains(e.target)); }
      function onStart(e){
        if (!e.touches || e.touches.length !== 1) return;
        if (isInsideSearch(e)) return;
        const t = e.touches[0];
        startX=t.clientX; startY=t.clientY;
        startScrollLeft=nav.scrollLeft; swiping=false; moved=false;
      }
      function onMove(e){
        if (!e.touches || e.touches.length !== 1) return;
        if (isInsideSearch(e)) return;
        const t=e.touches[0];
        const dx=t.clientX-startX, dy=t.clientY-startY;
        if (!swiping){
          if (Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>THRESHOLD) return;
          if (Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>THRESHOLD){ swiping=true; } else { return; }
        }
        moved=true;
        e.preventDefault();
        nav.scrollLeft=startScrollLeft-(dx*SPEED);
      }
      function onEnd(){
        if (moved){ suppressClickUntil=Date.now()+350; }
        swiping=false; moved=false;
      }
      wrap.addEventListener("touchstart", onStart, {passive:true});
      wrap.addEventListener("touchmove", onMove, {passive:false});
      wrap.addEventListener("touchend", onEnd, {passive:true});
      wrap.addEventListener("touchcancel", onEnd, {passive:true});
      document.addEventListener("touchstart", onStart, {passive:true});
      document.addEventListener("touchmove", onMove, {passive:false});
      document.addEventListener("touchend", onEnd, {passive:true});
      document.addEventListener("touchcancel", onEnd, {passive:true});
    })();
  </script>
"""

_GLOSSARY_TAIL = """<div class="dc-global-filter-box" id="dcGlobalBox">
  <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
  <h3 class="dc-global-filter-title">جستجوی سراسری دنت‌کست</h3>
  <input id="dcSearch" class="dc-search-input" placeholder="جستجو در همهٔ بخش‌های دنت‌کست…">
  <div class="dc-filter-list">
    <button class="dc-filter-btn active" data-type="dentcast">دنت‌کست</button>
    <button class="dc-filter-btn active" data-type="notecast">نوت‌کست</button>
    <button class="dc-filter-btn active" data-type="clinical">نکات کلینیکی</button>
    <button class="dc-filter-btn active" data-type="dentcast_plus">ویدیوها</button>
    <button class="dc-filter-btn active" data-type="dentai">مقالات</button>
    <button class="dc-filter-btn active" data-type="meta">metanote</button>
    <button class="dc-filter-btn active" data-type="chairside">chairside</button>
    <button class="dc-filter-btn active" data-type="sharehub">Share Hub</button>
  </div>
  <div class="dc-results-box" id="dcResults"></div>
</div>
<script src="/global-search.js?v=6" defer></script>
<script src="/dc-nav.js?v=20" defer></script>
</body>
</html>
"""


def _render_glossary_page(*, jsonld_body, count_chip_text, alpha_nav_html, sections_html):
    count_chip_html = '        <div class="chip" id="countChip">' + count_chip_text + '</div>\n'
    return (
        _GLOSSARY_HEAD_TOP
        + jsonld_body + '\n'
        + _GLOSSARY_HEAD_AFTER_JSONLD
        + count_chip_html
        + _GLOSSARY_BETWEEN_CHIP_AND_ALPHANAV
        + alpha_nav_html
        + _GLOSSARY_BETWEEN_ALPHANAV_AND_LISTWRAP
        + sections_html
        + _GLOSSARY_EMPTY_STATE
        + _GLOSSARY_AFTER_LISTWRAP
        + _GLOSSARY_HYDRATION_SCRIPT
        + _GLOSSARY_TAIL
    )


def build_glossary():
    gloss_doc = json.loads(GLOSS_PATH.read_text(encoding="utf-8"))
    items = gloss_doc.get("glossary", [])
    sorted_items = sorted(items, key=_glossary_sort_key)

    groups = defaultdict(list)
    for e in sorted_items:
        groups[_glossary_first_letter(e.get("title"))].append(e)

    ordered_keys = [L for L in _GLOSSARY_ALPHABET if L in groups] + sorted(
        k for k in groups.keys() if k not in _GLOSSARY_ALPHABET
    )
    enabled_letters = {k for k in groups.keys() if k in _GLOSSARY_ALPHABET}

    sections_html = "".join(_render_glossary_section(L, groups[L]) for L in ordered_keys)
    alpha_nav_html = _render_glossary_alpha_nav(enabled_letters)
    total = sum(len(v) for v in groups.values())
    count_chip_text = fa_digits(total) + " عنوان"
    jsonld_body = _build_glossary_jsonld(sorted_items)

    page = _render_glossary_page(
        jsonld_body=jsonld_body,
        count_chip_text=count_chip_text,
        alpha_nav_html=alpha_nav_html,
        sections_html=sections_html,
    )

    out_path = ROOT / "glossary" / "index.html"
    out_path.write_text(page, encoding="utf-8")

    print("Built " + str(out_path.relative_to(ROOT)))
    print("Total terms: " + str(total))
    for L in ordered_keys:
        print("  " + L + " " + str(len(groups[L])))
    return out_path


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print("Usage: python build_pillar.py <target>", file=sys.stderr)
        print("Targets: " + ", ".join(list(PILLARS.keys()) + ["index", "glossary", "all"]), file=sys.stderr)
        sys.exit(1)
    target = args[0]
    if target == "index":
        build_index()
    elif target == "glossary":
        build_glossary()
    elif target == "all":
        for slug in PILLARS.keys():
            build_pillar(slug)
        build_index()
        build_glossary()
    elif target in PILLARS:
        build_pillar(target)
    else:
        print("Unknown target: " + target, file=sys.stderr)
        print("Targets: " + ", ".join(list(PILLARS.keys()) + ["index", "glossary", "all"]), file=sys.stderr)
        sys.exit(1)
