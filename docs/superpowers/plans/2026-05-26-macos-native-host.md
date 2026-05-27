# macOS Native Host Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `yt2duck` from a Chrome-only `duck://player` opener into a macOS-specific Chrome extension plus Native Messaging host that opens YouTube videos in DuckDuckGo Browser, allowing DuckDuckGo's built-in Duck Player to handle playback.

**Architecture:** The Chrome extension keeps the context menu and URL extraction logic, but sends a normalized YouTube watch URL to a local native host instead of opening `duck://player/<id>`. The native host is a small Python stdio program that validates the message and runs `open -a DuckDuckGo <youtube-url>` on macOS.

**Tech Stack:** Chrome Extension Manifest V3, JavaScript ES modules, Node.js built-in test runner, Python 3 stdlib, Chrome Native Messaging, macOS `open`.

---

## File Structure

- Modify `docs/superpowers/specs/2026-05-26-yt2duck-design.md`
  - Replace the obsolete `duck://player/<id>` architecture with the macOS Native Messaging architecture.
- Modify `manifest.json`
  - Add `nativeMessaging` permission.
  - Keep `contextMenus` and existing host permissions.
- Modify `src/youtube.js`
  - Keep `extractYouTubeVideoId(value)`.
  - Add `toYouTubeWatchUrl(value)` to normalize supported YouTube URLs into `https://www.youtube.com/watch?v=<id>`.
- Modify `test/youtube.test.js`
  - Add tests for `toYouTubeWatchUrl(value)`.
- Modify `src/background.js`
  - Send `{ action: "open", url: normalizedYouTubeUrl }` to `com.yt2duck.host`.
  - Stop using `chrome.tabs.create({ url: "duck://player/<id>" })`.
- Create `native-host/yt2duck_host.py`
  - Implement Chrome Native Messaging stdin/stdout framing.
  - Validate action and YouTube URL.
  - Run `open -a DuckDuckGo <url>`.
  - Return structured JSON responses.
- Create `native-host/com.yt2duck.host.json`
  - Template manifest with replacement tokens for the extension ID and host path.
- Create `native-host/install.sh`
  - Install the native host manifest into `~/Library/Application Support/Google/Chrome/NativeMessagingHosts`.
  - Replace template tokens with repo-local absolute host path and user-provided Chrome extension ID.
- Create `test/native-host.test.js`
  - Run focused Python host unit checks through a test mode.
- Modify `README.md`
  - Document macOS-only behavior, native host install steps, extension ID requirement, and manual verification.

## Task 1: Update Design Spec for the New Root Cause

**Files:**
- Modify: `docs/superpowers/specs/2026-05-26-yt2duck-design.md`

- [ ] **Step 1: Replace the obsolete summary and goals**

Edit the design spec so the summary says:

```markdown
`yt2duck` is a macOS-specific Chrome extension plus Native Messaging host that opens YouTube videos in DuckDuckGo Browser from the Chrome right-click context menu.

The current implementation no longer opens `duck://player/<videoId>` from Chrome. Investigation showed that DuckDuckGo Browser uses `duck://player/<videoId>` internally, but does not register `duck://` as a macOS external URL scheme. Chrome therefore cannot reliably hand `duck://player/...` to DuckDuckGo Browser.

The supported workflow is:

1. The user browses YouTube in Google Chrome on macOS.
2. The user right-clicks a YouTube video page or YouTube video link/thumbnail.
3. The user selects `Duck Playerで再生`.
4. The Chrome extension sends a normalized YouTube watch URL to the native host.
5. The native host runs `open -a DuckDuckGo <youtube-url>`.
6. DuckDuckGo Browser opens the YouTube video and its built-in Duck Player setting handles playback.
```

- [ ] **Step 2: Replace old non-goals and architecture**

Ensure the spec explicitly says:

```markdown
## Goals

- Keep the Chrome context menu workflow.
- Support YouTube watch URLs, Shorts URLs, and `youtu.be` URLs.
- Normalize supported URLs to `https://www.youtube.com/watch?v=<id>`.
- Use Chrome Native Messaging to cross the Chrome-to-macOS boundary.
- Open the normalized URL in DuckDuckGo Browser with `open -a DuckDuckGo`.
- Treat the project as macOS-only.
- Include install instructions for the native host.

