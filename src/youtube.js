const SUPPORTED_YOUTUBE_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'm.youtube.com',
]);

export function extractYouTubeVideoId(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.hostname === 'youtu.be') {
    return firstPathSegment(url);
  }

  if (!SUPPORTED_YOUTUBE_HOSTS.has(url.hostname)) {
    return null;
  }

  if (url.pathname === '/watch') {
    return nonEmptyValue(url.searchParams.get('v'));
  }

  if (url.pathname === '/shorts' || url.pathname.startsWith('/shorts/')) {
    const [, shorts, id] = url.pathname.split('/');
    return shorts === 'shorts' ? nonEmptyValue(id) : null;
  }

  return null;
}

export function toYouTubeWatchUrl(value) {
  const videoId = extractYouTubeVideoId(value);
  if (!videoId) {
    return null;
  }

  const url = new URL('https://www.youtube.com/watch');
  url.searchParams.set('v', videoId);
  return url.href;
}

function firstPathSegment(url) {
  return nonEmptyValue(url.pathname.split('/').find(Boolean));
}

function nonEmptyValue(value) {
  return value === '' || value == null ? null : value;
}
