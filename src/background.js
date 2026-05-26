import { extractYouTubeVideoId } from './youtube.js';

const MENU_ID = 'open-in-duck-player';
const YOUTUBE_DOCUMENT_PATTERNS = [
  'https://www.youtube.com/*',
  'https://youtube.com/*',
  'https://m.youtube.com/*',
];
const YOUTUBE_TARGET_PATTERNS = [
  ...YOUTUBE_DOCUMENT_PATTERNS,
  'https://youtu.be/*',
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Duck Playerで再生',
    contexts: ['page', 'link'],
    documentUrlPatterns: YOUTUBE_DOCUMENT_PATTERNS,
    targetUrlPatterns: YOUTUBE_TARGET_PATTERNS,
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const sourceUrl = info.linkUrl || info.pageUrl;
  const videoId = extractYouTubeVideoId(sourceUrl);

  if (!videoId) {
    console.warn('yt2duck: unsupported YouTube URL', sourceUrl);
    return;
  }

  chrome.tabs.create({ url: `duck://player/${videoId}` });
});
