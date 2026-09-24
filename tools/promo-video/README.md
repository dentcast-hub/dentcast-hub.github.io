# ویدیوی دمو — «جستجوی کانتکت ← اپیزود ۱۲۱.۱ ← پخش از وسط»

A 9:16 (1080×1920, 60 fps) screen-recorded demo of the real site: the homepage in a
phone frame, «کانتکت» typed into the hero search, the اپیزود 121.1 result opened, play
pressed and the scrubber dragged to the middle of the episode.

- `stage.tpl` — the stage (background, phone frame, captions, finger, equalizer, outro).
  It is served by `record.mjs` itself under `/__promo/` on the site's own origin, so
  it is never a page of the site and never needs the GA/preconnect injectors.
- `record.mjs` — drives the site with Playwright and captures CDP screencast frames.
- `add_audio.py` — lays the real episode audio onto the recorded timeline.

```bash
# 1. serve the site (repo root)
npx http-server -p 8080 -s -c-1 .
# 2. in a scratch dir: a 15:02 silent stand-in for the episode file, then record
ffmpeg -f lavfi -i anullsrc=r=22050:cl=mono -t 902 -c:a libmp3lame -b:a 8k silent.mp3
node /path/to/repo/tools/promo-video/record.mjs      # needs `playwright` resolvable
# 3. frames → video
ffmpeg -f concat -safe 0 -i list.txt -vf "fps=60,scale=1080:1920:flags=lanczos,format=yuv420p" \
  -c:v libx264 -crf 17 -movflags +faststart dentcast-search-demo.mp4
# 4. real sound (dentopedia11 .mp3 from the bucket)
python3 add_audio.py "dentopedia11 .mp3" dentcast-search-demo.mp4 marks.json
```

The episode file is replaced by silence while recording because the Arvan bucket may
be unreachable from the recording machine; `marks.json` records when «پخش» was pressed
and where the scrubber landed, which is all `add_audio.py` needs.
The Spot sponsor card and the activity-tracker toast are hidden in the recording.
