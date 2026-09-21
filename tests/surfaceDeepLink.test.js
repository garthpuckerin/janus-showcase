/* Deep-link gate. Found in review by opening `/?d=<id>` on a phone: it showed
   the Attention list, not the decision — the story only opened under
   `view=decisions`, and a bare link lands on the phone's default view. The
   sweep missed it because it reaches decisions by tapping cards. Case-study
   and shared links use exactly the bare form. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionShowsDecision, resolveRoute } from '../src/utils/surface.js';
import { DESK_ONLY_VIEWS } from '../src/constants/surfaces.js';

const PHONE_DEFAULT = 'attention';

test('a bare deep link (?d=id, no view) opens the story on the phone', () => {
  const view = resolveRoute({ rawView: null, fallback: PHONE_DEFAULT });
  assert.equal(view, PHONE_DEFAULT);
  assert.equal(companionShowsDecision({ view, selectedId: 'lead-activates' }), true);
});

test('the story opens from either list screen', () => {
  for (const view of ['attention', 'decisions']) {
    assert.equal(companionShowsDecision({ view, selectedId: 'x' }), true, view);
  }
});

test('an explicit other tab wins over a stale decision id', () => {
  for (const view of ['advisor', 'matrix', ...DESK_ONLY_VIEWS]) {
    assert.equal(companionShowsDecision({ view, selectedId: 'x' }), false, view);
  }
});

test('no id, no story', () => {
  for (const selectedId of [null, undefined, '']) {
    assert.equal(companionShowsDecision({ view: 'decisions', selectedId }), false);
  }
});
