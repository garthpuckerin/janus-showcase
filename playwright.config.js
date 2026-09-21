/* Playwright config for the axe-core WCAG gate (e2e/accessibility.spec.js).
   The sweeps under scripts/ manage their own build+preview lifecycle by hand
   (house style: build once, `vite preview --strictPort`, kill in `finally`);
   this config does the same thing through Playwright's own `webServer`
   option so `playwright test` is a single, self-contained command. Builds to
   its own `dist-e2e` (gitignored) and previews on its own port, 4295 — every
   other local sweep already owns 4288/4289/4291/4293, so this stays clear of
   all of them when run alongside `npm run test:release`. */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4295;
const OUT_DIR = 'dist-e2e';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // The real iPhone 13 device descriptor (WebKit engine, touch, device
      // scale factor) — not a Chromium viewport pretending to be a phone.
      // Both `webkit` and `chromium` are already installed locally (the
      // sweeps under scripts/ launch chromium directly); if WebKit is ever
      // missing in a given environment, override this project's `use` with
      // `{ ...devices['iPhone 13'], defaultBrowserType: undefined,
      // browserName: 'chromium' }` to fall back to the already-installed browser.
      name: 'iPhone 13',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: `node node_modules/vite/bin/vite.js build --outDir ${OUT_DIR} --logLevel error && node node_modules/vite/bin/vite.js preview --outDir ${OUT_DIR} --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
