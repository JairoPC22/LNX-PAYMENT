# LNX Technologies — Sitio corporativo

Sitio web estático (sin framework, sin build step) para LNX Payments / LNX Technologies. Bilingüe
(ES/EN), con tema claro/oscuro, compatible con GitHub Pages o cualquier hosting estático.

## Ejecutar el proyecto localmente

No requiere instalación de dependencias para verse. Sirve la carpeta con cualquier servidor
estático, por ejemplo:

```bash
npx serve .
# o
python -m http.server 8080
```

Luego abre `http://localhost:8080` (o el puerto que indique tu servidor). Abrir `index.html`
directamente con `file://` funciona para revisar estilos, pero el Service Worker y el manifest
requieren `http://` o `https://`.

## Estructura del proyecto

```text
index.html            Página principal
404.html               Página de error 404
css/styles.css         Sistema de diseño (variables, tema claro/oscuro, layout, componentes)
js/i18n.js              Diccionarios ES/EN y motor de traducción
js/script.js            Comportamiento: navegación, tema, formulario, animaciones
assets/brand/           Logotipo y símbolo reconstruidos en SVG
assets/icons/           Favicons e iconos generados
assets/images/          Imagen social (Open Graph) y otras imágenes
assets/fonts/           Quantico e Inter autohospedadas (woff2)
.tools/generate-icons.js  Script de build (Node + sharp) para regenerar los iconos
manifest.json, sw.js     Configuración PWA
robots.txt, sitemap.xml SEO
```

## Cómo modificar los textos (español e inglés)

Todo el contenido visible vive en `js/i18n.js`, dentro de los objetos `dictionaries.es` y
`dictionaries.en`. Cada clave (por ejemplo `hero.subtitle`) se usa en `index.html`/`404.html` a
través de `data-i18n="clave"` (para el texto) o `data-i18n-attr="atributo:clave"` (para atributos
como `aria-label`). Para cambiar un texto, edita el valor correspondiente en **ambos** idiomas.

## Cómo cambiar de idioma / tema (para el usuario final)

El sitio detecta el idioma del navegador la primera vez (con español como reserva) y el tema
según `prefers-color-scheme` del sistema. El visitante puede cambiarlos manualmente con los
botones "ES/EN" y el icono de sol/luna en el encabezado; la preferencia se guarda en
`localStorage` (`lnx-locale` y `lnx-theme` respectivamente) y persiste entre visitas.

## Sobre el logotipo reconstruido

Los archivos en `assets/brand/` (`lnx-logo.svg`, `lnx-logo-dark.svg`, `lnx-logo-light.svg`,
`lnx-symbol.svg`) son una **reconstrucción vectorial limpia**, hecha a partir de los archivos de
referencia que ya estaban en la raíz del proyecto (`LNX-Technologies-Logo.svg`,
`LNX-Favicon.svg`, `LNX-LOGO.png`). No son el archivo maestro oficial de diseño de LNX.

Diferencias respecto a la referencia original:
- El texto "TECHNOLOGIES" se reconstruyó como trazados SVG geométricos (estilo técnico/cuadrado)
  en lugar de depender de la fuente Montserrat declarada en el SVG original, para que el
  logotipo se vea igual sin importar si esa fuente está instalada.
- El símbolo (`lnx-symbol.svg`) se recortó del fondo cuadrado navy del favicon original y se
  volvió a centrar con márgenes uniformes, para que funcione sobre cualquier fondo.

**Para reemplazar por el archivo oficial cuando esté disponible:** sustituye los 4 archivos SVG
en `assets/brand/` manteniendo los mismos nombres y un `viewBox` de proporciones similares
(1600×620 para los logotipos completos, 512×512 para el símbolo). Después vuelve a ejecutar el
script de iconos (ver abajo) para que los favicons se regeneren a partir del símbolo actualizado.

## Imagen del hero (`assets/images/hero-terminal.png` / `.webp`)

