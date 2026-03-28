#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  exec /Users/kevinliu/.codex/bin/open-chrome-debug.sh
fi

exec /Users/kevinliu/.codex/bin/open-chrome-debug.sh "$@"
