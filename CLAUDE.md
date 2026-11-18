# Blog Becarios MLK — Centro Colombo Americano

Blog oficial de los Becarios del Programa de Becas Martin Luther King Jr. Objetivos: mostrar quiénes somos, documentar las obras sociales y transmitir su impacto real.

## Stack

- **Astro 7** con `<ClientRouter />` (View Transitions) en `src/layouts/Layout.astro`.
- **Tailwind CSS v4** vía `@tailwindcss/vite`. Los tokens viven en `@theme` dentro de `src/styles/global.css`: no uses colores sueltos, usa los tokens.
- Animaciones con **CSS nativo** y JS mínimo (sin Framer Motion, para no cargar React). Toda animación respeta `prefers-reduced-motion`.
- Contenido con **Content Collections** (`src/content.config.ts`).

Comandos: `npm run dev` (http://localhost:4321), `npm run build`, `npm run preview`, **`npm run verificar`** (tipos + build + revisión de enlaces, `alt`, IDs, un `h1` por página, metadatos y peso del HTML ≤ 60 KB). Correr `verificar` antes de cada publicación.

### Publicación y rutas

- Publicado en GitHub Pages: **https://mlkblog.github.io/mlkblog/** (repo `mlkblog/mlkblog`). `.github/workflows/deploy.yml` corre `npm run verificar` y publica en cada push a `main`.
- El sitio vive en la subcarpeta `/mlkblog` (`base` en `astro.config.mjs`). **Todo enlace interno o archivo de `public/` va con `ruta()`** de `src/lib/rutas.ts`: `href={ruta('/actividades/')}`. Un `href="/algo"` escrito a mano funciona en local pero se rompe en línea; `npm run verificar` lo detecta como enlace roto.
- Para pasar a **mlkblog.com**: en `astro.config.mjs` poner `site: 'https://mlkblog.com'` y `base: '/'`, crear `public/CNAME` con `mlkblog.com`, configurar el dominio en Settings → Pages y los DNS en el registrador (A: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; CNAME `www` → `mlkblog.github.io`).

### Rendimiento (no romper)

Auditoría Lighthouse del 15 nov 2026: 99–100 en rendimiento, 100 en accesibilidad, buenas prácticas y SEO, en móvil y escritorio. LCP ≈ 1,6–1,9 s en móvil y 0,4 s en escritorio. CLS ≤ 0,04. HTML ~23 KB por página.

- Fuentes con la API `fonts` de Astro (`astro.config.mjs` + `<Font>` en el layout): se sirven desde el sitio con preload. No vuelvas a enlazar Google Fonts.
- CSS incrustado (`build.inlineStylesheets: 'always'`), sin peticiones que bloqueen el render.
- Logo como archivo estático en `public/` (`<img>`), nunca incrustado como SVG en el HTML (pesa 27 KB).
- La primera imagen visible de una lista lleva `prioridad` en `TarjetaActividad` (carga inmediata). El resto, en diferido.
- `prefetch` precarga las páginas al pasar el cursor por un enlace.
- La animación del mosaico usa solo `transform`: el contenido es visible aunque el navegador pause la animación.
- Fotos reales: súbelas en JPG/PNG de máx. ~2500 px de ancho; Astro genera WebP en varios tamaños.

### Móvil (probado en 320, 360, 390, 414, 768 y 844×390 horizontal)

- Sin desplazamiento horizontal desde 320 px. Por debajo de 360 px se oculta «Inicio» en el menú (el logo lleva al inicio).
- Todo control táctil mide ≥ 44 px de alto: enlaces sueltos con `inline-flex min-h-11 items-center`; elementos que deben verse pequeños (etiquetas) con la clase `zona-toque`, que amplía el área sin cambiar el tamaño visual.
- Los efectos `hover:` de Tailwind v4 solo aplican en dispositivos con cursor; en táctil la respuesta es `.btn:active` (se hunde un poco).
- Precarga `viewport`: las páginas enlazadas visibles se descargan antes del toque. Se omite con ahorro de datos o 2G.
- Galería: se desliza con el dedo (umbral 40 px), con teclado y con botones.
- Encabezado fijo solo en pantallas ≥ 640 px de ancho y ≥ 500 px de alto.
- Medición con CPU 4x y 4G lenta (390×844): 0 cuadros perdidos en scroll, filtros y galería; 1 cuadro en cada cambio de página; respuesta al toque ≤ 24 ms.

### Cambio de sección (no romper)

- **Teléfonos y tabletas (`hover: none` y `pointer: coarse`): sin View Transitions.** Un script en el `<head>` de `Layout.astro` anula `document.startViewTransition` antes de que cargue el router, que entonces cambia la página al instante (`fallback="swap"`). Capturar y fundir la pantalla entera pesaba en la GPU de los teléfonos reales y se sentía como un tirón. Medido con CPU 6x: 65–130 ms del toque a la página nueva, frente a 100–196 ms con transición. No quitar ese script.
- **Chrome en Android (≥ 2 GB de RAM): navegación nativa con pre-renderizado.** Un segundo script en el `<head>`, después de `<ClientRouter />`, apaga el router (meta `fallback` → `none`), marca `<html data-nav="nativa">` e inserta reglas de especulación: Chrome arma Inicio, Nosotros y Actividades en segundo plano (y las crónicas cuyos enlaces están a la vista), así que al tocar la página ya está lista. Medido sin herramientas de desarrollo: 31–75 ms del toque a la pantalla nueva. Se limita a Chrome porque sin pre-renderizado (Safari, teléfonos con poca memoria) la carga nativa tardaba 180–330 ms.
- Por eso los scripts de página (galería, filtros, contadores) arrancan así: `if (document.documentElement.dataset.nav === 'nativa') iniciar(); else document.addEventListener('astro:page-load', iniciar);`. Todo script nuevo debe seguir ese patrón.
- Las herramientas de desarrollo (Playwright, CDP) desactivan el pre-renderizado: para medirlo hay que abrir el navegador sin depurador.
- Escritorio: la página vieja desaparece al instante y la nueva entra con un fundido de 160 ms (`aparecer-pagina` en `global.css`). El grupo `root` va sin animación.
- El encabezado (`encabezado-vt`) no se anima: queda fijo entre secciones.
- Transición de foto (solo escritorio) **solo** entre la tarjeta tocada y su crónica (y de vuelta). Las fotos llevan `data-foto-id`, no `transition:name`: el nombre se asigna en `Layout.astro` (`astro:before-preparation` / `astro:before-swap`). Nunca pongas `transition:name` fijo a elementos repetidos: el navegador los capturaría todos en cada navegación.
- Las animaciones de entrada (mosaico, contadores) solo corren en la primera visita; al navegar, la clase `navegado` en `<html>` las desactiva.
- Secciones bajo el pliegue con `cv-auto` (`content-visibility: auto`).
- Navegadores sin View Transitions: `fallback="swap"` (cambio instantáneo).
- Respuesta al toque inmediata: enlaces del menú (`active:bg-cielo/60`) y tarjetas (`active:opacity-75`). Barra de carga amarilla (`#barra-carga`) solo si el cambio tarda > 120 ms.
- Perfil de un cambio de sección (CPU 6x): recálculo de estilos 50–90 ms, View Transition 60–110 ms, maquetado y pintura 27–58 ms. La página tiene ~160 elementos y 55 reglas CSS: no hay peso que recortar; mantenerla así.
- Imágenes de contenido en JPG/PNG (Astro genera WebP). No uses SVG con patrones como foto: son caros de dibujar en teléfonos.

### Seguridad (no romper) — detalle en `SECURITY.md`

- **CSP**: `scripts/csp.mjs` corre después de `astro build` y escribe la misma política en un `<meta>` al inicio de cada página, con el hash de todos los `<script>` y `<style>` en línea del sitio (el router de Astro carga estilos de otras páginas, por eso la política es una sola). No uses la CSP integrada de Astro (`security.csp`): calcula hashes por página y rompe el router.
- Nada de scripts, estilos, fuentes, imágenes ni iframes de otros dominios; nada de `onclick=` ni `javascript:`; nada de `<script>` en línea sin pasar por el build. Los scripts de módulo van como archivo propio (`vite.build.assetsInlineLimit: 0`).
- Las reglas de especulación viajan como `<script type="application/json" id="reglas-especulacion">` y la CSP autoriza ese texto por hash.
- `npm run verificar` incluye `scripts/auditar-seguridad.mjs`: falla con secretos, correos/teléfonos/documentos no autorizados (`seguridad/permitidos.json`), recursos externos, CSP débil, archivos internos o fotos con metadatos. El correo oficial del grupo debe agregarse a `permitidos.json` antes de publicarlo.
- `npm run auditar`: dependencias (excepciones con fecha en `seguridad/excepciones.json`) + build + auditoría con informe en `seguridad/informe.md`.
- `npm run limpiar-fotos` quita GPS y datos de cámara; corre en cada publicación y en el flujo `limpiar-fotos.yml`.
- Acciones de GitHub fijadas por SHA y con permisos mínimos; Dependabot las actualiza.

## Cómo publicar una obra social (para becarios)

1. Crea una carpeta en `src/content/actividades/` con el nombre de la URL, p. ej. `2026-03-jornada-salud/`.
2. Dentro, crea `index.md` y copia las fotos (`.jpg`, `.png`, `.webp`).
3. Llena el encabezado (frontmatter) siguiendo una crónica existente. Campos obligatorios: `titulo`, `fecha`, `ubicacion`, `resumen` (máx. 220 caracteres), `categoria`, `imagen`, `imagenAlt`, `beneficiarios`, `horasVoluntariado`. Opcionales: `aliados`, `autor`, `galeria` (lista de `{ src, alt }`), `ejemplo`.
4. Categorías permitidas: `Educación`, `Medio Ambiente`, `Comunidad`. Para agregar una, edítala en `src/content.config.ts` (constante `CATEGORIAS`).
5. Si un campo falta o tiene un tipo incorrecto, `npm run dev` muestra el error exacto.
6. Antes de publicar, revisa la lista «Antes de publicar una crónica» de `SECURITY.md` (autorización de imagen, sin datos personales).

Los contadores de la portada (obras, personas, horas) se calculan solos sumando `beneficiarios` y `horasVoluntariado` de todas las crónicas. El equipo se edita en `src/content/becarios.json`.

Las dos crónicas iniciales y los perfiles del equipo son **contenido de ejemplo** (`ejemplo: true` muestra una etiqueta). Reemplázalos por información real antes de lanzar.

## Identidad visual

### Paleta (manual de marca + logo)

El logo es monocromo: azul marino sobre blanco. El escaneo muestrea `#2F3879`, que es el Pantone Dark Blue 072C impreso; en pantalla usamos su valor oficial.

| Token Tailwind | HEX | Origen | Uso |
| --- | --- | --- | --- |
| `azul` | `#273591` | Dark Blue 072C | Color de firma: títulos, enlaces, bandas, botones |
| `noche` | `#1B2462` | Azul del logo oscurecido | Pie de página, hover, banda de cifras |
| `sol` | `#FFCB04` | Yellow 116C | Acento cálido único: subrayado activo, foco, CTA. Nunca texto sobre blanco |
| `rojo` | `#CB1334` | Dark Red 199C | Acento sutil secundario: una píldora del mosaico, comillas de citas, borde de testimonios, categoría Comunidad |
| `rosa` | `#FBE5E9` | Tinte de 199C | Fondo de la etiqueta Comunidad (texto `rojo`, 4,7:1) |
| `cielo` | `#ADDFE9` | Light Blue 635C | Fondos suaves (citas, etiqueta Educación) |
| `agua` | `#DCEDF3` | Tinte de Light Blue 7695C | Fondo de la etiqueta Medio Ambiente (texto `noche`) |
| `papel` | `#F7F7F3` | 11-0601 TCX | Fondo de secciones alternas |
| `tinta` | `#12162E` | — | Texto principal |
| `gris` | `#4B5170` | — | Texto secundario (7:1 sobre blanco) |
| `linea` | `#D6D7D6` | Light Gray 2C | Bordes y divisores |

Contraste verificado (WCAG 2.1): `azul` sobre blanco 10,4:1 · `sol` sobre `azul` 6,8:1 · `rojo` sobre blanco 5,7:1 · `rojo` sobre `rosa` 4,7:1 · `tinta` sobre blanco > 17:1.

Regla de proporción: blanco y azul dominan (~85%), amarillo y rojo son acentos (~5% cada uno). El amarillo marca acción y estado activo (subrayados, foco, píldora central); el rojo marca la voz de las personas (citas, testimonios) y la comunidad. Nunca rojo en botones ni en textos largos, y nunca rojo y amarillo juntos en el mismo elemento.

Colores por categoría: `src/lib/categorias.ts`.

### Logo

- `src/assets/logo-mlk.svg`: vector trazado del escaneo con `node scripts/vectorizar-logo.mjs` (usa `currentColor`; colorearlo con `text-azul` o `text-white`). Se importa como componente: `import Logo from '../assets/logo-mlk.svg'`.
- `public/favicon.svg`: misma silueta en azul 072C fijo.
- `src/assets/logo-mlk.jpg`: escaneo original, solo como fuente. Si el Centro entrega el logo en vector oficial (AI/SVG/PDF), reemplaza el SVG por ese.

### Tipografía

- **Display:** Bricolage Grotesque (700–800), interlineado 1.0–1.1, tracking ligeramente negativo. Solo títulos y cifras.
- **Texto:** Source Sans 3 (400/600), 18 px base, interlineado 1.6, líneas de máx. ~68 caracteres (`max-w-prose`).
- Etiquetas en minúscula/oración, nunca en mayúsculas sostenidas. Sin flechas `→` en botones.

### Motivos gráficos

Los rellenos de las letras del logo (zigzag, rombos concéntricos, greca, espiral cuadrada, líneas con muescas) están en `src/components/Patrones.astro` como `<pattern>` SVG. La forma base es la **píldora redondeada** (como los trazos de las letras M-L-K).

- El mosaico de píldoras del Hero es el único elemento expresivo del sitio y la única animación automática (entrada escalonada al cargar).
- El resto es sobrio: sin sombras, radio 1.25rem en imágenes, bordes de 1px `linea`.
- La franja de greca amarilla separa encabezado y pie.

### Reglas de diseño

- Alineación a la izquierda. Columna máxima 72rem con margen lateral mínimo de 1rem.
- Movimiento solo en respuesta a acciones (filtros, galería, navegación) más el Hero y los contadores.
- La foto de una crónica viaja entre tarjeta y página en escritorio (ver «Cambio de sección»).
- Probar siempre en 1440 px y 390 px de ancho.
- Fotos: pedir autorización para publicar rostros, nunca menores sin consentimiento del acudiente.
