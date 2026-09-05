# Generador de Ebooks con IA — Denisse

App que convierte "tema + número de páginas" en un **ebook terminado**: la IA escribe todo el contenido, genera las imágenes y arma el diseño (portada, índice, capítulos, citas destacadas, página de cierre con tu CTA de WhatsApp), y te entrega un **PDF final listo para usar como lead magnet** en cualquiera de tus 8 marcas.

> ⚠️ **Importante sobre dónde vive esto:** este repo (`App-resina`) se publica en GitHub Pages, que solo sirve archivos estáticos. Esta app necesita un servidor (llama a la API de Claude y usa un navegador headless para generar el PDF), así que **no corre en GitHub Pages**. Está lista para desplegarse en **Render** (ver más abajo) — el código vive en este repo dentro de `ebook-generator/` para que quede versionado junto a tus demás proyectos.

## Qué hace exactamente

1. Eliges la marca (Resina Lab, Teje Premium, Naturalmente Velas, Nails Master Pro, Bisutería, Mamá Millennial CR, CIMA Digital Pro o El Dulce Studio), el tema y cuántas páginas quieres.
2. Claude escribe el esqueleto del ebook (título, subtítulo, capítulos) y luego el contenido completo de cada capítulo, en tu tono de copywriting (estilo Marcos Araujo: cálido, narrativo, consultivo, sin hard-sell).
3. Se generan imágenes con IA para la portada y cada capítulo, con un estilo visual coherente por marca. Si el servicio de imágenes no responde (sin internet, límite alcanzado), la app cae automáticamente en un diseño vectorial de respaldo con los colores de tu marca — el ebook nunca sale "roto".
4. Se maqueta el diseño completo (tipografías Manrope/Work Sans iguales a tus landing pages, paleta de color por marca, pie de página con numeración) y se genera el PDF final con Chromium headless.
5. La última página es tu CTA real: "Escribe {PALABRA CLAVE} al WhatsApp", usando la misma palabra clave que ya usas en tus flujos de Meta/ManyChat.

## Instalación

Necesitas [Node.js 18+](https://nodejs.org/).

```bash
cd ebook-generator
npm install
npx playwright install chromium   # descarga el navegador que genera el PDF (una sola vez)
cp .env.example .env
```

Abre `.env` y pega tu clave de Anthropic:

```
ANTHROPIC_API_KEY=sk-ant-tu-clave-aqui
```

Consíguela en [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) si no tienes una.

## Uso

```bash
npm start
```

Abre [http://localhost:4790](http://localhost:4790), elige la marca, escribe el tema, ajusta las páginas y dale a "Generar mi ebook". Verás el progreso en vivo (outline → capítulos → imágenes → diseño → PDF) y al final un botón para descargar el PDF.

Cada ebook generado también queda guardado en `ebook-generator/output/<id>/` por si quieres recuperarlo después.

## Personalizar tus marcas

Todo el ADN de cada marca (colores, tipografía, autor/instructora, palabra clave del funnel, estilo de imagen, texto del CTA final) vive en un solo archivo: `src/brands.js`. Si cambias un color de marca, actualizas ahí el precio del curso, la palabra clave de WhatsApp, o agregas una marca nueva (nicho #9), es el único archivo que necesitas tocar.

## Costos y modelo de IA

- **Texto:** usa la API de Claude (`claude-opus-5` por defecto, la mejor calidad de escritura). Si generas muchos ebooks al mes y quieres bajar el costo, cambia `ANTHROPIC_MODEL=claude-sonnet-5` en tu `.env` — sigue siendo muy buena calidad a una fracción del precio.
- **Imágenes:** usa [Pollinations.ai](https://pollinations.ai), un servicio gratuito de generación de imágenes con IA que no requiere cuenta ni clave. Si tu red la bloquea, la app usa el diseño vectorial de respaldo automáticamente (ver arriba).
- Un ebook de ~20 páginas normalmente cuesta unos pocos centavos de dólar en la API de Claude.

## Desplegar en Render

El repo ya incluye un `render.yaml` (en la raíz de `App-resina`, no dentro de `ebook-generator/`) con todo configurado como "Blueprint" de Render.

### Opción A: Blueprint (recomendado, un solo paso)

1. Entra a [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. Conecta el repo `App-resina` (o el fork/remoto que uses).
3. Render detecta `render.yaml` automáticamente y te va a pedir el único secreto que no viene definido: **`ANTHROPIC_API_KEY`**. Pégala ahí (consíguela en [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)).
4. Dale a **Apply**. Render construye el servicio (instala dependencias + Chromium con sus librerías del sistema) y lo despliega.
5. Cuando termine, te da una URL tipo `https://ebook-generator-xxxx.onrender.com` — esa es tu app, abre eso en lugar de `localhost`.

### Opción B: Web Service manual (si no quieres usar el Blueprint)

Si prefieres configurarlo a mano desde el dashboard en vez de leer `render.yaml`:

| Campo | Valor |
|---|---|
| Root Directory | `ebook-generator` |
| Runtime | Node |
| Build Command | `npm install && npx playwright install --with-deps chromium` |
| Start Command | `npm start` |
| Plan | Standard (2 GB RAM) — Chromium necesita memoria de sobra; el plan Free/Starter puede quedarse corto y hacer que la generación falle a mitad de camino |
| Variable de entorno | `ANTHROPIC_API_KEY` = tu clave (marca "Secret") |

### Cosas a saber sobre correr esto en Render

- **El disco es efímero.** Cada ebook se guarda temporalmente en `output/<id>/` para poder descargarse justo después de generarse. La app misma borra automáticamente esas carpetas después de 2 horas para no llenar el disco — no necesitas hacer nada, pero tampoco esperes que un PDF viejo siga ahí días después. Si generaste algo valioso, descárgalo apenas esté listo.
- **Arranque en frío:** si usas un plan que "duerme" por inactividad, la primera generación después de dormir puede tardar más (arranca Node + Chromium desde cero).
- **Logs:** si algo falla, la pestaña "Logs" de tu servicio en Render te muestra el error real (por ejemplo, si te olvidaste de poner `ANTHROPIC_API_KEY`).

### VPS propio (alternativa)

Si en cambio prefieres tu propio servidor: clona el repo, sigue los mismos pasos de instalación de arriba, y usa `pm2` o un servicio systemd para mantenerlo corriendo.

## Estructura del proyecto

```
render.yaml            blueprint de despliegue en Render (vive en la raíz del repo)
ebook-generator/
  server.js          servidor Express + orquestación de todo el proceso
  src/
    brands.js         ADN de tus 8 marcas (colores, autor, CTA, keyword)
    planning.js        traduce "cuántas páginas" en capítulos/palabras
    claude.js           llamadas a la API de Claude (outline + capítulos)
    images.js            generación de imágenes con IA + respaldo vectorial
    fallbackArt.js         diseño SVG de respaldo por marca
    render.js               arma el HTML del ebook (portada, índice, capítulos, CTA)
    pdf.js                    convierte el HTML a PDF con Playwright y lo numera
    fonts.js                  tipografías autohospedadas (Manrope, Work Sans)
  assets/fonts/        archivos de las tipografías
  public/              interfaz web (formulario + progreso + descarga)
  output/              ebooks generados (no se sube a git)
```

## Notas de diseño

- Tamaño de página: 5.5in × 8.5in (formato libro digital, cómodo tanto en pantalla como impreso).
- El índice no numera páginas físicas exactas (solo el orden de capítulos) porque el contenido generado por IA varía en longitud; es una decisión de diseño intencional, no un error.
- Las citas destacadas (blockquotes) nunca se cortan entre dos páginas.