## Non-Goals

- Do not open `duck://player/<id>` from Chrome.
- Do not support Windows or Linux in this version.
- Do not build a packaged macOS app or custom protocol helper in this version.
- Do not add popup UI, toolbar UI, or settings UI in this version.
```

- [ ] **Step 3: Run a documentation sanity check**

Run:

```bash
rg -n "duck://player|nativeMessaging|open -a DuckDuckGo|macOS" docs/superpowers/specs/2026-05-26-yt2duck-design.md
```

Expected: any remaining `duck://player` mentions are explicitly historical/non-goal/root-cause notes, not the active implementation path.

- [ ] **Step 4: Commit the design update**

Run:

```bash
git add docs/superpowers/specs/2026-05-26-yt2duck-design.md
git commit -m "docs: update design for macos native host"
```

Expected: commit succeeds.

## Task 2: Normalize YouTube URLs for DuckDuckGo Browser

**Files:**
- Modify: `src/youtube.js`
- Modify: `test/youtube.test.js`

- [ ] **Step 1: Add failing tests for normalized watch URLs**

Update `test/youtube.test.js` imports to:

```js
import { extractYouTubeVideoId, toYouTubeWatchUrl } from "../src/youtube.js";
```

Append this test block:

```js
describe("toYouTubeWatchUrl", () => {
  it("normalizes supported URLs to canonical youtube watch URLs", () => {
    assert.equal(
      toYouTubeWatchUrl("https://www.youtube.com/watch?v=Zdzhh_drDhI"),
      "https://www.youtube.com/watch?v=Zdzhh_drDhI",
    );
    assert.equal(
      toYouTubeWatchUrl("https://youtube.com/watch?v=Zdzhh_drDhI&t=10s"),
      "https://www.youtube.com/watch?v=Zdzhh_drDhI",
    );
    assert.equal(
      toYouTubeWatchUrl("https://m.youtube.com/shorts/Zdzhh_drDhI"),
      "https://www.youtube.com/watch?v=Zdzhh_drDhI",
    );
    assert.equal(
      toYouTubeWatchUrl("https://youtu.be/Zdzhh_drDhI?t=10"),
      "https://www.youtube.com/watch?v=Zdzhh_drDhI",
    );
  });

  it("returns null when a URL cannot be normalized", () => {
    assert.equal(toYouTubeWatchUrl("https://example.com/watch?v=Zdzhh_drDhI"), null);
    assert.equal(toYouTubeWatchUrl("https://www.youtube.com/feed/subscriptions"), null);
    assert.equal(toYouTubeWatchUrl(""), null);
    assert.equal(toYouTubeWatchUrl(null), null);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test
```

Expected: FAIL because `toYouTubeWatchUrl` is not exported.

- [ ] **Step 3: Implement URL normalization**

Append this export to `src/youtube.js`:

```js
export function toYouTubeWatchUrl(value) {
  const videoId = extractYouTubeVideoId(value);
  if (!videoId) {
    return null;
  }

  const url = new URL("https://www.youtube.com/watch");
  url.searchParams.set("v", videoId);
  return url.href;
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit parser normalization**

Run:

```bash
git add src/youtube.js test/youtube.test.js
git commit -m "feat: normalize youtube urls for duckduckgo"
```

Expected: commit succeeds.

## Task 3: Add Native Host Program

**Files:**
- Create: `native-host/yt2duck_host.py`

- [ ] **Step 1: Create native host script**

Create `native-host/yt2duck_host.py` with this exact content:

```python
#!/usr/bin/env python3
import json
import struct
import subprocess
import sys
from urllib.parse import parse_qs, urlparse


ALLOWED_HOSTS = {"www.youtube.com", "youtube.com", "m.youtube.com"}


