"""
دانلود فایل‌های فونت وزیرمتن (Vazirmatn) برای self-hosting
اجرا: python download_vazirmatn.py
نیاز: Python 3.x (بدون نیاز به کتابخانه اضافه)
"""
import urllib.request
import os

DEST = os.path.dirname(os.path.abspath(__file__))

BASE = "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/Vazirmatn/"

FILES = [
    "Vazirmatn-Thin.woff2",
    "Vazirmatn-ExtraLight.woff2",
    "Vazirmatn-Light.woff2",
    "Vazirmatn-Regular.woff2",
    "Vazirmatn-Medium.woff2",
    "Vazirmatn-SemiBold.woff2",
    "Vazirmatn-Bold.woff2",
    "Vazirmatn-ExtraBold.woff2",
    "Vazirmatn-Black.woff2",
]

print(f"دانلود فونت‌ها در: {DEST}\n")

for fname in FILES:
    url = BASE + fname
    dest_path = os.path.join(DEST, fname)
    if os.path.exists(dest_path):
        print(f"✓ موجود: {fname}")
        continue
    try:
        print(f"دانلود: {fname} ...", end=" ", flush=True)
        urllib.request.urlretrieve(url, dest_path)
        size = os.path.getsize(dest_path)
        print(f"✓ ({size:,} bytes)")
    except Exception as e:
        print(f"✗ خطا: {e}")

print("\nتمام. فایل‌های woff2 در پوشه fonts/ قرار گرفتند.")
