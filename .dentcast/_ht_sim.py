# -*- coding: utf-8 -*-
import subprocess, sys
queries = [
    "چیرساید", "کیس بالینی", "دکتر شهابیان", "شکایت اصلی", "بریج",
    "PFM", "کانتور", "لینگوال", "تعویض پروتز", "شروع نکردن درمان",
    "طرح درمان", "پری اپیکال", "مارجین", "اوپک", "پانورامیک",
    "اوورکانتور", "overcontour", "chief complaint", "نارضایتی بیمار",
]
out = []
for q in queries:
    r = subprocess.run(
        [sys.executable, "tools/hashtag_ref.py", "--simulate", q],
        capture_output=True, text=True, encoding="utf-8",
    )
    out.append(f"===== {q} =====\n{r.stdout or r.stderr}\n")
open(".dentcast/_ht-sim-ok.txt", "w", encoding="utf-8").write("\n".join(out))
print("wrote", len(out), "blocks")
