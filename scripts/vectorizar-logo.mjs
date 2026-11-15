// Convierte el logo escaneado (JPG) en un SVG vectorial nítido en el azul oficial 072C.
// Requiere instalar el trazador solo cuando se use (no forma parte del sitio):
//   npm i --no-save potrace && node scripts/vectorizar-logo.mjs && npx -y svgo@3 public/logo-mlk-*.svg public/favicon.svg
// Uso: node scripts/vectorizar-logo.mjs [entrada] [salida]
import sharp from 'sharp';
import potrace from 'potrace';
import { writeFileSync } from 'node:fs';

const entrada = process.argv[2] ?? 'src/assets/logo-mlk.jpg';
const salida = process.argv[3] ?? 'src/assets/logo-mlk.svg';

// Escala x2 y umbral: separa con limpieza el azul del fondo blanco
const png = await sharp(entrada).grayscale().resize({ width: 2940, kernel: 'lanczos3' }).blur(1.2).threshold(150).png().toBuffer();

// Caja real del dibujo (sin el margen blanco del escaneo), con 24 px de aire
const { info } = await sharp(png).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
const aire = 24;
const x = Math.max(0, -info.trimOffsetLeft - aire);
const y = Math.max(0, -info.trimOffsetTop - aire);
const viewBox = `${x} ${y} ${info.width + aire * 2} ${info.height + aire * 2}`;

potrace.trace(png, { color: '#273591', background: 'transparent', turdSize: 40, optTolerance: 0.3, alphaMax: 1 }, (err, svg) => {
  if (err) throw err;
  const base = svg
    .replace(/\s(width|height)="\d+"/g, '')
    .replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
    .replace(/(\d+)\.\d+/g, '$1'); // coordenadas enteras: en un lienzo de ~2700 u. no se nota y pesa la mitad

  // Archivos estáticos (se cachean una vez para todo el sitio)
  const blanco = base.replace(/fill="#273591"/g, 'fill="#ffffff"');
  writeFileSync(salida, base);
  writeFileSync('public/logo-mlk-azul.svg', base);
  writeFileSync('public/logo-mlk-blanco.svg', blanco);
  writeFileSync('public/favicon.svg', base);
  console.log(`Logo listo (${(base.length / 1024).toFixed(0)} kB sin optimizar), viewBox ${viewBox}. Optimiza con: npx -y svgo@3 public/logo-mlk-*.svg public/favicon.svg`);
});
