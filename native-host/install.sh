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
chmod +x "$host_path"

escaped_host_path="${host_path//\\/\\\\}"
escaped_host_path="${escaped_host_path//\"/\\\"}"
escaped_host_path="${escaped_host_path//&/\\&}"
escaped_host_path="${escaped_host_path//|/\\|}"

sed \
  -e "s|__YT2DUCK_HOST_PATH__|${escaped_host_path}|g" \
  -e "s|__CHROME_EXTENSION_ID__|${extension_id}|g" \
  "$template_path" > "$manifest_path"

echo "Installed manifest: $manifest_path"
