/**
 * Colores por categoría (contraste AA verificado). Cada categoría tiene:
 * - etiqueta: fondo claro + texto oscuro de su familia
 * - fondo: tinte para paneles (datos de la crónica)
 * - solido: color pleno (fondo de foto, filtro activo, cifras)
 * - texto: color de cifras y detalles sobre el tinte
 * Las clases van escritas completas para que Tailwind las detecte.
 */
type Colores = { etiqueta: string; fondo: string; solido: string; texto: string; activo: string };

const colores: Record<string, Colores> = {
  'Educación': { etiqueta: 'bg-agua text-mar', fondo: 'bg-agua', solido: 'bg-mar', texto: 'text-mar', activo: 'aria-pressed:border-mar aria-pressed:bg-mar' },
  'Medio Ambiente': { etiqueta: 'bg-menta text-verde', fondo: 'bg-menta', solido: 'bg-verde', texto: 'text-verde', activo: 'aria-pressed:border-verde aria-pressed:bg-verde' },
  'Comunidad': { etiqueta: 'bg-rosa text-rojo', fondo: 'bg-rosa', solido: 'bg-rojo', texto: 'text-rojo', activo: 'aria-pressed:border-rojo aria-pressed:bg-rojo' },
};
const neutro: Colores = { etiqueta: 'bg-papel text-tinta', fondo: 'bg-papel', solido: 'bg-azul', texto: 'text-azul', activo: 'aria-pressed:border-azul aria-pressed:bg-azul' };

export const coloresCategoria = (categoria: string) => colores[categoria] ?? neutro;
export const claseCategoria = (categoria: string) => coloresCategoria(categoria).etiqueta;
