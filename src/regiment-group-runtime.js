import { battalions } from './data.js';
import { normalizeBattalionRegimentGroups } from './regiment-groups.js';

// main.js hydrates the bundled/imported game pack during module startup. Apply the
// source-aware regiment grouping immediately afterward so all later designer picks
// see the same structural groups as the 1.19.2 sub-unit records.
normalizeBattalionRegimentGroups(battalions);
