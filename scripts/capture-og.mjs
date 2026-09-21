#!/usr/bin/env node
// Capture Janus's own Open Graph card (public/og.png). Ported from
// dreamcatcher-showcase/scripts/capture-og.mjs: local `dist/` is the default
// server, so the card always matches the build about to ship — run
// `npm run build` first, then this, before committing.
//
//   npm run build && node scripts/capture-og.mjs
//   OG_URL=https://garthpuckerin-janus.vercel.app node scripts/capture-og.mjs
//
// The card is the Decisions ledger, dark theme, the desktop shell (the
// workstation breakpoint is 1024px — 1200px viewport width clears it) —
// the operator console's own primary screen, not a gray box. Captured at a
// 1200×630 viewport at deviceScaleFactor 2 (2400×1260 pixels): dreamcatcher's
// version renders at full desktop width (1440) and resizes down with
// `sharp`; this repo does not have `sharp` installed, and the build brief's
// fallback is to screenshot directly at the target viewport instead of
// adding a new dependency for one script. 1200px is still comfortably past
// the workstation breakpoint, so the real desktop shell renders, not a
// squeezed layout.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const out = path.resolve(repoRoot, 'public', 'og.png');

let server = null;
let base = process.env.OG_URL?.replace(/\/$/, '');
if (!base) {
  server = await preview({ root: repoRoot, preview: { host: '127.0.0.1', port: 0 } });
  base = server.resolvedUrls.local[0].replace(/\/$/, '');
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('janus:entered', '1');
      localStorage.setItem('janus:onboarded', 'done');
    } catch {
      /* Storage blocked — nothing to seed. */
    }
  });
  await page.goto(`${base}/?view=decisions&theme=dark`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.app-sidebar', { timeout: 15000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
  await mkdir(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: false });
  console.log(`wrote ${path.relative(repoRoot, out)} (2400×1260 @2x) from ${base}`);
} finally {
  await browser.close();
  if (server) await server.close();
}
