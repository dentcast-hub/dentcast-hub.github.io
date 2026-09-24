#!/usr/bin/env python3
"""Mux the real episode audio into the silent promo video.

usage: python3 add_audio.py dentopedia11.mp3 [video.mp4] [marks.json]
The video was recorded with a silent stand-in for the episode file (the Arvan
bucket is unreachable from the recording container), so the sound is laid in
afterwards on the exact timeline the recorder logged: the episode plays from
0:00 at the moment «پخش» is pressed, then jumps to the scrubbed position.
"""
import json, subprocess, sys, shutil
mp3 = sys.argv[1]
video = sys.argv[2] if len(sys.argv) > 2 else 'dentcast-search-demo.mp4'
m = json.load(open(sys.argv[3] if len(sys.argv) > 3 else 'marks.json'))
try:
    import imageio_ffmpeg; ff = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    ff = shutil.which('ffmpeg')
off = m['startWall'] - m['firstFrameWall']          # marks are relative to «start»
play = m['marks']['play'] + off
seeked = m['marks']['seeked'] + off
end = m['marks']['end'] + off
d1, d2, s = seeked - play, end - seeked, m['seekTarget']
fc = (f"[1:a]atrim=0:{d1:.3f},asetpts=PTS-STARTPTS,afade=t=out:st={d1-0.08:.3f}:d=0.08[a];"
      f"[1:a]atrim={s:.3f}:{s+d2:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.12,"
      f"afade=t=out:st={max(d2-2.2,0):.3f}:d=2.2[b];"
      f"[a][b]concat=n=2:v=0:a=1,adelay={int(play*1000)}:all=1,apad[out]")
out = video.replace('.mp4', '-audio.mp4')
subprocess.run([ff, '-y', '-i', video, '-i', mp3, '-filter_complex', fc,
                '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac',
                '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], check=True)
print('wrote', out)
