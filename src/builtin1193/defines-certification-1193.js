import { DEFINE_VALUES_1192 } from '../builtin1192/defines-certification-1192.js';

export const DEFINE_VALUES_1193=Object.freeze({
  NMilitary:Object.freeze({...DEFINE_VALUES_1192.NMilitary}),
  NProduction:Object.freeze({...DEFINE_VALUES_1192.NProduction})
});

export const DEFINES_SOURCE_1193=Object.freeze({
  gameVersion:'1.19.3',
  source:'user-provided HOI4 1.19.3 common/defines',
  sourceFiles:[
    {path:'common/defines/00_defines.lua',bytes:405823,sha256:'881b4076a41355fd67771064770338791fc7076bff1038c6271bb0dd0b717ac6'},
    {path:'common/defines/00_graphics.lua',bytes:89354,sha256:'dfdab0a5fad7319d7b5ac524d98af49d3a0c1f95772e6b7a76abce54836f3d86'},
    {path:'common/defines/01_career_profile.lua',bytes:3101,sha256:'49a3c68dde41a092b1af94674db6369a7abcfc0445153bb9da248cdb3f5c8604'}
  ],
  plannerConsumedSourceDefineValues:36,
  consumedValuesChangedFrom1192:0
});

export const DEFINES_CERTIFICATION_1193=Object.freeze({
  gameVersion:'1.19.3',
  classification:'game-file-exact-consumed-defines',
  sourceBoundary:{
    authoritativeRawGameDefinesRetained:true,
    plannerConsumedSourceDefineValues:36,
    valuesChangedFrom1192:0,
    note:'The planner-consumed 1.19.3 define values were re-audited against the supplied common/defines files and are numerically identical to the certified 1.19.2 consumed set. Executable transformations remain separately classified and require 1.19.3 Oracle revalidation.'
  },
  executableClassification:'1.19.2-executable-inferred-carried-forward-pending-1.19.3-oracle'
});

export default DEFINES_CERTIFICATION_1193;
