/**
 * Antepone la carpeta base del sitio a una ruta interna.
 * Hoy: GitHub Pages en mlkblog.github.io/mlkblog → ruta('/actividades/') = '/mlkblog/actividades/'.
 * Con dominio propio (base '/') → ruta('/actividades/') = '/actividades/'.
 * Usar SIEMPRE en enlaces e imágenes de public/; nunca escribir "/algo" a mano.
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const ruta = (p: string) => `${base}${p.startsWith('/') ? p : `/${p}`}`;
