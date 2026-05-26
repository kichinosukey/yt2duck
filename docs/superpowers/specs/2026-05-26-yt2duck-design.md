# yt2duck Design

## Summary

`yt2duck` is a macOS-only Chrome extension plus Native Messaging host that opens YouTube videos in DuckDuckGo Browser from the right-click context menu.

The first version focuses on one workflow:

1. The user browses YouTube in Google Chrome.
2. The user right-clicks a YouTube video page or a YouTube video link/thumbnail.
3. The user selects `Duck Playerで再生`.
4. The extension normalizes the selected video to `https://www.youtube.com/watch?v=<id>`.
5. The extension sends that normalized URL to the macOS Native Messaging host.
6. The native host runs `open -a DuckDuckGo <youtube-url>`.
7. DuckDuckGo Browser opens the YouTube URL, and the user's Duck Player setting handles playback.

Example:

- Source URL: `https://www.youtube.com/watch?v=Zdzhh_drDhI`
- Normalized URL: `https://www.youtube.com/watch?v=Zdzhh_drDhI`
- Native host command: `open -a DuckDuckGo https://www.youtube.com/watch?v=Zdzhh_drDhI`

The project will be created as a public GitHub repository named `yt2duck`.

## Root Cause

DuckDuckGo Browser uses `duck://player/<id>` internally for Duck Player, but it does not register `duck://` as a macOS external URL scheme.

Because macOS does not know DuckDuckGo Browser as the handler for `duck://`, Chrome cannot reliably hand off a direct `duck://player/<id>` navigation. Opening a `duck://player/<id>` tab from Chrome is therefore not a supported integration path.

The reliable macOS integration is to ask macOS to open DuckDuckGo Browser directly with a normal YouTube watch URL:

```sh
open -a DuckDuckGo https://www.youtube.com/watch?v=<id>
```

DuckDuckGo Browser then receives the YouTube URL through its normal app-opening path, and Duck Player behavior is controlled by the browser's own Duck Player setting.

## Goals

- Provide a Chrome Manifest V3 extension.
- Add a context menu item for YouTube video pages and YouTube video links.
- Keep the right-click context menu workflow.
- Support these YouTube URL forms:
  - `https://www.youtube.com/watch?v=<id>`
  - `https://youtube.com/watch?v=<id>`
  - `https://m.youtube.com/watch?v=<id>`
  - `https://www.youtube.com/shorts/<id>`
  - `https://youtube.com/shorts/<id>`
  - `https://m.youtube.com/shorts/<id>`
  - `https://youtu.be/<id>`
- Normalize supported URLs to `https://www.youtube.com/watch?v=<id>`.
- Prefer the right-clicked link URL when present, and fall back to the current page URL.
- Use Chrome Native Messaging to send the normalized YouTube URL from the extension to a local native host.
- Have the native host open DuckDuckGo Browser with `open -a DuckDuckGo <youtube-url>`.
- Keep the implementation macOS-only for the first version.
- Keep permissions and implementation small.
- Include a README with install and usage instructions for unpacked extension loading.
- Include native host install documentation for macOS.
- Include focused unit tests for YouTube video id extraction.

## Non-Goals

- No direct Chrome navigation to `duck://player/<id>`.
- No Windows or Linux support in the first version.
- No packaged macOS app or custom protocol helper.
- No popup UI.
- No toolbar button.
- No settings page.
- No content script or YouTube DOM scraping in the first version.
- No Chrome Web Store packaging in the first version.

## Recommended Architecture

Use Manifest V3 with a background service worker, Chrome's `contextMenus` API, and Chrome Native Messaging.

Files:

- `manifest.json`
  - Defines the extension metadata, permissions, host permissions, and background service worker.
  - Includes the `nativeMessaging` permission.
- `src/background.js`
  - Registers the context menu on install.
  - Handles context menu clicks.
  - Chooses `info.linkUrl || info.pageUrl`.
  - Calls the YouTube URL parser.
  - Normalizes the parsed id to `https://www.youtube.com/watch?v=<id>`.
  - Sends the normalized URL to the native host with `chrome.runtime.sendNativeMessage`.
- `src/youtube.js`
  - Exports a pure function for extracting a YouTube video id from supported URL forms.
- `native/yt2duck-host`
  - Reads a Chrome Native Messaging JSON request from stdin.
  - Validates that the request contains a normalized YouTube watch URL.
  - Runs `open -a DuckDuckGo <youtube-url>`.
- `native/com.yt2duck.host.json`
  - Native Messaging host manifest installed under Chrome's macOS native messaging host directory.
- `test/youtube.test.js`
  - Verifies supported URL forms and invalid URL behavior.
- `README.md`
  - Explains the purpose, manual Chrome extension install steps, native host install steps, and usage.

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
3. If a supported video id is found, normalize it to `https://www.youtube.com/watch?v=<id>`.
4. Send the normalized URL to the native host with `chrome.runtime.sendNativeMessage`.
5. The native host runs `open -a DuckDuckGo <youtube-url>`.
6. If no supported video id is found, do not open anything. Log a concise warning for debugging.

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

After extracting an id, the extension should construct the normalized URL as:

```text
https://www.youtube.com/watch?v=<id>
```

## Permissions

Required permissions:

- `contextMenus`
- `nativeMessaging`

Host permissions:

- `https://www.youtube.com/*`
- `https://youtube.com/*`
- `https://m.youtube.com/*`
- `https://youtu.be/*`

The extension does not need `activeTab`, `tabs`, `notifications`, `storage`, or content script permissions in the first version.

## Native Host

The native host is macOS-only.

Responsibilities:

- Receive one Native Messaging request from Chrome.
- Validate the URL is a normalized `https://www.youtube.com/watch?v=<id>` URL.
- Run `open -a DuckDuckGo <youtube-url>`.
- Return a concise success or error response to Chrome.

Install documentation should cover:

- Where to place the host executable.
- Where to install the Chrome Native Messaging host manifest on macOS.
- How to set executable permissions.
- How to connect the host manifest's `allowed_origins` to the installed extension id.
- How to verify DuckDuckGo Browser is installed and can be opened with `open -a DuckDuckGo`.

## Error Handling

The first version should avoid visible error UI. If the user triggers the menu on a URL that cannot be converted, the extension should no-op and log a warning.

If Native Messaging fails, the extension should log a concise warning. If the native host cannot validate the URL or cannot run `open -a DuckDuckGo`, it should return an error response and avoid opening anything else.

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
2. Install the macOS Native Messaging host manifest and executable.
3. Confirm `open -a DuckDuckGo https://www.youtube.com/watch?v=Zdzhh_drDhI` opens DuckDuckGo Browser.
4. Open a YouTube watch page in Chrome and right-click the page.
5. Confirm `Duck Playerで再生` appears and opens DuckDuckGo Browser with the normalized YouTube watch URL.
6. Right-click a YouTube video link or thumbnail and confirm the linked video opens in DuckDuckGo Browser.
7. Check a Shorts link.
8. Check a `youtu.be` link from a YouTube page if available.

## Public Repository Expectations

The repository should be public-ready from the first implementation:

- Use a clear README title: `yt2duck - YouTube to Duck Player`.
- Include a short description: `Open YouTube videos in Duck Player from the context menu.`
- Add a permissive license such as MIT unless a different license is chosen before publication.
- Avoid committing generated Chrome extension packages in the first version.
