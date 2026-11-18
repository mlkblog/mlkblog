// Auditoría de seguridad y filtración de información.
// Revisa el sitio construido (dist/) y los archivos del repositorio, que es público.
//
//   node scripts/auditar-seguridad.mjs            → audita (falla con código 1 si hay problemas graves)
//   node scripts/auditar-seguridad.mjs --informe  → además guarda seguridad/informe.md
//
// Graves (detienen la publicación): secretos, datos personales, scripts o recursos externos,
// CSP ausente o débil, archivos que no deben publicarse, fotos publicadas con ubicación.
// Avisos (no detienen): metadatos en fotos del repositorio, que limpia el flujo «Limpiar fotos».
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, relative, extname, sep } from 'node:path';
import sharp from 'sharp';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const DIST = join(RAIZ, 'dist');
const graves = [];
const avisos = [];
const grave = (regla, donde, detalle) => graves.push({ regla, donde, detalle });
const aviso = (regla, donde, detalle) => avisos.push({ regla, donde, detalle });
const rel = (f) => relative(RAIZ, f).split(sep).join('/');

const permitidos = JSON.parse(await readFile(join(RAIZ, 'seguridad', 'permitidos.json'), 'utf8'));

async function archivos(dir) {
  try {
    return (await readdir(dir, { withFileTypes: true, recursive: true }))
      .filter((f) => f.isFile()).map((f) => join(f.parentPath ?? f.path, f.name));
  } catch { return []; }
}