El visual del hero es un render de producto (proporcionado por el equipo de LNX) de una
terminal LNX conceptual mostrando la pantalla "Payment Approved" (`POS1.png`).

El archivo original traía un fondo de cuadros gris/blanco pintado como píxeles opacos (no
transparencia real), del mismo tono que el papel del recibo que asoma por la impresora —
por lo que un recorte por color simple borraba el papel junto con el fondo. Se resolvió con
`.tools/remove-checker-bg.js`, que:
1. Detecta el tamaño de celda y los dos tonos exactos del ajedrezado.
2. Hace flood-fill desde los bordes por cualquier pixel cercano a esos tonos (tolera ruido).
3. Antes de borrar cada pixel alcanzado, revisa una ventana local a su alrededor: si tiene
   mezcla real de ambos tonos (ajedrezado autentico) lo borra; si la ventana es casi de un
   solo tono (una hoja de papel lisa) lo conserva, aunque el flood-fill haya llegado ahi.

Uso: `node .tools/remove-checker-bg.js assets/images/POS1.png` (genera
`POS1-transparent.png`). Ya se corrió para `POS1.png`, `POS2.png` y `POS3.png` — los
`-transparent.png` resultantes quedan junto a cada original. `POS3.png` tiene un patrón de
cuadros más fino (celda de 7px) y quedó con algo de ruido residual sin limpiar del todo; no
se usa actualmente en el sitio, pero si se retoma puede necesitar un ajuste de tolerancia o
limpieza manual.

`hero-terminal.png`/`.webp` es `POS1-transparent.png` redimensionado a 1100px de ancho y
optimizado (WebP de 112 KB con fallback a PNG vía `<picture>` para navegadores antiguos).

El removedor de fondo dejaba, ademas del papel, un halo punteado de pixeles semi-transparentes
sueltos (restos de las esquinas del ajedrezado original) pegados al contorno de la silueta.
Sobre un fondo blanco era invisible, pero se veía como una línea de puntos grises flotando sobre
el fondo oscuro del hero. Se limpió con `.tools/clean-edge-halo.js`: agrupa todos los píxeles con
alpha > 0 en componentes conectados (8-conexo) y elimina cualquier componente que no sea el más
grande (el dispositivo + el papel forman un único componente; el halo queda desconectado de él,
sin importar el valor de alpha de cada píxel suelto). Uso:
`node .tools/clean-edge-halo.js assets/images/archivo.png` (genera `archivo-clean.png`).

Se probó primero una escena 3D real con Three.js + glTF cargando `LNX-POS-terminal.glb`
(también incluido en `assets/images/`, sin usar actualmente). Funcionaba, pero el resultado
visual no llegaba al nivel del render de producto — se mantuvo la imagen como visual
definitivo del hero. El archivo `.glb` se conserva por si se retoma esa vía más adelante
(por ejemplo, para una vista interactiva/AR en una página de producto separada).

## Cómo agregar o quitar preguntas frecuentes

La sección `<section id="faqs">` en `index.html` usa elementos `<details>/<summary>` nativos
(sin JavaScript adicional). Para agregar una pregunta, copia un bloque `.faq-item`, dale un
`--reveal-index` consecutivo y agrega las claves `faq.qN` / `faq.aN` correspondientes en
`js/i18n.js` (ambos idiomas).

## Otras imágenes y video de las tarjetas de Terminales / Tipos de comercio

Todas estas imágenes y el video son de Pexels, bajo la Licencia Pexels (uso comercial gratuito,
sin atribución obligatoria). Cada JPG tiene un par `.webp` generado con `sharp` (calidad 82) y
se sirve mediante `<picture><source type="image/webp">` con el `.jpg` como respaldo:

- `assets/images/terminal-handoff.jpg`/`.webp` (banner de la sección "Terminales"): manos
  entregando una terminal de pago genérica en un mostrador.
