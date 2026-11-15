const largo = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "20 de septiembre de 2026" (UTC, para que la fecha del frontmatter no cambie de día) */
export const fechaLarga = (d: Date) => largo.format(d);

export const numero = (n: number) => new Intl.NumberFormat('es-CO').format(n);
