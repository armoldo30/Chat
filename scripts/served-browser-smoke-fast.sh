#!/usr/bin/env bash
set -euo pipefail

root="${1:-dist}"
port="${HOI4_FAST_SMOKE_PORT:-4175}"
work="$(mktemp -d)"
python3 -m http.server "$port" --directory "$root" >"$work/server.log" 2>&1 &
server=$!
cleanup(){ kill "$server" 2>/dev/null || true; rm -rf "$work"; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -fsS "http://127.0.0.1:$port/" >/dev/null && break
  sleep .2
done
curl -fsS "http://127.0.0.1:$port/methodology.html" >/dev/null
curl -fsS "http://127.0.0.1:$port/about.html" >/dev/null

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

run_route battle '1440,1000' 3000 desktop
run_route gauntlet '1440,1000' 5000 desktop
run_route tank '1440,1000' 3000 desktop
run_route battle '390,844' 3500 mobile
run_route air '390,844' 3500 mobile

echo 'Fast presentation browser smoke passed.'
