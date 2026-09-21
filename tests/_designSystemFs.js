/* Shared, non-test helper for the design-system gates: walks a directory
 * tree collecting files by extension. Not a `*.test.js` file itself, so
 * `node --test` never tries to run it as a suite. */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function walk(dir, extensions) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      results.push(...walk(fullPath, extensions));
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Strip `/* ... *\/` block comments (valid in both CSS and JS/JSX) so
 * documentation prose explaining what the code avoids never trips the scan.
 * Deliberately does not strip `//` line comments: several of these files are
 * CSS, where `//` has no comment meaning and stripping it could corrupt a
 * value such as a `url()`. */
export function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}
