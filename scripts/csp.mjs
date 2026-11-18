// Escribe una Política de Seguridad de Contenido (CSP) en un <meta> al inicio de cada página de dist/.
// GitHub Pages no permite cabeceras HTTP propias, así que va en el HTML.
//
// La política es la MISMA en todas las páginas: incluye el hash SHA-256 de cada <script> y <style>
// en línea de todo el sitio. Es necesario porque el router de Astro cambia de página sin recargar:
// la CSP de la primera página visitada debe permitir los estilos y scripts de cualquier otra.
// Cualquier script que no salga del build (inyectado, de terceros o pegado en una crónica) queda bloqueado.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const listar = async (dir) => (await readdir(dir, { withFileTypes: true, recursive: true }))
  .filter((f) => f.isFile() && f.name.endsWith('.html')).map((f) => join(f.parentPath ?? f.path, f.name));

const hash = (txt) => `'sha256-${createHash('sha256').update(txt, 'utf8').digest('base64')}'`;
const paginas = await listar(DIST);
const scripts = new Set(), estilos = new Set();
const html = new Map();
for (const f of paginas) {
  const h = (await readFile(f, 'utf8')).replace(/<meta http-equiv="content-security-policy"[^>]*>/gi, '');
  html.set(f, h);
  for (const [, attrs, cuerpo] of h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=/.test(attrs) || !cuerpo.trim()) continue;
    // Reglas de especulación: el layout copia este JSON a un <script type="speculationrules">
    if (/id="reglas-especulacion"/.test(attrs)) { scripts.add(hash(cuerpo)); continue; }
    if (/type="(application\/(ld\+)?json|speculationrules)"/.test(attrs)) continue; // datos, no código
    scripts.add(hash(cuerpo));
  }
  for (const [, cuerpo] of h.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) estilos.add(hash(cuerpo));
}

export const politica = [
  "default-src 'none'",
  `script-src 'self' ${[...scripts].sort().join(' ')}`,
  `style-src 'self' ${[...estilos].sort().join(' ')}`,
  "style-src-attr 'unsafe-inline'", // solo atributos style="--i: n" (sin capacidad de ejecutar código)
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const meta = `<meta http-equiv="content-security-policy" content="${politica}">`;
for (const [f, h] of html) {
  if (!/<head>/i.test(h)) continue;
  // Primero en <head>: debe estar antes de cualquier script o estilo
  await writeFile(f, h.replace(/<head>/i, (m) => m + meta));
}
console.log(`CSP escrita en ${html.size} páginas: ${scripts.size} scripts y ${estilos.size} estilos en línea autorizados por hash.`);
