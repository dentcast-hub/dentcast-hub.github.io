// Render a reel page (1080x1920) to MP4, frame by frame.
// The page exposes window.TOTAL (seconds) and async window.render(t).
// Usage (from the work directory that holds the page and its assets):
//   node <repo>/tools/reel/render.js reel.html out-silent.mp4        full render, 30 fps
//   node <repo>/tools/reel/render.js reel.html --stills 2.5 11 40    PNG stills with the safe-zone outline
const {chromium} = require('playwright');
const path = require('path');
const {spawn} = require('child_process');
(async () => {
  const [page, ...rest] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  await p.goto('file://' + path.resolve(page));
  await p.evaluate(() => document.fonts.ready);
  if (rest[0] === '--stills') {
    await p.evaluate(() => { const s = document.getElementById('safe'); if (s) s.style.display = 'block'; });
    for (const t of rest.slice(1).map(Number)) {
      await p.evaluate(t => window.render(t), t);
      await p.screenshot({path: `still-${t}.png`});
    }
  } else {
    const out = rest[0] || 'reel-silent.mp4';
    const T = await p.evaluate(() => window.TOTAL), fps = 30, N = Math.round(T * fps);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', out],
      {stdio: ['pipe', 'inherit', 'inherit']});
    for (let i = 0; i < N; i++) {
      await p.evaluate(t => window.render(t), i / fps);
      const buf = await p.screenshot({type: 'jpeg', quality: 92});
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await b.close();
})();
