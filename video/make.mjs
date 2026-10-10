// Make the intro video for Agent Xray.
//
//   npm run build && node video/make.mjs      →  video/out/agent-xray-linkedin.mp4  (1080 × 1350, 30 fps)
//
// It opens video/stage.html in the Chrome that is already installed. The stage shows the real app
// (dist/index.html) in a frame, and this script plays the app like a person would: it moves a pointer,
// clicks, drags, changes the headline and moves the camera. Chrome hands over every frame it draws,
// with a time stamp, and ffmpeg turns those frames into the video.
//
// Two things make the edit possible without an editor: the recorder can be paused (a cut), and it can
// run fast (`rec.speed`), which shortens a stretch of footage without touching the app.
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createReadStream, linkSync, mkdirSync, rmSync, writeFile, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = join(here, 'out');
const raw = join(out, 'raw');
const seq = join(out, 'seq');

const FPS = 30;
/** When the last card comes up, in seconds. Only the progress bar uses it: the bar is full at that moment. */
const TOTAL = Number(process.env.TOTAL ?? 54.9);
const SCREEN = { x: 28, y: 300, w: 1024, h: 768 }; // where the app shows on the stage
const APP = { w: 1440, h: 1080 }; // the size the app thinks its window is
const FULL = { x: 0, y: 0, w: APP.w, h: APP.h };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── a tiny server: the stage, the built app and two fonts ────────────────────────────────────────
const fonts = join(root, 'node_modules/@fontsource-variable');
const FILES = {
  '/': [join(here, 'stage.html'), 'text/html; charset=utf-8'],
  '/app/': [join(root, 'dist/index.html'), 'text/html; charset=utf-8'],
  '/fonts/fredoka.woff2': [join(fonts, 'fredoka/files/fredoka-latin-wght-normal.woff2'), 'font/woff2'],
  '/fonts/nunito.woff2': [join(fonts, 'nunito/files/nunito-latin-wght-normal.woff2'), 'font/woff2'],
};
const server = http.createServer((req, res) => {
  const path = (req.url ?? '/').split(/[?#]/)[0];
  if (path === '/favicon.ico') return void res.writeHead(204).end();
  const hit = FILES[path];
  if (!hit) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': hit[1], 'cache-control': 'no-store' });
  createReadStream(hit[0]).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

rmSync(out, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });
mkdirSync(seq, { recursive: true });

// ── the browser ──────────────────────────────────────────────────────────────────────────────────
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
});
const page = await browser.newPage();
// Drawn at twice the size and handed over at 1080 × 1350, so thin lines and small type stay clean.
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
const problems = [];
page.on('pageerror', (e) => problems.push(String(e)));
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
await page.goto(base, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
const app = page.frames().find((f) => f.url().includes('/app/'));
if (!app) throw new Error('the app did not load in the stage');
// The headline above the screen asks the question, so the app's own copy of it steps aside for the opening shot.
await app.addStyleTag({ content: '.intro, .intro-hint, .home-foot { opacity: 0 !important; }' });

const st = (fn, ...args) => page.evaluate((fn, args) => window.stage[fn](...args), fn, args);

// ── the recorder ─────────────────────────────────────────────────────────────────────────────────
const cdp = await page.createCDPSession();
const rec = { on: false, speed: 1, last: 0, t: 0, n: 0, list: [], writes: [], marks: [] };
cdp.on('Page.screencastFrame', (f) => {
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  if (!rec.on) return;
  const stamp = f.metadata.timestamp;
  if (rec.last) rec.t += Math.max(0, stamp - rec.last) / rec.speed;
  rec.last = stamp;
  const file = join(raw, `${String(rec.n++).padStart(6, '0')}.jpg`);
  rec.writes.push(new Promise((done) => writeFile(file, Buffer.from(f.data, 'base64'), done)));
  rec.list.push({ t: rec.t, file });
});
const roll = () => {
  rec.last = 0; // the time spent paused is not part of the video
  rec.on = true;
};
const pause = () => {
  rec.on = false;
};
const mark = (name) => {
  rec.marks.push({ name, at: Number(rec.t.toFixed(2)) });
  console.log(`  ${rec.t.toFixed(1).padStart(5)}s  ${name}`);
};
// The progress bar moves all the time, which also keeps Chrome drawing a steady stream of frames.
const ticker = setInterval(() => rec.on && st('progress', rec.t / TOTAL).catch(() => {}), 100);

// ── the camera ───────────────────────────────────────────────────────────────────────────────────
let cam = { s: SCREEN.w / APP.w, tx: 0, ty: 0 };
function fit(r) {
  const s = Math.min(SCREEN.w / r.w, SCREEN.h / r.h);
  const keep = (v, size, win) => (size * s <= win ? (win - size * s) / 2 : Math.min(0, Math.max(win - size * s, v)));
  return { s, tx: keep((SCREEN.w - r.w * s) / 2 - r.x * s, APP.w, SCREEN.w), ty: keep((SCREEN.h - r.h * s) / 2 - r.y * s, APP.h, SCREEN.h) };
}
/** Frame a rectangle of the app (in the app's own pixels). */
async function camTo(r, ms = 900) {
  cam = fit(r);
  await st('camera', cam.tx, cam.ty, cam.s, ms);
}
const toStage = (x, y) => [SCREEN.x + cam.tx + x * cam.s, SCREEN.y + cam.ty + y * cam.s];

// ── looking at the app ───────────────────────────────────────────────────────────────────────────
const find = (sel, { text = null, nth = 0 } = {}) =>
  app.evaluate(
    (sel, text, nth) => {
      let all = [...document.querySelectorAll(sel)];
      if (text) all = all.filter((e) => e.textContent.includes(text));
      const el = all[nth];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    },
    sel,
    text,
    nth,
  );
async function rectOf(sel, opts) {
  const r = await find(sel, opts);
  if (!r) throw new Error(`nothing in the app matches ${sel}${opts?.text ? ` with "${opts.text}"` : ''}`);
  return r;
}
/** Press something without showing the pointer (used where the video plays the app by itself). */
const tap = (sel, { text = null, nth = 0 } = {}) =>
  app.evaluate(
    (sel, text, nth) => {
      let all = [...document.querySelectorAll(sel)];
      if (text) all = all.filter((e) => e.textContent.includes(text));
      all[nth]?.click();
      return !!all[nth];
    },
    sel,
    text,
    nth,
  );
/**
 * Scroll the app so an element sits at the top (plus `gap`) or in the middle of its window.
 * Not scrollIntoView: that also tries to scroll the stage around the app.
 */
const scrollToEl = (sel, { where = 'center', gap = 80, smooth = false } = {}) =>
  app.evaluate(
    (sel, where, gap, smooth) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const top = where === 'start' ? window.scrollY + r.top - gap : window.scrollY + r.top - (window.innerHeight - r.height) / 2;
      window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
    },
    sel,
    where,
    gap,
    smooth,
  );
const go = async (hash) => {
  await app.evaluate((h) => {
    window.location.hash = h;
  }, hash);
  await sleep(520);
};

// ── the pointer ──────────────────────────────────────────────────────────────────────────────────
let cur = { x: 900, y: 1010 };
async function glide(x, y, ms = 520) {
  const from = { ...cur };
  const t0 = performance.now();
  for (;;) {
    const k = Math.min(1, (performance.now() - t0) / ms);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    cur = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
    await Promise.all([st('cursor', cur.x, cur.y), page.mouse.move(cur.x, cur.y)]);
    if (k >= 1) return;
    await sleep(6);
  }
}
async function clickAt(x, y, ms = 520) {
  await glide(x, y, ms);
  await st('press', true);
  await st('ripple', x, y);
  await page.mouse.down();
  await sleep(70);
  await page.mouse.up();
  await st('press', false);
}
async function clickOn(sel, { ms = 520, fx = 0.5, fy = 0.5, ...opts } = {}) {
  const r = await rectOf(sel, opts);
  const [x, y] = toStage(r.x + r.w * fx, r.y + r.h * fy);
  await clickAt(x, y, ms);
}
async function hover(sel, opts = {}) {
  const r = await rectOf(sel, opts);
  await glide(...toStage(r.x + r.w / 2, r.y + r.h / 2), opts.ms ?? 480);
}

// ── a journey through Ray, played briskly ────────────────────────────────────────────────────────
const beatNo = () => app.evaluate(() => parseInt(document.querySelector('.beat-no')?.textContent ?? '0', 10));
const packet = () => app.evaluate(() => document.querySelector('.packet')?.getAttribute('transform') ?? '');
/** Wait until the travelling message has landed. */
async function landed(timeout = 4000) {
  const t0 = Date.now();
  await sleep(130);
  while (Date.now() - t0 < timeout) {
    const a = await packet();
    await sleep(70);
    if (a && a === (await packet())) return;
  }
}
/**
 * Step a story forward to stop number `n`, pausing `hold` ms at every stop.
 * Above the picture, the rail of numbers fills up and one line names the part that is acting,
 * a moment before the message gets there.
 */
async function playTo(n, hold, stops) {
  const show = async (at) => {
    const [part, text] = stops[at - 1];
    await st('rail', n, at, COLOR[part]);
    await st('say', part, text, COLOR[part]);
  };
  for (let at = 1; ; at++) {
    if (at > 1) await show(at);
    await landed();
    if (at === 1) await show(1);
    await sleep(at === 1 ? hold + 260 : hold);
    if (at >= n) return;
    await tap('[aria-label="Next step"]');
  }
}
/** Rush through the rest of a story. */
async function fastForward(gap = 140) {
  for (let i = 0; i < 60; i++) {
    const more = await app.evaluate(() => {
      const next = document.querySelector('[aria-label="Next step"]');
      if (!next || next.disabled) return false;
      next.click();
      return true;
    });
    if (!more) return;
    await sleep(gap);
  }
}

/** A cut: dip to dark, do something off camera, come back. The time off camera is not in the video. */
async function cut(offCamera) {
  await st('dip', true, 130);
  await sleep(170);
  pause();
  await offCamera();
  await sleep(80);
  roll();
  await st('dip', false, 220);
}
/** The scene of the room that is open, filling the screen. */
async function frameScene(ms = 0) {
  await scrollToEl('.scene');
  await sleep(60);
  await camTo(await rectOf('.scene'), ms);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// The video
// ═════════════════════════════════════════════════════════════════════════════════════════════════

// Where the camera can stand (rectangles of the app, in the app's own pixels).
const chart = await rectOf('.chart-svg');
const u = chart.w / 1200; // one unit of Ray's drawing, in app pixels
const ray = (x, y, w, h) => ({ x: chart.x + (300 + x) * u, y: chart.y + y * u, w: w * u, h: h * u });
const RAY = ray(-50, -6, 700, 730); // all of Ray, for the opening shot
const HOME = { x: 44, y: 58, w: APP.w - 88, h: APP.h - 58 }; // the whole home screen
const ROOM = { x: 50, y: 62, w: 827, h: 620 }; // the main column of an opened part

// The colour of each part, as in the app.
const COLOR = { Senses: '#ffd75e', Shield: '#2fd6c5', Memory: '#5aa9ff', Brain: '#ff8fd0', Hands: '#5fe3a1', Heart: '#ff6b6b', 'Check-up': '#b8e986' };
// What the line above the picture says at each stop: the part, and what it does. Short, so it can be read in a second.
const MESSAGE = [
  ['Senses', 'hear your question'],
  ['Shield', 'is it safe? Yes'],
  ['Memory', 'adds what it knows'],
  ['Brain', '“I need a tool!”'],
  ['Hands', 'use the weather tool'],
  ['Heart', 'round the loop'],
  ['Brain', '“Now I know.”'],
  ['Shield', 'checks the answer'],
  ['Senses', 'Ray answers'],
];
const JOB = [
  ['Senses', 'hear the job'],
  ['Shield', 'may it read the data?'],
  ['Brain', '“I must not guess.”'],
  ['Hands', 'ask the database'],
  ['Heart', 'round the loop'],
  ['Brain', 'writes a small program'],
  ['Hands', 'run it in a safe box'],
  ['Check-up', 'tests the answer'],
  ['Senses', 'real numbers, in a table'],
];

const SHOTS = [
  [
    'the question',
    async () => {
      await sleep(1450);
      await tap('button', { text: 'Turn on the X-ray' });
      await sleep(360);
      await st('caption', 'We put one under<br />the <em>X-ray.</em>');
      await sleep(900);
      await camTo(HOME, 1500);
      await sleep(1650);
    },
  ],
  [
    'ten parts',
    async () => {
      await st('caption', '<em>10 parts.</em><br />Every agent has them.');
      await st('cursorOn', true);
      for (const id of ['brain', 'heart', 'hands']) {
        await hover(`[data-organ="${id}"] .organ-hit`, { ms: 380 });
        await sleep(300);
      }
    },
  ],
  [
    'a message travels',
    async () => {
      // The whole playground stays in the picture: Ray, the card that pops up at every stop, and the caption below.
      await st('title', 'Watch a message <em>travel.</em>', { rail: [9, 0], say: ['You', '“What’s the weather in Paris?”', '#ffffff'] });
      await clickOn('.chip-ask', { nth: 0, ms: 520 });
      await st('cursorOn', false);
      rec.speed = 1.35;
      await playTo(9, 300, MESSAGE);
      await sleep(1300);
      rec.speed = 1;
    },
  ],
  [
    'switch a part off',
    async () => {
      await st('title', 'Now switch the hands <em>off.</em>', { say: ['Hands', 'are its tools', COLOR.Hands] });
      await st('cursorOn', true);
      await clickOn('.switches .switch', { text: 'Hands', ms: 620 });
      await st('say', 'Hands: off', 'Same question. No tools.', '#ffd75e');
      await sleep(420);
      await st('cursorOn', false);
      await fastForward(130);
      await sleep(350);
      await st('title', 'Now it can only <em>guess.</em><br />That is what tools are for.', {});
      await sleep(2150);
    },
  ],
  [
    'a whole job',
    async () => {
      await st('title', 'Or give it a <em>whole job.</em>', { rail: [9, 0], say: ['Data analyst', '“How many orders last week?”', '#ffffff'] });
      await tap('[aria-label="Close the playground"]');
      await sleep(400);
      await st('cursorOn', true);
      await clickOn('.deck-tabs button', { text: 'Give Ray a job', ms: 420 });
      await sleep(360);
      await clickOn('.chip-job', { text: 'Data analyst', ms: 420 });
      await st('cursorOn', false);
      rec.speed = 1.5;
      await playTo(9, 290, JOB);
      await sleep(1500);
      rec.speed = 1;
    },
  ],
  [
    'go deeper',
    async () => {
      await st('title', 'Click any part.<br /><em>Go deeper.</em>', {});
      await tap('[aria-label="Close the playground"]');
      await sleep(650);
      await st('cursorOn', true);
      await clickOn('[data-organ="memory"] .organ-hit', { ms: 480 });
      // the app takes half a second to step into a room: that stretch plays faster
      rec.speed = 1.8;
      await sleep(260);
      await camTo(ROOM, 700);
      await sleep(700);
      rec.speed = 1;
      await sleep(450);
      // down to the boxes inside Memory, and into Knowledge
      await scrollToEl('.inside', { where: 'start', gap: 96, smooth: true });
      await sleep(600);
      await clickOn('a.kid[href="#/memory/knowledge"]', { ms: 420, fx: 0.3 });
      rec.speed = 1.8;
      await sleep(620);
      rec.speed = 1;
      await st('caption', 'Memory. Knowledge.<br /><em>Vector database.</em>');
      await sleep(250);
      await clickOn('.trip a[href="#/memory/knowledge/vector-db"]', { ms: 480 });
      rec.speed = 1.8;
      await sleep(620);
      rec.speed = 1;
      await frameScene(700);
      await sleep(560);
      await st('caption', 'Do not just read it.<br /><em>Play with it.</em>');
      // Drag the question across the map of meaning. The closest dots light up, in order.
      const map = await rectOf('.vm-touch');
      const at = (ux, uy) => toStage(map.x + (ux / 100) * map.w, map.y + (uy / 100) * map.w);
      await glide(...at(36, 29), 420);
      await st('press', true);
      await page.mouse.down();
      await glide(...at(19, 15), 760);
      await sleep(330);
      await glide(...at(56, 41), 900);
      await sleep(330);
      await glide(...at(17, 42), 850);
      await sleep(360);
      await page.mouse.up();
      await st('press', false);
    },
  ],
  [
    'real tools',
    async () => {
      await st('caption', '<em>327 real tools.</em><br />Open source, free or paid.');
      await st('cursorOn', false);
      await scrollToEl('#tools', { where: 'start', gap: 84, smooth: true });
      await sleep(420);
      await camTo({ ...ROOM, y: 66 }, 750);
      await sleep(1500);
    },
  ],
  [
    'scenes',
    async () => {
      await st('caption', '<em>58 scenes</em> to play with.<br />Every step numbered.');
      const montage = [
        { route: '#/friends/broadcast', press: 'Go', skip: 1500, show: 3500, speed: 1.85 },
        { route: '#/shield', press: 'Send', skip: 450, show: 2600, speed: 1.5 },
        { route: '#/senses/structured', press: 'Tidy it into boxes', skip: 250, show: 2900, speed: 1.7 },
      ];
      for (const m of montage) {
        await cut(async () => {
          await go(m.route);
          await frameScene(0);
          await tap('.scene button', { text: m.press });
          await sleep(m.skip);
        });
        rec.speed = m.speed;
        await sleep(m.show);
        rec.speed = 1;
      }
    },
  ],
  [
    'the whole map',
    async () => {
      await cut(async () => {
        await go('#/');
        await camTo(FULL, 0);
        await sleep(300);
      });
      await st('caption', 'The whole map.<br /><em>135 boxes.</em>');
      await st('cursorOn', true);
      await clickOn('.top-btn', { text: 'Whole map', ms: 480 });
      await st('cursorOn', false);
      await sleep(650);
      // lean in, so the boxes can be read
      const panel = await rectOf('.atlas-panel');
      await camTo({ x: panel.x, y: panel.y, w: 860, h: 645 }, 1700);
      await sleep(1800);
    },
  ],
  [
    'give it a star',
    async () => {
      await st('end', true);
      await sleep(4400);
    },
  ],
];

// ── one still of Ray, half X-rayed: for the last card and for the poster ─────────────────────────
// Run the scan once off camera, stop the clock half way, and cut Ray out with no background.
{
  const alone = await app.addStyleTag({
    content: 'html, body { background: transparent !important; } .backdrop, .top, .deck, .chart-svg g.part { visibility: hidden !important; }',
  });
  await st('bare', true);
  await camTo(RAY, 0);
  await tap('button', { text: 'Turn on the X-ray' });
  await sleep(1400); // the beam is at Ray's belly: head and heart are X-rayed, arms and legs are not yet
  const png = await page.screenshot({ clip: { x: SCREEN.x + 150, y: SCREEN.y, width: 724, height: SCREEN.h }, omitBackground: true, encoding: 'base64' });
  await sleep(1900); // let the scan finish
  await tap('.top-xray'); // and switch it off again: back to the start page
  await sleep(500);
  await alone.evaluate((el) => el.remove());
  await st('bare', false);
  await st('still', `data:image/png;base64,${png}`);

  // The poster: the question, and Ray half X-rayed. A picture to use as the video's thumbnail.
  await st('caption', 'How does an AI agent<br /><em>really</em> work?');
  await st('dip', true, 0);
  await st('showStill', true);
  await sleep(350);
  await page.screenshot({ path: join(out, 'poster.jpg'), type: 'jpeg', quality: 93 });
  await st('showStill', false);
  await st('dip', false, 0);
  await sleep(250);
}

// FROM=6 starts at the sixth shot (for working on one part of the video without waiting for the rest).
const FROM = Number(process.env.FROM ?? 1);
const UNTIL = Number(process.env.UNTIL ?? SHOTS.length);
await st('cursor', cur.x, cur.y);
if (FROM > 1) {
  await tap('button', { text: 'Turn on the X-ray' });
  await sleep(3200);
  await camTo(HOME, 0);
  await st('caption', '…');
} else {
  await camTo(RAY, 0);
  await st('caption', 'How does an AI agent<br /><em>really</em> work?');
}
await sleep(700);

await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 96, everyNthFrame: 1 });
await sleep(300);
console.log('recording…');
roll();
try {
  for (let i = FROM - 1; i < UNTIL; i++) {
    mark(`${i + 1} ${SHOTS[i][0]}`);
    await SHOTS[i][1]();
  }
} catch (err) {
  pause();
  await page.screenshot({ path: join(out, 'stopped-here.png') });
  console.log('stopped:', err.message, '| the app was at', await app.evaluate(() => window.location.hash));
  await browser.close();
  server.close();
  process.exit(1);
}
pause();
mark('end');

