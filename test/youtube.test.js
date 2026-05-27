import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';

import { extractYouTubeVideoId, toYouTubeWatchUrl } from '../src/youtube.js';

test('extracts video id from supported youtube watch URLs', () => {
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=abc123'),
    'abc123',
  );
  assert.equal(
    extractYouTubeVideoId('https://youtube.com/watch?feature=share&v=def456&t=30'),
    'def456',
  );
  assert.equal(
    extractYouTubeVideoId('https://m.youtube.com/watch?v=ghi789'),
    'ghi789',
  );
});

test('extracts video id from supported youtube shorts URLs', () => {
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/shorts/abc123'),
    'abc123',
  );
  assert.equal(
    extractYouTubeVideoId('https://youtube.com/shorts/def456?feature=share'),
    'def456',
  );
  assert.equal(
    extractYouTubeVideoId('https://m.youtube.com/shorts/ghi789'),
    'ghi789',
  );
});

test('extracts video id from supported youtu.be URLs', () => {
  assert.equal(extractYouTubeVideoId('https://youtu.be/abc123'), 'abc123');
  assert.equal(
    extractYouTubeVideoId('https://youtu.be/def456?si=share'),
    'def456',
  );
});

test('returns null for unsupported or incomplete values', () => {
  const unsupportedValues = [
    'https://example.com/watch?v=abc123',
    'https://www.youtube.com/feed/subscriptions',
    'https://www.youtube.com/watch',
    'https://www.youtube.com/shorts/',
    'not a url',
    '',
    null,
  ];

  for (const value of unsupportedValues) {
    assert.equal(extractYouTubeVideoId(value), null);
  }
});

describe('toYouTubeWatchUrl', () => {
  it('normalizes supported URLs to canonical youtube watch URLs', () => {
    assert.equal(
      toYouTubeWatchUrl('https://www.youtube.com/watch?v=Zdzhh_drDhI'),
      'https://www.youtube.com/watch?v=Zdzhh_drDhI',
    );
    assert.equal(
      toYouTubeWatchUrl('https://youtube.com/watch?v=Zdzhh_drDhI&t=10s'),
      'https://www.youtube.com/watch?v=Zdzhh_drDhI',
    );
    assert.equal(
      toYouTubeWatchUrl('https://m.youtube.com/shorts/Zdzhh_drDhI'),
      'https://www.youtube.com/watch?v=Zdzhh_drDhI',
    );
    assert.equal(
      toYouTubeWatchUrl('https://youtu.be/Zdzhh_drDhI?t=10'),
      'https://www.youtube.com/watch?v=Zdzhh_drDhI',
    );
  });

  it('returns null when a URL cannot be normalized', () => {
    assert.equal(toYouTubeWatchUrl('https://example.com/watch?v=Zdzhh_drDhI'), null);
    assert.equal(toYouTubeWatchUrl('https://www.youtube.com/feed/subscriptions'), null);
    assert.equal(toYouTubeWatchUrl(''), null);
    assert.equal(toYouTubeWatchUrl(null), null);
  });
});