// ---------- Patrones ----------
const SECRETOS = [
  ['Clave privada', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----/],
  ['Token de GitHub', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/],
  ['Clave de AWS', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['Clave de Google', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Token de Slack', /\bxox[abposr]-[0-9A-Za-z-]{10,}\b/],
  ['Clave de Stripe', /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b/],
  ['Clave de OpenAI/Anthropic', /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}\b/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['URL con contraseña', /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/"']+:[^\s@/"']+@[^\s"']+/i],
  ['Asignación de secreto', /\b(?:api[_-]?key|secret|password|passwd|contraseña|token)\s*[:=]\s*["'][^"'\s]{8,}["']/i],
];
const CORREO = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// Celulares de Colombia (3xx xxx xxxx, con o sin +57) y teléfonos fijos con indicativo
const TELEFONO = /(?:\+?57[\s.-]?)?\b3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\+57[\s.-]?60\d[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
// Números de documento escritos junto a su sigla (C.C., T.I., NIT, cédula, documento)
const DOCUMENTO = /\b(?:C\.?\s?C\.?|T\.?\s?I\.?|NIT|c[ée]dula|documento)\s*(?:No\.?|n[úu]m(?:ero)?\.?|#)?\s*:?\s*\d[\d.\s-]{5,}\d/gi;
const RUTA_LOCAL = /\b[A-Z]:\\Users\\|\/(?:home|Users)\/[a-z0-9._-]+\/|file:\/\//i;

const esPermitido = (lista, valor) => lista.some((p) => valor.toLowerCase().includes(p.toLowerCase()));

function buscarDatos(texto, donde, { personales }) {
  for (const [nombre, re] of SECRETOS) {
    const m = texto.match(re);
    if (m) grave('Secreto expuesto', donde, `${nombre}: ${m[0].slice(0, 12)}…`);
  }
  if (RUTA_LOCAL.test(texto)) grave('Ruta local del computador', donde, texto.match(RUTA_LOCAL)[0]);
  if (!personales) return;
  for (const m of texto.matchAll(CORREO)) {
    const c = m[0];
    if (/\.(png|jpe?g|webp|svg|woff2?)$/i.test(c)) continue; // nombres de archivo con @2x, etc.
    if (!esPermitido(permitidos.correos, c)) grave('Correo personal publicado', donde, c);
  }
  for (const m of texto.matchAll(TELEFONO)) if (!esPermitido(permitidos.telefonos, m[0])) grave('Teléfono publicado', donde, m[0].trim());
  for (const m of texto.matchAll(DOCUMENTO)) grave('Número de documento publicado', donde, m[0].trim());
}

// ---------- 1. Sitio construido ----------
const distArchivos = await archivos(DIST);
if (!distArchivos.length) grave('Sin build', 'dist/', 'Corre `npm run build` antes de auditar');

const PROHIBIDOS = /(\.map|\.env(\..*)?|\.log|\.bak|\.orig|\.swp|~|\.DS_Store|Thumbs\.db|\.psd|\.ai|\.zip|\.sql|\.sqlite|\.pem|\.key|package(-lock)?\.json)$/i;
for (const f of distArchivos) {
  const r = rel(f);
  if (PROHIBIDOS.test(f) || r.includes('/.git/')) grave('Archivo que no debe publicarse', r, 'se subiría a GitHub Pages');
}

const ORIGEN = new URL(permitidos.sitio).origin;
for (const f of distArchivos.filter((x) => /\.(html|xml|txt|js|css|json|svg|webmanifest)$/.test(x))) {
  const r = rel(f);
  const texto = await readFile(f, 'utf8');
  // El texto visible y los metadatos se revisan en busca de datos personales; el JS/CSS de librerías solo por secretos
  buscarDatos(texto, r, { personales: /\.(html|xml|txt|json)$/.test(f) });

  if (!f.endsWith('.html')) continue;
  const csp = texto.match(/^<!DOCTYPE html>\s*<html[^>]*>\s*<head><meta http-equiv="content-security-policy" content="([^"]+)">/i);
  if (!csp) grave('CSP ausente', r, 'falta el <meta> de content-security-policy como primer elemento de <head>');
  else {
    const p = csp[1];
    const scriptSrc = p.match(/script-src ([^;]+)/)?.[1] ?? '';
    if (/'unsafe-inline'|'unsafe-eval'|\bdata:|\*|https?:/.test(scriptSrc)) grave('CSP débil', r, `script-src permite: ${scriptSrc.match(/'unsafe-inline'|'unsafe-eval'|\bdata:|\*|https?:\S*/)[0]}`);
    for (const d of ["default-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) if (!p.includes(d)) grave('CSP débil', r, `falta ${d}`);
  }
  // Manejadores en línea y URLs javascript: (la CSP los bloquearía, pero no deben existir)
  for (const m of texto.matchAll(/<[a-z][^>]*\s(on[a-z]+)\s*=/gi)) grave('Manejador de evento en línea', r, m[1]);
  if (/(?:href|src|action)\s*=\s*["']?\s*javascript:/i.test(texto)) grave('URL javascript:', r, 'enlace que ejecuta código');
  // Recursos de otros sitios: scripts, estilos, fuentes, imágenes, marcos
  for (const m of texto.matchAll(/<(script|link|img|iframe|frame|embed|object|source|video|audio)\b[^>]*\s(?:src|href|data|srcset)\s*=\s*["']([^"']+)["']/gi)) {
    const [, etiqueta, url] = m;
    if (etiqueta.toLowerCase() === 'link' && /rel=["'](?:canonical|sitemap|alternate)["']/i.test(m[0])) continue;
    for (const u of url.split(',').map((x) => x.trim().split(/\s+/)[0])) {
      if (/^(https?:)?\/\//i.test(u) && new URL(u, ORIGEN).origin !== ORIGEN) grave('Recurso de otro sitio', r, `<${etiqueta}> ${u}`);
    }
  }
  // Enlaces externos: HTTPS y sin dar acceso a la pestaña de origen
  for (const m of texto.matchAll(/<a\b[^>]*>/gi)) {
    const a = m[0];
    const href = a.match(/href=["']([^"']+)["']/)?.[1] ?? '';
    if (/^http:\/\//i.test(href)) grave('Enlace sin HTTPS', r, href);
    if (/target=["']_blank["']/i.test(a) && !/rel=["'][^"']*noopener/i.test(a)) grave('target=_blank sin noopener', r, href);
  }
  if (/<form\b(?![^>]*method=["']dialog)/i.test(texto)) aviso('Formulario', r, 'el sitio no tiene servidor; un formulario enviaría datos a otro sitio');
  if (/<iframe\b/i.test(texto)) grave('Marco incrustado (iframe)', r, 'bloqueado por la CSP; usar un enlace');
}

// Imágenes publicadas: no deben llevar ubicación ni datos de la cámara
const tieneGPS = (exif) => exif && (exif.includes(Buffer.from([0x88, 0x25])) || exif.includes(Buffer.from([0x25, 0x88])));
for (const f of distArchivos.filter((x) => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(x))) {
  const meta = await sharp(f).metadata().catch(() => ({}));
  if (tieneGPS(meta.exif)) grave('Foto publicada con ubicación GPS', rel(f), 'quita los metadatos con `npm run limpiar-fotos`');
  else if (meta.exif || meta.xmp || meta.iptc) grave('Foto publicada con metadatos', rel(f), 'cámara, fecha o autor visibles');
}

// ---------- 2. Repositorio (público en GitHub) ----------
let rastreados = [];
try {
  rastreados = execFileSync('git', ['ls-files', '-z'], { cwd: RAIZ, encoding: 'utf8' }).split('\0').filter(Boolean).map((f) => join(RAIZ, f));
} catch { rastreados = []; }
for (const f of rastreados) {
  const r = rel(f);
  if (/(^|\/)\.env(\.|$)|\.(pem|key|p12|pfx|keystore|sqlite|sql)$|id_(rsa|ed25519)/i.test(r)) grave('Archivo sensible en el repositorio', r, 'no debe estar en un repositorio público');
  const ext = extname(f).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.heic'].includes(ext)) {
    const meta = await sharp(f).metadata().catch(() => ({}));
    if (tieneGPS(meta.exif)) aviso('Foto del repositorio con ubicación GPS', r, 'el flujo «Limpiar fotos» la limpia; el original queda en el historial');
    else if (meta.exif) aviso('Foto del repositorio con metadatos', r, 'el flujo «Limpiar fotos» los quita');
    continue;
  }
  if (!/\.(md|mdx|astro|ts|js|mjs|json|ya?ml|txt|css|html|svg|toml)$/i.test(f) || r === 'package-lock.json') continue;
  const texto = await readFile(f, 'utf8').catch(() => '');
  // El contenido publicado (crónicas, equipo) también se revisa por datos personales
  const esContenido = r.startsWith('src/content/') || r.startsWith('public/');
  if (r.startsWith('scripts/auditar-seguridad')) continue; // contiene los patrones de búsqueda
  buscarDatos(texto, r, { personales: esContenido });
}

// ---------- Resultado ----------
const fila = (x) => `| ${x.regla} | \`${x.donde}\` | ${x.detalle.replace(/\|/g, '\\|')} |`;
const tabla = (lista) => (lista.length ? ['| Regla | Dónde | Detalle |', '| --- | --- | --- |', ...lista.map(fila)].join('\n') : 'Ninguno.');
const resumen = `Archivos publicados revisados: ${distArchivos.length} · archivos del repositorio: ${rastreados.length}`;

console.log(`\nAuditoría de seguridad — ${resumen}`);
for (const g of graves) console.log(`  GRAVE  ${g.regla} · ${g.donde} · ${g.detalle}`);
for (const a of avisos) console.log(`  AVISO  ${a.regla} · ${a.donde} · ${a.detalle}`);
console.log(graves.length ? `\n${graves.length} problema(s) grave(s). La publicación se detiene.` : `\nSin problemas graves${avisos.length ? ` (${avisos.length} aviso(s))` : ''}.`);

if (process.argv.includes('--informe')) {
  await mkdir(join(RAIZ, 'seguridad'), { recursive: true });
  const md = `# Informe de auditoría de seguridad\n\nFecha: ${new Date().toISOString().slice(0, 10)}\n\n${resumen}\n\n## Graves (${graves.length})\n\n${tabla(graves)}\n\n## Avisos (${avisos.length})\n\n${tabla(avisos)}\n`;
  await writeFile(join(RAIZ, 'seguridad', 'informe.md'), md);
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, md, { flag: 'a' });
}
process.exit(graves.length ? 1 : 0);
