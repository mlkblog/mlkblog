// Revisa vulnerabilidades conocidas en las dependencias (npm audit).
// Falla con vulnerabilidades críticas o altas, salvo las registradas en seguridad/excepciones.json
// con su justificación y una fecha límite de revisión (vencida la fecha, vuelve a fallar).
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const RAIZ = new URL('..', import.meta.url);
const excepciones = JSON.parse(await readFile(new URL('seguridad/excepciones.json', RAIZ), 'utf8')).excepciones;
let salida;
try { salida = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'ignore'] }); }
catch (e) { salida = e.stdout; } // npm audit sale con código 1 cuando encuentra algo
const informe = JSON.parse(salida);
const hoy = new Date().toISOString().slice(0, 10);
const fallas = [], aceptadas = [], menores = [];
for (const [paquete, v] of Object.entries(informe.vulnerabilities ?? {})) {
  for (const via of v.via.filter((x) => typeof x === 'object')) {
    const id = via.url?.split('/').pop();
    const linea = `${paquete} · ${via.severity} · ${via.title} (${id})`;
    if (!['high', 'critical'].includes(via.severity)) { menores.push(linea); continue; }
    const exc = excepciones.find((e) => e.id === id);
    if (exc && exc.revisarAntesDe >= hoy) aceptadas.push(`${linea} — aceptada hasta ${exc.revisarAntesDe}: ${exc.motivo}`);
    else fallas.push(exc ? `${linea} — la excepción venció el ${exc.revisarAntesDe}` : linea);
  }
}
const unico = (l) => [...new Set(l)];
console.log('\nAuditoría de dependencias');
unico(fallas).forEach((l) => console.log('  FALLA     ' + l));
unico(aceptadas).forEach((l) => console.log('  ACEPTADA  ' + l));
unico(menores).forEach((l) => console.log('  MENOR     ' + l));
console.log(fallas.length ? '\nHay vulnerabilidades altas o críticas sin resolver.' : '\nSin vulnerabilidades altas o críticas sin justificar.');
process.exit(fallas.length ? 1 : 0);
