import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const template = JSON.parse(read('templates/product.cinnamon-berberine.json').replace(/^\\s*\\/\\*[\\s\\S]*?\\*\\//, ''));
assert.equal(template.order[0], 'information');
assert.equal(template.sections.information.type, 'av-cb-product-information');
assert.equal(new Set(template.order).size, template.order.length);
assert.ok(template.order.length >= 12, 'expected product information plus standalone sections');
for (const id of template.order) {
  const entry = template.sections[id];
  assert.ok(entry, 'missing entry: ' + id);
  const p = path.join(root, 'sections', entry.type + '.liquid');
  assert.ok(fs.existsSync(p), 'missing section: ' + p);
  const liquid = fs.readFileSync(p, 'utf8');
  const m = liquid.match(/{%\\s*schema\\s*%}([\\s\\S]*?){%\\s*endschema\\s*%}/);
  assert.ok(m, 'section has no JSON schema: ' + entry.type);
  const schema = JSON.parse(m[1]);
  assert.ok(schema.name.length <= 25, 'schema display name too long');
  const ids = (schema.settings || []).filter(x => x.id).map(x => x.id);
  assert.equal(ids.length, new Set(ids).size, 'duplicate setting in ' + entry.type);
}
const info = read('snippets/av-cb-information.liquid');
assert.ok(info.includes('data-av-cb'), 'product data root missing');
assert.ok(info.includes('av-cb__hero'), 'product purchase area missing');
assert.ok(!info.includes('class="av-cb__stats-section"'), 'stats must be an independent section');
assert.ok(info.includes('const nextInner = nextDrawer?.querySelector'), 'mounted cart drawer refresh missing');
assert.ok(!info.includes('currentSection.replaceWith(nextSection)'), 'drawer must not be replaced');
assert.ok(read('sections/cart-drawer-section.liquid').includes('"type": "payments"'), 'custom payment block missing');
console.log('Native product sections and cart invariants verified.');
