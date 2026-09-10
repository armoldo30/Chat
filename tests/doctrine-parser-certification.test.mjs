import assert from 'node:assert/strict';
import { parseClausewitz } from '../src/parser.js';
import { extractDoctrines, extractDoctrineMetadata, buildExtendedDataPack } from '../src/gameDataParser.js';

const nodeSource=`
@xp = 100
fixture_doctrine = {
  folder = land
  track = infantry
  xp_cost = @xp
  available = { has_tech = required_tech }
  visible = { has_dlc = "Visible DLC" }
  xor = { alternate_a alternate_b }
  ai_will_do = {
    modifier = { factor = 10 has_tech = ai_only_tech has_dlc = "AI DLC" }
  }
  soft_attack = 0.05
  rewards = { first = { max_organisation = 2 } }
}
`;
const parsed=extractDoctrines(parseClausewitz(nodeSource),'subdoctrine','common/doctrines/subdoctrines/fixture.txt');
assert.deepEqual(Object.keys(parsed),['fixture_doctrine'],'@ script variables must not become doctrine nodes');
const doc=parsed.fixture_doctrine;
assert.equal(doc.kind,'subdoctrine');
assert.equal(doc.sourceFile,'common/doctrines/subdoctrines/fixture.txt');
assert.equal(doc.track,'infantry');
assert.deepEqual(doc.xor,['alternate_a','alternate_b']);
assert.deepEqual(doc.requirements.xor,['alternate_a','alternate_b']);
assert.ok(doc.prerequisites.includes('required_tech'));
assert.ok(doc.prerequisites.includes('Visible DLC'));
assert.ok(!doc.prerequisites.includes('ai_only_tech'),'AI doctrine weighting must not contaminate player requirement metadata');
assert.ok(!doc.prerequisites.includes('AI DLC'),'AI DLC weighting must not contaminate player requirement metadata');
assert.equal(doc.requirements.available.has_tech,'required_tech');
assert.equal(doc.requirements.visible.has_dlc,'Visible DLC');
assert.equal(doc.raw.ai_will_do.modifier.has_tech,'ai_only_tech','AI data remains preserved in raw source metadata');

const metadataSource=`DOCTRINE_fixture_ai = { enable = { has_doctrine = fixture_doctrine } ai_strategy = { type = role_ratio id = infantry value = 10 } }`;
const metadata=extractDoctrineMetadata(parseClausewitz(metadataSource),'common/ai_strategy/DOCTRINE_fixture.txt');
assert.deepEqual(Object.keys(metadata),['DOCTRINE_fixture_ai']);
assert.equal(metadata.DOCTRINE_fixture_ai.kind,'metadata');
assert.equal(metadata.DOCTRINE_fixture_ai.sourceFile,'common/ai_strategy/DOCTRINE_fixture.txt');

const nodeFile={name:'fixture.txt',webkitRelativePath:'common/doctrines/subdoctrines/fixture.txt',text:async()=>nodeSource};
const metadataFile={name:'DOCTRINE_fixture.txt',webkitRelativePath:'common/ai_strategy/DOCTRINE_fixture.txt',text:async()=>metadataSource};
const pack=await buildExtendedDataPack([nodeFile,metadataFile]);
assert.ok(pack.doctrines.fixture_doctrine,'real doctrine directory record belongs in doctrine node catalog');
assert.equal(pack.doctrines.DOCTRINE_fixture_ai,undefined,'AI doctrine-labelled metadata must not enter doctrine node catalog');
assert.ok(pack.doctrineMetadata.DOCTRINE_fixture_ai,'AI doctrine-labelled metadata is preserved separately');
assert.equal(pack.meta.doctrineCount,1);
assert.equal(pack.meta.doctrineMetadataCount,1);

console.log('Doctrine parser/catalog certification passed.');
