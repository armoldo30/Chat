import core from './localization-english-1192-core.js';
import equipment from './localization-english-1192-equipment.js';
import tankModules from './localization-english-1192-tank-modules.js';
import airEquipment from './localization-english-1192-air-equipment.js';
import airModules from './localization-english-1192-air-modules.js';
import researchAF from './localization-english-1192-research-a-f.js';
import researchGM from './localization-english-1192-research-g-m.js';
import researchNS from './localization-english-1192-research-n-s.js';
import researchTZ from './localization-english-1192-research-t-z.js';
import doctrinesGM from './localization-english-1192-doctrines-g-m.js';
import doctrinesNZ from './localization-english-1192-doctrines-n-z.js';
import mioCategories from './localization-english-1192-mio-categories.js';
import mioOrganizationsAM from './localization-english-1192-mio-organizations-a-m.js';

/*
 * Source-backed HOI4 1.19.2 English display-name catalog.
 *
 * These compact chunks were extracted from the user's authoritative
 * localisation/english upload. They intentionally retain display labels only;
 * descriptions, tooltips, events, and the full localisation corpus are not
 * redistributed by the planner.
 *
 * MIO coverage here is intentionally partial: only the authoritative MIO
 * equipment-category labels and organization labels A-M that were already
 * preserved on this branch are included. Missing MIO organization/trait labels
 * continue to use existing readable fallbacks until their authoritative source
 * extraction is recovered; they are not reconstructed from IDs or memory.
 */
const chunks=[
  core,equipment,tankModules,airEquipment,airModules,
  researchAF,researchGM,researchNS,researchTZ,doctrinesGM,doctrinesNZ,
  mioCategories,mioOrganizationsAM
];

export const BUILTIN_ENGLISH_LOCALIZATION_1192=Object.freeze(Object.assign({},...chunks));
const resolvedCount=Object.keys(BUILTIN_ENGLISH_LOCALIZATION_1192).length;

export const BUILTIN_ENGLISH_LOCALIZATION_1192_META=Object.freeze({
  gameVersion:'1.19.2',
  language:'english',
  source:'user-provided HOI4 1.19.2 localisation/english',
  generated:true,
  generatedAt:'2026-09-14T02:43:00Z',
  sourceFileCount:206,
  sourceDigestSha256:'01e79c3cc4e8c764c2fa22cd7ef2d0aefd081724ed169473072e192919b86133',
  sourceArchiveSha256:'177255e4b2ccaf237fe4747096e0272eda142ae44d0acfa10f738594ee27d623',
  targetCount:resolvedCount,
  resolvedCount,
  unresolvedCount:0,
  sourceKeyMode:'identity-object-keys',
  scope:'planner-facing unit, terrain, equipment, tank/air designer, technology, doctrine, and preserved partial MIO display labels'
});

// Chunk generation retained exact localisation keys as object keys, so a
// separate per-entry source-key table would duplicate the catalog in the
// production bundle without improving runtime resolution.
export const BUILTIN_ENGLISH_LOCALIZATION_1192_SOURCE_KEYS=Object.freeze({});

export default BUILTIN_ENGLISH_LOCALIZATION_1192;
