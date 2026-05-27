# yt2duck - YouTube to Duck Player

yt2duck is a macOS-only Chrome extension plus Native Messaging host.

It opens YouTube videos from Chrome in DuckDuckGo Browser so DuckDuckGo's built-in Duck Player can handle playback.

## Prerequisites

- macOS
- Google Chrome
- DuckDuckGo Browser for macOS
- Python 3
- Duck Player enabled in DuckDuckGo Browser settings

It does not open `duck://player/...` directly because DuckDuckGo Browser does not register `duck://` as external macOS URL scheme. Instead, yt2duck opens a normal YouTube watch URL:

```text
https://www.youtube.com/watch?v=<videoId>
```

Input URLs are normalized before being sent to DuckDuckGo Browser:

```text
Input:      https://www.youtube.com/watch?v=Zdzhh_drDhI
Normalized: https://www.youtube.com/watch?v=Zdzhh_drDhI

Input:      https://www.youtube.com/shorts/Zdzhh_drDhI
Normalized: https://www.youtube.com/watch?v=Zdzhh_drDhI

Input:      https://youtu.be/Zdzhh_drDhI
Normalized: https://www.youtube.com/watch?v=Zdzhh_drDhI
```

## Supported URLs

- YouTube watch URLs on `www.youtube.com`, `youtube.com`, and `m.youtube.com`
- YouTube Shorts URLs on `www.youtube.com`, `youtube.com`, and `m.youtube.com`
- `youtu.be` short URLs

## Install on macOS

1. Open `chrome://extensions` in Google Chrome.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repository directory.
5. Copy the extension ID shown by Chrome.
6. Run:

```bash
./native-host/install.sh <chrome-extension-id>
```

The installer writes the Native Messaging manifest for Google Chrome only:

```text
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.yt2duck.host.json
```

It does not install native host manifests for Chromium, Edge, Brave, Firefox, or other browsers.

## Usage

1. Open YouTube in Chrome.
2. Right-click a video page, video link, or thumbnail.
3. Click `Duck Playerで再生`.
4. DuckDuckGo Browser opens the video URL.
5. DuckDuckGo's Duck Player setting handles playback.

## Troubleshooting

Check that the native host manifest exists at:

```text
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.yt2duck.host.json
```

If the Chrome extension ID changes, or you reload the extension from a different path, rerun:

```bash
./native-host/install.sh <chrome-extension-id>
```

Run the native host self-test:

```bash
native-host/yt2duck_host.py --self-test
```

Verify DuckDuckGo Browser can open a YouTube URL:

```bash
open -a DuckDuckGo 'https://www.youtube.com/watch?v=Zdzhh_drDhI'
```

If the extension notification says the native host failed, check that the Chrome extension ID matches the ID passed to `./native-host/install.sh`.

## Development

Run tests:

```bash
npm test
```

## License

MIT
