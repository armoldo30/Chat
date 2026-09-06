export const DATA_VERSION='1.18-combat-foundation';
export const RESOURCES=['steel','aluminum','rubber','tungsten','chromium'];
export const equipment={
 infantry_equipment:{name:'Infantry Equipment',cost:.5,output:4.5,resources:{steel:2}},
 artillery:{name:'Artillery',cost:3.5,output:.65,resources:{steel:2,tungsten:1}},
 support_equipment:{name:'Support Equipment',cost:4,output:.55,resources:{steel:2}},
 motorized:{name:'Motorized',cost:2.5,output:.8,resources:{steel:1,rubber:1}},
 mechanized:{name:'Mechanized',cost:8,output:.3,resources:{steel:2,rubber:2}},
 light_tank:{name:'Light Tank',cost:4,output:.45,resources:{steel:2,rubber:1}},
 medium_tank:{name:'Medium Tank',cost:10,output:.18,resources:{steel:3,tungsten:1,rubber:1}},
 heavy_tank:{name:'Heavy Tank',cost:12,output:.14,resources:{steel:3,tungsten:2}},
 fighter:{name:'Fighter',cost:20,output:.09,resources:{aluminum:3,rubber:1}},
 cas:{name:'CAS',cost:24,output:.075,resources:{aluminum:3,rubber:1}},
 tactical_bomber:{name:'Tactical Bomber',cost:26,output:.07,resources:{aluminum:3,rubber:1}},
 truck:{name:'Transport / Truck',cost:2.5,output:.8,resources:{steel:1,rubber:1}},
 anti_tank:{name:'Anti-Tank',cost:3.5,output:.65,resources:{steel:2,tungsten:1}},
 anti_air:{name:'Anti-Air',cost:3.5,output:.65,resources:{steel:2,tungsten:1}}
};
export const armyTemplates={
 infantry:{name:'Infantry 9/1 example',equipment:{infantry_equipment:120,artillery:12,support_equipment:30},manpower:9000},
 infantry_standard:{name:'Infantry standard example',equipment:{infantry_equipment:100,support_equipment:30},manpower:9000},
 motorized:{name:'Motorized example',equipment:{motorized:80,support_equipment:30,truck:20},manpower:12000},
 medium:{name:'Medium tank example',equipment:{medium_tank:100,motorized:60,support_equipment:30},manpower:12000}
};
// Baseline province widths used by the combat model. These are deliberately data-driven so a future HOI4 version pack can replace them.
export const terrain={
 plains:{name:'Plains',width:90,reinforceWidth:45,attack:0,def:0},
 desert:{name:'Desert',width:90,reinforceWidth:45,attack:0,def:0},
 forest:{name:'Forest',width:84,reinforceWidth:42,attack:-.10,def:.05},
 jungle:{name:'Jungle',width:84,reinforceWidth:42,attack:-.20,def:.05},
 hills:{name:'Hills',width:80,reinforceWidth:40,attack:-.10,def:.05},
 mountain:{name:'Mountain',width:75,reinforceWidth:25,attack:-.30,def:.10},
 marsh:{name:'Marsh',width:78,reinforceWidth:26,attack:-.20,def:.10},
 urban:{name:'Urban',width:96,reinforceWidth:32,attack:-.20,def:.10}
};
export const battalions={
 infantry:{name:'Infantry',width:2,manpower:1000,org:60,hp:25,supply:.07,soft:6,hard:1,def:22,breakthrough:3,hardness:0,armor:0,piercing:1,need:{infantry_equipment:100},terrain:{}},
 motorized:{name:'Motorized',width:2,manpower:1200,org:60,hp:25,supply:.11,soft:6,hard:1,def:22,breakthrough:3,hardness:0,armor:0,piercing:1,need:{infantry_equipment:100,motorized:50},terrain:{forest:-.10,jungle:-.20,marsh:-.10,mountain:-.05,urban:-.10}},
 mechanized:{name:'Mechanized',width:2,manpower:1200,org:60,hp:30,supply:.18,soft:6.1,hard:5,def:22,breakthrough:3,hardness:.20,armor:2,piercing:1,need:{infantry_equipment:100,mechanized:50},terrain:{forest:-.20,jungle:-.30,marsh:-.10,mountain:-.05,urban:-.20}},
 artillery:{name:'Artillery',width:3,manpower:500,org:20,hp:5,supply:.16,soft:34,hard:16,def:12,breakthrough:5,hardness:0,armor:0,piercing:6,need:{artillery:12},terrain:{}},
 anti_tank:{name:'Anti-Tank',width:1,manpower:500,org:20,hp:5,supply:.16,soft:5,hard:18,def:10,breakthrough:4,hardness:0,armor:0,piercing:30,need:{anti_tank:36},terrain:{}},
 anti_air:{name:'Anti-Air',width:1,manpower:500,org:20,hp:5,supply:.16,soft:8,hard:5,def:10,breakthrough:4,hardness:0,armor:0,piercing:10,need:{anti_air:36},terrain:{}},
 cavalry:{name:'Cavalry',width:2,manpower:1000,org:60,hp:25,supply:.08,soft:6,hard:1,def:20,breakthrough:2,hardness:0,armor:0,piercing:1,need:{infantry_equipment:100},terrain:{}}
};
export const supports={
 engineer:{name:'Engineer',soft:0,hard:0,def:0,breakthrough:0,supply:.05,armor:0,piercing:0,need:{support_equipment:30},terrain:{forest:.10,jungle:.10,marsh:.10,mountain:.10}},
 support_artillery:{name:'Support Artillery',soft:15,hard:0,def:0,breakthrough:0,supply:.04,armor:0,piercing:0,need:{artillery:12},terrain:{}},
 recon:{name:'Recon',soft:0,hard:0,def:0,breakthrough:0,supply:.02,armor:0,piercing:0,need:{infantry_equipment:40,support_equipment:10},terrain:{}},
 support_aa:{name:'Support AA',soft:5,hard:10,def:0,breakthrough:0,supply:.04,armor:0,piercing:10,need:{anti_air:20,support_equipment:10},terrain:{}}
};
