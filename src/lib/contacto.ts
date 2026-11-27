/** Contacto del grupo. El correo está autorizado en seguridad/permitidos.json. */
export const correo = 'mlkscholarshipprogrambaq@gmail.com';

/** Enlace de correo con asunto prellenado (el asunto no lleva datos personales). */
export const enlaceCorreo = (asunto?: string) => `mailto:${correo}${asunto ? `?subject=${encodeURIComponent(asunto)}` : ''}`;

/** Redes, sin parámetros de rastreo (utm, is_from_webapp…). */
export const redes = [
  {
    red: 'Instagram',
    texto: '@mlkbaq',
    href: 'https://www.instagram.com/mlkbaq/',
    icono: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zM17.3 6.7h.01',
  },
  {
    red: 'TikTok',
    texto: '@mlk.bq_',
    href: 'https://www.tiktok.com/@mlk.bq_',
    icono: 'M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.2 4.4 5 4.6',
  },
];

export const iconoCorreo = 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3.5 6.5 12 13l8.5-6.5';
