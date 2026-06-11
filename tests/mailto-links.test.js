import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

function listTrackedHtmlFiles() {
  const stdout = execFileSync('git', ['-C', repoRoot, 'ls-files', '*.html'], { encoding: 'utf8' }).trim();
  return stdout ? stdout.split('\n') : [];
}

test('tracked mailto links open in a new tab without taking over the site', () => {
  const failures = [];
  const mailtoLinkPattern = /<a\b(?=[^>]*\bhref=(['"])mailto:)[^>]*>/gis;

  for (const relativePath of listTrackedHtmlFiles()) {
    const absolutePath = path.join(repoRoot, relativePath);
    const source = readFileSync(absolutePath, 'utf8');
    const links = source.match(mailtoLinkPattern) || [];

    for (const link of links) {
      if (!/\btarget=(['"])_blank\1/i.test(link)) {
        failures.push(`${relativePath}: mailto link is missing target="_blank"`);
      }

      const relMatch = /\brel=(['"])(.*?)\1/i.exec(link);
      const relValues = relMatch?.[2].toLowerCase().split(/\s+/) || [];
      if (!relValues.includes('noopener')) {
        failures.push(`${relativePath}: mailto link is missing rel="noopener"`);
      }
    }
  }

  assert.deepEqual(failures, []);
});
