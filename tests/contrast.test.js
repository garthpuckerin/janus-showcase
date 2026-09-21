/* WCAG contrast gate (docs/DESIGN-SYSTEM.md): every ink/status pairing the
 * contract lists must clear its threshold, in BOTH themes. Parses the actual
 * values out of tokens.css rather than hand-copying them, so this fails the
 * moment a value drifts without the contrast being re-checked. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_FILE = join(__dirname, '..', 'src', 'styles', 'tokens.css');

function parseCustomProperties(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockMatch = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`, 's'));
  const props = new Map();
  for (const line of blockMatch[1].split('\n')) {
    const propMatch = line.match(/(--[a-z0-9-]+)\s*:\s*([^;]+);/i);
    if (propMatch) props.set(propMatch[1], propMatch[2].trim());
  }
  return props;
}

function buildPalette() {
  const css = readFileSync(TOKENS_FILE, 'utf8');
  const root = parseCustomProperties(css, ':root');
  const dark = parseCustomProperties(css, '[data-theme="dark"]');
  return {
    light: root,
    dark: new Map([...root, ...dark]),
  };
}

// --- WCAG 2.x relative luminance / contrast ratio ---
function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const int = parseInt(full.slice(0, 6), 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function channelLuminance(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolve(palette, name) {
  const value = palette.get(name);
  assert.ok(value, `missing token ${name} in this theme's palette`);
  return value;
}

function checkPair(palette, themeName, fgName, bgName, minRatio) {
  const fg = resolve(palette, fgName);
  const bg = resolve(palette, bgName);
  const ratio = contrastRatio(fg, bg);
  assert.ok(
    ratio >= minRatio,
    `[${themeName}] ${fgName} on ${bgName} = ${ratio.toFixed(2)}:1, needs >= ${minRatio}:1 (fg ${fg} / bg ${bg})`,
  );
}

const STATUSES = ['positive', 'warning', 'danger', 'info', 'neutral'];

for (const [themeName, getPalette] of [
  ['light', () => buildPalette().light],
  ['dark', () => buildPalette().dark],
]) {
  test(`${themeName} theme: ink and ink-muted clear 4.5:1 on every light surface`, () => {
    const palette = getPalette();
    for (const bg of ['--color-canvas', '--color-surface', '--color-surface-muted']) {
      checkPair(palette, themeName, '--color-ink', bg, 4.5);
      checkPair(palette, themeName, '--color-ink-muted', bg, 4.5);
    }
  });

  test(`${themeName} theme: ink-inverse and panel-muted clear 4.5:1 on the panel`, () => {
    const palette = getPalette();
    for (const bg of ['--color-panel', '--color-panel-raised']) {
      checkPair(palette, themeName, '--color-ink-inverse', bg, 4.5);
      checkPair(palette, themeName, '--color-panel-muted', bg, 4.5);
    }
  });

  test(`${themeName} theme: accent-ink clears 4.5:1 on the accent fills`, () => {
    const palette = getPalette();
    checkPair(palette, themeName, '--color-accent-ink', '--color-accent', 4.5);
    checkPair(palette, themeName, '--color-accent-ink', '--color-accent-strong', 4.5);
  });

  /* The inverse pairing rule: an ink-filled control takes CANVAS text. The
     tempting pair — ink-inverse on ink — is white-on-white in dark, because
     ink-inverse stays light in both themes while ink flips. Caught in the
     browser on the active segmented button; pinned here so it cannot return. */
  test(`${themeName} theme: canvas text clears 4.5:1 on an ink fill`, () => {
    const palette = getPalette();
    checkPair(palette, themeName, '--color-canvas', '--color-ink', 4.5);
  });

  test(`${themeName} theme: accent-line clears 3:1 on canvas and surface`, () => {
    const palette = getPalette();
    checkPair(palette, themeName, '--color-accent-line', '--color-canvas', 3);
    checkPair(palette, themeName, '--color-accent-line', '--color-surface', 3);
  });

  test(`${themeName} theme: every status -text clears 4.5:1 on its own -soft and on surface`, () => {
    const palette = getPalette();
    for (const status of STATUSES) {
      checkPair(palette, themeName, `--color-${status}-text`, `--color-${status}-soft`, 4.5);
      checkPair(palette, themeName, `--color-${status}-text`, '--color-surface', 4.5);
    }
  });
}
