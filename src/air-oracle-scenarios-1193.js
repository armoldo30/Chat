export const AIR_ORACLE_1193_TARGET=Object.freeze({
  gameVersion:'1.19.3.0.c01a',
  checksum:'5632',
  mission:'air_superiority'
});

const scenario=(id,group,variable,description,minimumTrials=20)=>Object.freeze({
  id,group,variable,description,minimumTrials,mission:'air_superiority'
});

export const AIR_ORACLE_1193_SCENARIOS=Object.freeze([
  scenario('A01','formula','baseline','Identical land-based fighters, equal counts, equal operational conditions.'),
  scenario('A02','formula','airAttack','Change only Air Attack on side A.'),
  scenario('A03','formula','airDefense','Change only Air Defense on side A.'),
  scenario('A04','formula','agility','Change only Agility on side A.'),
  scenario('A05','formula','maxSpeed','Change only Max Speed on side A.'),
  scenario('A06','formula','countRatio2to1','Use a 2:1 numerical advantage with otherwise identical aircraft and conditions.'),
  scenario('A07','formula','countRatio3to1','Use a 3:1 numerical advantage with otherwise identical aircraft and conditions.'),
  scenario('A08','formula','countRatioAbove3to1','Use a ratio above 3:1 to probe the engagement-cap boundary.'),
  scenario('A09','participation','detection','Change only displayed detection for one side.'),
  scenario('A10','participation','missionEfficiency','Change only displayed mission efficiency for one side.'),
  scenario('A11','participation','rangeCoverage','Change only range/air-region coverage while retaining the same aircraft stats.'),
  scenario('A12','participation','doctrineDetection','Change only an Air Superiority doctrine detection modifier.'),
  scenario('A13','environment','dayNight','Compare controlled day and night windows with all other conditions fixed.'),
  scenario('A14','environment','weather','Change only controlled weather.'),
  scenario('A15','quality','wingExperience','Change only wing experience.'),
  scenario('A16','quality','ace','Add/remove an ace while preserving all other controlled state.')
]);

export const AIR_ORACLE_1193_PHASE1_REQUIRED_FIELDS=Object.freeze([
  'metadata.gameVersion',
  'metadata.checksum',
  'metadata.scenarioId',
  'controlled.mission',
  'controlled.countA',
  'controlled.countB',
  'controlled.aircraftA',
  'controlled.aircraftB',
  'trials[].lossA',
  'trials[].lossB',
  'trials[].windowHours'
]);
