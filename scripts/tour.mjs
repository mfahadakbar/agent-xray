// Smoke test: open pages of the running app in one browser session, optionally click through
// them, screenshot each, and fail if anything logs an error.
//
//   node scripts/tour.mjs                 visit every box on the map
//   node scripts/tour.mjs plan.json       run a plan: [{ "route": "/memory", "name": "memory", "do": "clicktext:Next;wait:500", "el": ".scene" }]
//
// Steps: click:<selector> · clickn:<selector>,<index> · clicktext:<text> · wait:<ms> · key:<Key> · range:<value>
//        move:<x>,<y> · eval:<js>
// PHONE=1 makes the window a phone (390 × 844, touch). W, H and DPR change its size.
// FIT=1 also fails a page when something is cut: a piece outside its stage, clipped words, a page wider than the window.
//
// Shots go to shots/tour/. Uses the same step language as shoot.mjs.
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = process.env.XRAY_URL ?? 'http://localhost:5177/';
const outDir = resolve(process.env.XRAY_SHOTS ?? 'shots/tour');
mkdirSync(outDir, { recursive: true });
const planFile = process.argv[2];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--no-first-run'],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * FIT=1: is anything cut? Runs in the page. It finds pieces that stick out of a scene's stage, text that is
 * clipped by its own box, and a page that is wider than the window.
 */
function fit() {
  const out = [];
  const say = (el) => `${(el.className.baseVal ?? el.className).toString().split(' ').filter(Boolean).slice(0, 2).join('.') || el.tagName}"${el.textContent.trim().slice(0, 22)}"`;
  const wide = document.documentElement.scrollWidth - window.innerWidth;
  if (wide > 1) out.push(`page is ${wide}px wider than the window`);
  // Anything that crosses the left or right edge of the screen. (A page that hides its overflow does not
  // scroll sideways, so the check above cannot see this.) Things inside a stage are checked below, and a
  // few boxes are meant to scroll inside themselves.
  const vw = window.innerWidth;
  for (const el of document.querySelectorAll('main *')) {
    if (el.closest('.stage, .code, .atlas') || el.closest('defs')) continue;
    if (el instanceof SVGElement && !el.matches('.leg, .packet, .print, .pill, .part, .chart-svg')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const over = Math.max(-r.left, r.right - vw);
    if (over > 1) out.push(`off the screen by ${Math.round(over)}px: ${say(el)}`);
  }
  // the caption and the controls under a scene: nothing may stick out of the scene's box
  const scene = document.querySelector('.scene');
  if (scene) {
    const box = scene.getBoundingClientRect();
    for (const el of scene.querySelectorAll('.scene-bar *')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > box.right + 1 || r.left < box.left - 1)) out.push(`controls stick out: ${say(el)}`);
    }
    if (scene.scrollLeft > 0) out.push('the scene has been pushed sideways');
  }
  const stage = document.querySelector('.stage');
  if (!stage) return out;
  const s = stage.getBoundingClientRect();
  for (const el of stage.querySelectorAll('.at:not(.is-hidden)')) {
    if (+getComputedStyle(el).opacity < 0.05) continue;
    for (const box of el.children.length ? el.children : [el]) {
      const r = box.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const over = Math.max(s.left - r.left, r.right - s.right, s.top - r.top, r.bottom - s.bottom);
      if (over > 1.5) out.push(`out by ${Math.round(over)}px: ${say(box)}`);
    }
  }
  for (const el of stage.querySelectorAll('.at:not(.is-hidden) *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'inline') continue;
    const clipsX = cs.overflowX !== 'visible';
    const clipsY = cs.overflowY !== 'visible';
    if (clipsX && el.scrollWidth - el.clientWidth > 1.5) out.push(`text cut: ${say(el)}`);
    else if (clipsY && el.scrollHeight - el.clientHeight > 1.5) out.push(`text cut below: ${say(el)}`);
  }
  return [...new Set(out)].slice(0, 6);
}
let failures = 0;

