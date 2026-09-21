import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MATRIX_PRESETS, presetIsActive } from '../src/components/matrix/matrixPresets.js';

test('a preset is active exactly when the controls hold its three settings', () => {
  for (const preset of MATRIX_PRESETS) {
    const settings = { routePresent: preset.routePresent, participation: preset.participation, adviseAllowed: preset.adviseAllowed };
    assert.equal(presetIsActive(preset, settings), true, preset.label);
    assert.equal(presetIsActive(preset, { ...settings, routePresent: !preset.routePresent }), false, `${preset.label} · route`);
    assert.equal(presetIsActive(preset, { ...settings, adviseAllowed: !preset.adviseAllowed }), false, `${preset.label} · advise`);
    assert.equal(presetIsActive(preset, { ...settings, participation: 'not-a-level' }), false, `${preset.label} · participation`);
  }
});

test('the model result is not part of a preset, so it never deactivates one', () => {
  const [preset] = MATRIX_PRESETS;
  const settings = { routePresent: preset.routePresent, participation: preset.participation, adviseAllowed: preset.adviseAllowed };
  assert.equal(presetIsActive(preset, { ...settings, modelResult: 'needs_input' }), true);
});

test('no two canonical presets are active at once (each button means one policy)', () => {
  for (const preset of MATRIX_PRESETS) {
    const settings = { routePresent: preset.routePresent, participation: preset.participation, adviseAllowed: preset.adviseAllowed };
    const active = MATRIX_PRESETS.filter((candidate) => presetIsActive(candidate, settings));
    assert.deepEqual(active.map((p) => p.key), [preset.key]);
  }
});