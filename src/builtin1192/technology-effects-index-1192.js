import armor from './technology-effects-armor-1192.js';
import artillery from './technology-effects-artillery-1192.js';
import bbaAir from './technology-effects-bba-air-1192.js';
import electronics from './technology-effects-electronics-1192.js';
import industry from './technology-effects-industry-1192.js';
import infantry from './technology-effects-infantry-1192.js';
import nsbArmor from './technology-effects-nsb-armor-1192.js';
import specialProjects from './technology-effects-special-projects-1192.js';
import support from './technology-effects-support-1192.js';

export const TECHNOLOGY_EFFECT_SOURCES_1192={armor,artillery,bbaAir,electronics,industry,infantry,nsbArmor,specialProjects,support};
export const TECHNOLOGY_EFFECTS_1192=Object.assign({},...Object.values(TECHNOLOGY_EFFECT_SOURCES_1192));
export const TECHNOLOGY_EFFECT_SOURCE_COUNTS_1192=Object.fromEntries(Object.entries(TECHNOLOGY_EFFECT_SOURCES_1192).map(([name,records])=>[name,Object.keys(records).length]));
export default TECHNOLOGY_EFFECTS_1192;
