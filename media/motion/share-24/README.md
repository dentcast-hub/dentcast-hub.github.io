# Share Hub 24 — motion teaser

26-second silent portrait video, 720 × 1280, 24 fps, H.264 / yuv420p.

- `share-24-motion.mp4`: ready to download and edit into a Reel.
- `share-24-motion.html`: self-contained editable animation; embedded existing DentCast Vazirmatn font. Open in a browser; replay button restarts playback. `?render` disables autoplay and exposes `window.render(seconds)` for deterministic capture.
- `render.cjs`: deterministic SVG frame renderer. Requires Node.js, `sharp`, FFmpeg, and Vazirmatn installed in fontconfig. Run `npm install --no-save sharp` in a separate temporary dependency directory, then `node render.cjs` with that directory on `NODE_PATH`. Font source: `/fonts/Vazirmatn-Bold.woff2` in this repository (convert to TTF with fontTools/Brotli when needed).

Source article: https://dentcast.org/sharehub/share-24.html

## Sequence

0–5 s: dentist seated in clinic; patient arrives; short upper centrals appear in a schematic.
5–10 s: dentist considers where to begin and what treatment is appropriate.
10–17 s: DentCast phone card with the exact article title and author; all body copy is replaced by unreadable placeholder bars. This is a stylized article card, not a screenshot of the live page.
17–22 s: light bulb appears; dentist turns back toward patient to continue assessment.
22–26 s: article title and DentCast call to action.

No diagnosis, cause, or treatment choice is revealed. No clinical before/after result is shown. No changes to the source article, site navigation, content indexes, or publishing records.

## Verification

Rendered all 624 frames from the same scene timing function used by the HTML. Inspected clinic, thought, phone, light bulb and closing frames for Persian shaping and layout. Verified MP4 duration, frame count, dimensions, codec and pixel format with ffprobe. Video intentionally contains no audio.
