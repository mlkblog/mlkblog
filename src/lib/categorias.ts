/** Color de etiqueta por categoría (fondo claro + texto con contraste AA). */
const colores: Record<string, string> = {
  'Educación': 'bg-cielo text-azul',
  'Medio Ambiente': 'bg-agua text-noche',
  'Comunidad': 'bg-rosa text-rojo',
};

export const claseCategoria = (categoria: string) => colores[categoria] ?? 'bg-papel text-tinta';
