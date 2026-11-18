// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Hoy: GitHub Pages en https://mlkblog.github.io/mlkblog/
  // Al conectar el dominio propio: site: 'https://mlkblog.com', base: '/' y recrear public/CNAME con "mlkblog.com"
  site: 'https://mlkblog.github.io',
  base: '/mlkblog',

  // Precarga cada página cuando su enlace aparece en pantalla (funciona en táctil, donde no hay
  // "hover"). Astro la omite con ahorro de datos activado o conexión lenta. Cada página pesa ~10 KB comprimida.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },

  // Política de seguridad de contenido (CSP): la escribe scripts/csp.mjs después de construir.
  // (La CSP integrada de Astro calcula hashes por página, y el router de Astro carga estilos y
  // scripts de otras páginas que quedarían bloqueados.)

  // CSS incrustado en cada página (~5 KB comprimido): elimina la única petición que bloqueaba el primer render
  build: { inlineStylesheets: 'always' },

  // Fuentes servidas desde el propio sitio (sin bloquear el render con Google Fonts)
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-bricolage',
      weights: [700, 800],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Source Sans 3',
      cssVariable: '--font-source',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],

  // Sin resaltado de código (Shiki usa estilos en línea que la CSP bloquearía)
  markdown: { syntaxHighlight: false },

  vite: {
    plugins: [tailwindcss()],
    // Scripts de módulo siempre como archivo propio (nunca en línea): la CSP los permite con 'self'
    // y el router de Astro no necesita inyectar un script data: para esperarlos (la CSP lo bloquearía).
    build: { assetsInlineLimit: 0 },
  },

  integrations: [sitemap()],
});