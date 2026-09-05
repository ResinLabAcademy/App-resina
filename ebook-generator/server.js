import "dotenv/config";
import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import { listBrands, getBrand } from "./src/brands.js";
import { planEbook } from "./src/planning.js";
import { generateOutline, generateChapterBody, friendlyClaudeError } from "./src/claude.js";
import { generateImage, seedFromString } from "./src/images.js";
import { buildEbookDocuments } from "./src/render.js";
import { renderEbookPdf } from "./src/pdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "output");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/brands", (req, res) => {
  res.json(listBrands());
});

app.post("/api/generate", async (req, res) => {
  const { brandId, topic, pages, tone, audience } = req.body || {};

  if (!topic || typeof topic !== "string" || topic.trim().length < 4) {
    res.status(400).json({ error: "Cuéntame el tema del ebook (mínimo unas palabras)." });
    return;
  }
  const pagesNum = Number(pages);
  if (!Number.isFinite(pagesNum) || pagesNum < 6 || pagesNum > 200) {
    res.status(400).json({ error: "El número de páginas debe estar entre 6 y 200." });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({
      error: "Falta configurar ANTHROPIC_API_KEY en el servidor (archivo .env). Revisa el README."
    });
    return;
  }

  const brand = getBrand(brandId);
  const toneLabel = (tone || "cálido y consultivo").trim();
  const jobId = randomUUID();
  const jobDir = path.join(OUTPUT_DIR, jobId);
  const imagesDir = path.join(jobDir, "images");

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no"
  });
  const send = (event) => res.write(`${JSON.stringify(event)}\n`);

  try {
    const plan = planEbook(pagesNum);
    send({
      type: "progress",
      step: "plan",
      message: `Plan listo: ${plan.chapterCount} capítulos para ~${plan.pages} páginas.`
    });

    send({ type: "progress", step: "outline", message: "Escribiendo el esqueleto del ebook con IA..." });
    const outline = await generateOutline({
      brand,
      topic: topic.trim(),
      tone: toneLabel,
      audience: audience?.trim(),
      chapterCount: plan.chapterCount
    });
    send({ type: "progress", step: "outline-done", message: `Título elegido: "${outline.title}"` });

    const projectSeed = seedFromString(`${brand.id}-${outline.title}`);

    send({ type: "progress", step: "cover-image", message: "Generando la portada con IA..." });
    const coverImage = await generateImage({
      prompt: `${outline.coverImagePrompt}, ${brand.imageStyle}`,
      outDir: imagesDir,
      fileName: "cover.jpg",
      width: 1024,
      height: 1536,
      seed: projectSeed,
      brandColors: brand.colors
    });

    const chapterBodies = [];
    const chapterImages = [];
    for (let i = 0; i < outline.chapters.length; i++) {
      const chapter = outline.chapters[i];
      send({
        type: "progress",
        step: "chapter",
        message: `Escribiendo capítulo ${i + 1}/${outline.chapters.length}: "${chapter.title}"...`
      });
      const body = await generateChapterBody({
        brand,
        tone: toneLabel,
        outline,
        chapter,
        wordsTarget: plan.wordsPerChapter
      });
      chapterBodies.push(body);

      send({
        type: "progress",
        step: "chapter-image",
        message: `Ilustrando capítulo ${i + 1}/${outline.chapters.length}...`
      });
      const img = await generateImage({
        prompt: `${chapter.imagePrompt}, ${brand.imageStyle}`,
        outDir: imagesDir,
        fileName: `chapter-${i + 1}.jpg`,
        width: 1400,
        height: 700,
        seed: projectSeed + i + 1,
        brandColors: brand.colors
      });
      chapterImages.push(img);
    }

    send({ type: "progress", step: "design", message: "Maquetando el diseño profesional del ebook..." });
    const { coverHtml, interiorHtml, pageSize } = await buildEbookDocuments({
      brand,
      outline,
      coverImage,
      chapterImages,
      chapterBodies
    });

    send({ type: "progress", step: "pdf", message: "Generando el PDF final (esto toma unos segundos)..." });
    const pdfBuffer = await renderEbookPdf({ coverHtml, interiorHtml, pageSize, brand });

    await fs.mkdir(jobDir, { recursive: true });
    const safeTitle = outline.title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().slice(0, 60) || "ebook";
    const pdfFileName = `${safeTitle}.pdf`;
    await fs.writeFile(path.join(jobDir, pdfFileName), pdfBuffer);

    send({
      type: "done",
      message: "¡Tu ebook está listo!",
      downloadUrl: `/output/${jobId}/${encodeURIComponent(pdfFileName)}`,
      title: outline.title,
      subtitle: outline.subtitle,
      pages: plan.pages,
      chapterCount: outline.chapters.length
    });
  } catch (err) {
    console.error("Error generando ebook:", err);
    send({ type: "error", message: friendlyClaudeError(err) });
  } finally {
    res.end();
  }
});

app.use("/output", express.static(OUTPUT_DIR));

const PORT = process.env.PORT || 4790;
app.listen(PORT, () => {
  console.log(`📚 Generador de ebooks corriendo en http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  ANTHROPIC_API_KEY no está configurada. Copia .env.example a .env y agrega tu clave.");
  }
});
