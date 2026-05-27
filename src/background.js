import { toYouTubeWatchUrl } from './youtube.js';

const HOST_NAME = 'com.yt2duck.host';
const MENU_ID = 'open-in-duck-player';
const FAILURE_NOTIFICATION_MESSAGE =
  'DuckDuckGoを開けませんでした。native host のインストールを確認してください。';
const YOUTUBE_DOCUMENT_PATTERNS = [
  'https://www.youtube.com/*',
  'https://youtube.com/*',
  'https://m.youtube.com/*',
];
const YOUTUBE_TARGET_PATTERNS = [
  ...YOUTUBE_DOCUMENT_PATTERNS,
  'https://youtu.be/*',
];

function notifyFailure(message = FAILURE_NOTIFICATION_MESSAGE) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: 'yt2duck',
    message,
  });
}

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
  const youtubeUrl = toYouTubeWatchUrl(sourceUrl);

  if (!youtubeUrl) {
    console.warn('yt2duck: unsupported YouTube URL', sourceUrl);
    return;
  }

  chrome.runtime.sendNativeMessage(
    HOST_NAME,
    { action: 'open', url: youtubeUrl },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('yt2duck: native host error', chrome.runtime.lastError.message);
        notifyFailure();
        return;
      }

      if (!response?.ok) {
        console.error('yt2duck: native host rejected request', response);
        notifyFailure();
      }
    },
  );
});
