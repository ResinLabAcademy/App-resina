import { marked } from "marked";
import { loadFontFaces } from "./fonts.js";

const PAGE_WIDTH_IN = 5.5;
const PAGE_HEIGHT_IN = 8.5;
// El PDF interior se imprime con un margen inferior reservado para el pie de
// página (numeración). Las secciones de página fija (índice, CTA) deben
// medir exactamente el área imprimible restante, o su contenido se
// desbordaría a una página extra en blanco.
export const FOOTER_HEIGHT_IN = 0.38;
const INTERIOR_PAGE_HEIGHT_IN = PAGE_HEIGHT_IN - FOOTER_HEIGHT_IN;

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imageLayer(image, className = "") {
  if (!image) return "";
  if (image.type === "raster") {
    return `<img class="bg-cover ${className}" src="data:${image.mimeType};base64,${image.base64}" alt=""/>`;
  }
  return `<div class="bg-cover ${className}">${image.svg}</div>`;
}

function baseStyles(brand, fontFaces, { pageHeightIn = PAGE_HEIGHT_IN } = {}) {
  return `
${fontFaces}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: 'Work Sans', Arial, sans-serif;
  color: ${brand.colors.ink};
  background: ${brand.colors.paper};
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, .heading {
  font-family: 'Manrope', Arial, sans-serif;
  margin: 0;
}
.page {
  width: ${PAGE_WIDTH_IN}in;
  height: ${pageHeightIn}in;
  position: relative;
  overflow: hidden;
  break-after: page;
  page-break-after: always;
}
.bg-cover { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bg-cover svg { width: 100%; height: 100%; display: block; }
.overlay-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 35%, ${brand.colors.ink}ee 92%);
}
.kicker {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.85);
  color: ${brand.colors.primary};
  font-weight: 700; font-size: 9.5pt; letter-spacing: 0.06em; text-transform: uppercase;
  padding: 5px 12px; border-radius: 999px;
}
.cover-content {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 0.5in 0.55in 0.55in;
  color: #fff;
}
.cover-title {
  font-size: 27pt; font-weight: 800; line-height: 1.12; margin: 0.16in 0 0.1in;
  text-shadow: 0 2px 18px rgba(0,0,0,0.25);
}
.cover-subtitle { font-size: 12.5pt; font-weight: 400; opacity: 0.94; line-height: 1.4; max-width: 92%; }
.cover-byline {
  margin-top: 0.28in; font-size: 9.5pt; letter-spacing: 0.04em; text-transform: uppercase;
  opacity: 0.85; font-weight: 600;
}
.toc-page { padding: 0.6in 0.6in 0.5in; }
.toc-kicker { color: ${brand.colors.primary}; font-weight: 700; font-size: 10pt; letter-spacing: 0.08em; text-transform: uppercase; }
.toc-title { font-size: 22pt; font-weight: 800; color: ${brand.colors.ink}; margin-top: 0.08in; margin-bottom: 0.35in; }
.toc-row { display: flex; align-items: baseline; gap: 0.18in; padding: 0.13in 0; border-bottom: 1px solid ${brand.colors.soft}; }
.toc-num { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 15pt; color: ${brand.colors.accent}; min-width: 0.5in; }
.toc-label { font-weight: 600; font-size: 12pt; color: ${brand.colors.ink}; }
.chapter-wrap { break-after: page; page-break-after: always; }
.chapter-banner { position: relative; width: 100%; height: 2.35in; overflow: hidden; }
.chapter-banner .overlay-gradient { background: linear-gradient(180deg, rgba(0,0,0,0.05) 40%, ${brand.colors.ink}f2 96%); }
.chapter-eyebrow {
  position: absolute; left: 0.5in; bottom: 0.72in;
  font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 26pt; color: rgba(255,255,255,0.55);
}
.chapter-heading {
  position: absolute; left: 0.5in; right: 0.5in; bottom: 0.22in;
  font-size: 17pt; font-weight: 800; color: #fff; line-height: 1.15;
  text-shadow: 0 2px 14px rgba(0,0,0,0.3);
}
.chapter-body { padding: 0.38in 0.55in 0.15in; font-size: 11pt; line-height: 1.62; color: ${brand.colors.ink}; }
.chapter-body p { margin: 0 0 0.16in; }
.chapter-body ul { margin: 0 0 0.2in; padding-left: 0.22in; }
.chapter-body li { margin-bottom: 0.08in; }
.chapter-body li::marker { color: ${brand.colors.accent}; font-weight: 700; }
.chapter-body blockquote {
  break-inside: avoid;
  margin: 0.22in 0; padding: 0.2in 0.24in;
  background: ${brand.colors.soft};
  border-left: 4px solid ${brand.colors.accent};
  border-radius: 4px;
  font-family: 'Manrope', sans-serif;
  font-weight: 600; font-style: italic; font-size: 12.5pt; line-height: 1.4;
  color: ${brand.colors.primary};
}
.chapter-body blockquote p { margin: 0; }
.chapter-body h2 { font-size: 13pt; font-weight: 700; color: ${brand.colors.primary}; margin: 0.26in 0 0.12in; }
.cta-page {
  background: linear-gradient(160deg, ${brand.colors.primary}, ${brand.colors.ink});
  color: #fff; padding: 0.75in 0.6in; display: flex; flex-direction: column; justify-content: center;
}
.cta-kicker { font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-size: 10pt; opacity: 0.75; }
.cta-heading { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 21pt; line-height: 1.2; margin: 0.14in 0 0.22in; }
.cta-text { font-size: 12pt; line-height: 1.55; opacity: 0.95; margin-bottom: 0.4in; }
.cta-pill {
  display: inline-flex; align-items: center; gap: 0.12in;
  background: ${brand.colors.accent}; color: ${brand.colors.ink};
  font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12.5pt;
  padding: 0.16in 0.3in; border-radius: 999px; width: fit-content;
}
.cta-sign { margin-top: 0.5in; font-size: 10pt; opacity: 0.75; }
`;
}

