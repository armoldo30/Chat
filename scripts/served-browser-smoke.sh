#!/usr/bin/env bash
set -euo pipefail

root="${1:-dist}"
port="${HOI4_SMOKE_PORT:-4173}"
work="$(mktemp -d)"
python3 -m http.server "$port" --directory "$root" >"$work/server.log" 2>&1 &
server=$!
cleanup(){ kill "$server" 2>/dev/null || true; rm -rf "$work"; }
trap cleanup EXIT
for i in $(seq 1 40); do curl -fsS "http://127.0.0.1:$port/" >/dev/null && break; sleep .2; done
curl -fsS "http://127.0.0.1:$port/privacy.html" >/dev/null
curl -fsS "http://127.0.0.1:$port/robots.txt" | grep -q 'Allow: /'

browser="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || true)"
test -n "$browser"

run_route(){
  local route="$1" size="$2" budget="$3" label="$4"
  local dom="$work/${label}-${route}.html" log="$work/${label}-${route}.log"
  "$browser" --headless=new --no-sandbox --disable-gpu --window-size="$size" --virtual-time-budget="$budget" --dump-dom "http://127.0.0.1:$port/#$route" >"$dom" 2>"$log"
  python3 scripts/audit-rendered-dom.py "$dom" "$label/$route"
  if grep -Eqi 'Uncaught (ReferenceError|TypeError|SyntaxError)|Unhandled Promise Rejection' "$log"; then
    cat "$log" >&2
    echo "Browser console/runtime error detected on $label/$route" >&2
    return 1
  fi
}

for route in battle gauntlet tank air production data scenario; do
  budget=4500
  [[ "$route" == "gauntlet" ]] && budget=8000
  run_route "$route" '1440,1000' "$budget" desktop
done

for route in battle tank air scenario gauntlet; do
  budget=5000
  [[ "$route" == "gauntlet" ]] && budget=8000
  run_route "$route" '390,844' "$budget" mobile
done

echo 'Served desktop/mobile route crawl passed.'
