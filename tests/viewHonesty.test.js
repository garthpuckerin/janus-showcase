/* View-honesty gate: a view or component may never type a figure by hand —
   every number an operator sees has to be read off a domain module, a
   policy record or a scripted preset, not typed again at the point it's
   displayed. This scans SOURCE TEXT, not rendered output: it looks for a
   digit sequence immediately next to a literal "%" (a hand-typed
   percentage), and for a short list of figures this build plan calls out by
   name (a confidence value, "eleven"/"11 rows" for the matrix's row count,
   "six checks" for the pre-matrix gate). `advisorPresets.js` is a `.js` data
   module, not a view — it is where those confidence figures are allowed to
   live, so it is exempt. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../src');

const BANNED_LITERALS = ['0.65', '0.82', '0.5', '0.99', '11 rows', 'eleven', 'six checks'];
const PERCENT_ADJACENT_DIGIT = /\d\s*%|%\s*\d/;
// A quoted, purely-numeric CSS length like width="40%" is layout, not a
// claimed figure — strip those before checking for a hand-typed percentage.
const CSS_PERCENT_LENGTH = /(["'])\d{1,3}%\1/g;

function collectJsxFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectJsxFiles(full));
    else if (entry.name.endsWith('.jsx')) out.push(full);
  }
  return out;
}

test('no .jsx file under src/views or src/components hand-types a figure', () => {
  const dirs = [path.join(SRC, 'views'), path.join(SRC, 'components')];
  const files = dirs.flatMap((dir) => (fs.existsSync(dir) ? collectJsxFiles(dir) : []));
  assert.ok(files.length > 0, 'expected .jsx files to scan');

  for (const file of files) {
    const relative = path.relative(SRC, file);
    if (relative.endsWith('advisorPresets.js')) continue; // never true for .jsx, kept for clarity

    const text = fs.readFileSync(file, 'utf8');
    for (const literal of BANNED_LITERALS) {
      assert.ok(!text.includes(literal), `${relative} hand-types the banned figure "${literal}"`);
    }
    const withoutCssLengths = text.replace(CSS_PERCENT_LENGTH, '""');
    assert.ok(!PERCENT_ADJACENT_DIGIT.test(withoutCssLengths), `${relative} hand-types a percentage`);
  }
});
