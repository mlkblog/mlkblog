// Revisa el sitio ya construido (dist/) antes de publicar.
// Uso: npm run verificar  (corre astro check + build + este script)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const MAX_HTML_KB = 60;
const paginas = [];
(function recorrer(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (p.endsWith('.html')) paginas.push(p);
  }
})(DIST);

const existe = (url) => {
  const limpia = decodeURI(url.split('#')[0].split('?')[0]);
  if (!limpia) return true;
  const p = join(DIST, limpia);
  return existsSync(p) && (statSync(p).isFile() || existsSync(join(p, 'index.html')));
};

const problemas = [];
for (const archivo of paginas) {
  const html = readFileSync(archivo, 'utf8');
  const kb = Buffer.byteLength(html) / 1024;
  if (kb > MAX_HTML_KB) problemas.push(`${archivo}: pesa ${kb.toFixed(0)} KB (máx. ${MAX_HTML_KB} KB)`);

  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (!url.startsWith('//') && !existe(url)) problemas.push(`${archivo}: enlace roto ${url}`);
  }
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(img)) problemas.push(`${archivo}: imagen sin texto alternativo`);
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (repetidos.length) problemas.push(`${archivo}: IDs repetidos ${repetidos.join(', ')}`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) problemas.push(`${archivo}: debe tener exactamente un <h1>`);
  if (!/<title>[^<]{5,}<\/title>/.test(html)) problemas.push(`${archivo}: falta <title>`);
  if (!/<meta name="description" content="[^"]{30,}"/.test(html)) problemas.push(`${archivo}: falta meta description`);
}

console.log(`Revisadas ${paginas.length} páginas.`);
if (problemas.length) {
  console.error(`\n${problemas.length} problema(s):\n- ${problemas.join('\n- ')}`);
  process.exit(1);
}
console.log('Todo en orden: sin enlaces rotos, imágenes con alt, IDs únicos, un h1 por página y metadatos completos.');
