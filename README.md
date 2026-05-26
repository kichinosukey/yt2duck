# yt2duck - YouTube to Duck Player

yt2duck is a Chrome extension that opens YouTube videos in Duck Player from the Chrome right-click context menu.

It adds a `Duck Playerで再生` context menu item on YouTube. When selected, the extension converts supported YouTube URLs to the Duck Player protocol format:

```text
duck://player/<videoId>
```

The `duck://player/...` protocol must already be handled by an installed and registered Duck Player or DuckDuckGo protocol handler. The extension only opens that protocol URL; it does not install or register the handler.

Examples:

```text
https://www.youtube.com/watch?v=Zdzhh_drDhI
duck://player/Zdzhh_drDhI

https://www.youtube.com/shorts/Zdzhh_drDhI
duck://player/Zdzhh_drDhI

https://youtu.be/Zdzhh_drDhI
duck://player/Zdzhh_drDhI
```

## Supported URLs

- YouTube watch URLs on `www.youtube.com`, `youtube.com`, and `m.youtube.com`
- YouTube Shorts URLs on `www.youtube.com`, `youtube.com`, and `m.youtube.com`
- `youtu.be` short URLs

## Local Install

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repository directory.

## Usage

1. Open YouTube in Chrome.
2. Right-click a video page, video link, or thumbnail.
3. Click `Duck Playerで再生`.
4. Confirm the external protocol prompt if Chrome shows one.

## Development

Run tests:

```bash
npm test
```

## License

MIT
