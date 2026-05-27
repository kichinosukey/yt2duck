# yt2duck - YouTube to Duck Player

yt2duck is a macOS-only Chrome extension plus Native Messaging host.

It opens YouTube videos from Chrome in DuckDuckGo Browser so DuckDuckGo's built-in Duck Player can handle playback.

It does not open `duck://player/...` directly because DuckDuckGo Browser does not register `duck://` as external macOS URL scheme. Instead, yt2duck opens a normal YouTube watch URL:

```text
https://www.youtube.com/watch?v=<videoId>
```

Supported URLs are normalized before being sent to the native host:

```text
https://www.youtube.com/watch?v=Zdzhh_drDhI
https://www.youtube.com/watch?v=Zdzhh_drDhI

https://www.youtube.com/shorts/Zdzhh_drDhI
https://www.youtube.com/watch?v=Zdzhh_drDhI

https://youtu.be/Zdzhh_drDhI
https://www.youtube.com/watch?v=Zdzhh_drDhI
```

## Supported URLs

- YouTube watch URLs on `www.youtube.com`, `youtube.com`, and `m.youtube.com`
- YouTube Shorts URLs on `www.youtube.com`, `youtube.com`, and `m.youtube.com`
- `youtu.be` short URLs

## Install on macOS

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repository directory.
5. Copy the extension ID shown by Chrome.
6. Run:

```bash
./native-host/install.sh <chrome-extension-id>
```

DuckDuckGo Browser for macOS must already be installed, and Duck Player must be enabled in DuckDuckGo settings.

## Usage

1. Open YouTube in Chrome.
2. Right-click a video page, video link, or thumbnail.
3. Click `Duck Playerで再生`.
4. DuckDuckGo Browser opens the video URL.
5. DuckDuckGo's Duck Player setting handles playback.

## Development

Run tests:

```bash
npm test
```

## License

MIT
