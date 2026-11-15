# Blog Becarios MLK

Blog oficial de los Becarios del Programa de Becas Martin Luther King Jr. del Centro Colombo Americano. Sitio en línea: **https://mlkblog.com**

Hecho con [Astro](https://astro.build) y Tailwind CSS. Cada cambio en la rama `main` se publica solo en GitHub Pages en unos 2 minutos.

## Publicar una obra social (sin instalar nada)

1. En GitHub, entra a la carpeta `src/content/actividades/`.
2. Pulsa **Add file → Create new file** y escribe como nombre `nombre-de-la-actividad/index.md` (la barra crea la carpeta).
3. Copia el contenido de una crónica existente (por ejemplo `club-lectura-bilingue/index.md`) y cambia los datos y el texto.
4. Pulsa **Commit changes**.
5. Entra a la nueva carpeta, pulsa **Add file → Upload files** y sube las fotos con los nombres que pusiste en `imagen` y `galeria`.
6. En la pestaña **Actions** verás la publicación en curso. Si sale en rojo, abre el detalle: el mensaje dice qué campo falta o está mal escrito.

Campos obligatorios: `titulo`, `fecha` (AAAA-MM-DD), `ubicacion`, `resumen` (máx. 220 caracteres), `categoria` (`Educación`, `Medio Ambiente` o `Comunidad`), `imagen`, `imagenAlt`, `beneficiarios`, `horasVoluntariado`. Opcionales: `aliados`, `autor`, `galeria`, `ejemplo`.

Fotos: JPG o PNG de hasta ~2500 px de ancho. Pide autorización para publicar rostros, y nunca publiques menores sin consentimiento de su acudiente.

## Trabajar en local

```bash
npm install
npm run dev        # http://localhost:4321
npm run verificar  # tipos + build + revisión de enlaces, alt y metadatos
```

Las reglas de diseño (paleta, tipografías, logo, rendimiento) están en [CLAUDE.md](CLAUDE.md).