def is_supported_youtube_watch_url(value):
    if not isinstance(value, str) or not value:
        return False

    parsed = urlparse(value)
    if parsed.scheme != "https":
        return False
    if parsed.netloc not in ALLOWED_HOSTS:
        return False
    if parsed.path != "/watch":
        return False

    video_ids = parse_qs(parsed.query).get("v", [])
    return len(video_ids) == 1 and bool(video_ids[0])


def open_in_duckduckgo(url):
    subprocess.run(["open", "-a", "DuckDuckGo", url], check=True)


def handle_message(message, opener=open_in_duckduckgo):
    if not isinstance(message, dict):
        return {"ok": False, "error": "message must be an object"}

    if message.get("action") != "open":
        return {"ok": False, "error": "unsupported action"}

    url = message.get("url")
    if not is_supported_youtube_watch_url(url):
        return {"ok": False, "error": "unsupported url"}

    try:
        opener(url)
    except subprocess.CalledProcessError as exc:
        return {"ok": False, "error": f"failed to open DuckDuckGo: {exc}"}
    except FileNotFoundError:
        return {"ok": False, "error": "macOS open command not found"}

    return {"ok": True}


def read_message(stdin_buffer):
    raw_length = stdin_buffer.read(4)
    if len(raw_length) == 0:
        return None
    if len(raw_length) != 4:
        raise ValueError("invalid message length header")

    message_length = struct.unpack("@I", raw_length)[0]
    raw_message = stdin_buffer.read(message_length)
    if len(raw_message) != message_length:
        raise ValueError("invalid message body")

    return json.loads(raw_message.decode("utf-8"))


def write_message(stdout_buffer, message):
    encoded = json.dumps(message, separators=(",", ":")).encode("utf-8")
    stdout_buffer.write(struct.pack("@I", len(encoded)))
    stdout_buffer.write(encoded)
    stdout_buffer.flush()


def main():
    if "--self-test" in sys.argv:
        result = handle_message(
            {"action": "open", "url": "https://www.youtube.com/watch?v=Zdzhh_drDhI"},
            opener=lambda url: None,
        )
        print(json.dumps(result, sort_keys=True))
        return 0 if result == {"ok": True} else 1

    try:
      message = read_message(sys.stdin.buffer)
      if message is None:
          return 0
      response = handle_message(message)
    except Exception as exc:
      response = {"ok": False, "error": str(exc)}

    write_message(sys.stdout.buffer, response)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Make script executable**

Run:

```bash
chmod +x native-host/yt2duck_host.py
```

Expected: command succeeds.

- [ ] **Step 3: Run host self-test**

Run:

```bash
native-host/yt2duck_host.py --self-test
```

Expected output:

```json
{"ok": true}
```

- [ ] **Step 4: Commit native host script**

Run:

```bash
git add native-host/yt2duck_host.py
git commit -m "feat: add macos native host"
```

Expected: commit succeeds.

## Task 4: Test Native Host Validation from npm

**Files:**
- Create: `test/native-host.test.js`
- Modify: `native-host/yt2duck_host.py`

- [ ] **Step 1: Add JSON test mode to the native host**

Modify `native-host/yt2duck_host.py` so `main()` handles a `--test-message` argument before `--self-test`:

```python
    if "--test-message" in sys.argv:
        index = sys.argv.index("--test-message")
        message = json.loads(sys.argv[index + 1])
        result = handle_message(message, opener=lambda url: None)
        print(json.dumps(result, sort_keys=True))
        return 0
```

Place that block immediately after:

```python
def main():
```

- [ ] **Step 2: Add Node tests for native host validation**

Create `test/native-host.test.js` with this exact content:

