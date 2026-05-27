#!/usr/bin/env python3
import json
import struct
import subprocess
import sys
from urllib.parse import parse_qs, urlparse


ALLOWED_HOSTS = {"www.youtube.com", "youtube.com", "m.youtube.com"}
MAX_MESSAGE_SIZE = 1024 * 1024


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
    if message_length == 0 or message_length > MAX_MESSAGE_SIZE:
        raise ValueError("invalid message size")

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
