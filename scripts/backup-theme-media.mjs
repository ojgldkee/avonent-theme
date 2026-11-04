/**
 * Back up images referenced by the Avonent Shopify theme.
 * Runs in GitHub Actions using the CDN links collected at export time.
 * No Shopify Admin token is needed; only public storefront files are fetched.
 */
import { readFile, mkdir, stat, rename, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'backups/theme-media-manifest.json'), 'utf8'));
const destination = join(root, 'media', 'theme');
const MAX_BYTES = 50 * 1024 * 1024;
await mkdir(destination, { recursive: true });
let next = 0;
let copied = 0;
let skipped = 0;
const failed = [];

function validate(entry) {
  const name = entry.filename;
  if (typeof name !== 'string' || !/^[\w .()%-]+\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name) || name === '.' || name === '..') {
    throw new Error('Unsafe filename in manifest: ' + String(name));
  }
  const url = new URL(entry.source_url);
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.shopify.com') {
    throw new Error('Untrusted media source for ' + name);
  }
  return { name, url: url.toString() };
}
async function download(entry) {
  const { name, url } = validate(entry);
  const destinationPath = join(destination, name);
  try {
    if ((await stat(destinationPath)).size > 0) { skipped++; return; }
  } catch { /* Not backed up yet. */ }
  const partialPath = destinationPath + '.part';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90000), redirect: 'follow' });
      if (!response.ok || !response.body) throw new Error('CDN returned HTTP ' + response.status);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/') && contentType !== 'application/octet-stream') {
        throw new Error('Unexpected content type: ' + contentType);
      }
      const declaredSize = Number(response.headers.get('content-length') || '0');
      if (declaredSize > MAX_BYTES) throw new Error('Exceeds GitHub-friendly size limit');
      await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath));
      const size = (await stat(partialPath)).size;
      if (!size || size > MAX_BYTES) throw new Error('Empty or oversized file: ' + size);
      await rename(partialPath, destinationPath);
      copied++;
      console.log('Backed up ' + name + ' (' + size + ' bytes)');
      return;
    } catch (error) {
      await rm(partialPath, { force: true });
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 1200));
    }
  }
}
const items = manifest.images || [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (true) {
    const index = next++;
    if (index >= items.length) break;
    const item = items[index];
    try { await download(item); }
    catch (error) { failed.push(item.filename + ': ' + error.message); console.error('FAILED ' + item.filename + ': ' + error.message); }
  }
}));
console.log('Media backup: ' + copied + ' downloaded, ' + skipped + ' already present, ' + failed.length + ' failed.');
if (failed.length) process.exitCode = 1;
