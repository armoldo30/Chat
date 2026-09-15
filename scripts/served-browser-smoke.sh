#!/usr/bin/env bash
set -euo pipefail

root="${1:-dist}"
port="${HOI4_SMOKE_PORT:-4173}"
work="$(mktemp -d)"
interactive_server=""
python3 -m http.server "$port" --directory "$root" >"$work/server.log" 2>&1 &
server=$!
cleanup(){
  kill "$server" 2>/dev/null || true
  if [[ -n "$interactive_server" ]]; then kill "$interactive_server" 2>/dev/null || true; fi
  rm -rf "$work"
}
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

for route in battle counter gauntlet tank air data scenario; do
  budget=4500
  [[ "$route" == "gauntlet" ]] && budget=8000
  run_route "$route" '1440,1000' "$budget" desktop
done

for route in battle counter tank air scenario gauntlet; do
  budget=5000
  [[ "$route" == "gauntlet" ]] && budget=8000
  run_route "$route" '390,844' "$budget" mobile
done

# Division building and Counter Analysis must expose direct navigation into the real Combat test.
grep -q 'data-combat-test-shortcut="1"' "$work/desktop-battle.html"
grep -q 'TEST THIS DIVISION' "$work/desktop-battle.html"
grep -q 'data-combat-test-shortcut="1"' "$work/desktop-counter.html"
grep -q 'COMBAT TEST' "$work/desktop-counter.html"
grep -q 'data-combat-test-shortcut="1"' "$work/mobile-battle.html"
grep -q 'data-combat-test-shortcut="1"' "$work/mobile-counter.html"

# Actually exercise Counter Analysis and the Combat terrain selector in an isolated copy of the built site.
# The injected missing image deliberately fires a non-critical resource error after the runtime
# guard is active; that must not produce the global planner-recovery banner.
interactive_root="$work/interactive-root"
cp -R "$root" "$interactive_root"
python3 - "$interactive_root/index.html" <<'PY'
from pathlib import Path
import sys
path=Path(sys.argv[1])
text=path.read_text()
hook=r'''<script>
(()=>{
  const runCounter=()=>{
    const button=document.getElementById('runCounterSearch');
    if(!button){setTimeout(runCounter,50);return;}
    const img=new Image();img.alt='';img.hidden=true;img.src='./__intentional_smoke_missing_resource__.png';document.body.append(img);
    button.click();
  };
  const terrainSelectionIsClean=()=>{
    const select=document.getElementById('b-terrain');
    const buttons=[...document.querySelectorAll('.terrain-choices .quick-visual-choice')];
    const selected=buttons.filter(button=>button.classList.contains('selected'));
    return !!select&&selected.length===1&&selected[0].dataset.value===select.value;
  };
  const runTerrain=()=>{
    const combat=document.querySelector('[data-lab-panel="combat"]');
    if(!combat){setTimeout(runTerrain,50);return;}
    combat.click();
    setTimeout(()=>{
      const select=document.getElementById('b-terrain');
      const buttons=[...document.querySelectorAll('.terrain-choices .quick-visual-choice')];
      if(!select||buttons.length<2){document.body.dataset.terrainSelectionSmoke='fail';return;}
      const target=buttons.find(button=>button.dataset.value!==select.value);
      if(!target){document.body.dataset.terrainSelectionSmoke='fail';return;}
      target.click();
      const immediate=terrainSelectionIsClean();
      document.querySelector('[data-lab-panel="template"]')?.click();
      setTimeout(()=>{
        document.querySelector('[data-lab-panel="combat"]')?.click();
        setTimeout(()=>{
          document.body.dataset.terrainSelectionSmoke=immediate&&terrainSelectionIsClean()?'pass':'fail';
        },120);
      },120);
    },120);
  };
  if(location.hash==='#counter')setTimeout(runCounter,250);
  if(location.hash==='#battle')setTimeout(runTerrain,250);
})();
</script>'''
path.write_text(text.replace('</body>',hook+'\n</body>'))
PY
interactive_port=$((port+1))
python3 -m http.server "$interactive_port" --directory "$interactive_root" >"$work/interactive-server.log" 2>&1 &
interactive_server=$!
for i in $(seq 1 40); do curl -fsS "http://127.0.0.1:$interactive_port/" >/dev/null && break; sleep .2; done

run_counter_interaction(){
  local size="$1" label="$2"
  local dom="$work/${label}-counter-interaction.html" log="$work/${label}-counter-interaction.log"
  "$browser" --headless=new --no-sandbox --disable-gpu --window-size="$size" --virtual-time-budget=15000 --dump-dom "http://127.0.0.1:$interactive_port/#counter" >"$dom" 2>"$log"
  python3 scripts/audit-rendered-dom.py "$dom" "$label/counter-interaction"
  grep -q 'IMPROVE ATTACKER' "$dom"
  grep -q 'IMPROVE DEFENDER' "$dom"
  grep -q 'Recommended attacker improvements' "$dom"
  if grep -q 'data-runtime-error="1"' "$dom"; then
    echo "Global planner recovery appeared during $label Counter Analysis interaction." >&2
    return 1
  fi
  if grep -q 'Counter Analysis could not complete safely' "$dom"; then
    echo "Counter Analysis local failure appeared during $label interaction." >&2
    return 1
  fi
  if grep -Eqi 'Uncaught (ReferenceError|TypeError|SyntaxError)|Unhandled Promise Rejection' "$log"; then
    cat "$log" >&2
    echo "Browser console/runtime error detected during $label Counter Analysis interaction." >&2
    return 1
  fi
}
run_counter_interaction '1440,1000' desktop
run_counter_interaction '390,844' mobile

run_terrain_interaction(){
  local size="$1" label="$2"
  local dom="$work/${label}-terrain-interaction.html" log="$work/${label}-terrain-interaction.log"
  "$browser" --headless=new --no-sandbox --disable-gpu --window-size="$size" --virtual-time-budget=6000 --dump-dom "http://127.0.0.1:$interactive_port/#battle" >"$dom" 2>"$log"
  grep -q 'data-terrain-selection-smoke="pass"' "$dom"
  if grep -Eqi 'Uncaught (ReferenceError|TypeError|SyntaxError)|Unhandled Promise Rejection' "$log"; then
    cat "$log" >&2
    echo "Browser console/runtime error detected during $label terrain interaction." >&2
    return 1
  fi
}
run_terrain_interaction '1440,1000' desktop
run_terrain_interaction '390,844' mobile

# Legacy operational-planning hashes must land in the current analysis workflow.
run_route dashboard '1440,1000' 4500 legacy
if ! grep -q '<h1>Division Lab</h1>' "$work/legacy-dashboard.html"; then
  echo 'Legacy #dashboard did not resolve to Division Lab.' >&2
  exit 1
fi
if grep -Eq 'GENERAL STAFF · THEATRE COMMAND|OPERATION READINESS|Operation order|Industrial command' "$work/legacy-dashboard.html"; then
  echo 'Retired Command dashboard rendered from legacy #dashboard hash.' >&2
  exit 1
fi

echo 'Served desktop/mobile route, Counter interaction, and terrain selection crawl passed.'
