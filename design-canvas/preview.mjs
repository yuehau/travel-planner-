// Local QA only: turns each artboard into a standalone page that loads the app's real illustrations.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(here, 'artboards');
const outDir = path.join(here, 'preview');
mkdirSync(outDir, { recursive: true });

const args = readFileSync(path.join(here, 'seed-args.txt'), 'utf8').split('\n');
const images = new Map();
args.forEach((arg, i) => {
  if (arg === '--image') images.set(path.basename(args[i + 1]), `../../${args[i + 1]}`);
});

const files = readdirSync(srcDir).filter((f) => f.endsWith('.dc.html'));
for (const file of files) {
  const html = readFileSync(path.join(srcDir, file), 'utf8');
  const helmet = html.match(/<helmet>([\s\S]*?)<\/helmet>/)[1];
  const body = html.match(/<\/helmet>([\s\S]*?)<\/x-dc>/)[1]
    .replace(/src="([^"]+)"/g, (match, name) => (images.has(name) ? `src="${images.get(name)}"` : match));
  writeFileSync(path.join(outDir, file.replace('.dc.html', '.html')), `<!doctype html><html><head><meta charset="utf-8">${helmet}<style>body{margin:0}</style></head><body>${body}</body></html>`);
}
console.log(`preview pages: ${files.length}`);
