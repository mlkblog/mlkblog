# Seguridad del blog Becarios MLK

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad o información personal publicada por error, **no abras un issue público**. Repórtalo en privado desde la pestaña **Security → Report a vulnerability** de este repositorio, o escribe a mlkscholarshipprogrambaq@gmail.com. Respondemos en máximo 5 días hábiles.

Si es información personal visible en el sitio (un teléfono, una dirección, la foto de un menor sin autorización), avisa de inmediato: se retira primero y se revisa después.

## Qué protege el sitio

El blog es HTML estático en GitHub Pages: no tiene servidor, base de datos, inicio de sesión ni formularios. No guarda datos de los visitantes ni usa cookies, analítica o scripts de terceros. Los riesgos reales son tres: publicar datos personales por error, que alguien inyecte código en una crónica y que una dependencia o la cuenta de GitHub se vean comprometidas.

| Capa | Protección | Dónde |
| --- | --- | --- |
| Navegador | Política de seguridad de contenido (CSP) en cada página: solo se ejecutan los scripts del propio sitio, autorizados por hash. Bloquea scripts inyectados, iframes, objetos y recursos de otros dominios. | `scripts/csp.mjs` |
| Navegador | Política de referencia: a otros sitios solo se envía el dominio. Fuentes e imágenes servidas desde el propio sitio. | `src/layouts/Layout.astro` |
| Publicación | Auditoría que detiene la publicación si encuentra secretos, correos, teléfonos o números de documento, recursos externos, manejadores de eventos en línea, enlaces sin HTTPS, archivos internos (`.map`, `.env`) o fotos con metadatos. | `scripts/auditar-seguridad.mjs` |
| Fotos | Se les quita la ubicación GPS, la cámara y la fecha antes de publicarlas, y un flujo automático limpia también los originales del repositorio. | `scripts/limpiar-fotos.mjs`, `.github/workflows/limpiar-fotos.yml` |
| Dependencias | `npm audit` en cada publicación: falla con vulnerabilidades altas o críticas, salvo excepciones justificadas con fecha de vencimiento. Verificación de firmas de paquetes. Dependabot propone actualizaciones cada semana. | `scripts/auditar-dependencias.mjs`, `seguridad/excepciones.json`, `.github/dependabot.yml` |
| Repositorio | Búsqueda de claves y tokens en todo el historial con gitleaks (binario verificado por SHA-256). | `.github/workflows/seguridad.yml` |
| GitHub Actions | Permisos mínimos por flujo, acciones fijadas a un commit exacto, credenciales no persistidas en los pasos de construcción. | `.github/workflows/` |

La auditoría completa corre en cada cambio, en cada pull request y cada lunes. El informe queda en **Actions → Auditoría de seguridad → resumen de la ejecución**. Para correrla en local: `npm run auditar`.

### Límites conocidos

- GitHub Pages no permite cabeceras HTTP propias. Por eso la CSP va en un `<meta>` y **no se puede impedir que otro sitio muestre el blog dentro de un marco** (`frame-ancestors` y `X-Frame-Options` solo funcionan como cabecera). El riesgo es bajo porque el sitio no tiene botones que hagan acciones. Si se necesita, se puede servir a través de Cloudflare para agregar cabeceras.
- Lo que se sube a un repositorio público queda en su historial aunque luego se borre. Si se publica un dato sensible, hay que borrarlo del historial (no basta un commit nuevo) y, si es una clave, revocarla.

## Antes de publicar una crónica (becarios)

1. **Autorización de imagen.** No publiques rostros sin permiso. Nunca publiques menores sin el consentimiento escrito de su acudiente; en la duda, foto de espaldas o de manos.
2. **Sin datos personales.** Nada de teléfonos, direcciones de casas, números de documento, correos personales ni apellidos de beneficiarios. Usa nombre de pila o el rol («madre de familia»).
3. **Desactiva la ubicación de la cámara del teléfono** antes de la jornada. El sistema limpia las fotos, pero el original queda unos segundos en GitHub.
4. **No pegues código** (`<script>`, `<iframe>`, enlaces a formularios) en una crónica: la publicación se detendrá.
5. Si la publicación falla, abre la pestaña **Actions**: el error dice qué encontró y en qué archivo.

## Configuración de GitHub (administradores)

Estas opciones se activan en la web de GitHub y no se pueden configurar desde el código. Revísalas cada semestre.

- [ ] **Autenticación en dos pasos obligatoria** para todos los miembros (Organization → Settings → Authentication security).
- [ ] **Secret scanning** y **Push protection**: GitHub rechaza un push que contenga una clave (Settings → Code security).
- [ ] **Dependabot alerts** y **Dependabot security updates** (Settings → Code security).
- [ ] **Private vulnerability reporting**, para que el enlace de reporte de arriba funcione (Settings → Code security).
- [ ] **CodeQL default setup** (Settings → Code security → Code scanning).
- [ ] **Regla de protección de `main`**: sin force push ni borrado de la rama (Settings → Rules → Rulesets). Opcional: exigir que «Auditoría de seguridad» pase antes de aceptar un pull request.
- [ ] **Enforce HTTPS** en Settings → Pages (y lo mismo al conectar mlkblog.com).
- [ ] **Permisos de Actions**: «Read repository contents» por defecto y sin aprobar pull requests desde Actions (Settings → Actions → General).
- [ ] **Revisar colaboradores**: quitar acceso a quien ya no participa; cada becario con el rol mínimo (Write para publicar, nunca Admin).
