# HOI4 War Planner 0.14.2 — Release Notes

## Veteran-familiarity UI

0.14.2 is a focused interaction redesign. It does not intentionally alter combat, air, doctrine, MIO, tank, or production mechanics. The goal is that an experienced HOI4 player can recognize the workflows without learning a dashboard-style interface.

## Headline changes

- Replaced the tall desktop sidebar with a compact horizontal command strip.
- Reorganized Division Lab into **Template / Tech & MIO / Combat / Analysis** modes.
- Battalion, divisional-support, and regimental-support selection now opens in a centered HOI-style picker overlay.
- Compressed the Division Designer stat language to familiar ORG / SA / HA / DEF / BRK / ARM / PIER conventions with hover titles.
- Moved simulation-only settings behind an Advanced combat assumptions disclosure.
- Kept the primary battle row focused on terrain, directions, entrenchment, forts, rivers, supply, and air.
- Reduced additional chrome, padding, and explanatory copy across the interface.
- Collapsed Tank/Air MIO and air-doctrine controls into equipment drawers so module design remains the primary task.
- Simplified Air Lab test setup to mission + aircraft counts, with detection/sortie/mission-efficiency assumptions under Advanced.
- Moved Industry assumptions, resources, and stockpiles into one setup drawer so recommended production lines stay primary.
- Preserved the 0.14.1 mechanical model unchanged.

## Verification

- `npm test` — PASS
- `npm run build` — PASS
- JavaScript syntax validation — PASS
- Route-level UI smoke tests — PASS
- GitHub Pages workflow retained