// ── from frames to a video ───────────────────────────────────────────────────────────────────────
clearInterval(ticker);
await cdp.send('Page.stopScreencast');
await Promise.all(rec.writes);
await browser.close();
server.close();
if (problems.length) console.log('the page reported:', problems.slice(0, 5));

// Chrome hands frames over when it draws them, so they are not evenly spaced. Pick, for every 30th of a
// second, the newest frame at that moment.
const frames = Math.ceil(rec.t * FPS);
let j = 0;
for (let k = 0; k < frames; k++) {
  while (j + 1 < rec.list.length && rec.list[j + 1].t <= k / FPS) j++;
  linkSync(rec.list[j].file, join(seq, `${String(k).padStart(6, '0')}.jpg`));
}
writeFileSync(join(out, 'timeline.json'), JSON.stringify({ seconds: Number(rec.t.toFixed(2)), framesFromChrome: rec.list.length, marks: rec.marks }, null, 2));
console.log(`${rec.list.length} frames from Chrome over ${rec.t.toFixed(1)}s → ${frames} frames at ${FPS} fps`);

const mp4 = join(out, 'agent-xray-linkedin.mp4');
const run = (args) =>
  new Promise((done, fail) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? done() : fail(new Error(`ffmpeg stopped with code ${code}`))));
  });
await run([
  '-framerate', String(FPS), '-i', join(seq, '%06d.jpg'),
  // a silent sound track: some players and sites expect a video to have one
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-shortest',
  // the frames are full-range JPEG; video wants limited-range BT.709
  '-vf', 'scale=1080:1350:in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level', '4.2',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
  '-c:a', 'aac', '-b:a', '128k',
  '-movflags', '+faststart',
  mp4,
]);
rmSync(raw, { recursive: true, force: true });
rmSync(seq, { recursive: true, force: true });
console.log(`done: ${mp4}`);