function renderCoverHtml({ brand, outline, coverImage, fontFaces }) {
  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>${baseStyles(brand, fontFaces)}</style></head>
<body>
<section class="page">
  ${imageLayer(coverImage)}
  <div class="overlay-gradient"></div>
  <div class="cover-content">
    <span class="kicker">${escapeHtml(brand.niche)}</span>
    <h1 class="cover-title">${escapeHtml(outline.title)}</h1>
    <p class="cover-subtitle">${escapeHtml(outline.subtitle)}</p>
    <p class="cover-byline">${escapeHtml(brand.author)} · ${escapeHtml(brand.name)}</p>
  </div>
</section>
</body></html>`;
}

function renderTocHtml({ brand, outline }) {
  const rows = outline.chapters
    .map(
      (ch, i) => `
    <div class="toc-row">
      <span class="toc-num">${String(i + 1).padStart(2, "0")}</span>
      <span class="toc-label">${escapeHtml(ch.title)}</span>
    </div>`
    )
    .join("");
  return `
<section class="page toc-page">
  <div class="toc-kicker">Contenido</div>
  <div class="toc-title">${escapeHtml(outline.subtitle)}</div>
  ${rows}
</section>`;
}

function renderChapterHtml({ index, chapter, image, bodyMarkdown }) {
  const bodyHtml = marked.parse(bodyMarkdown || "");
  return `
<div class="chapter-wrap">
  <section class="chapter-banner">
    ${imageLayer(image)}
    <div class="overlay-gradient"></div>
    <div class="chapter-eyebrow">${String(index + 1).padStart(2, "0")}</div>
    <h2 class="chapter-heading">${escapeHtml(chapter.title)}</h2>
  </section>
  <div class="chapter-body">${bodyHtml}</div>
</div>`;
}

function renderCtaHtml({ brand, outline }) {
  return `
<section class="page cta-page">
  <div class="cta-kicker">Antes de irte</div>
  <h2 class="cta-heading">Gracias por leer "${escapeHtml(outline.title)}"</h2>
  <p class="cta-text">${escapeHtml(brand.ctaText)}</p>
  <div class="cta-pill">💬 Escribe ${escapeHtml(brand.keyword)} al WhatsApp</div>
  <p class="cta-sign">Con cariño, ${escapeHtml(brand.author)} · ${escapeHtml(brand.name)}</p>
</section>`;
}

/**
 * Construye los dos documentos HTML del ebook:
 * - coverHtml: una sola página a sangre completa (se imprime sin márgenes).
 * - interiorHtml: índice + capítulos + CTA final (se imprime con margen
 *   inferior reservado para el pie de página con numeración).
 */
export async function buildEbookDocuments({ brand, outline, coverImage, chapterImages, chapterBodies }) {
  const fontFaces = await loadFontFaces();
  const coverHtml = renderCoverHtml({ brand, outline, coverImage, fontFaces });

  const chaptersHtml = outline.chapters
    .map((chapter, i) =>
      renderChapterHtml({
        index: i,
        chapter,
        image: chapterImages[i],
        bodyMarkdown: chapterBodies[i]
      })
    )
    .join("\n");

  const interiorHtml = `<!doctype html><html><head><meta charset="utf-8"/>
<style>${baseStyles(brand, fontFaces, { pageHeightIn: INTERIOR_PAGE_HEIGHT_IN })}</style></head>
<body>
${renderTocHtml({ brand, outline })}
${chaptersHtml}
${renderCtaHtml({ brand, outline })}
</body></html>`;

  return {
    coverHtml,
    interiorHtml,
    pageSize: { width: PAGE_WIDTH_IN, height: PAGE_HEIGHT_IN, footerHeight: FOOTER_HEIGHT_IN }
  };
}
