import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import q101 from '../src/builtin1192/q1_01.js';
import q1bridge from '../src/builtin1192/q1_bridge.js';
import q1b01 from '../src/builtin1192/q1b_01.js';
import q1b02 from '../src/builtin1192/q1b_02.js';
import q1b03 from '../src/builtin1192/q1b_03.js';
import q1b04 from '../src/builtin1192/q1b_04.js';
import q1b05 from '../src/builtin1192/q1b_05.js';
import q1b06 from '../src/builtin1192/q1b_06.js';
import q201 from '../src/builtin1192/q2_01.js';
import q202 from '../src/builtin1192/q2_02.js';
import q203 from '../src/builtin1192/q2_03.js';
import q204 from '../src/builtin1192/q2_04.js';
import q205 from '../src/builtin1192/q2_05.js';
import q206 from '../src/builtin1192/q2_06.js';
import q207 from '../src/builtin1192/q2_07.js';
import q301 from '../src/builtin1192/q3_01.js';
import q302 from '../src/builtin1192/q3_02.js';
import q303 from '../src/builtin1192/q3_03.js';
import q304 from '../src/builtin1192/q3_04.js';
import q305 from '../src/builtin1192/q3_05.js';
import q306 from '../src/builtin1192/q3_06.js';

const chunks={q101,q1bridge,q1b01,q1b02,q1b03,q1b04,q1b05,q1b06,q201,q202,q203,q204,q205,q206,q207,q301,q302,q303,q304,q305,q306};
const expected={
 q101:[7000,'1579baa2b4b5df3fa9a7e674daea60fac0a4c897a87787c14e6b5eeffc1ac811'],
 q1bridge:[2984,'67e1bd553351f935635353895bc69ef672a13695c6e318f061fd238d4dfbbb81'],
 q1b01:[7000,'7870476f95d3df2e30069caf3f85d6969ca9bca90a8f67f1a68c4e5751885d9b'],
 q1b02:[7000,'ff0faa08542d9190e157bfe97912452cdb54a48cce9e2e06d3155168701125ec'],
 q1b03:[7000,'466832ef4b56acd55987d47b069396d8833f91b1c272aca029b5108b07447cca'],
 q1b04:[7000,'6f1c89f0c2c612930ce72068a5d37da9090c9d6d57b88b59d08562ffce15b626'],
 q1b05:[7000,'2ff31d1640f3bbbd935e254b66f78b6c38768862582d66d926ffc36ceb31eef7'],
 q1b06:[3016,'00ad85ce12a230cb6f55eee8d9696893cdda72960260001ba06878847c844afd'],
 q201:[7000,'333c4c3869318f944e9fe996dc9691822bc31a0ce0662e204ff01c76d83482d9'],
 q202:[7000,'c5144af025e0c9bb17a3666d9054be83932a8d0ed7f7538d12460982cf19a0bf'],
 q203:[7000,'11305a139f10fdcb82f089a0e480a078c357c788e28f265637731a071f725592'],
 q204:[7000,'d19435b0d0d28f799a4a58b64fb04c8ea81472cf85330c2487876c14a4dc3973'],
 q205:[7000,'f98f941ea9f8f7f97c1728673468fbb36ed12d7776f6270b2b0710fef33079fb'],
 q206:[7000,'f8d6f1a4d1588196b46401afc8fb95b00222627c9803505c170651781958b5cf'],
 q207:[6000,'a7a0a3caf0df77a50dbb0814b138930a52bb2d742fb912be3095713bc9e0bf54'],
 q301:[7000,'c77fb857333b325c13da360a15f99a94693f3eff99180b1df14e22add0e1a158'],
 q302:[7000,'9d95fef91314a54de95c90ef66af8b16f744ab4ff39e0cc958f22dd646c52e4c'],
 q303:[7000,'9fe3da01a50fed4a2f70f9497d39e6eeb8cbcfdb75439b44beb4ad70db7e3846'],
 q304:[7000,'0f70aadb9d402557fc172d5f782b7e9694812de8c749797b6eb58562a97a05da'],
 q305:[7000,'b3f1f0783c2b2f4ce86a643b78e63b396e37b5665838e37c6960581e69a3b462'],
 q306:[4544,'486a4bfa8fcc3b3718cc060b5312e8ecc576014791116e69e65abf1cffb6eb5b']
};
const sha=s=>createHash('sha256').update(s).digest('hex');
for(const [name,value] of Object.entries(chunks)){
 const [length,hash]=expected[name];
 assert.equal(value.length,length,`${name} length`);
 assert.equal(sha(value),hash,`${name} authoritative payload hash`);
}
const DATA=Object.values(chunks).join('');
assert.equal(DATA.length,135544,'assembled base64 length');
assert.equal(sha(DATA),'89a1a8b06abfa5771569eae611749a654be8ce5a5cb16b84f409e5d4da0206bb','assembled authoritative stream hash');
console.log('bundled 1.19.2 stream integrity passed');