```js
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";

const HOST = "native-host/yt2duck_host.py";

function runHostTestMessage(message) {
  const output = execFileSync(HOST, ["--test-message", JSON.stringify(message)], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

describe("yt2duck native host validation", () => {
  it("accepts canonical youtube watch URLs", () => {
    assert.deepEqual(
      runHostTestMessage({
        action: "open",
        url: "https://www.youtube.com/watch?v=Zdzhh_drDhI",
      }),
      { ok: true },
    );
  });

  it("rejects unsupported actions and URLs", () => {
    assert.deepEqual(
      runHostTestMessage({
        action: "noop",
        url: "https://www.youtube.com/watch?v=Zdzhh_drDhI",
      }),
      { ok: false, error: "unsupported action" },
    );
    assert.deepEqual(
      runHostTestMessage({
        action: "open",
        url: "https://example.com/watch?v=Zdzhh_drDhI",
      }),
      { ok: false, error: "unsupported url" },
    );
  });
});
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit native host tests**

Run:

```bash
git add native-host/yt2duck_host.py test/native-host.test.js
git commit -m "test: cover native host validation"
```

Expected: commit succeeds.

## Task 5: Wire Chrome Extension to Native Messaging

**Files:**
- Modify: `manifest.json`
- Modify: `src/background.js`

- [ ] **Step 1: Add nativeMessaging permission**

Modify `manifest.json` permissions so it contains:

```json
  "permissions": [
    "contextMenus",
    "nativeMessaging",
    "tabs"
  ],
```

Keep the existing host permissions unchanged.

- [ ] **Step 2: Replace background click handling**

Modify `src/background.js` to this exact content:

```js
import { toYouTubeWatchUrl } from './youtube.js';

const HOST_NAME = 'com.yt2duck.host';
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
        return;
      }

      if (!response?.ok) {
        console.error('yt2duck: native host rejected request', response);
      }
    },
  );
});
```

- [ ] **Step 3: Run extension checks**

Run:

```bash
npm test
node --check src/background.js
node -e 'JSON.parse(require("fs").readFileSync("manifest.json", "utf8")); console.log("manifest ok")'
```

Expected:

```text
manifest ok
```

and all tests pass.

- [ ] **Step 4: Commit extension native messaging wiring**

Run:

```bash
git add manifest.json src/background.js
git commit -m "feat: send youtube urls to native host"
```

Expected: commit succeeds.

## Task 6: Add Native Host Manifest and Installer

**Files:**
- Create: `native-host/com.yt2duck.host.json`
- Create: `native-host/install.sh`

- [ ] **Step 1: Create native host manifest template**

Create `native-host/com.yt2duck.host.json` with this exact content:

```json
{
  "name": "com.yt2duck.host",
  "description": "yt2duck Native Messaging Host",
  "path": "__YT2DUCK_HOST_PATH__",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://__CHROME_EXTENSION_ID__/"
  ]
}
```

- [ ] **Step 2: Create installer script**

Create `native-host/install.sh` with this exact content:

```bash
#!/bin/bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <chrome-extension-id>" >&2
  exit 1
fi

EXTENSION_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_PATH="${SCRIPT_DIR}/yt2duck_host.py"
TEMPLATE_PATH="${SCRIPT_DIR}/com.yt2duck.host.json"
INSTALL_DIR="${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts"
INSTALL_PATH="${INSTALL_DIR}/com.yt2duck.host.json"

if [[ ! "${EXTENSION_ID}" =~ ^[a-p]{32}$ ]]; then
  echo "Invalid Chrome extension ID: ${EXTENSION_ID}" >&2
  echo "Expected 32 lowercase letters from a to p." >&2
  exit 1
fi

if [ ! -x "${HOST_PATH}" ]; then
  chmod +x "${HOST_PATH}"
fi

mkdir -p "${INSTALL_DIR}"
sed \
  -e "s#__YT2DUCK_HOST_PATH__#${HOST_PATH}#g" \
  -e "s#__CHROME_EXTENSION_ID__#${EXTENSION_ID}#g" \
  "${TEMPLATE_PATH}" > "${INSTALL_PATH}"

