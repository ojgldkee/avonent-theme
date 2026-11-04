/**
 * Import Avonent landing-page media into ANOTHER Shopify store.
 * Reads the version-controlled image manifest; --apply is required to change a store.
 *
 * Preview: node scripts/import-theme-media.mjs --store example.myshopify.com
 * Import:  SHOPIFY_ADMIN_ACCESS_TOKEN=... node scripts/import-theme-media.mjs --store example.myshopify.com --apply
 *
 * By default uses GitHub-hosted backup images. Use --source shopify only while
 * the original Shopify CDN links are still accessible.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
function arg(name) { const i = argv.indexOf(name); return i < 0 ? null : argv[i + 1]; }
const store = arg('--store') || process.env.SHOPIFY_DEST_STORE;
const apply = argv.includes('--apply');
const source = arg('--source') || 'github';
const version = process.env.SHOPIFY_API_VERSION || '2026-10';
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!store || !/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.myshopify\.com$/.test(store)) {
  throw new Error('Use --store DESTINATION.myshopify.com (not your storefront domain).');
}
if (!['github', 'shopify'].includes(source)) throw new Error('Valid --source values: github or shopify');
if (apply && !token) throw new Error('--apply requires SHOPIFY_ADMIN_ACCESS_TOKEN set for the destination store.');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'backups/theme-media-manifest.json'), 'utf8'));
const images = manifest.images || [];
console.log('Destination: ' + store);
console.log('Source: ' + source);
console.log('Referenced theme images: ' + images.length);
if (!apply) {
  console.log('DRY RUN: no destination files changed. Add --apply and SHOPIFY_ADMIN_ACCESS_TOKEN to import.');
  console.log('After importing, deploy the theme and verify image settings in the Shopify editor.');
  process.exit(0);
}
async function graphql(query, variables = {}) {
  const endpoint = 'https://' + store + '/admin/api/' + version + '/graphql.json';
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query, variables })
    });
    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 4) {
      await new Promise(resolve => setTimeout(resolve, 1200 * attempt * attempt));
      continue;
    }
    if (!response.ok) throw new Error('Shopify Admin API HTTP ' + response.status);
    const data = await response.json();
    if (data.errors?.length) throw new Error('GraphQL: ' + JSON.stringify(data.errors).slice(0, 1000));
    return data.data;
  }
  throw new Error('Failed to call Shopify Admin API');
}
const existing = new Set();
const queryFiles = 'query ExistingFiles($after: String) { files(first: 50, after: $after) { nodes { __typename ... on MediaImage { image { url } } ... on GenericFile { url } } pageInfo { hasNextPage endCursor } } }';
let after = null;
for (let page = 0; page < 100; page++) {
  const data = await graphql(queryFiles, { after });
  for (const file of data.files.nodes) {
    const url = file.image?.url || file.url;
    if (url && url.includes('/files/')) existing.add(decodeURIComponent(url.split('/files/').pop().split('?')[0]));
  }
  if (!data.files.pageInfo.hasNextPage) break;
  after = data.files.pageInfo.endCursor;
}
const pending = images.filter(item => !existing.has(item.filename));
console.log('Already in destination: ' + (images.length - pending.length) + '; importing: ' + pending.length);
const mutation = 'mutation ImportThemeImages($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id fileStatus } userErrors { field message } } }';
let uploaded = 0;
for (let i = 0; i < pending.length; i += 10) {
  const chunk = pending.slice(i, i + 10);
  const inputs = chunk.map(item => ({
    contentType: 'IMAGE',
    duplicateResolutionMode: 'RAISE_ERROR',
    filename: item.filename,
    alt: item.alt || '',
    originalSource: source === 'shopify'
      ? item.source_url
      : 'https://raw.githubusercontent.com/ojgldkee/avonent-theme/main/media/theme/' + encodeURIComponent(item.filename)
  }));
  const data = await graphql(mutation, { files: inputs });
  const errors = data.fileCreate.userErrors || [];
  if (errors.length) throw new Error('File import failed: ' + JSON.stringify(errors));
  uploaded += (data.fileCreate.files || []).filter(Boolean).length;
  console.log('Submitted ' + uploaded + ' / ' + pending.length + ' images to Shopify');
}
console.log('Complete. Shopify may process image files asynchronously; verify media in Content > Files and review the page after upload.');