async function act(page, steps) {
  for (const step of steps) {
    const i = step.indexOf(':');
    const [verb, arg] = i === -1 ? [step, ''] : [step.slice(0, i), step.slice(i + 1)];
    if (verb === 'wait') await sleep(Number(arg));
    else if (verb === 'click') await page.click(arg);
    else if (verb === 'clicktext') {
      const ok = await page.evaluate((text) => {
        const node = [...document.querySelectorAll('button, a, [role=button], [role=switch], [role=tab]')].find((b) => b.textContent.trim().includes(text) && !b.disabled);
        if (node) node.click();
        return !!node;
      }, arg);
      if (!ok) throw new Error(`nothing clickable says "${arg}"`);
    } else if (verb === 'range') {
      // range:<value>  sets the first slider on the page
      await page.evaluate((v) => {
        const input = document.querySelector('input[type=range]');
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        set.call(input, v);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, arg);
    } else if (verb === 'move') {
      const [x, y] = arg.split(',').map(Number);
      await page.mouse.move(x, y);
    } else if (verb === 'key') await page.keyboard.press(arg);
    else if (verb === 'clickn') {
      // clickn:<selector>,<index>  clicks the nth element that matches
      const cut = arg.lastIndexOf(',');
      const ok = await page.evaluate((sel, n) => {
        const el = document.querySelectorAll(sel)[n];
        if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return !!el;
      }, arg.slice(0, cut), Number(arg.slice(cut + 1)));
      if (!ok) throw new Error(`no element for ${arg}`);
    } else if (verb === 'eval') await page.evaluate(arg);
    else throw new Error(`unknown step: ${step}`);
  }
}

try {
  const page = await browser.newPage();
  // W, H and DPR set the window. PHONE=1 also makes it a touch screen, as on a real phone.
  const phone = process.env.PHONE === '1';
  await page.setViewport({
    width: Number(process.env.W ?? (phone ? 390 : 1440)),
    height: Number(process.env.H ?? (phone ? 844 : 900)),
    deviceScaleFactor: Number(process.env.DPR ?? (phone ? 2 : 1)),
    isMobile: phone,
    hasTouch: phone,
  });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.setItem('agent-xray:xray-on', '1');
    } catch {
      /* about:blank has no storage */
    }
  });
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  let plan;
  if (planFile) plan = JSON.parse(readFileSync(planFile, 'utf8'));
  else {
    // Every route, read from the map itself (the Atlas lists them all).
    await page.keyboard.press('/');
    await sleep(400);
    const count = await page.$$eval('.atlas-row', (rows) => rows.length);
    const routes = [];
    for (let i = 0; i < count; i++) {
      await page.evaluate((n) => document.querySelectorAll('.atlas-row')[n].click(), i);
      await sleep(30);
      routes.push(await page.evaluate(() => location.hash.slice(1)));
      await page.keyboard.press('/');
      await sleep(60);
    }
    await page.keyboard.press('Escape');
    plan = routes.map((route) => ({ route, name: route.slice(1).replaceAll('/', '--'), shot: false }));
    console.log(`visiting ${plan.length} routes`);
  }

  for (const item of plan) {
    errors.length = 0;
    const tag = item.name ?? item.route;
    try {
      if (planFile) {
        // A plan may visit the same page twice in different states, so each item starts from a fresh load.
        await page.goto('about:blank');
        await page.goto(`${base}#${item.route}`, { waitUntil: 'networkidle0' });
      } else await page.evaluate((r) => (location.hash = r), item.route);
      await sleep(item.settle ?? 450);
      if (item.do) await act(page, item.do.split(';').map((s) => s.trim()).filter(Boolean));
      if (item.shot !== false) {
        const file = resolve(outDir, `${tag}.png`);
        if (item.el) {
          const node = await page.$(item.el);
          if (!node) throw new Error(`no element ${item.el}`);
          await node.screenshot({ path: file });
        } else await page.screenshot({ path: file });
      }
      const broken = await page.evaluate(() => {
        const title = document.querySelector('.room-head h1, .intro h1, .chart');
        return title ? '' : 'page has no title or chart';
      });
      if (broken) throw new Error(broken);
      if (process.env.FIT === '1') {
        const cut = await page.evaluate(fit);
        if (cut.length) {
          failures++;
          console.error(`✗ ${tag}: ${cut.join(' · ')}`);
        }
      }
      if (errors.length) throw new Error(`console: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);
    } catch (e) {
      failures++;
      console.error(`✗ ${tag}: ${e.message}`);
    }
  }
  console.log(failures ? `${failures} problem(s)` : `ok: ${plan.length} pages, no errors`);
} finally {
  await browser.close();
}
process.exit(failures ? 1 : 0);