echo "Installed native host manifest:"
echo "${INSTALL_PATH}"
```

- [ ] **Step 3: Make installer executable**

Run:

```bash
chmod +x native-host/install.sh
```

Expected: command succeeds.

- [ ] **Step 4: Validate installer with a sample extension ID**

Run:

```bash
bash -n native-host/install.sh
```

Expected: command exits with status 0.

Do not run the installer during automated tests because it writes to the user's Chrome Native Messaging host directory.

- [ ] **Step 5: Commit native host installer**

Run:

```bash
git add native-host/com.yt2duck.host.json native-host/install.sh
git commit -m "feat: add native host installer"
```

Expected: commit succeeds.

## Task 7: Update README for macOS Native Messaging

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README behavior description**

Update the README opening section to say:

````markdown
# yt2duck - YouTube to Duck Player

yt2duck is a macOS-only Chrome extension plus Native Messaging host. It opens YouTube videos from Chrome in DuckDuckGo Browser so DuckDuckGo's built-in Duck Player can handle playback.

The extension does not open `duck://player/...` directly. DuckDuckGo Browser uses that URL internally, but the macOS app does not register `duck://` as an external URL scheme. yt2duck therefore opens the normal YouTube watch URL in DuckDuckGo Browser:

```text
https://www.youtube.com/watch?v=<videoId>
```
````

- [ ] **Step 2: Replace install section**

Add this install flow:

````markdown
## Install on macOS

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repository directory.
5. Copy the extension ID shown by Chrome.
6. Install the native host:

```bash
./native-host/install.sh <chrome-extension-id>
```

DuckDuckGo Browser for macOS must already be installed, and Duck Player must be enabled in DuckDuckGo settings.
````

- [ ] **Step 3: Replace usage section**

Ensure usage says:

````markdown
## Usage

1. Open YouTube in Chrome.
2. Right-click a video page, video link, or thumbnail.
3. Click `Duck Playerで再生`.
4. DuckDuckGo Browser opens the video URL.
5. DuckDuckGo's Duck Player setting handles playback.
````

- [ ] **Step 4: Run docs and tests check**

Run:

```bash
rg -n "duck://player|Native Messaging|install.sh|DuckDuckGo Browser|macOS" README.md
npm test
```

Expected: `duck://player` only appears as an explanation of why direct protocol opening is not used, and tests pass.

- [ ] **Step 5: Commit README update**

Run:

```bash
git add README.md
git commit -m "docs: document macos native host setup"
```

Expected: commit succeeds.

## Task 8: Final Verification and Publication

**Files:**
- Modify: none unless verification exposes a defect.

- [ ] **Step 1: Run automated verification**

Run:

```bash
npm test
node --check src/background.js
python3 -m py_compile native-host/yt2duck_host.py
bash -n native-host/install.sh
node -e 'JSON.parse(require("fs").readFileSync("manifest.json", "utf8")); JSON.parse(require("fs").readFileSync("native-host/com.yt2duck.host.json", "utf8")); console.log("json ok")'
```

Expected output includes:

```text
json ok
```

and all commands exit with status 0.

- [ ] **Step 2: Manual native host install check**

After loading the unpacked extension in Chrome, copy the extension ID and run:

```bash
./native-host/install.sh <chrome-extension-id>
```

Expected: installer prints the installed manifest path under:

```text
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.yt2duck.host.json
```

- [ ] **Step 3: Manual end-to-end check**

Open a YouTube video page in Chrome, right-click the page, and choose `Duck Playerで再生`.

Expected:

- Chrome does not open a `duck://player/...` tab.
- DuckDuckGo Browser opens `https://www.youtube.com/watch?v=<id>`.
- DuckDuckGo Browser's Duck Player setting handles playback.

- [ ] **Step 4: Push to GitHub**

Run:

```bash
git status --short
git push origin main
```

Expected: working tree is clean before push, and push succeeds.

## Self-Review Notes

- Spec coverage: The plan updates the design, replaces direct `duck://player` opening, adds URL normalization, adds a macOS Native Messaging host, wires Chrome to the host, adds installer documentation, and includes automated plus manual verification.
- Scope check: This is one coherent subsystem change. Chrome extension, native host, installer, and README must ship together for the macOS workflow to work.
- Type consistency: Extension sends `{ action: "open", url: string }`; native host validates the same shape.
- Risk note: Native Messaging requires the Chrome extension ID after unpacked loading. The installer intentionally takes that ID as an argument rather than guessing it.
