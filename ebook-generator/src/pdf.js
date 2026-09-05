import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";

function escapeHtml(str = "") {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function withBrowser(fn) {
  // CHROMIUM_EXECUTABLE_PATH permite usar un Chrome/Chromium ya instalado en
  // el sistema (útil en servidores donde la descarga automática de
  // Playwright no está disponible). Si no se define, Playwright usa el
  // Chromium que instaló con `npx playwright install chromium`.
  const launchOptions = { args: ["--no-sandbox", "--disable-dev-shm-usage"] };
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
  }
  const browser = await chromium.launch(launchOptions);
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

async function htmlToPdfBuffer(browser, html, pdfOptions) {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    return await page.pdf(pdfOptions);
  } finally {
    await page.close();
  }
}

/**
 * Imprime portada + interior por separado (la portada necesita sangrado
 * completo sin márgenes; el interior necesita margen inferior para el pie de
 * página numerado) y los une en un solo PDF final.
 */
export async function renderEbookPdf({ coverHtml, interiorHtml, pageSize, brand }) {
  return withBrowser(async (browser) => {
    const coverBuffer = await htmlToPdfBuffer(browser, coverHtml, {
      width: `${pageSize.width}in`,
      height: `${pageSize.height}in`,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      printBackground: true
    });

    const footerTemplate = `
<div style="width:100%; font-family: Arial, Helvetica, sans-serif; font-size:7.5pt; color:${brand.colors.primary}; text-align:center; padding:0; opacity:0.8;">
  <span>${escapeHtml(brand.name)} &middot; p&aacute;gina <span class="pageNumber"></span> de <span class="totalPages"></span></span>
</div>`;

    const interiorBuffer = await htmlToPdfBuffer(browser, interiorHtml, {
      width: `${pageSize.width}in`,
      height: `${pageSize.height}in`,
      margin: { top: 0, bottom: `${pageSize.footerHeight}in`, left: 0, right: 0 },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate
    });

    return mergePdfBuffers([coverBuffer, interiorBuffer]);
  });
}

async function mergePdfBuffers(buffers) {
  const finalDoc = await PDFDocument.create();
  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf);
    const pages = await finalDoc.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => finalDoc.addPage(p));
  }
  const bytes = await finalDoc.save();
  return Buffer.from(bytes);
}
