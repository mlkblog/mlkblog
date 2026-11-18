// Quita los metadatos (ubicación GPS, cámara, fecha, autor) de las fotos del repositorio.
// Endereza la foto según la orientación de la cámara antes de borrar ese dato.
// Uso: npm run limpiar-fotos   (también lo corre el flujo «Limpiar fotos» en GitHub)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import sharp from 'sharp';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const CARPETAS = ['src', 'public'];
let limpiadas = 0;
for (const c of CARPETAS) {
  const lista = (await readdir(join(RAIZ, c), { withFileTypes: true, recursive: true })).filter((f) => f.isFile());
  for (const f of lista) {
    const ruta = join(f.parentPath ?? f.path, f.name);
    const ext = extname(ruta).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
    const original = await readFile(ruta);
    const meta = await sharp(original).metadata();
    if (!meta.exif && !meta.xmp && !meta.iptc) continue;
    // sharp no copia metadatos al guardar salvo que se le pida; rotate() aplica la orientación EXIF
    let img = sharp(original).rotate();
    img = ext === '.png' ? img.png() : ext === '.webp' ? img.webp({ quality: 90 }) : img.jpeg({ quality: 90, mozjpeg: true });
    await writeFile(ruta, await img.toBuffer());
    console.log(`  limpia: ${relative(RAIZ, ruta)}`);
    limpiadas++;
  }
}
console.log(limpiadas ? `${limpiadas} foto(s) sin metadatos.` : 'Ninguna foto tenía metadatos.');