- `assets/images/pos-countertop.jpg`/`.webp` (tarjeta "Terminal de mostrador").
- `assets/images/pos-system-front.jpg`/`.webp` (tarjeta "Sistema POS"): persona ajustando la
  pantalla de un sistema de punto de venta.
- `assets/images/pos-allinone.jpg`/`.webp` (tarjeta "Solución todo en uno").
- `assets/images/pos-in-use.jpg`/`.webp` (sección "Tipos de comercio"): persona usando un sistema
  de punto de venta táctil en una cafetería.
- `assets/videos/mobile-terminal.mp4` + `mobile-terminal-poster.webp` (tarjeta "Terminal móvil"):
  video descargado en 4K y recomprimido a 960px/sin audio para no afectar el rendimiento del
  sitio; el poster se sirve directamente en WebP (todos los navegadores con soporte de video
  moderno soportan WebP como poster).

Algunas de estas fotos muestran de forma incidental el logotipo de la marca del equipo que
aparece en la foto original (por ejemplo "imin" en la pantalla) — es parte de la foto de stock
tal cual se tomó, no representa una alianza confirmada de LNX con esa marca. Si más adelante
tienes fotografía real de los equipos de LNX, reemplaza estos archivos manteniendo los mismos
nombres (JPG y WebP).

## Cómo regenerar los iconos y favicons

Los iconos se generan con un script de Node que usa la librería `sharp` (dependencia de
desarrollo, vive en `.tools/`, no se sirve como parte del sitio):

```bash
cd .tools
npm install   # solo la primera vez
cd ..
node .tools/generate-icons.js
```

Esto regenera `favicon.svg`, `favicon.ico` y todos los PNG de `assets/icons/` y la imagen social
`assets/images/og-image-1200x630.png` a partir de `assets/brand/lnx-symbol.svg`. Si cambias el
símbolo, vuelve a correr el script.

## Cómo modificar las terminales

Las 4 tarjetas de terminales están en `index.html`, dentro de `<section id="terminals">`, justo
después del comentario interno `<!-- Pendiente: sustituir por modelo y especificaciones
confirmadas -->`. Ese comentario es una nota para el equipo (no se muestra al usuario) y marca
dónde se deben sustituir las categorías genéricas por modelos y especificaciones reales cuando
estén confirmados. No agregues precios, procesadores, conectividad ni certificaciones sin
confirmación oficial.

## Cómo agregar datos de contacto reales

El correo de contacto confirmado (`LNXTech2025@outlook.com`) ya está en el sitio: en el footer y
en la sección de contacto (`#contact`). Teléfono, WhatsApp, dirección física y redes sociales
siguen sin incluirse porque no fueron confirmados. Cuando existan esos datos oficiales:
- Agrégalos en la sección de contacto de `index.html` y en el footer.
- Actualiza las claves correspondientes en `js/i18n.js` si agregas texto nuevo.
- Si agregas redes sociales, considera añadir la propiedad `sameAs` al bloque JSON-LD en
  `index.html`.

## Cómo conectar el formulario de contacto a un backend real

El formulario (`#contact-form` en `index.html`, lógica en `js/script.js`) **no envía datos a
ningún servidor todavía**. Mientras `CONTACT_ENDPOINT_URL` esté vacía, el formulario opera en modo
demostración: valida y muestra un mensaje de éxito simulado, pero nunca dice haber sido enviado a
un sistema real.

Para conectarlo:
1. Crea un endpoint (Formspree, un Google Apps Script Web App, o una API propia) que acepte
   `POST` con JSON: `{ name, company, email, phone, businessType, solution, message }`.
2. Abre `js/script.js` y define la constante `CONTACT_ENDPOINT_URL` con la URL de ese endpoint.
3. **Importante:** la validación de `js/script.js` es solo de experiencia de usuario. El backend
   debe volver a validar y sanitizar todos los campos — nunca confíes en la validación del
   cliente para seguridad.
