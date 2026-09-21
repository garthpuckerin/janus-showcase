/* The full desktop view on a small device. Found by the viewport sweep: asking
   for the desktop on a phone mounted the desktop components at 390px — the
   sidebar took the full width and content began 534px down a 664px screen.
   The desktop is now laid out at a desktop width and scaled to the screen. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVICE_VIEWPORT_CONTENT,
  FORCED_DESKTOP_LAYOUT_WIDTH,
  FORCED_DESKTOP_VIEWPORT_CONTENT,
  deviceWidth,
  isWorkstationWidth,
  viewportContentFor,
} from '../src/utils/surface.js';

test('the forced layout width is itself a workstation width', () => {
  assert.ok(isWorkstationWidth(FORCED_DESKTOP_LAYOUT_WIDTH));
  assert.match(FORCED_DESKTOP_VIEWPORT_CONTENT, new RegExp(`width=${FORCED_DESKTOP_LAYOUT_WIDTH}\\b`));
});

test('device width follows orientation, not the viewport meta', () => {
  // iOS reports the portrait screen size in both orientations.
  assert.equal(deviceWidth({ screenWidth: 390, screenHeight: 844, landscape: false }), 390);
  assert.equal(deviceWidth({ screenWidth: 390, screenHeight: 844, landscape: true }), 844);
  // Android swaps them; the answer must be the same.
  assert.equal(deviceWidth({ screenWidth: 844, screenHeight: 390, landscape: true }), 844);
  assert.equal(deviceWidth({ screenWidth: 844, screenHeight: 390, landscape: false }), 390);
});

test('an unknown screen never triggers the desktop layout width', () => {
  for (const bad of [{ screenWidth: 0, screenHeight: 0 }, { screenWidth: undefined, screenHeight: undefined }]) {
    const width = deviceWidth({ ...bad, landscape: false });
    assert.equal(viewportContentFor({ forced: true, deviceWidthPx: width }), DEVICE_VIEWPORT_CONTENT);
  }
});

test('forced on a phone or a portrait tablet → the desktop layout width', () => {
  for (const px of [390, 750, 768, 834, 1023]) {
    assert.equal(viewportContentFor({ forced: true, deviceWidthPx: px }), FORCED_DESKTOP_VIEWPORT_CONTENT, String(px));
  }
});

test('forced on a device that is already workstation-wide → untouched', () => {
  for (const px of [1024, 1194, 1440, 1920]) {
    assert.equal(viewportContentFor({ forced: true, deviceWidthPx: px }), DEVICE_VIEWPORT_CONTENT, String(px));
  }
});

test('not forced → always the device viewport, so clearing the choice restores the phone', () => {
  for (const px of [390, 768, 1440]) {
    assert.equal(viewportContentFor({ forced: false, deviceWidthPx: px }), DEVICE_VIEWPORT_CONTENT, String(px));
  }
});
