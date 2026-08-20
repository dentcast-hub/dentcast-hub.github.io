# -*- coding: utf-8 -*-
import subprocess, sys
sys.exit(subprocess.call([
    sys.executable, "tools/verify_publish.py", "chairside/chairside-34",
    "--expect-title", "آیا واقعاً می‌توانیم شکایت اصلی بیمار را بهتر کنیم؟",
    "--expect-caption",
    "در این کیس Chairside می‌بینیم چرا تعویض فوری یک بریج PFM نازیبا برای شکایتِ حجیم‌بودن سمت لینگوال رد شد: کانتور لینگوال در محدودهٔ طبیعی است، پس ساخت زیباترین بریج هم فضای زبان را خالی‌تر نمی‌کند — و چرا عکس پری‌اپیکال شرطِ تصمیم است نه شروع توربین.",
]))
