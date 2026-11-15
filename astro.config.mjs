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

  // Precarga las páginas al pasar el cursor o tocar un enlace: navegación casi instantánea
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

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

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});