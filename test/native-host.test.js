import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOST = join(__dirname, '..', 'native-host', 'yt2duck_host.py');

function runHost(message) {
  const output = execFileSync(
    HOST,
    ['--test-message', JSON.stringify(message)],
    { encoding: 'utf8' },
  );
  return JSON.parse(output);
}

test('opens supported YouTube watch URLs', () => {
  assert.deepEqual(
    runHost({
      action: 'open',
      url: 'https://www.youtube.com/watch?v=Zdzhh_drDhI',
    }),
    { ok: true },
  );
});

test('rejects unsupported actions', () => {
  assert.deepEqual(
    runHost({
      action: 'close',
      url: 'https://www.youtube.com/watch?v=Zdzhh_drDhI',
    }),
    { error: 'unsupported action', ok: false },
  );
});

test('rejects unsupported URLs', () => {
  assert.deepEqual(
    runHost({
      action: 'open',
      url: 'https://example.com/watch?v=Zdzhh_drDhI',
    }),
    { error: 'unsupported url', ok: false },
  );
});
