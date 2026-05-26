# yt2duck Design

## Summary

`yt2duck` is a minimal Chrome extension that opens YouTube videos in Duck Player from the right-click context menu.

The first version focuses on one workflow:

1. The user browses YouTube in Google Chrome.
2. The user right-clicks a YouTube video page or a YouTube video link/thumbnail.
3. The user selects `Duck Playerで再生`.
4. The extension opens a new tab with `duck://player/<videoId>`.

Example:

- Source URL: `https://www.youtube.com/watch?v=Zdzhh_drDhI`
- Duck Player URL: `duck://player/Zdzhh_drDhI`

The project will be created as a public GitHub repository named `yt2duck`.

## Goals

- Provide a Chrome Manifest V3 extension.
- Add a context menu item for YouTube video pages and YouTube video links.
- Support these YouTube URL forms:
  - `https://www.youtube.com/watch?v=<id>`
  - `https://youtube.com/watch?v=<id>`
  - `https://m.youtube.com/watch?v=<id>`
  - `https://www.youtube.com/shorts/<id>`
  - `https://youtube.com/shorts/<id>`
  - `https://m.youtube.com/shorts/<id>`
  - `https://youtu.be/<id>`
- Prefer the right-clicked link URL when present, and fall back to the current page URL.
- Open Duck Player in a new tab so the YouTube browsing state is preserved.
- Keep permissions and implementation small.
- Include a README with install and usage instructions for unpacked extension loading.
- Include focused unit tests for YouTube video id extraction.

## Non-Goals

- No popup UI in the first version.
- No toolbar button in the first version.
- No settings page in the first version.
- No content script or YouTube DOM scraping in the first version.
- No Chrome Web Store packaging in the first version.
- No native messaging host.

## Recommended Architecture

Use Manifest V3 with a background service worker and Chrome's `contextMenus` API.

Files:

- `manifest.json`
  - Defines the extension metadata, permissions, host permissions, and background service worker.
- `src/background.js`
  - Registers the context menu on install.
  - Handles context menu clicks.
  - Chooses `info.linkUrl || info.pageUrl`.
  - Calls the YouTube URL parser.
  - Opens `duck://player/<videoId>` in a new tab.
- `src/youtube.js`
  - Exports a pure function for extracting a YouTube video id from supported URL forms.
- `test/youtube.test.js`
  - Verifies supported URL forms and invalid URL behavior.
- `README.md`
  - Explains the purpose, manual install steps, and usage.

## Context Menu Behavior

Create one menu item:

- ID: `open-in-duck-player`
- Title: `Duck Playerで再生`
- Contexts: `page`, `link`
- Document URL patterns:
  - `https://www.youtube.com/*`
  - `https://youtube.com/*`
  - `https://m.youtube.com/*`
- Target URL patterns:
  - `https://www.youtube.com/*`
  - `https://youtube.com/*`
  - `https://m.youtube.com/*`
  - `https://youtu.be/*`

When the user clicks the menu:

1. If `info.linkUrl` exists, parse that URL.
2. Otherwise parse `info.pageUrl`.
3. If a supported video id is found, open `duck://player/<videoId>` using `chrome.tabs.create`.
4. If no supported video id is found, do not open anything. Log a concise warning for debugging.

## YouTube URL Parsing

The parser should use the standard `URL` API rather than manual string splitting.

Rules:

- `youtube.com`, `www.youtube.com`, and `m.youtube.com`:
  - `/watch?v=<id>` returns the `v` query parameter.
  - `/shorts/<id>` returns the first path segment after `shorts`.
- `youtu.be`:
  - `/<id>` returns the first path segment.
- Invalid URLs, unsupported hosts, missing ids, and unsupported paths return `null`.

The parser should strip obvious extra path/query context by relying on `URL.pathname` and `URL.searchParams`. It should not attempt to validate the exact YouTube id alphabet in the first version beyond requiring a non-empty id.

## Permissions

Required permissions:

- `contextMenus`
- `tabs`

Host permissions:

- `https://www.youtube.com/*`
- `https://youtube.com/*`
- `https://m.youtube.com/*`
- `https://youtu.be/*`

The extension does not need `activeTab`, `notifications`, `storage`, or content script permissions in the first version.

## Error Handling

The first version should avoid visible error UI. If the user triggers the menu on a URL that cannot be converted, the extension should no-op and log a warning.

This keeps the extension quiet during normal browsing. If manual testing shows users can easily trigger confusing no-op cases, a later version can add a small notification or toolbar fallback.

## Testing

Automated tests:

- `/watch?v=Zdzhh_drDhI` returns `Zdzhh_drDhI`.
- `/watch?v=Zdzhh_drDhI&t=10s` returns `Zdzhh_drDhI`.
- `/shorts/Zdzhh_drDhI` returns `Zdzhh_drDhI`.
- `https://youtu.be/Zdzhh_drDhI` returns `Zdzhh_drDhI`.
- Unsupported hosts return `null`.
- YouTube URLs without a video id return `null`.

Manual verification:

1. Load the extension with `chrome://extensions` in developer mode.
2. Open a YouTube watch page and right-click the page.
3. Confirm `Duck Playerで再生` appears and opens a new `duck://player/<id>` tab.
4. Right-click a YouTube video link or thumbnail and confirm the linked video opens.
5. Check a Shorts link.
6. Check a `youtu.be` link from a YouTube page if available.

## Public Repository Expectations

The repository should be public-ready from the first implementation:

- Use a clear README title: `yt2duck - YouTube to Duck Player`.
- Include a short description: `Open YouTube videos in Duck Player from the context menu.`
- Add a permissive license such as MIT unless a different license is chosen before publication.
- Avoid committing generated Chrome extension packages in the first version.

