# ویدیوی دمو — «کانتکت بین ۶ و ۷ هی باز میشه…»

A 9:16 (1080×1920, 60 fps), ~55 s screen-recorded story of the real site:

1. hook — typed full-screen: «کانتکت بین ۶ و ۷ / هی باز میشه… / چیکار باید بکنم؟»
2. بپرس — the homepage in a phone frame, the hero search tapped
3. بنویس — «کانتکت» typed into the global search
4. پیدا کن — the MetaNote 12 result tapped
5. بخوان — the page glides through «آیا فقط اکلوژن…» and «تفاوت حضور و عدم حضور…»
6. هایلایت کن — میز کار opened, the key sentence highlighted in yellow, the
   «پس نکته…» line in green, then a push-in on both marks
7. outro — «سؤالت رو بپرس، جوابش رو نگه دار.» · dentcast.ir

- `stage.tpl` — background, phone frame, captions + step rail, finger, outro. Served by
  `record.mjs` under `/__promo/` on the site's own origin, so it is never a page of the
  site and the GA/preconnect injectors never see it.
- `record.mjs` — drives the site with Playwright and captures CDP screencast frames.
  The Plus API is mocked (a premium reader with no highlights, `tour_seen` set), so
  میز کار and the highlight toolbar are the real modules working offline. The Spot
  sponsor card, the floating search button and the activity-tracker toast are hidden.

```bash
npx http-server -p 8080 -s -c-1 .                       # repo root
node /path/to/repo/tools/promo-video/record.mjs          # in a scratch dir; needs `playwright`
ffmpeg -f concat -safe 0 -i list.txt -vf "fps=60,scale=1080:1920:flags=lanczos,format=yuv420p" \
  -c:v libx264 -crf 18 -movflags +faststart dentcast-demo.mp4
```