4. No expongas claves ni tokens secretos en este archivo (es código público del sitio).

## Cómo configurar el dominio final

El sitio está publicado en `https://jairopc22.github.io/LNX-PAYMENT/` (GitHub Pages). Si en el
futuro se usa un dominio propio, reemplaza esa URL por el dominio real en:
- `index.html`: `<link rel="canonical">`, las etiquetas `og:*` y `twitter:*`, y el JSON-LD.
- `robots.txt`: la línea `Sitemap:`.
- `sitemap.xml`: la etiqueta `<loc>`.

## Cómo actualizar el sitemap

Edita `sitemap.xml` y agrega una entrada `<url><loc>...</loc></url>` por cada página adicional
que publiques (por ejemplo, si en el futuro agregas páginas separadas por sección).

## Cómo cambiar la versión del Service Worker

Edita la constante `CACHE_VERSION` al inicio de `sw.js` (por ejemplo, de `'lnx-v1'` a
`'lnx-v2'`) cada vez que publiques cambios en los archivos precacheados (`PRECACHE_URLS`). Esto
invalida la caché anterior en los navegadores de los usuarios que ya visitaron el sitio.

## Cómo probar la PWA

1. Sirve el sitio por `http://localhost` o `https://` (el Service Worker no se registra sobre
   `file://`).
2. Abre Chrome DevTools → pestaña **Application** → **Manifest** para revisar los iconos y
   metadatos del manifest.
3. En la misma pestaña, **Service Workers**, confirma que `sw.js` esté activo.
4. Para probar el modo offline, activa la casilla "Offline" en esa misma pestaña y recarga.

## Cómo publicar en GitHub Pages

El repositorio ya está en `https://github.com/JairoPC22/LNX-PAYMENT`. Para activar la publicación:

1. En la configuración del repositorio, ve a **Settings → Pages**.
2. En "Build and deployment", elige **Deploy from a branch**, selecciona la rama `main` y la
   carpeta raíz (`/`) como origen. Guarda.
3. GitHub Pages publicará el sitio en `https://jairopc22.github.io/LNX-PAYMENT/` (puede tardar
   uno o dos minutos la primera vez). Todas las metaetiquetas, el sitemap y el manifest ya están
   configurados para esa URL.
4. Si más adelante se usa un dominio personalizado, actualiza el dominio en los archivos
   mencionados arriba.

## Información pendiente de confirmar

Estos elementos quedaron deliberadamente sin definir porque no fueron proporcionados o
confirmados, siguiendo la instrucción de no inventar datos comerciales:

- **Dominio propio**: por ahora se usa la URL de GitHub Pages (`jairopc22.github.io/LNX-PAYMENT`).
- **Datos de contacto**: teléfono, WhatsApp, dirección física, redes sociales (el correo,
  `LNXTech2025@outlook.com`, ya está confirmado y agregado al sitio).
- **Especificaciones de terminales**: modelos, procesadores, memoria, batería, pantalla,
  conectividad, métodos de pago aceptados, certificaciones.
- **Detalles de la alianza con OnTheFly**: términos exactos, exclusividad (se asume que no la
  hay), funciones específicas soportadas.
- **Texto legal definitivo** de aviso de privacidad y términos y condiciones (los enlaces del
  footer están preparados pero apuntan a `#`).
- **Cifras de la empresa**: año de fundación, número de clientes, empleados, oficinas, países,
  certificaciones, volumen procesado.
- **Backend del formulario de contacto** (`CONTACT_ENDPOINT_URL` vacía por diseño).

## Notas de seguridad

- El formulario sanitiza y valida en el cliente solo por experiencia de usuario; el backend que
  se conecte **debe** revalidar todo.
- No se usa `innerHTML` con datos provenientes del usuario en ningún punto del código.
- Los enlaces externos (cuando se agreguen) deben incluir `rel="noopener noreferrer"`.
- No hay claves, tokens ni contraseñas en este repositorio.
