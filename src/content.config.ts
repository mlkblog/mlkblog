import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/** Categorías de las crónicas. Para agregar una nueva, añádela aquí y dale color en src/lib/categorias.ts. */
export const CATEGORIAS = ['Educación', 'Medio Ambiente', 'Comunidad', 'Nuestro grupo'] as const;
/** Categorías que no son obras sociales: no suman a las cifras de impacto ni muestran personas u horas. */
export const SIN_IMPACTO: readonly string[] = ['Nuestro grupo'];
export const esObraSocial = (categoria: string) => !SIN_IMPACTO.includes(categoria);

const actividades = defineCollection({
  // Cada obra social es una carpeta con index.md + sus fotos
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/actividades' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string().min(10).max(110),
      fecha: z.coerce.date(),
      ubicacion: z.string(),
      resumen: z.string().max(220),
      categoria: z.enum(CATEGORIAS),
      imagen: image(),
      imagenAlt: z.string().min(5),
      /** Obligatorios en obras sociales; en «Nuestro grupo» se omiten (0) */
      beneficiarios: z.number().int().nonnegative().default(0),
      horasVoluntariado: z.number().nonnegative().default(0),
      aliados: z.array(z.string()).default([]),
      autor: z.string().optional(),
      galeria: z.array(z.object({ src: image(), alt: z.string().min(3) })).default([]),
      /** true = contenido de ejemplo; muestra una etiqueta visible */
      ejemplo: z.boolean().default(false),
    }),
});

const becarios = defineCollection({
  loader: file('src/content/becarios.json'),
  schema: z.object({
    nombre: z.string(),
    carrera: z.string(),
    frase: z.string().max(90),
    cohorte: z.string(),
  }),
});

export const collections = { actividades, becarios };
