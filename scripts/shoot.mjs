// Take a screenshot of the running app with the Chrome that is already installed.
//
//   node scripts/shoot.mjs <route> <out.png> [--w 1440] [--h 900] [--do "click:.btn;wait:800"] [--el ".scene"] [--full]
//
// <route> is the hash route, e.g. "/memory/knowledge/vector-db" ("/" is the home screen).
// --do runs a list of steps before the shot:  click:<selector> · wait:<ms> · hover:<selector> · key:<Key> · type:<text>
//      move:<x>,<y> · eval:<js> · clickn:<selector>,<index>
// --el screenshots just one element. Console errors are printed, and make the exit code 1.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const route = args[0] ?? '/';
const out = resolve(args[1] ?? 'shots/shot.png');
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const base = process.env.XRAY_URL ?? 'http://localhost:5177/';
const width = Number(flag('w', 1440));
const height = Number(flag('h', 900));
const steps = (flag('do', '') || '').split(';').map((s) => s.trim()).filter(Boolean);
const el = flag('el', null);
const store = flag('store', null); // e.g. "session:agent-xray:xray-on=1"

mkdirSync(dirname(out), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--no-first-run'],
});
const errors = [];
try {
  const page = await browser.newPage();
  // --phone makes it a touch screen, as on a real phone (390 × 844 unless --w and --h say otherwise).
  const phone = has('phone');
  await page.setViewport({
    width: phone && !args.includes('--w') ? 390 : width,
    height: phone && !args.includes('--h') ? 844 : height,
    deviceScaleFactor: Number(flag('dpr', phone ? 2 : 1)),
    isMobile: phone,
    hasTouch: phone,
  });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  if (store) {
    await page.evaluateOnNewDocument((spec) => {
      for (const item of spec.split('|')) {
        const [where, rest] = [item.slice(0, item.indexOf(':')), item.slice(item.indexOf(':') + 1)];
        const [k, v] = rest.split('=');
        (where === 'session' ? sessionStorage : localStorage).setItem(k, v);
      }
    }, store);
  }

  await page.goto(`${base}#${route}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, Number(flag('settle', 700))));

  for (const step of steps) {
    const i = step.indexOf(':');
    const [verb, arg] = i === -1 ? [step, ''] : [step.slice(0, i), step.slice(i + 1)];
    if (verb === 'click') await page.click(arg);
    else if (verb === 'clickn') {
      const [sel, n] = [arg.slice(0, arg.lastIndexOf(',')), Number(arg.slice(arg.lastIndexOf(',') + 1))];
      const all = await page.$$(sel);
      if (!all[n]) throw new Error(`clickn: no element ${n} for ${sel} (found ${all.length})`);
      await all[n].click();
    } else if (verb === 'clicktext') {
      const ok = await page.evaluate((text) => {
        const node = [...document.querySelectorAll('button, a, [role=button], [role=switch], [role=tab]')].find((b) => b.textContent.trim().includes(text));
        if (node) node.click();
        return !!node;
      }, arg);
      if (!ok) throw new Error(`clicktext: nothing says "${arg}"`);
    } else if (verb === 'wait') await new Promise((r) => setTimeout(r, Number(arg)));
    else if (verb === 'hover') await page.hover(arg);
    else if (verb === 'key') await page.keyboard.press(arg);
    else if (verb === 'type') await page.keyboard.type(arg);
    else if (verb === 'move') {
      const [x, y] = arg.split(',').map(Number);
      await page.mouse.move(x, y);
    } else if (verb === 'eval') await page.evaluate(arg);
    else throw new Error(`unknown step: ${step}`);
  }

  if (el) {
    const node = await page.$(el);
    if (!node) throw new Error(`no element matches ${el}`);
    await node.screenshot({ path: out });
  } else {
    await page.screenshot({ path: out, fullPage: has('full') });
  }
  console.log(`saved ${out}`);
} finally {
  await browser.close();
}
if (errors.length) {
  console.error(`console errors (${errors.length}):\n` + [...new Set(errors)].slice(0, 12).join('\n'));
  process.exit(1);
}
