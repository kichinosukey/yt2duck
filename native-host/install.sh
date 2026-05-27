#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <chrome-extension-id>" >&2
  exit 1
fi

extension_id="$1"
if [[ ! "$extension_id" =~ ^[a-p]{32}$ ]]; then
  echo "Error: chrome extension id must match ^[a-p]{32}$" >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
host_path="${script_dir}/yt2duck_host.py"
template_path="${script_dir}/com.yt2duck.host.json"
install_dir="${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts"
manifest_path="${install_dir}/com.yt2duck.host.json"

if [[ ! -f "$host_path" ]]; then
  echo "Error: host not found: $host_path" >&2
  exit 1
fi

if [[ ! -f "$template_path" ]]; then
  echo "Error: manifest template not found: $template_path" >&2
  exit 1
fi

mkdir -p "$install_dir"
if [ ! -x "$host_path" ]; then
  chmod +x "$host_path"
fi

python3 - "$template_path" "$manifest_path" "$host_path" "$extension_id" <<'PY'
import json
import sys

template_path, manifest_path, host_path, extension_id = sys.argv[1:]

with open(template_path, "r", encoding="utf-8") as template_file:
    manifest = json.load(template_file)

manifest["path"] = host_path
manifest["allowed_origins"] = [f"chrome-extension://{extension_id}/"]

with open(manifest_path, "w", encoding="utf-8") as manifest_file:
    json.dump(manifest, manifest_file, indent=2)
    manifest_file.write("\n")
PY

echo "Installed manifest: $manifest_path"
